const AudioManager = {
  enabled: true,
  ctx: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
    this.enabled = GameState.get('settings.soundEnabled') !== false;
  },

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play(type) {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();

    switch (type) {
      case 'correct': this._beep(523.25, 0.15, 'sine'); break;       // C5
      case 'incorrect': this._beep(233.08, 0.3, 'sawtooth'); break;   // A#3
      case 'click': this._beep(800, 0.05, 'sine'); break;
      case 'success': this._tada(); break;
      case 'levelup': this._levelUp(); break;
      case 'purchase': this._beep(659.25, 0.1, 'sine'); setTimeout(() => this._beep(880, 0.15, 'sine'), 100); break;
      case 'countdown': this._beep(440, 0.1, 'square'); break;
      case 'tick': this._beep(1000, 0.03, 'sine'); break;
    }
  },

  _beep(freq, duration, type = 'sine') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  },

  _tada() {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => this._beep(freq, 0.2, 'sine'), i * 100);
    });
  },

  _levelUp() {
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => this._beep(freq, 0.25, 'sine'), i * 120);
    });
  },

  toggle() {
    this.enabled = !this.enabled;
    GameState.set('settings.soundEnabled', this.enabled);
    return this.enabled;
  }
};
