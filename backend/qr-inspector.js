// qr-inspector.js - Universal Multi-Format QR Forensic Engine
// Analyzes ANY QR Code: Payment/UPI/BharatQR, Website URLs, Wi-Fi Networks, Phone/USSD, vCards, App Stores & Plain Text.
// Calculates exact Risk Percentage (0-100%) and classifies Real vs Fake / Malicious.

export class QrInspector {
  constructor() {
    this.sampleQRs = [
      {
        id: "sample_scam_collect",
        title: "UPI Scam: 'Scan to Receive' Trap",
        type: "payment_upi",
        risk: "high",
        payload: "upi://pay?pa=claim.refund9912@ybl&pn=Govt_Cashback_Portal&am=3500.00&cu=INR&tn=ENTER_PIN_TO_RECEIVE_3500",
        description: "Scammer tricks seller: 'Scan this code to receive advance'. In reality, this withdraws ₹3,500 from the victim."
      },
      {
        id: "sample_genuine_merchant",
        title: "UPI Real: Verified Grocery Counter QR",
        type: "payment_upi",
        risk: "low",
        payload: "upi://pay?pa=sharmagrocery@okaxis&pn=Sharma%20General%20Store&cu=INR&tn=Grocery%20Purchase",
        description: "Standard legitimate BharatQR/UPI merchant QR without fixed deductions."
      },
      {
        id: "sample_phishing_url",
        title: "Website Fake: Bank KYC APK Download",
        type: "website_url",
        risk: "high",
        payload: "http://sbi-yono-kyc-update.xyz/download/login-update.apk",
        description: "Phishing QR placed on flyers or posters. Downloads banking spyware directly onto the phone."
      },
      {
        id: "sample_safe_url",
        title: "Website Real: Official Bank Portal",
        type: "website_url",
        risk: "low",
        payload: "https://www.onlinesbi.sbi/personal/security_tips.html",
        description: "Official, verified HTTPS banking portal with valid SSL domain."
      },
      {
        id: "sample_wifi_honeypot",
        title: "Wi-Fi Fake: Unencrypted Honeypot",
        type: "wifi_network",
        risk: "high",
        payload: "WIFI:S:Free_Airport_HighSpeed_WiFi;T:nopass;P:;;",
        description: "Rogue open Wi-Fi hotspot QR code. Uses zero encryption to intercept passwords and banking sessions."
      },
      {
        id: "sample_wifi_secure",
        title: "Wi-Fi Real: WPA2 Protected Network",
        type: "wifi_network",
        risk: "low",
        payload: "WIFI:T:WPA;S:Office_Guest_Secure;P:SecurePass#2026;;",
        description: "Legitimate private Wi-Fi access point with standard WPA2 encryption and strong password."
      },
      {
        id: "sample_vcard_safe",
        title: "vCard Real: Digital Contact Card",
        type: "vcard_contact",
        risk: "low",
        payload: "BEGIN:VCARD\nVERSION:3.0\nN:Verma;Nikhil;;;\nFN:Nikhil Verma\nORG:Digital Safety Desk\nTEL;TYPE=CELL:+919876543210\nEMAIL:contact@example.org\nEND:VCARD",
        description: "Standard digital business card format without malicious redirect links."
      }
    ];
  }

  // Universal Classification & Analysis of ANY QR payload
  analyze(rawPayload) {
    if (!rawPayload || typeof rawPayload !== "string" || rawPayload.trim().length === 0) {
      return null;
    }

    const payload = rawPayload.trim();

    // 1. UPI / Payment QR (case-insensitive) or EMVCo BharatQR (starts with 000201)
    if (
      /^upi:\/\//i.test(payload) ||
      (/[?&]pa=[^&]+/i.test(payload) && /@/.test(payload)) ||
      /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(payload) ||
      /^000201/.test(payload)
    ) {
      return this.analyzeUPIPayment(payload);
    }

    // 2. Wi-Fi Network QR (case-insensitive)
    if (/^wifi:/i.test(payload)) {
      return this.analyzeWiFiNetwork(payload);
    }

    // 3. App Store / Google Play Deep Link
    if (/^market:\/\//i.test(payload) || /play\.google\.com\/store|apps\.apple\.com/i.test(payload)) {
      return this.analyzeAppMarket(payload);
    }

    // 4. Website / URL QR (http, https, www., or domain.tld/path)
    if (/^https?:\/\//i.test(payload) || /^www\./i.test(payload) || /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([\/?#].*)?$/i.test(payload)) {
      return this.analyzeWebsiteURL(payload);
    }

    // 5. vCard / MeCard Contact QR
    if (/BEGIN:VCARD/i.test(payload) || /^MECARD:/i.test(payload)) {
      return this.analyzeVCard(payload);
    }

    // 6. Phone / Call-Forwarding USSD / SMS QR
    if (/^(tel:|smsto:|sms:)/i.test(payload)) {
      return this.analyzeTelOrSMS(payload);
    }

    // 7. Generic Plain Text
    return this.analyzeGenericText(payload);
  }

  // --- 1. Payment QR Inspector ---
  analyzeUPIPayment(payload) {
    let pa = "", pn = "Unknown Payee", am = null, tn = "", cu = "INR";
    const flags = [];
    let calculatedRisk = 6;

    if (/^000201/.test(payload)) {
      // EMVCo / BharatQR payload
      const upiMatch = payload.match(/[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32}/);
      pa = upiMatch ? upiMatch[0] : "EMVCo Merchant Tag";
      pn = "BharatQR / EMVCo Merchant";
      flags.push({
        severity: "safe",
        title: "EMVCo / BharatQR Standard Structure",
        desc: "Follows standardized ISO/NPCI interoperable merchant QR framing."
      });
    } else if (/^upi:\/\//i.test(payload) || /pa=/i.test(payload)) {
      try {
        const urlStr = /^upi:\/\//i.test(payload) ? payload.replace(/^upi:\/\//i, "http://") : "http://upi?" + payload;
        const url = new URL(urlStr);
        const params = new URLSearchParams(url.search);

        pa = params.get("pa") || "";
        pn = decodeURIComponent(params.get("pn") || "Unknown Payee");
        am = params.get("am") || null;
        tn = decodeURIComponent(params.get("tn") || "");
        cu = params.get("cu") || "INR";

        if (/^upi:\/\/mandate/i.test(payload)) {
          flags.push({
            severity: "critical",
            title: "UPI AutoPay Mandate Request",
            desc: "This QR sets up recurring automatic deductions from your bank account without asking for a PIN every month."
          });
          calculatedRisk = 86;
        }
      } catch (e) {
        pa = payload;
      }
    } else {
      pa = payload;
    }

    if (am && parseFloat(am) > 0) {
      flags.push({
        severity: "critical",
        title: `Forced Deduction Amount (₹${am})`,
        desc: `This QR is coded to DEDUCT ₹${am} from your bank account upon PIN entry. Never scan a QR to receive money.`
      });
      calculatedRisk = Math.max(calculatedRisk, 95);
    }

    if (/pin|receive|claim|refund|cashback|prize|lottery/i.test(tn)) {
      flags.push({
        severity: "critical",
        title: `Deceptive Transaction Note ('${tn}')`,
        desc: "Transaction note uses social engineering bait to trick you into approving an outgoing transfer."
      });
      calculatedRisk = Math.max(calculatedRisk, 98);
    }

    if (/refund|support|care|helpline|sbi-kyc|cashback|reward|lottery|verify/i.test(pa)) {
      flags.push({
        severity: "critical",
        title: `Impersonation VPA Handle ('${pa}')`,
        desc: "Handle impersonates bank support or reward departments. Official banks do not collect money via reward VPAs."
      });
      calculatedRisk = Math.max(calculatedRisk, 89);
    }

    if (calculatedRisk <= 20) {
      flags.push({
        severity: "safe",
        title: "Clean Merchant Payment Intent",
        desc: "No forced withdrawal amount, AutoPay mandate, or deceptive wording found."
      });
    }

    const verdict = this.computeVerdict(calculatedRisk, "REAL / VERIFIED MERCHANT QR", "SUSPICIOUS PAYMENT QR", "FAKE / MALICIOUS PAYMENT TRAP");
    return {
      category: "payment_upi",
      categoryLabel: "Payment / UPI QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Payee UPI ID (VPA)": pa || "Not Specified",
        "Payee Name": pn,
        "Amount Trigger": am ? `₹${am} (Pre-filled deduction)` : "Open (Customer enters amount)",
        "Transaction Note": tn || "None",
        "Currency": cu
      },
      flags,
      goldenRule: "Scanning a payment QR ALWAYS transfers money OUT of your account. You can NEVER receive money by scanning someone else's QR."
    };
  }

  // --- 2. Website / URL Inspector ---
  analyzeWebsiteURL(payload) {
    let cleanUrl = payload.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "http://" + cleanUrl;
    }

    let domain = "";
    const isHttps = /^https:\/\//i.test(cleanUrl);
    const flags = [];
    let calculatedRisk = isHttps ? 10 : 48;

    try {
      const parsed = new URL(cleanUrl);
      domain = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname.toLowerCase();
      const fullLower = cleanUrl.toLowerCase();

      // Check 1: @ Userinfo Phishing Deception (e.g. https://sbi.co.in@evil.com)
      if (parsed.username || parsed.password || cleanUrl.includes("@")) {
        flags.push({
          severity: "critical",
          title: "URL Credential / @ Spoofing Trick",
          desc: "URL uses '@' symbol to disguise the true destination host behind a trusted domain name."
        });
        calculatedRisk = 97;
      }

      // Check 2: Direct Executable / APK Sideloading
      if (/\.(apk|exe|bat|scr|msi|vbs)(\?|$)/i.test(pathname) || (fullLower.includes("download") && fullLower.includes("apk"))) {
        flags.push({
          severity: "critical",
          title: "Malicious App / Executable Download (.APK)",
          desc: `QR triggers direct download of '${pathname}'. Fraudsters use this to install OTP-stealing spyware.`
        });
        calculatedRisk = Math.max(calculatedRisk, 98);
      }

      // Check 3: Raw IP Address Host
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain) || /^\[.*\]$/.test(domain)) {
        flags.push({
          severity: "critical",
          title: "Unregistered Raw IP Address",
          desc: `Points directly to IP '${domain}' without a registered domain certificate.`
        });
        calculatedRisk = Math.max(calculatedRisk, 93);
      }

      // Check 4: Punycode / Homoglyph Domain
      if (domain.includes("xn--")) {
        flags.push({
          severity: "critical",
          title: "Homoglyph / Punycode Spoofed Domain",
          desc: `Domain '${domain}' uses hidden Unicode lookalike characters to mimic legitimate websites.`
        });
        calculatedRisk = Math.max(calculatedRisk, 95);
      }

      // Check 5: High-risk Disposable TLDs
      if (/\.(xyz|top|tk|ml|ga|cf|gq|cc|ru|click|live|monster|download|icu|vip|buzz|work)$/i.test(domain)) {
        flags.push({
          severity: "critical",
          title: `High-Risk Top-Level Domain ('.${domain.split('.').pop()}')`,
          desc: "Disposable domain extension commonly used in phishing and scam portals."
        });
        calculatedRisk = Math.max(calculatedRisk, 89);
      }

      // Check 6: Brand Impersonation
      const brandPatterns = /paytm|phonepe|googlepay|gpay|sbi|yono|hdfc|icici|axisbank|pnb|npci|bhim|uidai|aadhaar|amazon|flipkart|paypal|whatsapp/i;
      const officialDomains = [
        "sbi.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com", "axisbank.com", "kotak.com",
        "paytm.com", "phonepe.com", "pay.google.com", "google.com", "npci.org.in", "bhimupi.org.in",
        "uidai.gov.in", "cybercrime.gov.in", "amazon.in", "amazon.com", "flipkart.com", "paypal.com",
        "whatsapp.com", "github.com", "wikipedia.org", "youtube.com", "microsoft.com", "apple.com"
      ];
      const isOfficial = officialDomains.some(d => domain === d || domain.endsWith("." + d));

      if (brandPatterns.test(domain) && !isOfficial) {
        flags.push({
          severity: "critical",
          title: `Fake Brand Impersonation ('${domain}')`,
          desc: "Mimics a well-known bank, government agency, or payment brand on an unofficial domain."
        });
        calculatedRisk = Math.max(calculatedRisk, 96);
      } else if (isOfficial && isHttps) {
        flags.push({
          severity: "safe",
          title: "Verified Official Domain",
          desc: `'${domain}' matches an authorized official web portal over HTTPS.`
        });
        calculatedRisk = 4;
      }

      // Check 7: URL Shorteners
      if (/^(bit\.ly|tinyurl\.com|is\.gd|cutt\.ly|t\.co|shorturl\.at|rb\.gy|ow\.ly)$/i.test(domain)) {
        flags.push({
          severity: "warning",
          title: `Concealed Shortened URL ('${domain}')`,
          desc: "Hides the true destination website behind a link shortener. Treat with high caution."
        });
        calculatedRisk = Math.max(calculatedRisk, 74);
      }

      // Check 8: Phishing path keywords
      if (/(kyc-update|verify-pan|account-block|claim-reward|cashback-prize|login-verify)/i.test(fullLower) && !isOfficial) {
        flags.push({
          severity: "critical",
          title: "Phishing Path Keywords",
          desc: "URL path contains known credential-harvesting keywords ('kyc-update', 'claim-reward', etc.)."
        });
        calculatedRisk = Math.max(calculatedRisk, 92);
      }

      // Check 9: Unencrypted HTTP
      if (!isHttps) {
        flags.push({
          severity: "warning",
          title: "Unencrypted HTTP (No SSL)",
          desc: "Traffic is sent in plain text without HTTPS encryption."
        });
        calculatedRisk = Math.max(calculatedRisk, 58);
      } else if (flags.length === 0) {
        flags.push({
          severity: "safe",
          title: "HTTPS Encrypted Standard Domain",
          desc: "Uses SSL/TLS encryption and standard domain structure with no detected phishing patterns."
        });
      }
    } catch (e) {
      flags.push({
        severity: "warning",
        title: "Malformed URL Syntax",
        desc: "Could not parse clean domain structure."
      });
      calculatedRisk = 68;
    }

    const verdict = this.computeVerdict(calculatedRisk, "REAL / SAFE WEBSITE LINK", "CAUTION: UNVERIFIED WEB LINK", "FAKE / PHISHING WEBSITE QR");
    return {
      category: "website_url",
      categoryLabel: "Website / URL QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Target URL": cleanUrl,
        "Host Domain": domain || "Unknown",
        "Encryption": isHttps ? "HTTPS (SSL Secured)" : "HTTP (Unencrypted)",
        "Resource Type": /\.apk/i.test(cleanUrl) ? "Android APK Installer" : "Web Page"
      },
      flags,
      goldenRule: "Always verify the exact domain spelling before logging in, and never install APK files downloaded via QR codes."
    };
  }

  // --- 3. Wi-Fi Network Inspector ---
  analyzeWiFiNetwork(payload) {
    // Handle WIFI:T:WPA;S:Name;P:Pass;H:true;; in any field order
    const getField = (key) => {
      const regex = new RegExp(`(?:^|[;:])${key}:((?:\\\\.|[^;])*)`, "i");
      const m = payload.match(regex);
      return m ? m[1].replace(/\\([\\;,:"])/g, "$1") : "";
    };

    const ssid = getField("S") || "Unnamed Network";
    const rawSec = getField("T").toUpperCase();
    const security = rawSec || "NOPASS";
    const password = getField("P");
    const isHidden = getField("H").toLowerCase() === "true";

    const flags = [];
    let calculatedRisk = 6;

    // Encryption check
    if (security === "NOPASS" || security === "NONE" || !password) {
      flags.push({
        severity: "critical",
        title: "Unencrypted Open Wi-Fi (Evil-Twin Risk)",
        desc: "Network has NO password protection. Attackers on the same open hotspot can intercept unencrypted traffic or launch fake captive-portal phishing logins."
      });
      calculatedRisk = 88;
    } else if (security === "WEP") {
      flags.push({
        severity: "critical",
        title: "Broken WEP Encryption",
        desc: "WEP security is obsolete and can be cracked within minutes."
      });
      calculatedRisk = 78;
    } else if (["WPA", "WPA2", "WPA3", "SAE", "WPA/WPA2"].includes(security)) {
      if (password.length < 8 || /^(12345678|password|123456789|admin123|00000000)$/i.test(password)) {
        flags.push({
          severity: "warning",
          title: `Weak Wi-Fi Password ('${security}')`,
          desc: "Network uses encryption, but the embedded password is short or commonly guessed."
        });
        calculatedRisk = 42;
      } else {
        flags.push({
          severity: "safe",
          title: `Encrypted Network (${security})`,
          desc: "Uses modern Wi-Fi encryption with a credential handshake."
        });
      }
    } else {
      flags.push({
        severity: "warning",
        title: `Unusual Security Protocol ('${security}')`,
        desc: "Verify the network administrator before joining."
      });
      calculatedRisk = 50;
    }

    // Honeypot / Fake public hotspot naming
    if (/free.*wifi|airport.*free|railway.*free|metro.*free|public.*wifi|sbi.*wifi|govt.*free/i.test(ssid)) {
      flags.push({
        severity: "critical",
        title: `Suspicious Public Honeypot Name ('${ssid}')`,
        desc: "Imitates public facility Wi-Fi. Scammers place fake 'Free Wi-Fi' QR stickers in malls, cafes, and stations to harvest data."
      });
      calculatedRisk = Math.max(calculatedRisk, 84);
    }

    // Embedded script or malicious URI inside SSID/Password
    if (/<script|javascript:|https?:\/\//i.test(ssid + password)) {
      flags.push({
        severity: "critical",
        title: "Malicious Injection Payload in Wi-Fi Fields",
        desc: "Contains URL or script code inside Wi-Fi configuration fields."
      });
      calculatedRisk = 96;
    }

    if (isHidden) {
      flags.push({
        severity: "info",
        title: "Hidden SSID",
        desc: "Network does not broadcast its name publicly."
      });
    }

    const verdict = this.computeVerdict(calculatedRisk, "REAL / SECURE WI-FI QR", "CAUTION: WEAK WI-FI SECURITY", "FAKE / RISKY WI-FI HONEYPOT");
    return {
      category: "wifi_network",
      categoryLabel: "Wi-Fi Network QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Network Name (SSID)": ssid,
        "Encryption Protocol": security === "NOPASS" ? "None (Open Network)" : security,
        "Password Status": password ? `Protected (${password.length} chars)` : "No Password",
        "Hidden SSID": isHidden ? "Yes" : "No"
      },
      flags,
      goldenRule: "Never connect to unencrypted 'Free Wi-Fi' QR stickers in public places, and avoid banking apps on public hotspots."
    };
  }

  // --- 4. App Store / Market Link ---
  analyzeAppMarket(payload) {
    const isOfficial = /^market:\/\/details\?id=/i.test(payload) || /^https:\/\/(play\.google\.com\/store|apps\.apple\.com)/i.test(payload);
    const flags = [];
    const calculatedRisk = isOfficial ? 6 : 86;

    if (isOfficial) {
      flags.push({
        severity: "safe",
        title: "Official App Store Link",
        desc: "Directs to verified Google Play Store or Apple App Store listing."
      });
    } else {
      flags.push({
        severity: "critical",
        title: "Unofficial App Download Source",
        desc: "Does not match verified official Play Store or App Store domains."
      });
    }

    const verdict = this.computeVerdict(calculatedRisk, "REAL / OFFICIAL APP STORE QR", "CAUTION: UNVERIFIED APP LINK", "FAKE / UNOFFICIAL APP SOURCE");
    return {
      category: "app_market",
      categoryLabel: "App Store QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Target Link": payload,
        "Verified Store": isOfficial ? "Official Store" : "Unverified"
      },
      flags,
      goldenRule: "Install apps solely from Google Play Store or Apple App Store."
    };
  }

  // --- 5. vCard / Contact Inspector ---
  analyzeVCard(payload) {
    const flags = [];
    let calculatedRisk = 6;

    const urlMatches = payload.match(/https?:\/\/[^\s\n\r;]+/gi);
    if (urlMatches) {
      urlMatches.forEach(u => {
        if (/bit\.ly|\.apk|\.xyz|\.top|tinyurl/i.test(u)) {
          flags.push({
            severity: "critical",
            title: `Suspicious Link Inside Contact ('${u}')`,
            desc: "Contact card contains a shortened or risky phishing link."
          });
          calculatedRisk = 91;
        }
      });
    }

    if (calculatedRisk < 20) {
      flags.push({
        severity: "safe",
        title: "Standard Contact Card",
        desc: "Valid vCard/MeCard address book payload with no malicious redirects."
      });
    }

    const nameMatch = payload.match(/FN:([^\n\r]+)/i) || payload.match(/N:([^\n\r;]+)/i);
    const telMatch = payload.match(/TEL[^:]*:([^\n\r;]+)/i);

    const verdict = this.computeVerdict(calculatedRisk, "REAL / SAFE CONTACT QR", "CAUTION: CHECK CONTACT LINKS", "FAKE / MALICIOUS CONTACT QR");
    return {
      category: "vcard_contact",
      categoryLabel: "Contact (vCard) QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Contact Name": nameMatch ? nameMatch[1].trim() : "Specified in Card",
        "Phone": telMatch ? telMatch[1].trim() : "None",
        "Embedded URLs": urlMatches ? urlMatches.join(", ") : "None"
      },
      flags,
      goldenRule: "Inspect embedded web links inside shared digital business cards before opening them."
    };
  }

  // --- 6. Phone / Call Forwarding USSD / SMS QR ---
  analyzeTelOrSMS(payload) {
    const flags = [];
    let calculatedRisk = 15;

    if (/(\*21\*|\*\*21\*|\*401\*|\*402\*)/i.test(payload)) {
      flags.push({
        severity: "critical",
        title: "Call Forwarding Hijack Code (*21* / *401*)",
        desc: "Dialing this code silently forwards all your incoming calls and banking OTPs to a scammer's phone number!"
      });
      calculatedRisk = 99;
    } else if (/^smsto:/i.test(payload) && /(kyc|otp|pin|bank|block|1900)/i.test(payload)) {
      flags.push({
        severity: "critical",
        title: "Suspicious Auto-SMS Command",
        desc: "Pre-fills an SMS message designed to trigger phishing or unauthorized actions."
      });
      calculatedRisk = 86;
    } else {
      flags.push({
        severity: "safe",
        title: "Standard Call / SMS Action",
        desc: "No call-forwarding hijack or malicious SMS command detected."
      });
    }

    const verdict = this.computeVerdict(calculatedRisk, "REAL / SAFE CALL OR SMS QR", "CAUTION: VERIFY RECIPIENT", "FAKE / CALL-FORWARDING SCAM QR");
    return {
      category: "tel_sms",
      categoryLabel: "Phone / SMS Action QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Action Payload": payload
      },
      flags,
      goldenRule: "Never dial USSD strings starting with *21* or *401*—scammers use them to steal your calls and OTPs."
    };
  }

  // --- 7. Plain Text QR ---
  analyzeGenericText(payload) {
    const flags = [];
    let calculatedRisk = 10;

    if (/(pin|otp|password|kyc|urgent|lottery|winner|suspended|anydesk|quicksupport|\.apk)/i.test(payload)) {
      flags.push({
        severity: "critical",
        title: "Scam / Social Engineering Text Detected",
        desc: "Text payload contains high-risk fraud indicators (OTP/PIN prompts, KYC threats, or remote access app names)."
      });
      calculatedRisk = 85;
    } else {
      flags.push({
        severity: "safe",
        title: "Benign Plain Text Data",
        desc: "Informational text payload that does not trigger payments, apps, or network connections."
      });
    }

    const verdict = this.computeVerdict(calculatedRisk, "REAL / SAFE TEXT QR", "CAUTION: REVIEW TEXT", "FAKE / SUSPICIOUS TEXT QR");
    return {
      category: "plain_text",
      categoryLabel: "Plain Text QR",
      rawPayload: payload,
      ...verdict,
      details: {
        "Decoded Text": payload.slice(0, 120) + (payload.length > 120 ? "..." : ""),
        "Length": `${payload.length} characters`
      },
      flags,
      goldenRule: "Read decoded QR text carefully before taking any action requested."
    };
  }

  computeVerdict(score, safeText, mediumText, fakeText) {
    const clamped = Math.max(2, Math.min(99, Math.round(score)));
    if (clamped >= 70) {
      return {
        score: clamped,
        riskLevel: "high",
        isReal: false,
        realOrFakeLabel: "FAKE / MALICIOUS",
        summary: fakeText
      };
    } else if (clamped >= 30) {
      return {
        score: clamped,
        riskLevel: "medium",
        isReal: false,
        realOrFakeLabel: "SUSPICIOUS / CAUTION",
        summary: mediumText
      };
    }
    return {
      score: clamped,
      riskLevel: "low",
      isReal: true,
      realOrFakeLabel: "REAL / GENUINE",
      summary: safeText
    };
  }

  // Visual rendering of synthetic QR matrix on canvas (for typed/preset strings)
  renderQRPreview(canvas, payload, isSafe = true) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = isSafe ? "#059669" : "#DC2626";
    ctx.lineWidth = 3.5;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    const drawFinder = (x, y) => {
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(x, y, 40, 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x + 6, y + 6, 28, 28);
      ctx.fillStyle = isSafe ? "#0F172A" : "#DC2626";
      ctx.fillRect(x + 12, y + 12, 16, 16);
    };

    drawFinder(14, 14);
    drawFinder(width - 54, 14);
    drawFinder(14, height - 54);

    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash << 5) - hash + payload.charCodeAt(i);
      hash |= 0;
    }

    const cols = 20;
    const rows = 20;
    const cellSize = (width - 40) / cols;
    ctx.fillStyle = isSafe ? "#1E293B" : "#7F1D1D";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r < 6 && c < 6) || (r < 6 && c >= cols - 6) || (r >= rows - 6 && c < 6)) {
          continue;
        }
        const seed = Math.sin(hash * 0.001 + r * 12.9898 + c * 78.233) * 43758.5453;
        const frac = seed - Math.floor(seed);
        if (frac > 0.45) {
          ctx.fillRect(20 + c * cellSize, 20 + r * cellSize, cellSize - 1.2, cellSize - 1.2);
        }
      }
    }

    const badgeSize = 46;
    const cx = (width - badgeSize) / 2;
    const cy = (height - badgeSize) / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cx - 2, cy - 2, badgeSize + 4, badgeSize + 4);
    ctx.fillStyle = isSafe ? "#059669" : "#DC2626";
    ctx.fillRect(cx, cy, badgeSize, badgeSize);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";

    let label = "QR";
    if (/^upi:\/\//i.test(payload) || /pa=/i.test(payload) || /^000201/.test(payload)) label = "UPI";
    else if (/^wifi:/i.test(payload)) label = "WI-FI";
    else if (/^https?:\/\//i.test(payload) || /^www\./i.test(payload)) label = "WEB";
    else if (/VCARD|MECARD/i.test(payload)) label = "CARD";

    ctx.fillText(label, width / 2, height / 2 + 3.5);
  }
}
