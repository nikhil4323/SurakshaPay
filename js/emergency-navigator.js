// emergency-navigator.js - Golden Hour Incident Navigator & Official Cyber Complaint Generator
// Guides victims step-by-step through freezing accounts and preparing formal police evidence.

export class EmergencyNavigator {
  constructor() {
    this.bankDirectory = [
      {
        name: "State Bank of India (SBI)",
        tollFree: "1800 1234",
        altTollFree: "1800 2100",
        smsFreeze: "SMS 'BLOCK <last 4 digits>' to 567676",
        ussd: "*99*41#",
        portal: "https://www.onlinesbi.sbi"
      },
      {
        name: "HDFC Bank",
        tollFree: "1800 1688",
        altTollFree: "1800 202 6161",
        smsFreeze: "SMS 'BLOCK' to 5676712",
        portal: "https://www.hdfcbank.com"
      },
      {
        name: "ICICI Bank",
        tollFree: "1800 1080",
        altTollFree: "1860 120 7777",
        smsFreeze: "SMS 'BLOCK <Acc No>' to 9215676766",
        portal: "https://www.icicibank.com"
      },
      {
        name: "Punjab National Bank (PNB)",
        tollFree: "1800 180 2222",
        altTollFree: "1800 103 2222",
        smsFreeze: "SMS 'HOTLIST <Acc No>' to 5607040",
        portal: "https://www.pnbindia.in"
      },
      {
        name: "Bank of Baroda (BoB)",
        tollFree: "1800 258 4455",
        altTollFree: "1800 102 4455",
        smsFreeze: "SMS 'BLOCK' to 8422009988",
        portal: "https://www.bankofbaroda.in"
      },
      {
        name: "Axis Bank",
        tollFree: "1860 419 5555",
        altTollFree: "1860 500 5555",
        smsFreeze: "SMS 'BLOCK' to 5676782",
        portal: "https://www.axisbank.com"
      },
      {
        name: "Canara Bank",
        tollFree: "1800 425 0018",
        altTollFree: "1800 103 0018",
        smsFreeze: "SMS 'CANBLOCK' to 9266623333",
        portal: "https://www.canarabank.com"
      },
      {
        name: "Kotak Mahindra Bank",
        tollFree: "1860 266 2666",
        altTollFree: "1800 209 0000",
        smsFreeze: "Via Kotak Mobile App > Service Requests",
        portal: "https://www.kotak.com"
      },
      {
        name: "Paytm Payments Bank / App",
        tollFree: "0120 4456 456",
        altTollFree: "0120 3888 388",
        smsFreeze: "Call 0120 4456 456 > Press 1 to block account",
        portal: "https://www.paytmbank.com"
      }
    ];

    this.upiAppDirectory = [
      {
        name: "Google Pay (GPay)",
        help: "Open GPay > Profile > Help and Feedback > Raise Dispute on Transaction > Call 1800 419 0157"
      },
      {
        name: "PhonePe",
        help: "Open PhonePe > History > Select Transaction > Contact Support > Call 080-68727374 / 022-68727374"
      },
      {
        name: "Paytm",
        help: "Open Paytm > Balance & History > Select Payment > Help & Support > Report Fraud"
      },
      {
        name: "BHIM (NPCI)",
        help: "Toll-Free 1800 120 1740 > Website: https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism"
      }
    ];
  }

  generateOfficialComplaint(data) {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const nowTime = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const victimName = data.victimName || "[Your Full Name]";
    const phone = data.victimPhone || "[Your Mobile Number]";
    const email = data.victimEmail || "[Your Email Address]";
    const city = data.victimCity || "[Your City/District, State]";
    const bankName = data.bankName || "[Your Bank Name]";
    const accNumber = data.accNumber ? `ending with ...${data.accNumber.slice(-4)}` : "[Your Bank Account Number]";
    const fraudAmount = data.amount ? `₹${data.amount}` : "[Amount in INR]";
    const fraudDateTime = data.fraudDateTime || `${today} at approx ${nowTime}`;
    const scammerContact = data.scammerContact || "[Scammer Mobile / WhatsApp / UPI ID]";
    const scamType = data.scamType || "Digital Payment / UPI Fraud";
    const utrRef = data.utrRef || "[12-Digit NPCI UTR Reference Number]";
    const narrative = data.description || "The scammer contacted me and fraudulently deceived me into transferring funds / sharing credentials.";

    return `To,
The Inspector In-Charge / Cyber Crime Cell,
National Cyber Crime Reporting Portal (cybercrime.gov.in)
Police Station: ${city}

Subject: Formal Complaint regarding Cyber Fraud / UPI Payment Scam amounting to ${fraudAmount} under IT Act 2000 (Sec 66C, 66D) & BNS/IPC.

Respected Sir / Madam,

I wish to formally report a case of cyber fraud perpetrated against me on ${fraudDateTime}. The details of the incident and financial losses incurred are as follows:

1. COMPLAINANT PARTICULARS:
   - Full Name: ${victimName}
   - Contact Mobile: ${phone}
   - Email ID: ${email}
   - Address / City: ${city}

2. VICTIM BANKING DETAILS:
   - Bank Name: ${bankName}
   - Account Details: ${accNumber}

3. INCIDENT & TRANSACTION PARTICULARS:
   - Date & Time of Fraud: ${fraudDateTime}
   - Total Amount Defrauded: ${fraudAmount}
   - Nature of Scam: ${scamType}
   - NPCI UPI Transaction Reference (UTR / RRN): ${utrRef}
   - Suspect / Scammer Mobile Number or UPI ID: ${scammerContact}

4. FACTUAL SUMMARY OF THE FRAUD:
${narrative}

5. IMMEDIATE ACTIONS TAKEN:
   - Incident reported on National Cyber Helpline: 1930 (Token / Acknowledgement logged).
   - Request placed with ${bankName} to freeze debit transactions and raise a chargeback / lien on the beneficiary account.
   - Preserved all digital evidence including screenshots, SMS headers, and call records.

PRAYER / RELIEF SOUGHT:
I earnestly request you to register this complaint, initiate an inquiry, and issue an immediate lien/freeze request to the beneficiary bank/wallet under Section 91 CrPC to recover the defrauded amount of ${fraudAmount}.

Date: ${today}
Place: ${city}

Sincerely,

_________________________
(${victimName})
Contact: ${phone}`;
  }
}
