/**
 * Tactile Web Audio API Synthesizer (Zero external audio assets)
 */
class SoundEngine {
  constructor() {
    this.enabled = localStorage.getItem("dq_sound") !== "off";
    this.ctx = null;
  }

  _ensureCtx() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("dq_sound", this.enabled ? "on" : "off");
    if (this.enabled) this.click();
    return this.enabled;
  }

  _tone(freq, duration = 0.08, type = "triangle", gainPeak = 0.08, delay = 0) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  click() {
    this._tone(420, 0.035, "square", 0.035);
  }

  hint() {
    this._tone(523.25, 0.09, "sine", 0.07, 0);
    this._tone(659.25, 0.12, "sine", 0.06, 0.07);
  }

  bossHit() {
    this._tone(160, 0.11, "sawtooth", 0.09, 0);
    this._tone(110, 0.14, "square", 0.07, 0.06);
  }

  victory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this._tone(n, 0.18, "triangle", 0.09, idx * 0.085));
  }
}

export const sound = new SoundEngine();
