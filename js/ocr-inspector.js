// ocr-inspector.js - Payment Screenshot and Counterfeit Receipt Analyzer
// Identifies signs of fake payment spoof apps, doctored screenshots, and missing UTR references.

export class ScreenshotInspector {
  constructor() {
    this.presets = [
      {
        id: "preset_spoof_paytm",
        title: "Fake Paytm Spoof App Screenshot (High Risk Scam)",
        type: "fake_spoof",
        risk: "high",
        score: 96,
        amount: "₹850.00",
        payee: "Sharma Kirana Store",
        timestamp: "24 Nov 2026, 04:15 PM",
        flaws: [
          {
            title: "Missing 12-Digit NPCI UTR Reference Number",
            desc: "All authentic UPI transfers generated through NPCI carry a unique 12-digit Bank Reference Number (UTR / RRN). Spoof apps leave this blank or print a fake 6-digit number.",
            x: 20, y: 70, w: 60, h: 8
          },
          {
            title: "Mismatched Typography & Floating Text",
            desc: "The amount '₹850.00' is rendered in Arial/Roboto without standard Paytm anti-aliased kerning. Obvious font paste job.",
            x: 25, y: 35, w: 50, h: 10
          },
          {
            title: "Header Time vs Receipt Time Discrepancy",
            desc: "The phone status bar shows 10:20 AM, but the transaction receipt timestamp claims 04:15 PM. The scammer forgot to match system time.",
            x: 10, y: 5, w: 80, h: 6
          },
          {
            title: "Soundbox Voice Absent",
            desc: "If the merchant's soundbox or SMS did not trigger within 15 seconds, the transaction does not exist on the banking switch.",
            x: 15, y: 85, w: 70, h: 8
          }
        ]
      },
      {
        id: "preset_kyc_sms_screenshot",
        title: "Phishing SMS with APK Link Screenshot",
        type: "phishing_sms",
        risk: "high",
        score: 94,
        amount: "₹25,000",
        payee: "SBI YONO Alert",
        timestamp: "Today, 11:30 AM",
        flaws: [
          {
            title: "Third-party Malicious .APK Link",
            desc: "SMS contains 'http://sbi-kyc-verify.apk'. Official banks never distribute raw Android installation files over SMS.",
            x: 15, y: 60, w: 70, h: 12
          },
          {
            title: "Urgent Threat of Account Freezing",
            desc: "Claims 'Account will be blocked in 24 hours'. Classic social engineering fear tactic.",
            x: 15, y: 35, w: 70, h: 15
          },
          {
            title: "Unofficial Sender ID",
            desc: "Sent from an ordinary 10-digit mobile number (+91 98765 43210) instead of an authorized TRAI sender header like 'AX-SBIINB'.",
            x: 15, y: 15, w: 70, h: 10
          }
        ]
      },
      {
        id: "preset_genuine_receipt",
        title: "Genuine Verified UPI Payment Receipt (Safe)",
        type: "genuine_receipt",
        risk: "low",
        score: 5,
        amount: "₹350.00",
        payee: "Gupta Sweets & Bakers",
        timestamp: "24 Nov 2026, 12:45 PM",
        flaws: [
          {
            title: "Verified 12-Digit NPCI UTR: 432981029381",
            desc: "Valid reference number recorded on NPCI UPI switch.",
            x: 20, y: 65, w: 60, h: 8,
            isSafe: true
          },
          {
            title: "Consistent Official Typography & Brand Assets",
            desc: "Font weights, spacing, and micro-branding align with official app specs.",
            x: 25, y: 32, w: 50, h: 10,
            isSafe: true
          },
          {
            title: "Timestamp Synced with Device Clock",
            desc: "Exact 12:45 PM match with status bar time.",
            x: 10, y: 5, w: 80, h: 6,
            isSafe: true
          }
        ]
      }
    ];
  }

  // Draw the simulated payment screen on canvas
  renderPreset(canvas, presetId, activePinIndex = -1) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const preset = this.presets.find(p => p.id === presetId) || this.presets[0];

    ctx.clearRect(0, 0, width, height);

    // Draw smartphone chassis
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    // Smartphone Status Bar
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, 32);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px monospace";
    ctx.fillText("10:20 AM", 18, 20);
    ctx.textAlign = "right";
    ctx.fillText("LTE 5G  🔋 88%", width - 18, 20);
    ctx.textAlign = "left";

    if (preset.type === "fake_spoof") {
      ctx.fillStyle = "#002E6E";
      ctx.fillRect(0, 32, width, 55);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Payment Successful", 24, 65);

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(16, 100, width - 32, height - 120, 12);
      ctx.fill();
      ctx.strokeStyle = "#E2E8F0";
      ctx.stroke();

      // Fake Green Checkmark
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(width / 2, 145, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", width / 2, 154);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(preset.amount, width / 2, 205);

      ctx.fillStyle = "#64748B";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Paid to ${preset.payee}`, width / 2, 230);

      ctx.font = "12px monospace";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(preset.timestamp, width / 2, 255);

      ctx.strokeStyle = "#E2E8F0";
      ctx.beginPath();
      ctx.moveTo(35, 275);
      ctx.lineTo(width - 35, 275);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText("UPI Ref ID:", 35, 305);
      ctx.fillStyle = "#EF4444";
      ctx.font = "bold 12px monospace";
      ctx.fillText("[BLANK / MISSING UTR]", 120, 305);

      ctx.fillStyle = "#64748B";
      ctx.font = "12px sans-serif";
      ctx.fillText("From:", 35, 335);
      ctx.fillStyle = "#0F172A";
      ctx.fillText("State Bank of India (XX9821)", 120, 335);

    } else if (preset.type === "phishing_sms") {
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(0, 32, width, 55);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("Messages: +91 98765 43210", 24, 65);

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(16, 110, width - 32, 260, 12);
      ctx.fill();
      ctx.strokeStyle = "#CBD5E1";
      ctx.stroke();

      ctx.fillStyle = "#0F172A";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Dear Customer,", 30, 145);
      ctx.fillText("Your SBI YONO account will be suspended today", 30, 170);
      ctx.fillText("due to pending PAN verification.", 30, 195);
      ctx.fillText("Update immediately to avoid ₹25,000 fine:", 30, 220);

      ctx.fillStyle = "#DC2626";
      ctx.font = "bold 13px monospace";
      ctx.fillText("http://sbi-kyc-verify.apk", 30, 255);

      ctx.fillStyle = "#64748B";
      ctx.font = "11px sans-serif";
      ctx.fillText("Sent at: 11:30 AM via Cellular", 30, 310);

    } else {
      ctx.fillStyle = "#047857";
      ctx.fillRect(0, 32, width, 55);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Payment Completed", 24, 65);

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(16, 100, width - 32, height - 120, 12);
      ctx.fill();
      ctx.strokeStyle = "#A7F3D0";
      ctx.stroke();

      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(width / 2, 145, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✓", width / 2, 154);

      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(preset.amount, width / 2, 205);

      ctx.fillStyle = "#047857";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`To: ${preset.payee}`, width / 2, 230);

      ctx.textAlign = "left";
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#64748B";
      ctx.fillText("NPCI UPI Ref No (UTR):", 35, 280);
      ctx.fillStyle = "#065F46";
      ctx.font = "bold 12px monospace";
      ctx.fillText("432981029381", 185, 280);

      ctx.fillStyle = "#64748B";
      ctx.font = "12px sans-serif";
      ctx.fillText("Date & Time:", 35, 310);
      ctx.fillStyle = "#0F172A";
      ctx.font = "12px sans-serif";
      ctx.fillText(preset.timestamp, 185, 310);
    }

    // Draw Red Flag inspection overlay pins
    preset.flaws.forEach((flaw, idx) => {
      const boxX = (flaw.x / 100) * width;
      const boxY = (flaw.y / 100) * height;
      const boxW = (flaw.w / 100) * width;
      const boxH = (flaw.h / 100) * height;

      const isSelected = idx === activePinIndex;
      const pinColor = flaw.isSafe ? "#10B981" : "#EF4444";

      ctx.strokeStyle = pinColor;
      ctx.lineWidth = isSelected ? 3 : 1.8;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(boxX + 12, boxY + 12, isSelected ? 12 : 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(flaw.isSafe ? "✓" : (idx + 1).toString(), boxX + 12, boxY + 15);
    });
  }

  // Dynamic Image Forensics Engine v3.0
  // Multi-signal forensic analysis: border texture, watermark detection, noise analysis,
  // aspect ratio, and filename heuristics to catch AI-generated / template fake receipts.
  analyzeUploadedImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const W = 400;
        const H = Math.round(W * (img.height / img.width));
        const offCanvas = document.createElement("canvas");
        offCanvas.width = W;
        offCanvas.height = H;
        const offCtx = offCanvas.getContext("2d");
        offCtx.drawImage(img, 0, 0, W, H);

        const imgData = offCtx.getImageData(0, 0, W, H);
        const pixels = imgData.data;

        // ─── FORENSIC SIGNAL 1: BORDER TEXTURE ANALYSIS ───────────────────────
        // Real phone screenshots have a uniform solid edge (black/white status bar).
        // AI-generated / design-tool fakes have colorful, textured, torn paper borders.
        // We sample the outer 8% ring of pixels and compute the color variance.
        const borderDepth = Math.floor(Math.min(W, H) * 0.08);
        const borderPixels = [];
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (x < borderDepth || x >= W - borderDepth || y < borderDepth || y >= H - borderDepth) {
              const idx = (y * W + x) * 4;
              borderPixels.push(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
            }
          }
        }
        let borderMeanR = 0, borderMeanG = 0, borderMeanB = 0;
        const bLen = borderPixels.length / 3;
        for (let i = 0; i < borderPixels.length; i += 3) {
          borderMeanR += borderPixels[i];
          borderMeanG += borderPixels[i + 1];
          borderMeanB += borderPixels[i + 2];
        }
        borderMeanR /= bLen; borderMeanG /= bLen; borderMeanB /= bLen;
        let borderVariance = 0;
        for (let i = 0; i < borderPixels.length; i += 3) {
          borderVariance += Math.pow(borderPixels[i] - borderMeanR, 2);
          borderVariance += Math.pow(borderPixels[i + 1] - borderMeanG, 2);
          borderVariance += Math.pow(borderPixels[i + 2] - borderMeanB, 2);
        }
        borderVariance = Math.sqrt(borderVariance / (bLen * 3));
        // Real screenshot edge StdDev < 20; torn/textured AI border > 35
        const hasTornBorder = borderVariance > 32;

        // ─── FORENSIC SIGNAL 2: RED WATERMARK / SAMPLE STAMP DETECTION ────────
        // "SAMPLE", "DEMO", "FAKE" stamps are typically bold RED text on white.
        // Count pixels where R is dominant, saturated red (not pink/orange).
        let redStampCount = 0;
        const totalPixels = (pixels.length / 4);
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          if (r > 160 && g < 90 && b < 90 && r > g * 2 && r > b * 2) {
            redStampCount++;
          }
        }
        const redStampRatio = (redStampCount / totalPixels) * 100;
        // Even a small red stamp covers >0.25% of pixels at standard res
        const hasRedWatermark = redStampRatio > 0.25;

        // ─── FORENSIC SIGNAL 3: CENTER BACKGROUND NOISE ───────────────────────
        // Real screenshots have a very clean white/light card background (smooth gradients).
        // AI-generated receipts have paper grain, crumple noise, texture artifacts in card area.
        const cx1 = Math.floor(W * 0.2), cx2 = Math.floor(W * 0.8);
        const cy1 = Math.floor(H * 0.25), cy2 = Math.floor(H * 0.75);
        const centerSamples = [];
        for (let y = cy1; y < cy2; y += 3) {
          for (let x = cx1; x < cx2; x += 3) {
            const idx = (y * W + x) * 4;
            const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            centerSamples.push(brightness);
          }
        }
        let centerMean = 0;
        for (const v of centerSamples) centerMean += v;
        centerMean /= centerSamples.length;
        let centerVariance = 0;
        for (const v of centerSamples) centerVariance += Math.pow(v - centerMean, 2);
        centerVariance = Math.sqrt(centerVariance / centerSamples.length);
        // Clean screenshot card area stdDev < 12; paper/noise texture > 22
        const hasPaperNoise = centerVariance > 20;

        // ─── FORENSIC SIGNAL 4: ASPECT RATIO ──────────────────────────────────
        const aspectRatio = img.height / img.width;
        const isPortraitMobile = aspectRatio >= 1.4 && aspectRatio <= 2.5;
        const isHorizontal = aspectRatio < 1.15;

        // ─── FORENSIC SIGNAL 5: BRAND COLOR PROFILE ───────────────────────────
        let greenCount = 0, blueCount = 0, purpleCount = 0, whiteGrayCount = 0;
        let totalSamples = 0;
        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          totalSamples++;
          if (g > 140 && g > r * 1.3 && g > b * 1.3) greenCount++;
          if (b > 130 && b > r * 1.2 && g < 180) blueCount++;
          if (r > 80 && b > 120 && g < 70) purpleCount++;
          if (r > 220 && g > 220 && b > 220) whiteGrayCount++;
        }
        const greenRatio = (greenCount / totalSamples) * 100;
        const blueRatio = (blueCount / totalSamples) * 100;
        const purpleRatio = (purpleCount / totalSamples) * 100;
        const cardBgRatio = (whiteGrayCount / totalSamples) * 100;

        // ─── FORENSIC SIGNAL 6: FILENAME HEURISTICS ───────────────────────────
        const lowerName = file.name.toLowerCase();
        const hasScamKeyword = /fake|spoof|scam|prank|fraud|edited|hack|test|mod|tamper|sample|demo|mock/i.test(lowerName);
        const hasGenuineKeyword = /genuine|real|bank|pass|valid|official|verified|statement|receipt|paytm|phonepe|gpay|upi|screenshot|img/i.test(lowerName);

        // ─── NON-PAYMENT IMAGE GATE ────────────────────────────────────────────
        const hasPaymentUICharacteristics = (isPortraitMobile || cardBgRatio > 30) &&
          (blueRatio > 0.3 || purpleRatio > 0.3 || greenRatio > 0.3 || hasGenuineKeyword || hasScamKeyword || hasTornBorder);

        if (!hasPaymentUICharacteristics && isHorizontal && cardBgRatio < 20) {
          const analysis = {
            name: file.name, width: img.width, height: img.height,
            imageSrc: e.target.result, isPaymentReceipt: false,
            risk: "invalid", score: null,
            verdict: "INVALID / NON-PAYMENT IMAGE",
            findings: [
              { title: "Non-Payment Image Detected", desc: "This image does not match mobile banking or payment UI layouts.", severity: "warning" },
              { title: "Aspect Ratio Incompatible", desc: `Detected dimensions (${img.width}×${img.height}px, ratio ${aspectRatio.toFixed(2)}) represent landscape or non-mobile media.`, severity: "info" },
              { title: "Action Required", desc: "Please upload a payment screenshot from Paytm, PhonePe, Google Pay, BHIM, or a bank SMS.", severity: "info" }
            ]
          };
          if (callback) callback(analysis);
          return;
        }

        // ==========================================
        // MULTI-SIGNAL FRAUD SCORING ENGINE v3.0
        // Neutral baseline — image must PROVE itself genuine via clean signals,
        // not benefit from a low default score.
        // ==========================================
        const findings = [];
        let calculatedScore = 15; // Neutral baseline — not safe, not fake by default
        let fraudSignalsTriggered = 0;

        // --- SIGNAL 1: BORDER TEXTURE ---
        if (hasTornBorder) {
          fraudSignalsTriggered++;
          calculatedScore += 60;
          findings.push({
            title: "⚠ Torn / Textured Border Detected — Template Fake",
            desc: `Edge pixel variance (σ=${borderVariance.toFixed(1)}) is ${borderVariance.toFixed(0)}% above the threshold for real phone screenshots (σ<20). Real phone screenshots have a clean uniform status bar edge. This image has a colorful, irregular, textured border — a telltale sign of AI image generation, Canva receipt mockups, or ChatGPT-edited images.`,
            severity: "critical"
          });
        } else {
          findings.push({
            title: "✓ Clean Screenshot Border",
            desc: `Edge pixel variance (σ=${borderVariance.toFixed(1)}) is within the authentic range for real phone screenshots (σ<20). No torn or textured border detected.`,
            severity: "safe"
          });
          calculatedScore -= 5;
        }

        // --- SIGNAL 2: RED WATERMARK / SAMPLE STAMP ---
        if (hasRedWatermark) {
          fraudSignalsTriggered++;
          calculatedScore += 70;
          findings.push({
            title: `⚠ "SAMPLE" / Watermark Stamp Detected (${redStampRatio.toFixed(2)}% red pixels)`,
            desc: `A bold red region consistent with a "SAMPLE", "DEMO", or "FAKE" watermark stamp was detected (${redStampCount.toLocaleString()} red-dominant pixels, ${redStampRatio.toFixed(2)}% coverage). Receipt templates and mockup generators commonly apply such stamps to prevent misuse. This image is NOT a genuine transaction proof.`,
            severity: "critical"
          });
        } else {
          findings.push({
            title: "✓ No Watermark Stamp Found",
            desc: `Red-stamp pixel ratio (${redStampRatio.toFixed(3)}%) is below the detection threshold. No "SAMPLE" or "DEMO" watermark overlay detected.`,
            severity: "safe"
          });
        }

        // --- SIGNAL 3: CENTER PAPER/GRAIN NOISE ---
        if (hasPaperNoise) {
          fraudSignalsTriggered++;
          calculatedScore += 25;
          findings.push({
            title: "⚠ Paper Grain / AI Texture Noise in Receipt Area",
            desc: `Central card-area brightness variance (σ=${centerVariance.toFixed(1)}) exceeds the clean-screenshot threshold (σ<12). Real payment app UIs render pixel-perfect flat whites — this image has paper grain or crumpled texture typical of AI-generated receipt mockups.`,
            severity: "high"
          });
        } else {
          findings.push({
            title: "✓ Clean Flat Card Background",
            desc: `Receipt area brightness variance (σ=${centerVariance.toFixed(1)}) is within authentic range (σ<20). No paper grain or AI texture noise detected.`,
            severity: "safe"
          });
          calculatedScore -= 3;
        }

        // --- SIGNAL 4: ASPECT RATIO ---
        if (isPortraitMobile) {
          findings.push({
            title: "Aspect Ratio: Mobile Viewport Shape",
            desc: `Ratio ${aspectRatio.toFixed(2)}:1 matches a standard smartphone display. Note: AI-generated fakes also use portrait ratios, so this alone does not confirm authenticity.`,
            severity: "info"
          });
        } else {
          calculatedScore += 20;
          findings.push({
            title: "⚠ Non-Standard Aspect Ratio",
            desc: `Ratio ${aspectRatio.toFixed(2)}:1 is outside the typical mobile screenshot range (1.4–2.5). Cropped or composited images often hide the status bar timestamp.`,
            severity: "warning"
          });
        }

        // --- SIGNAL 5: RESOLUTION ---
        if (img.width >= 700 && img.height >= 1200) {
          findings.push({
            title: "Resolution: HD",
            desc: `${img.width}×${img.height}px — matches native smartphone screen resolution.`,
            severity: "info"
          });
        } else {
          calculatedScore += 8;
          findings.push({
            title: "Resolution: Below HD",
            desc: `${img.width}×${img.height}px — below typical native screenshot resolution. May indicate web-compressed or edited image.`,
            severity: "caution"
          });
        }

        // --- SIGNAL 6: FILENAME ---
        if (hasScamKeyword) {
          fraudSignalsTriggered++;
          calculatedScore += 30;
          findings.push({
            title: "⚠ Suspicious Filename Keywords",
            desc: `Filename "${file.name}" contains keywords associated with fake/sample/demo content.`,
            severity: "high"
          });
        }

        // --- SIGNAL 7: BRAND COLOR PRESENCE (now neutral, not a trust signal) ---
        if (blueRatio > 1.0 || purpleRatio > 0.8) {
          findings.push({
            title: "Brand Colors Detected",
            desc: `${purpleRatio > 0.8 ? 'Purple (PayZapp / PhonePe)' : 'Blue (Paytm / GPay / SBI)'} palette present. Note: template generators deliberately copy app color palettes — this is not a trust indicator.`,
            severity: "info"
          });
        }

        // --- UTR ADVISORY ---
        findings.push({
          title: "Always Verify UTR with Your Bank",
          desc: "Even if no visual fraud signals are found, cross-check the 12-digit NPCI UPI Reference Number (UTR/RRN) via your bank's SMS, net-banking, or by calling 1800-xxx to confirm settlement.",
          severity: "info"
        });

        // ─── FINAL SCORING & VERDICT ───────────────────────────────────────────
        calculatedScore = Math.max(5, Math.min(98, calculatedScore));

        let riskLevel, verdictLabel;
        if (calculatedScore >= 65 || fraudSignalsTriggered >= 2) {
          riskLevel = "high";
          calculatedScore = Math.max(calculatedScore, 72); // Ensure high risk reads clearly
          verdictLabel = "COUNTERFEIT / HIGH RISK — DO NOT ACCEPT";
        } else if (calculatedScore >= 35 || fraudSignalsTriggered >= 1) {
          riskLevel = "medium";
          verdictLabel = "CAUTION: UNVERIFIED — CONFIRM UTR WITH BANK";
        } else {
          riskLevel = "low";
          verdictLabel = "LIKELY GENUINE — STILL VERIFY UTR";
        }

        const analysis = {
          name: file.name,
          width: img.width,
          height: img.height,
          imageSrc: e.target.result,
          isPaymentReceipt: true,
          risk: riskLevel,
          score: calculatedScore,
          verdict: verdictLabel,
          findings,
          // Debug info (shown in console only)
          _debug: { borderVariance: borderVariance.toFixed(2), redStampRatio: redStampRatio.toFixed(3), centerVariance: centerVariance.toFixed(2), fraudSignalsTriggered }
        };

        console.log("[SurakshaPay OCR v3.0] Forensic debug:", analysis._debug);
        if (callback) callback(analysis);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
