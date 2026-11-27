// fraud-engine.js - Deep Rule-Based and Heuristic Digital Payment Fraud Detector (English Edition)
// Calibrated for First-Time Digital Payers, Senior Citizens, and Small Merchants.

export class FraudDetectionEngine {
  constructor() {
    this.rules = [
      {
        id: "RULE_PIN_TO_RECEIVE",
        name: "UPI PIN to Receive Money Scam (Collect Trap)",
        category: "collect_scam",
        weight: 95,
        regex: /(enter|type|insert)\s+(your\s+)?(\d[-\s]?digit\s+)?(upi\s+)?pin\s+(to|for)\s*(receive|get|claim|transfer)|(to|for)\s*(receive|get|claim).*?(scan.*qr|enter.*pin)|(scan\s+(this\s+)?(qr|code).*?(receive|get\s*money|enter.*pin))|pin.*to\s*receive/i,
        flags: {
          en: "Critical Red Flag: Requesting you to enter a UPI PIN or scan a QR code to 'RECEIVE' money."
        },
        intent: {
          en: "The fraudster has initiated a 'COLLECT REQUEST'. If you enter your UPI PIN, money will be immediately DEDUCTED from your bank account and transferred to the scammer."
        },
        goldenRule: {
          en: "The Golden Rule of Digital Payments: You NEVER need to enter your UPI PIN to receive money. UPI PIN is ONLY entered when sending money."
        }
      },
      {
        id: "RULE_REMOTE_ACCESS_APP",
        name: "Remote Screen Sharing Trojan (AnyDesk/QuickSupport)",
        category: "remote_access",
        weight: 90,
        regex: /(anydesk|teamviewer|rustdesk|quicksupport|quick\s*support|airdroid|screen\s*share|zoho\s*assist|helpdesk\s*app)/i,
        flags: {
          en: "High Danger: Prompting you to install remote desktop or screen-sharing tools (AnyDesk, QuickSupport, TeamViewer)."
        },
        intent: {
          en: "Once installed, the fraudster gains full remote visibility into your phone screen, observes your incoming bank OTPs, captures your passwords, and empties your account."
        },
        goldenRule: {
          en: "Never install AnyDesk or QuickSupport on instructions from any caller or message, even if they claim to be a bank official or customer care."
        }
      },
      {
        id: "RULE_APK_MALWARE_LINK",
        name: "Malicious APK Download Link",
        category: "malware",
        weight: 92,
        regex: /(\.apk|\.apk\?|download\s*app\s*link|install\s*app.*from\s*link|drive\.google\.com.*apk|mediafire|bit\.ly|tinyurl|is\.gd|cutt\.ly|ngrok|app-update.*\.link)/i,
        flags: {
          en: "Malware Danger: Direct link to download an unofficial Android application file (.APK)."
        },
        intent: {
          en: "This APK contains banking spyware that operates silently in the background, intercepts your incoming bank SMS alerts and OTPs, and forwards them to cybercriminals."
        },
        goldenRule: {
          en: "Install applications ONLY from Google Play Store or Apple App Store. Never install .apk files received via SMS, WhatsApp, or web links."
        }
      },
      {
        id: "RULE_KYC_ACCOUNT_SUSPENSION_URGENCY",
        name: "Urgent KYC Suspension & Disconnection Threats",
        category: "phishing_urgency",
        weight: 85,
        regex: /(yono|sbi\s*yono|kyc\s*suspended|account\s*(blocked|suspended|deactivated|freeze)|pan\s*card\s*(expired|update|link)|electricity\s*bill\s*(unpaid|disconnect)|power\s*will\s*be\s*disconnected|immediately\s*(update|call)|within\s*(24|12|2|1)\s*(hours|hrs)|debit\s*card\s*blocked)/i,
        flags: {
          en: "Social Engineering Tactic: Creating artificial panic regarding account suspension, KYC expiration, or utility disconnection."
        },
        intent: {
          en: "Scammers create false urgency ('action required within 2 hours') to manipulate you into acting impulsively before you have time to verify with your official bank branch."
        },
        goldenRule: {
          en: "No legitimate bank or utility department sends SMS with personal mobile numbers or suspicious links. When in doubt, visit your physical bank branch."
        }
      },
      {
        id: "RULE_LOTTERY_CASHBACK_REWARD",
        name: "Fake Cashback / Lottery / Scratch Card Trap",
        category: "reward_scam",
        weight: 80,
        regex: /(congratulations|you\s*have\s*won|won\s*(rs\.?|inr|₹)?\s*\d+|gpay\s*cashback|phonepe\s*reward|scratch\s*card|lucky\s*draw|lottery|claim\s*your\s*reward\s*at|tap\s*here\s*to\s*claim)/i,
        flags: {
          en: "Financial Bait: Unsolicited cash prize, lottery victory, or oversized cashback reward notification."
        },
        intent: {
          en: "The link directs to a counterfeit payment gateway that disguises a 'PAY' transaction as a 'CLAIM' button. Authorizing it transfers your money to the fraudster."
        },
        goldenRule: {
          en: "Legitimate cashbacks earned in Google Pay, PhonePe, or Paytm deposit directly into your linked bank account. You NEVER need to tap external links to claim them."
        }
      },
      {
        id: "RULE_OVERPAYMENT_REFUND_TRICK",
        name: "Shopkeeper / Vendor Overpayment Refund Scam",
        category: "vendor_refund_scam",
        weight: 88,
        regex: /(sent\s*by\s*mistake|mistakenly\s*(transferred|sent|paid)|refund\s*me|extra\s*amount|sent\s*\d+\s*instead\s*of\s*\d+|send\s*back\s*remaining)/i,
        flags: {
          en: "Merchant Alert: Customer claims they 'accidentally paid extra' and demands an immediate cash or UPI refund."
        },
        intent: {
          en: "The fraudster presents a fabricated screenshot or fake SMS alert. In reality, no funds were ever transferred to you. Issuing a refund will result in direct financial loss."
        },
        goldenRule: {
          en: "Never issue refunds based on a customer's mobile screen. Check your own Merchant Soundbox, Merchant App history, or bank statement first."
        }
      },
      {
        id: "RULE_SOUNDBOX_SILENT_DISPUTE",
        name: "Silent Soundbox / Fake Spoof App Dispute",
        category: "soundbox_spoof",
        weight: 85,
        regex: /(soundbox\s*(silent|quiet|did\s*not\s*speak)|(see|look\s*at)\s*(my\s+)?(phone\s+)?screen.*?(successful|debited|paid)|shows\s*payment\s*screen|money\s*(has\s*already\s*been\s*)?debited\s*from\s*my\s*account|transaction\s*successful.*merchant\s*not\s*received)/i,
        flags: {
          en: "Counterfeiting Alert: Customer insists transaction was successful on their phone screen without merchant Soundbox or bank confirmation."
        },
        intent: {
          en: "Scammers utilize fake 'spoof applications' that emulate genuine payment screens with counterfeit checkmarks and shop names without executing any bank transfer."
        },
        goldenRule: {
          en: "NO SOUNDBOX ANNOUNCEMENT = NO PAYMENT. Politely ask the customer to wait for official confirmation or settle in cash."
        }
      }
    ];

    // Genuine Bank SMS signatures
    this.genuineBankPatterns = [
      /(a\/c|acct|account)\s*[*xX\d]+\s*(debited|credited)\s*(by|with)?\s*(inr|rs\.?)\s*[\d,.]+/i,
      /upi\s*ref(\s*no)?\s*[:\s]*\d{10,14}/i,
      /avl\s*bal|available\s*balance/i
    ];
  }

  analyze(text) {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return {
        isEmpty: true,
        riskLevel: "low",
        score: 0,
        flags: [],
        intent: null,
        goldenRule: null,
        actionAdvice: null,
        spokenText: {}
      };
    }

    const cleanText = text.trim();
    const matchedRules = [];

    for (const rule of this.rules) {
      if (rule.regex.test(cleanText)) {
        matchedRules.push(rule);
      }
    }

    const isLikelyGenuineBank = this.isGenuineBankSms(cleanText);

    let riskLevel = "low";
    let normalizedScore = 0;

    if (matchedRules.length > 0) {
      normalizedScore = Math.min(99, Math.max(...matchedRules.map(r => r.weight)));
      if (normalizedScore >= 80) {
        riskLevel = "high";
      } else {
        riskLevel = "medium";
      }
    } else if (isLikelyGenuineBank) {
      riskLevel = "low";
      normalizedScore = 5;
    } else {
      riskLevel = "low";
      normalizedScore = 15;
    }

    const primaryRule = matchedRules[0] || null;

    const result = {
      rawText: cleanText,
      matchedRulesCount: matchedRules.length,
      rules: matchedRules.map(r => r.id),
      riskLevel,
      score: normalizedScore,
      primaryRule,
      isGenuineBankSms: isLikelyGenuineBank && matchedRules.length === 0,
      flags: matchedRules.map(r => r.flags),
      intent: primaryRule ? primaryRule.intent : null,
      goldenRule: primaryRule ? primaryRule.goldenRule : null,
      actionAdvice: this.generateActionAdvice(riskLevel, primaryRule)
    };

    result.spokenText = this.generateSpokenScripts(result);
    return result;
  }

  isGenuineBankSms(text) {
    let matchesCount = 0;
    for (const pattern of this.genuineBankPatterns) {
      if (pattern.test(text)) {
        matchesCount++;
      }
    }
    const hasSuspiciousLinks = /(https?:\/\/|\.apk|bit\.ly|tinyurl)/i.test(text);
    return matchesCount >= 2 && !hasSuspiciousLinks;
  }

  generateActionAdvice(riskLevel, primaryRule) {
    if (riskLevel === "high") {
      return {
        en: [
          "DO NOT enter your UPI PIN or approve any incoming payment request.",
          "DO NOT click on any link or download any .APK application file.",
          "DO NOT install AnyDesk, TeamViewer, or any screen-sharing tool.",
          "Block the sender's phone number or WhatsApp contact immediately.",
          "If funds have already been deducted, dial 1930 immediately (National Cyber Crime Helpline)."
        ]
      };
    } else if (riskLevel === "medium") {
      return {
        en: [
          "Exercise caution: This communication contains suspicious phrasing.",
          "Verify the sender's identity through official bank customer support channels only.",
          "Never disclose OTPs, UPI PINs, or card CVV numbers to anyone."
        ]
      };
    } else {
      return {
        en: [
          "This message matches standard legitimate bank transaction alert formats.",
          "Always verify that your actual account balance in your banking app matches the alert.",
          "Remember: Banks never solicit PINs or OTPs over phone calls or SMS."
        ]
      };
    }
  }

  generateSpokenScripts(result) {
    if (result.riskLevel === "high") {
      const enRule = result.primaryRule ? result.primaryRule.intent.en : "This is a dangerous fraudulent message.";
      return {
        en: `Warning! Danger detected. ${enRule} Remember: you never need to enter a UPI PIN to receive money. Do not click any links or download any applications. If funds were deducted, dial 1930 immediately.`
      };
    } else if (result.riskLevel === "medium") {
      return {
        en: "Caution: This message contains suspicious elements. Do not share your OTP or PIN, and verify directly with your official bank branch."
      };
    } else {
      return {
        en: "This message appears to be safe and consistent with standard bank notifications. Always verify your actual bank balance in your official banking app."
      };
    }
  }
}
