// simulator.js - Interactive "Spot-the-Scam" Training Drill (English Edition)
// Realistic scenarios for Small Shopkeepers, Senior Citizens, and First-Time Payers.

export class ScamSimulator {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.currentScenarioIndex = 0;
    this.score = 0;
    this.answersHistory = [];

    this.scenarios = [
      {
        id: "scenario_soundbox_rush",
        targetGroup: "Street Vendors & Shopkeepers",
        badge: "Merchant Counter Drill",
        title: "The Rush-Hour Customer & The Silent Soundbox",
        situation: "It is 8:30 PM peak rush at your shop. A customer buys groceries worth ₹650, points their phone at your QR stand, and immediately flashes a glowing green screen saying 'Paid ₹650.00 to Your Store'. They insist: 'I am catching a train in 5 minutes, please let me take the bag!'. However, your merchant Soundbox has made NO sound.",
        prompt: "What is the correct action to take?",
        options: [
          {
            text: "Hand over the goods immediately since their phone clearly shows a green checkmark and your store name.",
            isCorrect: false,
            feedback: "❌ TRAP! This is how merchants lose money every day. Scammers use 'Spoof Apps' that mimic payment receipts without sending any funds. If your Soundbox didn't announce payment, no money was transferred to your bank account!"
          },
          {
            text: "Politely state: 'Please wait 30 seconds for my soundbox or merchant app to confirm. If it doesn't announce, please pay in cash or re-scan.'",
            isCorrect: true,
            feedback: "✅ CORRECT & SAFE! The golden merchant rule: 'If the Soundbox didn't speak = Payment did NOT arrive'. Genuine customers will always wait 1 minute. Scammers with spoof apps will get nervous and leave."
          },
          {
            text: "Offer them ₹100 change in cash because they claim they typed ₹750 by mistake.",
            isCorrect: false,
            feedback: "❌ HUGE TRAP! Never issue cash refunds based on customer phone screens. You will lose both your merchandise and your cash."
          }
        ]
      },
      {
        id: "scenario_scan_to_receive",
        targetGroup: "First-Time Payers & Online Sellers",
        badge: "QR Collect Trap",
        title: "The 'Scan this QR to Receive Advance' Scam",
        situation: "You posted a piece of used furniture for sale online. A buyer messages: 'I am buying this right now and sending a ₹5,000 advance. Open your payment app, scan this special QR code I just sent you, and enter your 4-digit UPI PIN to claim the funds into your bank account.'",
        prompt: "What is actually happening here?",
        options: [
          {
            text: "This is a 100% FRAUD! Scanning a QR code and entering your UPI PIN will DEDUCT ₹5,000 from YOUR bank account, not credit it.",
            isCorrect: true,
            feedback: "✅ SPOT ON! The #1 Digital Payment Rule: You NEVER need to enter your UPI PIN to receive money. UPI PIN is only needed to SEND money. Never scan a QR code to receive payment."
          },
          {
            text: "Scan the QR code quickly before the buyer changes their mind.",
            isCorrect: false,
            feedback: "❌ TRAP! The instant you enter your UPI PIN, ₹5,000 will be withdrawn from your bank account."
          },
          {
            text: "Ask them for their government ID card first, then scan the QR code.",
            isCorrect: false,
            feedback: "❌ TRAP! Scammers routinely use stolen or forged ID cards downloaded from the internet. Never scan any QR code to receive payment under any circumstances."
          }
        ]
      },
      {
        id: "scenario_senior_kyc",
        targetGroup: "Senior Citizens & Pensioners",
        badge: "Senior Citizen Safety Drill",
        title: "The 8 PM Pension Account Suspension Threat",
        situation: "An elderly pensioner receives an SMS: 'Dear Customer, your State Bank Pension Account is blocked today due to pending PAN KYC. Download QuickSupport app or click bit.ly/sbi-kyc.apk to update immediately, or your pension will be suspended tonight.'",
        prompt: "What should the senior citizen do?",
        options: [
          {
            text: "Immediately click the link and download the APK file so the pension is not disrupted.",
            isCorrect: false,
            feedback: "❌ CRITICAL DANGER! That APK file contains malware that intercepts banking SMS and OTPs, allowing cybercriminals to drain your entire lifetime savings."
          },
          {
            text: "Do not click the link or install anything. Tomorrow morning, visit your local bank branch in person or consult family.",
            isCorrect: true,
            feedback: "✅ PRUDENT & SAFE! Legitimate banks never threaten to block accounts within hours via SMS accompanied by APK download links. Visiting your branch or calling official support is the only safe route."
          },
          {
            text: "Forward the SMS to all WhatsApp contacts to warn them to update their KYC.",
            isCorrect: false,
            feedback: "❌ NEVER forward phishing messages! It spreads the malware link to other vulnerable seniors and relatives."
          }
        ]
      },
      {
        id: "scenario_electricity_disconnect",
        targetGroup: "Households & Consumers",
        badge: "Utility Bill Phishing",
        title: "The 'Electricity Line Cut at 9:30 PM' Caller",
        situation: "You receive an urgent phone call: 'I am an executive from the Electricity Board. Your last bill payment of ₹1,420 failed to update in our database. Your power will be disconnected in 45 minutes unless you install AnyDesk app so our technician can verify your digital meter.'",
        prompt: "What is the correct response?",
        options: [
          {
            text: "Install AnyDesk app so they can resolve the bill issue quickly.",
            isCorrect: false,
            feedback: "❌ DANGEROUS TRAP! AnyDesk gives the caller full remote view and control over your phone screen. When you open your banking app, they record your credentials and steal your funds."
          },
          {
            text: "Hang up immediately! Never install remote screen-sharing tools. Verify bill payment status directly on the official utility website.",
            isCorrect: true,
            feedback: "✅ EXCELLENT! No government utility or bank ever instructs customers to install AnyDesk or screen-sharing tools. This is a common cybercrime technique."
          },
          {
            text: "Offer to read your debit card number and CVV over the phone instead.",
            isCorrect: false,
            feedback: "❌ NEVER share card numbers, CVVs, or OTPs with any caller on the phone."
          }
        ]
      },
      {
        id: "scenario_overpayment_refund",
        targetGroup: "Shopkeepers & Street Vendors",
        badge: "Accidental Overpayment Trick",
        title: "The 'Accidental ₹5,000' Refund Plea",
        situation: "A customer buys ₹200 worth of merchandise. Two minutes later they show an SMS on their phone saying '₹5,000 debited' and plead: 'I accidentally typed ₹5,000 instead of ₹200! Please give me ₹4,800 cash back or I will be in serious trouble!'.",
        prompt: "How should the merchant respond?",
        options: [
          {
            text: "Immediately withdraw ₹4,800 from your cash register and hand it to them out of sympathy.",
            isCorrect: false,
            feedback: "❌ SCAM! This is emotional manipulation. Fraudsters show forged SMS alerts or edited screenshots. In reality, they never transferred any funds to you."
          },
          {
            text: "Check your own merchant app or bank statement. If ₹5,000 is not credited, inform them: 'No money has reached my account. Please contact your bank.'",
            isCorrect: true,
            feedback: "✅ 100% CORRECT! Always verify transactions in your OWN bank statement or merchant app. Never rely on what a customer's phone displays."
          },
          {
            text: "Scan their QR code to send them the refund.",
            isCorrect: false,
            feedback: "❌ TRAP! Not only did they not pay you, but you will also lose your own money by initiating a transfer."
          }
        ]
      }
    ];
  }

  getCurrentScenario() {
    return this.scenarios[this.currentScenarioIndex];
  }

  submitAnswer(optionIndex) {
    const current = this.getCurrentScenario();
    const chosen = current.options[optionIndex];
    const isCorrect = chosen.isCorrect;

    if (isCorrect) {
      this.score += 20;
      if (this.audio) this.audio.playSafeSoundboxChime(500);
    } else {
      if (this.audio) this.audio.playScamAlertSiren();
    }

    const record = {
      scenario: current,
      chosenOption: chosen,
      isCorrect,
      feedback: chosen.feedback
    };
    this.answersHistory.push(record);
    return record;
  }

  nextScenario() {
    if (this.currentScenarioIndex < this.scenarios.length - 1) {
      this.currentScenarioIndex++;
      return this.getCurrentScenario();
    }
    return null;
  }

  reset() {
    this.currentScenarioIndex = 0;
    this.score = 0;
    this.answersHistory = [];
  }

  getFinalVerdict() {
    let title = "";
    let badge = "";
    let level = "";

    if (this.score === 100) {
      title = "Digital Payment Defense Master (100% Scam-Proof)";
      badge = "🏆 Certified Digital Defender";
      level = "expert";
    } else if (this.score >= 60) {
      title = "Vigilant Merchant / Alert Citizen";
      badge = "🛡️ Certified Aware User";
      level = "good";
    } else {
      title = "High Risk: Practical Safety Training Recommended";
      badge = "⚠️ Additional Vigilance Needed";
      level = "needs_practice";
    }

    return {
      score: this.score,
      maxScore: 100,
      title,
      badge,
      level,
      history: this.answersHistory
    };
  }
}
