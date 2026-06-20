const GameTimer = {
  _interval: null,
  _startTime: null,
  _remaining: 0,
  _duration: 0,
  _callback: null,
  _tickCallback: null,

  start(duration, onEnd, onTick) {
    this.stop();
    this._duration = duration;
    this._remaining = duration;
    this._callback = onEnd;
    this._tickCallback = onTick;
    this._startTime = Date.now();

    this._interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
      this._remaining = Math.max(this._duration - elapsed, 0);

      if (this._tickCallback) {
        this._tickCallback(this._remaining);
      }

      if (this._remaining <= 0) {
        this.stop();
        if (this._callback) this._callback();
      }
    }, 100);
  },

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  },

  getRemaining() {
    return this._remaining;
  },

  getElapsed() {
    return Math.floor((Date.now() - this._startTime) / 1000);
  },

  renderBar(remaining, duration) {
    const pct = duration > 0 ? (remaining / duration) * 100 : 0;
    let warningClass = '';
    if (pct < 20) warningClass = 'danger';
    else if (pct < 50) warningClass = 'warning';

    return `
      <div class="game-timer ${pct < 20 ? 'warning' : ''}">
        <span>⏱</span>
        <span>${FormatUtils.time(remaining)}</span>
        <div class="timer-bar">
          <div class="timer-bar-fill ${warningClass}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }
};
