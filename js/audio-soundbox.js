// audio-soundbox.js - Web Audio API Synthesis and Web Speech API Engine
// Zero external asset dependencies - generates realistic soundbox chimes, scam sirens, and vernacular TTS speech.

export class AudioSoundboxEngine {
  constructor() {
    this.audioCtx = null;
    this.currentUtterance = null;
    this.synth = window.speechSynthesis || null;
    this.recognition = null;
    this.isListening = false;
    this.initSpeechRecognition();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Plays authentic Paytm/PhonePe style soundbox melodic chime
  playSafeSoundboxChime(amount = 500) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 4-note melodic chime (F5 -> A5 -> C6 -> E6 harmonic bell)
      const notes = [698.46, 880.00, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.3, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.6);
      });
    } catch (e) {
      console.warn("Audio Context playback error:", e);
    }
  }

  // Plays high-urgency caution siren / alarm
  playScamAlertSiren() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Two-tone warning beep
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        const startTime = now + i * 0.28;
        osc.frequency.setValueAtTime(880, startTime);
        osc.frequency.setValueAtTime(440, startTime + 0.14);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.26);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.27);
      }
    } catch (e) {
      console.warn("Alert Siren error:", e);
    }
  }

  // Web Speech API - Text to Speech in local language
  speak(text, lang = "hi", onEndCallback = null) {
    if (!this.synth) {
      console.warn("SpeechSynthesis not supported on this browser.");
      return false;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select appropriate BCP 47 language tag
    const langMap = {
      hi: "hi-IN",
      hinglish: "hi-IN",
      en: "en-IN",
      ta: "ta-IN",
      bn: "bn-IN",
      mr: "mr-IN"
    };

    utterance.lang = langMap[lang] || "hi-IN";
    utterance.rate = lang === "hi" || lang === "hinglish" ? 0.92 : 0.95; // slightly slower for elderly clarity
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = this.synth.getVoices();
    const targetTag = langMap[lang] || "hi";
    const matchedVoice = voices.find(v => v.lang.startsWith(targetTag) || v.lang.replace('_', '-').startsWith(targetTag));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  stopSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  // Speech Recognition for voice input ("Speak your suspicious message")
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  startVoiceInput(lang = "hi", onResultCallback, onErrorCallback) {
    if (!this.recognition) {
      if (onErrorCallback) onErrorCallback("Speech recognition is not supported in this browser. Please type or paste instead.");
      return;
    }

    const langMap = {
      hi: "hi-IN",
      hinglish: "hi-IN",
      en: "en-IN",
      ta: "ta-IN",
      bn: "bn-IN",
      mr: "mr-IN"
    };

    this.recognition.lang = langMap[lang] || "hi-IN";

    this.recognition.onresult = (event) => {
      this.isListening = false;
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (onResultCallback) onResultCallback(transcript);
      }
    };

    this.recognition.onerror = (err) => {
      this.isListening = false;
      if (onErrorCallback) onErrorCallback(err.error || "Voice input error. Please try again.");
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn("Recognition already started or error:", e);
    }
  }

  stopVoiceInput() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
