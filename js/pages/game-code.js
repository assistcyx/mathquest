const CodeChallengeGame = {
  _challenges: [],
  _currentIndex: 0,
  _score: 0,
  _timeLimit: 120,
  _isPlaying: false,
  _timerStarted: false,

  async render(container) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    try {
      const config = await fetch('data/games-config.json').then(r => r.json());
      this._challenges = config.codeChallenge?.challenges || [];
    } catch (e) {
      this._challenges = this._getDefaultChallenges();
    }

    this._currentIndex = 0;
    this._score = 0;
    this._isPlaying = false;
    this._timerStarted = false;

    this._renderStart(container);
  },

  _getDefaultChallenges() {
    return [
      {
        id: 'cc1', difficulty: 'easy',
        instructions: 'Fill in the blank to create a greeting function:',
        code: 'def greet(name):\n    return "Hello, " + ___',
        blankLabel: '___',
        correctAnswer: 'name',
        hint: 'What parameter was passed to the function?',
        options: ['name', 'greeting', '"World"', 'person'],
        creditReward: 8, xpReward: 30
      },
      {
        id: 'cc2', difficulty: 'easy',
        instructions: 'Fill in the blank to check if a number is even:',
        code: 'def is_even(n):\n    return n ___ 2 == 0',
        blankLabel: '___',
        correctAnswer: '%',
        hint: 'What operator gives you the remainder?',
        options: ['%', '/', '*', '+'],
        creditReward: 8, xpReward: 30
      },
      {
        id: 'cc3', difficulty: 'medium',
        instructions: 'Fill in the blank to create a list of numbers 0-4:',
        code: 'numbers = list(___(5))',
        blankLabel: '___',
        correctAnswer: 'range',
        hint: 'Function that generates a sequence of numbers',
        options: ['range', 'len', 'sum', 'enumerate'],
        creditReward: 8, xpReward: 30
      },
      {
        id: 'cc4', difficulty: 'medium',
        instructions: 'What will this code output?',
        code: 'x = 5\ny = 3\nprint(x ** y)',
        blankLabel: 'Output:',
        correctAnswer: '125',
        hint: '** is the exponentiation operator',
        options: ['125', '15', '8', '243'],
        creditReward: 8, xpReward: 30
      },
      {
        id: 'cc5', difficulty: 'hard',
        instructions: 'Fill in the blank to add an item to a list:',
        code: 'fruits = ["apple", "banana"]\nfruits.___("cherry")',
        blankLabel: '___',
        correctAnswer: 'append',
        hint: 'Method to add an element to the end of a list',
        options: ['append', 'add', 'insert', 'push'],
        creditReward: 8, xpReward: 30
      }
    ];
  },

  _renderStart(container) {
    container.innerHTML = `
      <div class="game-container animate-fade-in" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">💻</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm);">Python Code Challenge</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">
          Fill in the blanks and solve Python puzzles!<br>
          Earn 8 credits per challenge solved.
        </p>
        <button class="btn btn-success btn-lg" onclick="CodeChallengeGame._startGame()">🚀 Start Challenge!</button>
      </div>
    `;
  },

  _startGame() {
    this._isPlaying = true;
    this._currentIndex = 0;
    this._score = 0;
    this._timerStarted = false;
    this._renderChallenge(document.getElementById('app'));
  },

  _renderChallenge(container) {
    if (this._currentIndex >= this._challenges.length) {
      this._endGame(container);
      return;
    }

    const c = this._challenges[this._currentIndex];
    const codeHtml = c.code.replace(/___/g, '<span class="challenge-blank">?</span>');

    container.innerHTML = `
      <div class="game-container animate-fade-in">
        <div class="game-header">
          <div class="game-score">⭐ ${this._score}/${this._currentIndex}</div>
          <div id="challenge-timer"></div>
        </div>

        <div style="margin-bottom: var(--space-md); display: flex; gap: var(--space-xs); justify-content: center;">
          ${Array.from({length: this._challenges.length}, (_, i) => `
            <div style="width: 16px; height: 6px; border-radius: 3px; background: ${i < this._currentIndex ? 'var(--color-success)' : i === this._currentIndex ? 'var(--color-primary)' : 'var(--color-border)'};"></div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
          <span class="badge ${c.difficulty === 'easy' ? 'badge-green' : c.difficulty === 'medium' ? 'badge-gold' : 'badge-pink'}">${c.difficulty}</span>
          <span style="font-size: var(--text-sm); color: var(--color-text-muted);">Challenge ${this._currentIndex + 1} of ${this._challenges.length}</span>
        </div>

        <p style="font-weight: 700; margin-bottom: var(--space-md);">${c.instructions}</p>

        <pre class="challenge-code">${codeHtml}</pre>

        <div style="margin-bottom: var(--space-md);">
          <p style="font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--space-sm);">${c.blankLabel || 'Your answer:'}</p>
          <div class="challenge-options-grid">
            ${(c.options || []).map((opt, i) => `
              <button class="quiz-option" onclick="CodeChallengeGame._selectAnswer(this, '${opt.replace(/'/g, "\\'")}', '${c.correctAnswer.replace(/'/g, "\\'")}')">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>

        <div id="challenge-result" style="display: none;"></div>
      </div>
    `;

    if (!this._timerStarted) {
      this._timerStarted = true;
      GameTimer.start(this._timeLimit, () => this._endGame(container), (remaining) => {
        const timerEl = document.getElementById('challenge-timer');
        if (timerEl) timerEl.innerHTML = GameTimer.renderBar(remaining, this._timeLimit);
      });
    }
  },

  _selectAnswer(btn, selected, correct) {
    const options = document.querySelectorAll('.challenge-options-grid .quiz-option');
    options.forEach(o => o.classList.add('disabled'));

    const isCorrect = selected.toLowerCase() === correct.toLowerCase();
    btn.classList.add(isCorrect ? 'correct' : 'incorrect');

    if (!isCorrect) {
      options.forEach(o => {
        if (o.textContent.trim().toLowerCase() === correct.toLowerCase()) {
          o.classList.add('correct');
        }
      });
    }

    const resultEl = document.getElementById('challenge-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = isCorrect
        ? `<div style="padding: var(--space-sm); background: var(--color-success-light); border-radius: var(--radius-md); color: var(--color-success-dark); font-weight: 600;">✅ Correct! +8 credits</div>`
        : `<div style="padding: var(--space-sm); background: var(--color-error-light); border-radius: var(--radius-md); color: var(--color-error-dark); font-weight: 600;">❌ The answer was: ${correct}</div>`;
    }

    if (isCorrect) {
      this._score++;
      AudioManager.play('correct');
    } else {
      AudioManager.play('incorrect');
    }

    setTimeout(() => {
      this._currentIndex++;
      this._renderChallenge(document.getElementById('app'));
    }, 1500);
  },

  _endGame(container) {
    GameTimer.stop();

    const reward = CreditEngine.awardGameReward('challengeSolve', this._score, this._challenges.length);
    const creditsEarned = reward?.credits || 0;
    const xpEarned = reward?.xp || 0;

    GameState.addGameStats('challenge', this._score, this._challenges.length);

    container.innerHTML = `
      <div class="game-container animate-bounce-in">
        <div class="game-results">
          💻
          <div class="score-big">${this._score}/${this._challenges.length}</div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            ${this._score === this._challenges.length ? 'Perfect! You know Python!' :
              this._score >= 3 ? 'Great work! Keep practicing!' : 'Good start!'}
          </p>

          <div class="result-stats">
            <div class="result-stat">
              <div class="value">+${creditsEarned}</div>
              <div class="label">Credits</div>
            </div>
            <div class="result-stat">
              <div class="value">+${xpEarned}</div>
              <div class="label">XP</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); justify-content: center;">
            <button class="btn btn-success" onclick="CodeChallengeGame._startGame()">🔄 Play Again</button>
            <button class="btn btn-ghost" onclick="Router.navigate('/games')">← Back to Games</button>
          </div>
        </div>
      </div>
    `;

    GameState.set('partner.currentMood', this._score === this._challenges.length ? 'celebrating' : 'happy');
    AchievementEngine.check();
  }
};
