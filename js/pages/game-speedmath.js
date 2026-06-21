const SpeedMathGame = {
  _currentQuestion: null,
  _score: 0,
  _currentIndex: 0,
  _totalQuestions: 20,
  _timeLimit: 60,
  _difficulty: 'easy',
  _isPlaying: false,
  _answered: false,
  _timerStarted: false,
  _questionStartTime: 0,
  _totalResponseTime: 0,
  _fastAnswers: 0,

  render(container) {
    container.innerHTML = `
      <div class="game-container animate-fade-in" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">⚡</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm);">Speed Math</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">
          Solve arithmetic problems as fast as you can!<br>
          Answer within 3 seconds for a speed bonus!
        </p>
        <div style="margin-bottom: var(--space-xl);">
          <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Difficulty</p>
          <div class="difficulty-select">
            <button class="difficulty-btn selected" data-diff="easy" onclick="SpeedMathGame._setDifficulty(this, 'easy')">🌟 Easy</button>
            <button class="difficulty-btn" data-diff="medium" onclick="SpeedMathGame._setDifficulty(this, 'medium')">🔥 Medium</button>
            <button class="difficulty-btn" data-diff="hard" onclick="SpeedMathGame._setDifficulty(this, 'hard')">⚡ Hard</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="SpeedMathGame._startGame()">🚀 Start!</button>
      </div>
    `;
  },

  _setDifficulty(btn, diff) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const settings = { easy: { time: 60 }, medium: { time: 45 }, hard: { time: 30 } };
    this._timeLimit = settings[diff].time;
    this._difficulty = diff;
  },

  _startGame() {
    this._isPlaying = true;
    this._currentIndex = 0;
    this._score = 0;
    this._totalResponseTime = 0;
    this._fastAnswers = 0;
    this._timerStarted = false;
    this._renderQuestion(document.querySelector('.game-container')?.closest('#app') || document.getElementById('app'));
  },

  _generateQuestion() {
    const diff = this._difficulty;
    let a, b, op, answer;
    const ops = diff === 'easy' ? ['+', '-'] : diff === 'medium' ? ['+', '-', '*'] : ['+', '-', '*', '/'];
    op = ops[Math.floor(Math.random() * ops.length)];

    const ranges = { easy: { min: 1, max: 10 }, medium: { min: 1, max: 20 }, hard: { min: 1, max: 50 } };
    const range = ranges[diff];

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        b = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        b = Math.floor(Math.random() * (a - range.min + 1)) + range.min;
        answer = a - b;
        break;
      case '*':
        a = Math.floor(Math.random() * Math.min(range.max, 12)) + 1;
        b = Math.floor(Math.random() * Math.min(range.max, 12)) + 1;
        answer = a * b;
        break;
      case '/':
        b = Math.floor(Math.random() * Math.min(range.max, 12)) + 1;
        answer = Math.floor(Math.random() * Math.min(range.max, 12)) + 1;
        a = b * answer;
        break;
    }

    const question = `${a} ${op} ${b} = ?`;
    const options = this._generateOptions(answer, diff);
    const correctIndex = options.indexOf(answer);

    return { question, options, correctIndex, answer };
  },

  _generateOptions(correct, diff) {
    const options = [correct];
    const range = diff === 'easy' ? 5 : diff === 'medium' ? 10 : 20;
    while (options.length < 4) {
      const offset = Math.floor(Math.random() * range * 2) - range;
      const distractor = correct + (offset === 0 ? Math.floor(Math.random() * 3) + 1 : offset);
      if (distractor >= 0 && !options.includes(distractor)) {
        options.push(distractor);
      }
    }
    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  },

  _renderQuestion(container) {
    if (this._currentIndex >= this._totalQuestions) {
      this._endGame(container);
      return;
    }

    this._currentQuestion = this._generateQuestion();
    this._answered = false;
    this._questionStartTime = Date.now();

    container.innerHTML = `
      <div class="game-container animate-fade-in">
        <div class="game-header">
          <div class="game-score">⭐ ${this._score}/${this._currentIndex}</div>
          <div id="speed-timer"></div>
        </div>

        <div style="margin-bottom: var(--space-md); display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
          ${Array.from({length: this._totalQuestions}, (_, i) => `
            <div style="width: 16px; height: 6px; border-radius: 3px; background: ${i < this._currentIndex ? 'var(--color-success)' : i === this._currentIndex ? 'var(--color-primary)' : 'var(--color-border)'};"></div>
          `).join('')}
        </div>

        <div class="speedmath-question">${this._currentQuestion.question}</div>

        <div class="quiz-options">
          ${this._currentQuestion.options.map((opt, i) => `
            <button class="quiz-option" onclick="SpeedMathGame._selectAnswer(this, ${i}, ${this._currentQuestion.correctIndex})">
              <span class="option-letter">${'ABCD'[i]}</span> ${opt}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    if (!this._timerStarted) {
      this._timerStarted = true;
      GameTimer.start(this._timeLimit, () => this._endGame(container), (remaining) => {
        const timerEl = document.getElementById('speed-timer');
        if (timerEl) timerEl.innerHTML = GameTimer.renderBar(remaining, this._timeLimit);
      });
    } else {
      const timerEl = document.getElementById('speed-timer');
      if (timerEl) timerEl.innerHTML = GameTimer.renderBar(GameTimer.getRemaining(), this._timeLimit);
    }
  },

  _selectAnswer(btn, selected, correct) {
    if (this._answered) return;
    this._answered = true;

    const responseTime = (Date.now() - this._questionStartTime) / 1000;
    this._totalResponseTime += responseTime;
    const isFast = responseTime <= 3;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach(o => o.classList.add('disabled'));
    btn.classList.add(selected === correct ? 'correct' : 'incorrect');

    if (selected !== correct) {
      options[correct].classList.add('correct');
    }

    if (selected === correct) {
      this._score++;
      if (isFast) this._fastAnswers++;
      AudioManager.play('correct');
    } else {
      AudioManager.play('incorrect');
    }

    setTimeout(() => {
      this._currentIndex++;
      this._renderQuestion(document.querySelector('.game-container')?.closest('#app') || document.getElementById('app'));
    }, 800);
  },

  _endGame(container) {
    GameTimer.stop();

    const total = this._currentIndex;
    const avgTime = total > 0 ? (this._totalResponseTime / total).toFixed(1) : 0;
    const reward = CreditEngine.awardGameReward('speedMathCorrect', this._score, total);
    const speedBonus = this._fastAnswers * 2;
    const creditsEarned = (reward?.credits || 0) + speedBonus;
    const xpEarned = (reward?.xp || 0) + this._fastAnswers * 5;

    GameState.addGameStats('speedmath', this._score, total);

    container.innerHTML = `
      <div class="game-container animate-bounce-in">
        <div class="game-results">
          ${this._score === this._totalQuestions ? '🏆' : this._score >= this._totalQuestions * 0.7 ? '🎉' : '⚡'}
          <div class="score-big">${this._score}/${this._totalQuestions}</div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            ${this._score === this._totalQuestions ? 'Perfect score! Lightning fast!' :
              this._score >= this._totalQuestions * 0.7 ? 'Great speed! Keep practicing!' :
              'Good start! Speed comes with practice!'}
          </p>

          <div class="result-stats">
            <div class="result-stat">
              <div class="value">+${creditsEarned}</div>
              <div class="label">Credits earned</div>
            </div>
            <div class="result-stat">
              <div class="value">+${xpEarned}</div>
              <div class="label">XP earned</div>
            </div>
            <div class="result-stat">
              <div class="value">${avgTime}s</div>
              <div class="label">Avg response</div>
            </div>
            <div class="result-stat">
              <div class="value">${this._fastAnswers}</div>
              <div class="label">Fast answers</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); justify-content: center;">
            <button class="btn btn-primary" onclick="SpeedMathGame._startGame()">🔄 Play Again</button>
            <button class="btn btn-ghost" onclick="Router.navigate('/games')">← Back to Games</button>
          </div>
        </div>
      </div>
    `;

    GameState.set('partner.currentMood', this._score >= this._totalQuestions * 0.7 ? 'celebrating' : 'happy');
    AchievementEngine.check();
  }
};
