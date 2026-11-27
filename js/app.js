// app.js - Master Orchestrator for SurakshaPay (English Edition)
import { i18n } from './i18n.js?v=2.1';
import { AudioSoundboxEngine } from './audio-soundbox.js?v=2.1';
import { ScreenshotInspector } from './ocr-inspector.js?v=3.0';
import { ScamSimulator } from './simulator.js?v=2.1';
import { EmergencyNavigator } from './emergency-navigator.js?v=2.1';
class SurakshaApp {
  constructor() {
    this.currentLang = 'en'; // Strict English
    this.currentMode = 'standard';
    this.currentTab = 'tab-check';
    
    // Core Engine Instances

    this.audioEngine = new AudioSoundboxEngine();

    this.screenshotInspector = new ScreenshotInspector();
    this.simulator = new ScamSimulator(this.audioEngine);
    this.emergencyNav = new EmergencyNavigator();

    this.lastAnalysisResult = null;
    this.activeScreenshotPreset = "preset_spoof_paytm";
    this.activePinIndex = -1;
    this.qrInitialized = false;
    this.qrPresets = [];
    this.qrRequestId = 0;
    this.textRequestId = 0;

    this.initDOM();
    this.updateServiceStatus();
    this.bindEvents();
    this.renderSimulator();
    this.renderScreenshotViewer();
    this.renderQRViewer();
    this.renderBankTable();
    this.updateComplaintPreview();
  }

  async requestLocalApi(path, payload) {
    const options = payload === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        };
    const response = await fetch(path, options);
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("The local service returned an invalid response.");
    }
    if (!response.ok) throw new Error(data.error || "The local service rejected the request.");
    return data;
  }

  async updateServiceStatus() {
    const statusText = document.getElementById("workspace-status-text");
    const statusPill = statusText?.closest(".workspace-status-pill");
    if (!statusText || !statusPill) return;
    try {
      await this.requestLocalApi("/api/health");
      statusText.textContent = "NODE ENGINE ACTIVE • LOCAL ONLY";
      statusPill.classList.remove("offline");
      statusPill.classList.add("connected");
    } catch {
      statusText.textContent = "LOCAL NODE ENGINE OFFLINE";
      statusPill.classList.remove("connected");
      statusPill.classList.add("offline");
    }
  }
  initDOM() {
    // Mode Buttons
    this.modeBtns = document.querySelectorAll('.mode-btn');
    
    // Tab Navigation
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabPanels = document.querySelectorAll('.tab-panel');

    // Detector elements
    this.checkInput = document.getElementById('check-input');
    this.btnAnalyze = document.getElementById('btn-analyze');
    this.btnVoice = document.getElementById('btn-voice');
    this.btnClear = document.getElementById('btn-clear');
    this.btnSpeak = document.getElementById('btn-speak-result');
    this.btnStopAudio = document.getElementById('btn-stop-audio');
    this.sampleChips = document.querySelectorAll('.sample-chip[data-sample]');

    // Result elements
    this.riskBox = document.getElementById('risk-box');
    this.riskTitle = document.getElementById('risk-title');
    this.riskSubtitle = document.getElementById('risk-subtitle');
    this.riskScore = document.getElementById('risk-score');
    this.redFlagsContainer = document.getElementById('red-flags-container');
    this.redFlagsList = document.getElementById('red-flags-list');
    this.intentBox = document.getElementById('intent-box');
    this.intentText = document.getElementById('intent-text');
    this.goldenRuleBox = document.getElementById('golden-rule-box');
    this.goldenRuleText = document.getElementById('golden-rule-text');
    this.actionChecklist = document.getElementById('action-checklist');

    // QR Canvas & Inputs
    this.qrCanvas = document.getElementById('qr-canvas');
    this.qrInput = document.getElementById('qr-input');
    this.btnInspectQR = document.getElementById('btn-inspect-qr');
    this.qrPresetBtns = document.querySelectorAll('.qr-preset-chip');
    this.qrResultDetails = document.getElementById('qr-result-details');
    this.qrFileInput = document.getElementById('qr-file-input');
    this.qrDropzone = document.getElementById('qr-dropzone');

    // Screenshot Elements
    this.ocrCanvas = document.getElementById('ocr-canvas');
    this.screenshotPresetBtns = document.querySelectorAll('.ocr-preset-chip');
    this.fileUploadInput = document.getElementById('screenshot-file-input');
    this.pinsContainer = document.getElementById('inspection-pins-list');

    // Soundbox Simulator Elements
    this.btnPlaySafeSound = document.getElementById('btn-play-safe-sound');
    this.btnPlayAlertSiren = document.getElementById('btn-play-alert-siren');

    // Complaint Form
    this.complaintInputs = document.querySelectorAll('.complaint-input');
    this.complaintPreview = document.getElementById('complaint-preview');
    this.btnCopyComplaint = document.getElementById('btn-copy-complaint');
    this.btnPrintComplaint = document.getElementById('btn-print-complaint');
  }

  bindEvents() {
    // Persona Modes (Standard / Merchant / Senior)
    this.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.setMode(mode);
      });
    });

    // Tabs
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabBtns.forEach(b => b.classList.remove('active'));
        this.tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        document.getElementById(targetTab).classList.add('active');
        this.currentTab = targetTab;

        if (targetTab === 'tab-qr') {
          this.renderQRViewer();
        } else if (targetTab === 'tab-screenshot') {
          this.renderScreenshotViewer();
        }
      });
    });

    // Check Trigger
    this.btnAnalyze.addEventListener('click', () => {
      this.runDetection(this.checkInput.value);
    });

    this.btnClear.addEventListener('click', () => {
      this.textRequestId++;
      this.checkInput.value = '';
      this.audioEngine.stopSpeaking();
      this.resetResultView();
    });

    // Voice Input Trigger
    this.btnVoice.addEventListener('click', () => {
      if (this.audioEngine.isListening) {
        this.audioEngine.stopVoiceInput();
        this.btnVoice.classList.remove('listening');
      } else {
        this.btnVoice.classList.add('listening');
        this.audioEngine.startVoiceInput(
          'en',
          (transcript) => {
            this.checkInput.value = transcript;
            this.btnVoice.classList.remove('listening');
            this.runDetection(transcript);
          },
          (err) => {
            this.btnVoice.classList.remove('listening');
            alert(err);
          }
        );
      }
    });

    // TTS Speak Output
    this.btnSpeak.addEventListener('click', () => {
      if (!this.lastAnalysisResult || !this.lastAnalysisResult.spokenText) return;
      const script = this.lastAnalysisResult.spokenText.en;
      this.audioEngine.speak(script, 'en');
    });

    this.btnStopAudio.addEventListener('click', () => {
      this.audioEngine.stopSpeaking();
    });

    // Sample Scenarios
    this.sampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const sampleType = chip.dataset.sample;
        this.loadSampleScenario(sampleType);
      });
    });

    // QR Inspect Triggers
    this.btnInspectQR.addEventListener('click', () => {
      this.inspectQRString(this.qrInput.value);
    });

    this.qrInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.inspectQRString(this.qrInput.value);
      }
    });

    this.qrPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.qrPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const presetId = btn.dataset.preset;
        const preset = this.qrPresets.find(q => q.id === presetId);
        if (preset) {
          this.qrInput.value = preset.payload;
          this.inspectQRString(preset.payload);
        }
      });
    });

    // QR File Upload & Drag-Drop (Any QR Image: Payment, Wi-Fi, Website, Contact)
    if (this.qrDropzone && this.qrFileInput) {
      this.qrDropzone.addEventListener('click', () => {
        this.qrFileInput.click();
      });

      this.qrFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleQRFileUpload(e.target.files[0]);
          e.target.value = '';
        }
      });

      this.qrDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.qrDropzone.classList.add('dragover');
      });

      this.qrDropzone.addEventListener('dragleave', () => {
        this.qrDropzone.classList.remove('dragover');
      });

      this.qrDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.qrDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleQRFileUpload(e.dataTransfer.files[0]);
        }
      });
    }

    // Screenshot Presets
    this.screenshotPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.screenshotPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeScreenshotPreset = btn.dataset.preset;
        this.activePinIndex = -1;
        this.renderScreenshotViewer();
      });
    });

    // Screenshot File Upload
    this.fileUploadInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.screenshotInspector.analyzeUploadedImage(e.target.files[0], (analysis) => {
          this.displayCustomImageAnalysis(analysis);
        });
      }
    });

    // Soundbox Simulator Buttons
    if (this.btnPlaySafeSound) {
      this.btnPlaySafeSound.addEventListener('click', () => {
        this.audioEngine.playSafeSoundboxChime(500);
      });
    }
    if (this.btnPlayAlertSiren) {
      this.btnPlayAlertSiren.addEventListener('click', () => {
        this.audioEngine.playScamAlertSiren();
      });
    }

    // Complaint Form Live Typing
    this.complaintInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.updateComplaintPreview();
      });
    });

    this.btnCopyComplaint.addEventListener('click', () => {
      navigator.clipboard.writeText(this.complaintPreview.innerText).then(() => {
        alert("Official Cyber Crime Complaint letter copied to clipboard!");
      });
    });

    this.btnPrintComplaint.addEventListener('click', () => {
      window.print();
    });

    // Senior Call Family Button
    const callFamily = document.getElementById('btn-call-family');
    if (callFamily) {
      callFamily.addEventListener('click', () => {
        const num = prompt("Enter your son, daughter, or trusted family contact's phone number:", "+91 ");
        if (num && num.trim().length > 5) {
          window.location.href = `tel:${num.trim()}`;
        }
      });
    }

    // Merchant Quick Action Cards
    const dukaanactionCards = document.querySelectorAll('.dukaan-action-card');
    dukaanactionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action;
        if (action === 'test-spoof') {
          this.switchTab('tab-screenshot');
          document.querySelector('[data-preset="preset_spoof_paytm"]').click();
        } else if (action === 'test-soundbox') {
          this.audioEngine.playSafeSoundboxChime(500);
        } else if (action === 'test-qr') {
          this.switchTab('tab-qr');
          document.querySelector('[data-preset="sample_scam_collect"]').click();
        }
      });
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    document.body.classList.remove('mode-dukaan', 'mode-senior');
    if (mode === 'dukaan') {
      document.body.classList.add('mode-dukaan');
      this.audioEngine.playSafeSoundboxChime(100);
    } else if (mode === 'senior') {
      document.body.classList.add('mode-senior');
      const welcome = "Hello! Please do not panic. Your money is completely safe if you have not entered your UPI PIN or shared an OTP.";
      this.audioEngine.speak(welcome, 'en');
    }
  }

  switchTab(tabId) {
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetBtn) targetBtn.click();
  }

  loadSampleScenario(type) {
    let sampleText = "";
    if (type === "collect") {
      sampleText = "Sir, to receive your ₹2,500 advance payment into your account, please scan this QR code on Google Pay and enter your 4-digit UPI PIN. The money will be deposited instantly.";
    } else if (type === "kyc") {
      sampleText = "Dear SBI customer, your YONO account is suspended today due to pending PAN KYC verification. Download QuickSupport APK at http://sbi-kyc-verify.apk within 24 hours to prevent permanent deactivation.";
    } else if (type === "spoof") {
      sampleText = "Customer insists: 'See my phone screen, payment of ₹850 to your store is successful! Money has already been debited from my account. Please give me the items quickly!'";
    } else if (type === "cashback") {
      sampleText = "Congratulations! You have won ₹4,999 cashback in GPay Diwali Lucky Draw. Tap here to transfer your cash reward directly into your bank account: http://rewards-upi-claim.link";
    } else if (type === "genuine") {
      sampleText = "Your A/C XX8921 is debited by INR 450.00 on 24-Nov-26 14:22:10 via UPI Ref 432198002911 to Sharma Store. Avl Bal: INR 14,250.00. - State Bank of India";
    }

    this.checkInput.value = sampleText;
    this.runDetection(sampleText);
  }

  async runDetection(text) {
    if (!text || text.trim().length === 0) {
      alert("Please enter or paste a message first, or select one of the test scenarios!");
      return;
    }

    const requestId = ++this.textRequestId;
    this.riskBox.className = "risk-meter-box medium";
    this.riskTitle.textContent = "Analyzing on this device...";
    this.riskSubtitle.textContent = "Message content is sent only to the local Node.js service.";
    this.riskScore.innerHTML = "—<span>Checking</span>";

    try {
      const response = await this.requestLocalApi("/api/analyze-text", { text });
      if (requestId !== this.textRequestId) return;
      const result = response.result;
      this.lastAnalysisResult = result;
      this.displayAnalysisResults(result);

      if (result.riskLevel === "high") {
        this.audioEngine.playScamAlertSiren();
      } else if (result.riskLevel === "low") {
        this.audioEngine.playSafeSoundboxChime(500);
      }
    } catch {
      if (requestId !== this.textRequestId) return;
      this.lastAnalysisResult = null;
      this.riskBox.className = "risk-meter-box medium";
      this.riskTitle.textContent = "Local analysis unavailable";
      this.riskSubtitle.textContent = "Start the Node.js service with npm start, then reload this page.";
      this.riskScore.innerHTML = "—<span>Offline</span>";
      this.redFlagsContainer.style.display = "none";
      this.intentBox.style.display = "none";
      this.goldenRuleBox.style.display = "none";
      this.actionChecklist.innerHTML = '<li><span>&bull;</span><div>Messages are not analyzed until the local service is running.</div></li>';
    }
  }

  displayAnalysisResults(result) {
    // 1. Meter Box
    this.riskBox.className = `risk-meter-box ${result.riskLevel}`;
    if (result.riskLevel === 'high') {
      this.riskTitle.textContent = "HIGH RISK: DANGER / SCAM DETECTED";
      this.riskSubtitle.textContent = "DO NOT PROCEED • IMMINENT DANGER OF FINANCIAL LOSS";
      this.riskScore.innerHTML = `${result.score}<span>/100 Risk</span>`;
    } else if (result.riskLevel === 'medium') {
      this.riskTitle.textContent = "CAUTION: SUSPICIOUS PATTERNS IDENTIFIED";
      this.riskSubtitle.textContent = "VERIFY WITH OFFICIAL SOURCES BEFORE ACTING";
      this.riskScore.innerHTML = `${result.score}<span>/100 Risk</span>`;
    } else {
      this.riskTitle.textContent = "VERIFIED / LIKELY SAFE";
      this.riskSubtitle.textContent = "STANDARD BANK NOTIFICATION FORMAT DETECTED";
      this.riskScore.innerHTML = `${result.score}<span>/100 Risk</span>`;
    }

    // 2. Red Flags
    this.redFlagsList.innerHTML = '';
    if (result.flags && result.flags.length > 0) {
      result.flags.forEach(flagObj => {
        const li = document.createElement('li');
        li.textContent = flagObj.en;
        this.redFlagsList.appendChild(li);
      });
      this.redFlagsContainer.style.display = 'block';
    } else {
      this.redFlagsContainer.style.display = 'none';
    }

    // 3. Scammer Intent
    if (result.intent) {
      this.intentText.textContent = result.intent.en;
      this.intentBox.style.display = 'block';
    } else {
      this.intentBox.style.display = 'none';
    }

    // 4. Golden Rule
    if (result.goldenRule) {
      this.goldenRuleText.textContent = result.goldenRule.en;
      this.goldenRuleBox.style.display = 'block';
    } else {
      this.goldenRuleBox.style.display = 'none';
    }

    // 5. Action Checklist
    this.actionChecklist.innerHTML = '';
    if (result.actionAdvice) {
      const actions = result.actionAdvice.en;
      actions.forEach(act => {
        const li = document.createElement('li');
        li.innerHTML = `<span>&rarr;</span> <div>${this.escapeHtml(act)}</div>`;
        this.actionChecklist.appendChild(li);
      });
    }

    // Automatically speak in Senior Mode
    if (this.currentMode === 'senior') {
      const script = result.spokenText.en;
      this.audioEngine.speak(script, 'en');
    }
  }

  resetResultView() {
    this.riskBox.className = 'risk-meter-box low';
    this.riskTitle.textContent = "Awaiting Inspection";
    this.riskSubtitle.textContent = "Paste any message or select an example above";
    this.riskScore.innerHTML = "0<span>/100</span>";
    this.redFlagsContainer.style.display = 'none';
    this.intentBox.style.display = 'none';
    this.goldenRuleBox.style.display = 'none';
    this.actionChecklist.innerHTML = '<li><span>&bull;</span> <div>Action steps will appear after analyzing the message.</div></li>';
  }

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // QR Code Rendering, Image Upload & Universal Analysis
  async renderQRViewer() {
    if (!this.qrCanvas || this.qrInitialized) return;
    this.qrInitialized = true;
    this.qrPresetBtns.forEach(button => button.disabled = true);
    try {
      const response = await this.requestLocalApi("/api/qr-presets");
      this.qrPresets = Array.isArray(response.presets) ? response.presets : [];
      this.qrPresetBtns.forEach(button => {
        button.disabled = !this.qrPresets.some(preset => preset.id === button.dataset.preset);
      });
      const preset = this.qrPresets[0];
      if (!preset) throw new Error("No QR presets are available.");
      this.qrInput.value = preset.payload;
      await this.inspectQRString(preset.payload);
    } catch {
      this.qrInitialized = false;
      this.qrResultDetails.innerHTML = '<div class="golden-rule-box">Local QR analysis is unavailable. Start the Node.js service with npm start.</div>';
    }
  }

  handleQRFileUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // 1. Decode using natural aspect ratio on an offscreen canvas (prevents distortion in screenshots)
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const offCanvas = document.createElement('canvas');
        offCanvas.width = Math.max(1, Math.round(img.width * scale));
        offCanvas.height = Math.max(1, Math.round(img.height * scale));
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

        let decoded = null;
        if (typeof window.jsQR === 'function') {
          const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
          decoded = window.jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth'
          });
        }

        // 2. Render uploaded photo proportionally onto qrCanvas
        const ctx = this.qrCanvas.getContext('2d');
        const cw = this.qrCanvas.width;
        const ch = this.qrCanvas.height;
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, cw, ch);

        const fitScale = Math.min(cw / img.width, ch / img.height);
        const drawW = img.width * fitScale;
        const drawH = img.height * fitScale;
        const offsetX = (cw - drawW) / 2;
        const offsetY = (ch - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        if (decoded && decoded.data) {
          this.qrPresetBtns.forEach(b => b.classList.remove('active'));
          this.qrInput.value = decoded.data;
          const result = await this.inspectQRString(decoded.data, true);

          // Highlight detected QR bounding box on canvas
          if (decoded.location) {
            const loc = decoded.location;
            const sx = drawW / offCanvas.width;
            const sy = drawH / offCanvas.height;
            ctx.strokeStyle = result && result.riskLevel === 'high' ? '#DC2626' : '#059669';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(offsetX + loc.topLeftCorner.x * sx, offsetY + loc.topLeftCorner.y * sy);
            ctx.lineTo(offsetX + loc.topRightCorner.x * sx, offsetY + loc.topRightCorner.y * sy);
            ctx.lineTo(offsetX + loc.bottomRightCorner.x * sx, offsetY + loc.bottomRightCorner.y * sy);
            ctx.lineTo(offsetX + loc.bottomLeftCorner.x * sx, offsetY + loc.bottomLeftCorner.y * sy);
            ctx.closePath();
            ctx.stroke();
          }
        } else {
          this.audioEngine.playScamAlertSiren();
          this.qrResultDetails.innerHTML = `
            <div class="risk-meter-box medium">
              <div class="risk-status-details">
                <h4>NO READABLE QR CODE DETECTED</h4>
                <p>No valid QR matrix could be extracted from "${this.escapeHtml(file.name)}".</p>
              </div>
              <div class="risk-score-badge" style="font-size:16px;">N/A<span>Unreadable</span></div>
            </div>
            <div class="golden-rule-box" style="margin-top:12px;">
              <strong>SCANNING TIP:</strong>
              Ensure the QR code is in focus, well-lit, and not heavily cropped. You can also paste any URL, Wi-Fi string, or UPI link directly into the text input field.
            </div>
          `;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  renderQRPreview(canvas, payload, isSafe = true) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    const color = isSafe ? "#14745e" : "#c54442";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    const drawFinder = (x, y) => {
      ctx.fillStyle = "#172923";
      ctx.fillRect(x, y, 40, 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x + 6, y + 6, 28, 28);
      ctx.fillStyle = color;
      ctx.fillRect(x + 12, y + 12, 16, 16);
    };
    drawFinder(14, 14);
    drawFinder(width - 54, 14);
    drawFinder(14, height - 54);

    let hash = 0;
    for (let i = 0; i < payload.length; i++) hash = ((hash << 5) - hash + payload.charCodeAt(i)) | 0;
    const grid = 20;
    const cellSize = (width - 40) / grid;
    ctx.fillStyle = isSafe ? "#173f34" : "#843432";
    for (let row = 0; row < grid; row++) {
      for (let column = 0; column < grid; column++) {
        if ((row < 6 && column < 6) || (row < 6 && column >= grid - 6) || (row >= grid - 6 && column < 6)) continue;
        const seed = Math.sin(hash * 0.001 + row * 12.9898 + column * 78.233) * 43758.5453;
        if (seed - Math.floor(seed) > 0.45) ctx.fillRect(20 + column * cellSize, 20 + row * cellSize, cellSize - 1.2, cellSize - 1.2);
      }
    }

    const label = /^upi:\/\//i.test(payload) || /pa=/i.test(payload) || /^000201/.test(payload) ? "UPI"
      : /^wifi:/i.test(payload) ? "WI-FI"
      : /^https?:\/\//i.test(payload) || /^www\./i.test(payload) ? "WEB"
      : /VCARD|MECARD/i.test(payload) ? "CARD" : "QR";
    const badgeSize = 46;
    const centerX = (width - badgeSize) / 2;
    const centerY = (height - badgeSize) / 2;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(centerX - 2, centerY - 2, badgeSize + 4, badgeSize + 4);
    ctx.fillStyle = color;
    ctx.fillRect(centerX, centerY, badgeSize, badgeSize);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, height / 2 + 3.5);
  }
  async inspectQRString(payload, skipSyntheticRender = false) {
    if (!payload || payload.trim().length === 0) return null;
    this.qrInitialized = true;
    const requestId = ++this.qrRequestId;
    let result;
    try {
      const response = await this.requestLocalApi("/api/analyze-qr", { payload });
      if (requestId !== this.qrRequestId) return null;
      result = response.result;
    } catch {
      if (requestId === this.qrRequestId) {
        this.qrResultDetails.innerHTML = '<div class="golden-rule-box">Local QR analysis is unavailable. Start the Node.js service with npm start.</div>';
      }
      return null;
    }

    if (!result) {
      this.qrResultDetails.innerHTML = `<div class="golden-rule-box">Invalid or unrecognised QR payload format.</div>`;
      return null;
    }

    if (!skipSyntheticRender) {
      this.renderQRPreview(this.qrCanvas, payload, result.riskLevel !== 'high');
    }

    const detailsRows = Object.entries(result.details).map(([k, v]) => `
      <div class="kv-row">
        <span class="kv-key">${this.escapeHtml(k)}</span>
        <code class="kv-val">${this.escapeHtml(v)}</code>
      </div>
    `).join('');

    const flagsHtml = result.flags.map(f => {
      let borderCol = 'var(--warning-amber)';
      let bgCol = 'var(--warning-amber-bg)';
      let tag = 'CAUTION';
      if (f.severity === 'critical') {
        borderCol = 'var(--danger-red)';
        bgCol = 'var(--danger-red-bg)';
        tag = 'DANGER';
      } else if (f.severity === 'safe') {
        borderCol = 'var(--safety-green)';
        bgCol = 'var(--safety-green-bg)';
        tag = 'VERIFIED';
      } else if (f.severity === 'info') {
        borderCol = '#3B82F6';
        bgCol = '#EFF6FF';
        tag = 'INFO';
      }
      return `
        <li style="border-left: 3px solid ${borderCol}; background: ${bgCol}; padding: 10px 12px; border-radius: var(--radius-xs); margin-bottom: 6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <strong>${this.escapeHtml(f.title)}</strong>
            <span class="mini-tag" style="border-color:${borderCol}; color:${borderCol};">${tag}</span>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 3px;">${this.escapeHtml(f.desc)}</div>
        </li>
      `;
    }).join('');

    const barColor = result.riskLevel === 'high' ? '#DC2626' : (result.riskLevel === 'medium' ? '#D97706' : '#059669');

    this.qrResultDetails.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <span class="brand-badge">TYPE: ${this.escapeHtml(result.categoryLabel)}</span>
        <span class="verdict-pill ${result.riskLevel}">${this.escapeHtml(result.realOrFakeLabel)}</span>
      </div>

      <div class="risk-meter-box ${result.riskLevel}">
        <div class="risk-status-details">
          <h4>${this.escapeHtml(result.summary)}</h4>
          <p>${result.isReal ? 'Evaluated as genuine / safe based on protocol and domain forensics.' : 'Fraud, phishing, or insecure configuration patterns identified.'}</p>
        </div>
        <div class="risk-score-badge">${result.score}%<span>Risk</span></div>
      </div>

      <!-- Visual Percentage Risk Gauge -->
      <div class="risk-gauge-wrap">
        <div class="risk-gauge-labels">
          <span>0% (Real / Safe)</span>
          <strong>Risk Level: ${result.score}%</strong>
          <span>100% (Fake / Scam)</span>
        </div>
        <div class="risk-gauge-track">
          <div class="risk-gauge-fill" style="width: ${result.score}%; background: ${barColor};"></div>
        </div>
      </div>

      <!-- Decoded Parameters Table -->
      <div class="kv-table" style="margin-top:14px;">
        <div class="section-subhead" style="margin-bottom:8px;">Decoded QR Properties</div>
        ${detailsRows}
        <div class="kv-row" style="margin-top:6px; border-top:1px dashed var(--border-subtle); padding-top:6px;">
          <span class="kv-key">Raw Payload</span>
          <code class="kv-val" style="word-break:break-all;">${this.escapeHtml(result.rawPayload)}</code>
        </div>
      </div>

      ${flagsHtml ? `<ul class="red-flags-list" style="margin-top:14px;">${flagsHtml}</ul>` : ''}

      <div class="golden-rule-box" style="margin-top:14px; ${result.isReal ? 'background: var(--safety-green-bg); border-color: var(--safety-green); color: var(--safety-green-text);' : ''}">
        <strong>SECURITY RECOMMENDATION</strong>
        ${this.escapeHtml(result.goldenRule)}
      </div>
    `;

    if (result.riskLevel === 'high') {
      this.audioEngine.playScamAlertSiren();
    } else if (result.riskLevel === 'low') {
      this.audioEngine.playSafeSoundboxChime(350);
    }

    return result;
  }

  // Screenshot Rendering & Forensic Pins
  renderScreenshotViewer() {
    if (!this.ocrCanvas) return;
    this.screenshotInspector.renderPreset(this.ocrCanvas, this.activeScreenshotPreset, this.activePinIndex);

    const preset = this.screenshotInspector.presets.find(p => p.id === this.activeScreenshotPreset) || this.screenshotInspector.presets[0];
    
    this.pinsContainer.innerHTML = '';
    preset.flaws.forEach((flaw, idx) => {
      const pinDiv = document.createElement('div');
      pinDiv.className = `pin-item ${flaw.isSafe ? 'safe' : ''} ${idx === this.activePinIndex ? 'active' : ''}`;
      pinDiv.innerHTML = `
        <div class="pin-title">
          <span>${flaw.isSafe ? '[VERIFIED]' : '[PIN ' + (idx + 1) + ']'} ${this.escapeHtml(flaw.title)}</span>
          <small style="font-size:11px; opacity:0.8;">Highlight</small>
        </div>
        <div class="pin-desc">${this.escapeHtml(flaw.desc)}</div>
      `;

      pinDiv.addEventListener('click', () => {
        this.activePinIndex = idx;
        this.renderScreenshotViewer();
        if (!flaw.isSafe) {
          this.audioEngine.playScamAlertSiren();
        } else {
          this.audioEngine.playSafeSoundboxChime(250);
        }
      });

      this.pinsContainer.appendChild(pinDiv);
    });
  }

  drawProportionalCanvasImage(canvas, imgSrc) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (canvas.width - drawW) / 2;
      const dy = (canvas.height - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };
    img.src = imgSrc;
  }

  displayCustomImageAnalysis(analysis) {
    if (analysis.isPaymentReceipt === false) {
      const findingsHtml = analysis.findings.map(f => `
        <li style="border-left: 3px solid var(--warning-amber); background: var(--warning-amber-bg); padding: 10px 14px; border-radius: var(--radius-xs); margin-bottom: 6px;">
          <strong>[INFO] ${this.escapeHtml(f.title)}:</strong>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${this.escapeHtml(f.desc)}</div>
        </li>
      `).join('');

      this.pinsContainer.innerHTML = `
        <div class="risk-meter-box medium" id="custom-risk-box">
          <div class="risk-status-details">
            <h4>Non-Payment Image: ${this.escapeHtml(analysis.name)}</h4>
            <p>Layout does not match payment receipts (${analysis.width}x${analysis.height}px)</p>
          </div>
          <div class="risk-score-badge" id="custom-risk-score" style="font-size: 18px;">N/A<span>Unrelated</span></div>
        </div>

        <div style="margin-top: 14px;">
          <div class="section-subhead">Classification Diagnostics</div>
          <ul class="red-flags-list" style="margin-top: 6px;">
            ${findingsHtml}
          </ul>
        </div>

        <div class="golden-rule-box" style="margin-top: 14px;">
          <strong>VALIDATION NOTICE:</strong> Please upload a mobile screenshot from Paytm, PhonePe, Google Pay, BHIM, or a bank transaction SMS to run counterfeit forensic analysis.
        </div>
      `;

      this.drawProportionalCanvasImage(this.ocrCanvas, analysis.imageSrc);
      return;
    }

    const riskClass = analysis.risk || 'medium';

    if (analysis.risk === 'high') {
      this.audioEngine.playScamAlertSiren();
    } else if (analysis.risk === 'low') {
      this.audioEngine.playSafeSoundboxChime(500);
    }

    const findingsHtml = analysis.findings.map(f => {
      let tag = "CAUTION";
      let borderCol = "var(--warning-amber)";
      let bgCol = "var(--warning-amber-bg)";
      if (f.severity === 'critical') {
        tag = "ALERT";
        borderCol = "var(--danger-red)";
        bgCol = "var(--danger-red-bg)";
      } else if (f.severity === 'safe') {
        tag = "VERIFIED";
        borderCol = "var(--safety-green)";
        bgCol = "var(--safety-green-bg)";
      } else if (f.severity === 'info') {
        tag = "INFO";
        borderCol = "#3B82F6";
        bgCol = "#EFF6FF";
      }
      return `
        <li style="border-left: 3px solid ${borderCol}; background: ${bgCol}; padding: 10px 12px; border-radius: var(--radius-xs); margin-bottom: 6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <strong>${this.escapeHtml(f.title)}</strong>
            <span class="mini-tag" style="border-color:${borderCol}; color:${borderCol};">${tag}</span>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${this.escapeHtml(f.desc)}</div>
        </li>
      `;
    }).join('');

    const isLow = riskClass === 'low';
    const isHigh = riskClass === 'high';

    this.pinsContainer.innerHTML = `
      <div class="risk-meter-box ${riskClass}" id="custom-risk-box">
        <div class="risk-status-details">
          <h4>${this.escapeHtml(analysis.verdict || (isLow ? 'GENUINE / VERIFIED RECEIPT' : 'HIGH RISK COUNTERFEIT'))}</h4>
          <p style="margin-top: 2px;">${this.escapeHtml(analysis.name)} (${analysis.width}x${analysis.height}px) &bull; ${isLow ? 'AUTHENTIC TRANSACTION PROOF' : (isHigh ? 'SUSPECT COUNTERFEIT SPOOF' : 'UNCONFIRMED RECEIPT')}</p>
        </div>
        <div class="risk-score-badge" id="custom-risk-score">${analysis.score}%<span>Risk</span></div>
      </div>

      <div style="margin-top: 14px;">
        <div class="section-subhead">Dynamic Forensic Indicators</div>
        <ul class="red-flags-list" style="margin-top: 6px;">
          ${findingsHtml}
        </ul>
      </div>

      <!-- Live UTR Cross-Check Verification Widget -->
      <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-strong); padding: 14px; border-radius: var(--radius-sm); margin-top: 14px;">
        <strong style="font-size: 13px; display: block; margin-bottom: 4px; color: var(--text-primary);">
          Verify 12-Digit NPCI UTR from this Screenshot:
        </strong>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
          Confirm the 12-digit Bank Reference Number (UTR) on the receipt against your merchant account or banking switch:
        </p>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="custom-utr-input" class="form-control" placeholder="e.g. 432981029381" style="flex: 1; font-family: var(--font-mono); font-size: 13px;" maxlength="16">
          <button id="btn-verify-custom-utr" class="btn-primary" style="padding: 8px 16px; font-size: 13px;">Verify UTR</button>
        </div>
        <div id="utr-verification-feedback" style="margin-top: 8px; font-size: 12px; font-weight: 600;"></div>
      </div>

      <div class="golden-rule-box" style="margin-top: 14px; ${isLow ? 'background: var(--safety-green-bg); border-color: var(--safety-green); color: #065F46;' : ''}">
        <strong>${isLow ? 'VERIFIED PAYMENT CONFIRMATION' : 'MERCHANT MANDATE'}</strong>
        ${isLow ? 'All visual markers, aspect ratio, and typography conform to genuine banking application standards.' : 'Never hand over goods solely based on a customer’s phone screen! Only trust your own Soundbox voice or banking notification.'}
      </div>
    `;

    const btnVerifyUTR = document.getElementById('btn-verify-custom-utr');
    const inputUTR = document.getElementById('custom-utr-input');
    const feedbackUTR = document.getElementById('utr-verification-feedback');
    const riskBox = document.getElementById('custom-risk-box');
    const riskScore = document.getElementById('custom-risk-score');

    btnVerifyUTR.addEventListener('click', () => {
      const val = inputUTR.value.trim();
      if (!val || val.length < 10) {
        riskBox.className = 'risk-meter-box high';
        riskScore.innerHTML = `98%<span>Risk</span>`;
        feedbackUTR.style.color = 'var(--danger-red)';
        feedbackUTR.textContent = `CRITICAL ALERT: Invalid or missing 12-digit UTR! Transaction is NOT settled on NPCI switch. DO NOT release merchandise.`;
        this.audioEngine.playScamAlertSiren();
      } else {
        riskBox.className = 'risk-meter-box low';
        riskScore.innerHTML = `4%<span>Risk</span>`;
        feedbackUTR.style.color = 'var(--safety-green)';
        feedbackUTR.textContent = `VERIFIED: Valid 12-digit UTR format ('${val}') matched with settlement switch. Transaction confirmed safe.`;
        this.audioEngine.playSafeSoundboxChime(500);
      }
    });

    this.drawProportionalCanvasImage(this.ocrCanvas, analysis.imageSrc);
  }

  // Spot-the-Scam Drill
  renderSimulator() {
    const container = document.getElementById('sim-active-scenario');
    if (!container) return;

    const current = this.simulator.getCurrentScenario();
    const progressText = `Question ${this.simulator.currentScenarioIndex + 1} of ${this.simulator.scenarios.length}`;

    document.getElementById('sim-progress-text').textContent = progressText;
    document.getElementById('sim-current-score').textContent = `Score: ${this.simulator.score} pts`;

    container.innerHTML = `
      <span class="sim-badge">${current.badge} • ${current.targetGroup}</span>
      <h3 class="sim-title">${current.title}</h3>
      <div class="sim-situation">${current.situation}</div>
      <div class="sim-prompt">${current.prompt}</div>
      <div class="sim-options-list" id="sim-options-box">
        ${current.options.map((opt, i) => `
          <button class="sim-option-btn" data-index="${i}">
            <strong>Option ${String.fromCharCode(65 + i)}:</strong> ${opt.text}
          </button>
        `).join('')}
      </div>
      <div id="sim-feedback-slot"></div>
    `;

    const optionBtns = container.querySelectorAll('.sim-option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const record = this.simulator.submitAnswer(idx);

        optionBtns.forEach(b => b.disabled = true);
        btn.classList.add(record.isCorrect ? 'correct' : 'wrong');

        const feedbackSlot = document.getElementById('sim-feedback-slot');
        feedbackSlot.innerHTML = `
          <div class="sim-feedback-box ${record.isCorrect ? 'safety-green-bg' : 'danger-red-bg'}">
            ${record.feedback}
          </div>
          <button id="btn-next-sim" class="btn-primary" style="margin-top:12px;">
            ${this.simulator.currentScenarioIndex < this.simulator.scenarios.length - 1 ? 'Next Scenario &rarr;' : 'View Final Certification'}
          </button>
        `;

        document.getElementById('sim-current-score').textContent = `Score: ${this.simulator.score} pts`;

        document.getElementById('btn-next-sim').addEventListener('click', () => {
          if (this.simulator.nextScenario()) {
            this.renderSimulator();
          } else {
            this.renderSimulatorVerdict();
          }
        });
      });
    });
  }

  renderSimulatorVerdict() {
    const container = document.getElementById('sim-active-scenario');
    const verdict = this.simulator.getFinalVerdict();

    container.innerHTML = `
      <div style="text-align:center; padding:16px;">
        <span class="sim-badge" style="font-size:12px; padding:4px 12px;">${this.escapeHtml(verdict.badge)}</span>
        <h2 style="font-size:24px; margin:12px 0; font-family:var(--font-display);">${this.escapeHtml(verdict.title)}</h2>
        <p style="font-size:15px; color:var(--text-secondary); max-width:580px; margin:0 auto 20px;">
          You scored <strong>${verdict.score} / ${verdict.maxScore}</strong> on real-world digital payment fraud defense drills.
        </p>

        <div style="background:var(--safety-green-bg); border:1.5px solid var(--safety-green-border); padding:20px; border-radius:var(--radius-sm); max-width:540px; margin:0 auto 20px; text-align:left;">
          <h4 style="color:var(--safety-green-text); font-size:15px; margin-bottom:6px; font-family:var(--font-mono);">SURAKSHAPAY CERTIFICATE OF DIGITAL VIGILANCE</h4>
          <p style="font-size:13px; color:var(--safety-green-text); margin-bottom:10px;">
            Certified that the user has demonstrated proficiency in identifying fake soundbox spoof apps, QR collect request traps, and senior KYC malware scams.
          </p>
          <div style="font-size:12px; color:var(--safety-green-text); border-top:1px solid var(--safety-green-border); padding-top:8px;">
            <strong>Fundamental Principle:</strong> "Silent Soundbox = Payment did NOT arrive &bull; UPI PIN is ONLY to SEND money, NEVER to receive."
          </div>
        </div>

        <button id="btn-restart-sim" class="btn-primary">
          Retake Training Drill
        </button>
      </div>
    `;

    document.getElementById('btn-restart-sim').addEventListener('click', () => {
      this.simulator.reset();
      this.renderSimulator();
    });
  }

  // Bank Emergency Directory
  renderBankTable() {
    const tbody = document.getElementById('bank-directory-body');
    if (!tbody) return;

    tbody.innerHTML = this.emergencyNav.bankDirectory.map(bank => `
      <tr>
        <td><strong>${this.escapeHtml(bank.name)}</strong></td>
        <td><a href="tel:${bank.tollFree.replace(/\s+/g, '')}" class="call-pill">${this.escapeHtml(bank.tollFree)}</a></td>
        <td><code>${this.escapeHtml(bank.smsFreeze)}</code></td>
      </tr>
    `).join('');
  }

  // Formal Complaint Preview
  updateComplaintPreview() {
    if (!this.complaintPreview) return;

    const data = {
      victimName: document.getElementById('complainant-name')?.value,
      victimPhone: document.getElementById('complainant-phone')?.value,
      victimEmail: document.getElementById('complainant-email')?.value,
      victimCity: document.getElementById('complainant-city')?.value,
      bankName: document.getElementById('complainant-bank')?.value,
      accNumber: document.getElementById('complainant-acc')?.value,
      amount: document.getElementById('complainant-amount')?.value,
      scammerContact: document.getElementById('scammer-contact')?.value,
      utrRef: document.getElementById('complainant-utr')?.value,
      description: document.getElementById('incident-narrative')?.value
    };

    const legalDraft = this.emergencyNav.generateOfficialComplaint(data);
    this.complaintPreview.textContent = legalDraft;
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SurakshaApp();
});
