import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FraudDetectionEngine } from "./backend/fraud-engine.js";
import { QrInspector } from "./backend/qr-inspector.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGE_CHARS = 12_000;
const MAX_QR_CHARS = 10_000;
const fraudEngine = new FraudDetectionEngine();
const qrInspector = new QrInspector();

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  response.end(JSON.stringify(payload));
}

function isLocalRequest(request) {
  const host = String(request.headers.host || "").toLowerCase();
  const allowedHosts = new Set(["127.0.0.1:" + PORT, "localhost:" + PORT]);
  if (!allowedHosts.has(host)) return false;

  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.protocol === "http:" && parsedOrigin.host.toLowerCase() === host;
  } catch {
    return false;
  }
}

async function readJson(request, response) {
  const mediaType = String(request.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    request.resume();
    sendJson(response, 415, { error: "Send a JSON request body." });
    return null;
  }

  const declaredLength = Number(request.headers["content-length"] || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    request.resume();
    sendJson(response, 413, { error: "Request body is too large." });
    return null;
  }

  const chunks = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) {
    sendJson(response, 413, { error: "Request body is too large." });
    return null;
  }

  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      sendJson(response, 400, { error: "Request body must be a JSON object." });
      return null;
    }
    return value;
  } catch {
    sendJson(response, 400, { error: "Request body must contain valid JSON." });
    return null;
  }
}
async function serveStatic(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: "Invalid URL path." });
    return;
  }

  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const absolutePath = path.resolve(ROOT, "." + requestedPath);
  const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (absolutePath !== ROOT && !absolutePath.startsWith(rootPrefix)) {
    sendJson(response, 403, { error: "Path is outside the app directory." });
    return;
  }

  const relativePath = path.relative(ROOT, absolutePath).split(path.sep).join("/");
  const blocked = relativePath.split("/").some((part) => part.startsWith(".")) ||
    relativePath.toLowerCase().startsWith("backend/") ||
    ["server.js", "package.json", "package-lock.json", "readme.md"].includes(relativePath.toLowerCase());
  if (blocked) {
    sendJson(response, 404, { error: "File not found." });
    return;
  }

  try {
    const file = await readFile(absolutePath);
    response.writeHead(200, {
      "Content-Type": contentTypes.get(path.extname(absolutePath).toLowerCase()) || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "SAMEORIGIN"
    });
    response.end(request.method === "HEAD" ? undefined : file);
  } catch (error) {
    sendJson(response, error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 500, { error: "File not found." });
  }
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://" + (request.headers.host || HOST + ":" + PORT));
    const pathname = requestUrl.pathname;

    if (pathname.startsWith("/api/")) {
      if (!isLocalRequest(request)) {
        sendJson(response, 403, { error: "This local API only accepts requests from this device." });
        return;
      }

      if (request.method === "GET" && pathname === "/api/health") {
        sendJson(response, 200, { status: "ok", service: "SurakshaPay local Node engine", storage: "none" });
        return;
      }

      if (request.method === "GET" && pathname === "/api/qr-presets") {
        const presets = qrInspector.sampleQRs.map(({ id, title, type, payload, description }) => ({ id, title, type, payload, description }));
        sendJson(response, 200, { presets });
        return;
      }

      if (request.method === "POST" && pathname === "/api/analyze-text") {
        const body = await readJson(request, response);
        if (body === null) return;
        if (typeof body.text !== "string" || body.text.trim().length === 0) {
          sendJson(response, 400, { error: "Provide a non-empty message to analyze." });
          return;
        }
        if (body.text.length > MAX_MESSAGE_CHARS) {
          sendJson(response, 413, { error: "Message is too long to analyze." });
          return;
        }
        const { rawText, primaryRule, ...result } = fraudEngine.analyze(body.text);
        sendJson(response, 200, { result });
        return;
      }

      if (request.method === "POST" && pathname === "/api/analyze-qr") {
        const body = await readJson(request, response);
        if (body === null) return;
        if (typeof body.payload !== "string" || body.payload.trim().length === 0) {
          sendJson(response, 400, { error: "Provide a non-empty QR payload to analyze." });
          return;
        }
        if (body.payload.length > MAX_QR_CHARS) {
          sendJson(response, 413, { error: "QR payload is too long to analyze." });
          return;
        }
        const result = qrInspector.analyze(body.payload);
        if (!result) {
          sendJson(response, 400, { error: "QR payload could not be analyzed." });
          return;
        }
        sendJson(response, 200, { result });
        return;
      }

      sendJson(response, 404, { error: "API route not found." });
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }
    await serveStatic(request, response, pathname);
  } catch {
    if (!response.headersSent) sendJson(response, 500, { error: "The local service encountered an error." });
    else response.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log("SurakshaPay is running at http://" + HOST + ":" + PORT);
  console.log("Analysis stays on this device. Message content is not logged or stored.");
});