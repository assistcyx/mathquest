const WordProblemsGame = {
  _questions: [],
  _currentIndex: 0,
  _score: 0,
  _totalQuestions: 8,
  _timeLimit: 90,
  _difficulty: 'easy',
  _isPlaying: false,
  _answered: false,
  _timerStarted: false,

  async render(container) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    try {
      const config = await fetch('data/games-config.json').then(r => r.json());
      this._questions = config.wordProblems?.questions || [];
    } catch (e) {
      container.innerHTML = `<div class="empty-state"><div class="icon">😅</div><h3>Couldn't load word problems</h3></div>`;
      return;
    }

    this._currentIndex = 0;
    this._score = 0;
    this._isPlaying = false;
    this._answered = false;
    this._timerStarted = false;

    container.innerHTML = `
      <div class="game-container animate-fade-in" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">📝</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm);">Word Problems</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">
          Solve real-world math word problems!<br>
          Read carefully and choose the right answer.
        </p>
        <div style="margin-bottom: var(--space-xl);">
          <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Difficulty</p>
          <div class="difficulty-select">
            <button class="difficulty-btn selected" data-diff="easy" onclick="WordProblemsGame._setDifficulty(this, 'easy')">🌟 Easy</button>
            <button class="difficulty-btn" data-diff="medium" onclick="WordProblemsGame._setDifficulty(this, 'medium')">🔥 Medium</button>
            <button class="difficulty-btn" data-diff="hard" onclick="WordProblemsGame._setDifficulty(this, 'hard')">⚡ Hard</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="WordProblemsGame._startGame()">🚀 Start!</button>
      </div>
    `;
  },

  _setDifficulty(btn, diff) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const settings = { easy: { time: 90, questions: 6 }, medium: { time: 75, questions: 8 }, hard: { time: 60, questions: 10 } };
    this._timeLimit = settings[diff].time;
    this._totalQuestions = Math.min(settings[diff].questions, this._questions.length);
    this._difficulty = diff;
  },

  _startGame() {
    this._isPlaying = true;
    this._currentIndex = 0;
    this._score = 0;
    this._timerStarted = false;

    // Filter and shuffle questions by difficulty
    const diffMap = { easy: 'easy', medium: 'medium', hard: 'hard' };
    const filtered = this._questions.filter(q => q.difficulty === diffMap[this._difficulty]);
    // Shuffle
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
    this._questions = filtered;
    this._totalQuestions = Math.min(this._totalQuestions, filtered.length);

    this._renderQuestion(document.querySelector('.game-container')?.closest('#app') || document.getElementById('app'));
  },

  _renderQuestion(container) {
    if (this._currentIndex >= this._totalQuestions) {
      this._endGame(container);
      return;
    }

    const q = this._questions[this._currentIndex];
    this._answered = false;

    container.innerHTML = `
      <div class="game-container animate-fade-in">
        <div class="game-header">
          <div class="game-score">⭐ ${this._score}/${this._currentIndex}</div>
          <div id="wp-timer"></div>
        </div>

        <div style="margin-bottom: var(--space-md); display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
          ${Array.from({length: this._totalQuestions}, (_, i) => `
            <div style="width: 16px; height: 6px; border-radius: 3px; background: ${i < this._currentIndex ? 'var(--color-success)' : i === this._currentIndex ? 'var(--color-primary)' : 'var(--color-border)'};"></div>
          `).join('')}
        </div>

        <div class="word-problem-text">${q.question}</div>

        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" onclick="WordProblemsGame._selectAnswer(this, ${i}, ${q.correctIndex})">
              <span class="option-letter">${'ABCD'[i]}</span> ${opt}
            </button>
          `).join('')}
        </div>

        <div id="wp-explain" style="display: none;" class="quiz-explain"></div>
      </div>
    `;

    if (!this._timerStarted) {
      this._timerStarted = true;
      GameTimer.start(this._timeLimit, () => this._endGame(container), (remaining) => {
        const timerEl = document.getElementById('wp-timer');
        if (timerEl) timerEl.innerHTML = GameTimer.renderBar(remaining, this._timeLimit);
      });
    } else {
      const timerEl = document.getElementById('wp-timer');
      if (timerEl) timerEl.innerHTML = GameTimer.renderBar(GameTimer.getRemaining(), this._timeLimit);
    }
  },

  _selectAnswer(btn, selected, correct) {
    if (this._answered) return;
    this._answered = true;

    const q = this._questions[this._currentIndex];
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(o => o.classList.add('disabled'));
    btn.classList.add(selected === correct ? 'correct' : 'incorrect');

    if (selected !== correct) {
      options[correct].classList.add('correct');
    }

    const explainEl = document.getElementById('wp-explain');
    if (explainEl) {
      explainEl.style.display = 'block';
      explainEl.innerHTML = `
        <strong>${selected === correct ? '✅ Correct!' : '❌ Incorrect'}</strong><br>
        ${q.hint || ''}
      `;
    }

    if (selected === correct) {
      this._score++;
      AudioManager.play('correct');
    } else {
      AudioManager.play('incorrect');
    }

    setTimeout(() => {
      this._currentIndex++;
      this._renderQuestion(document.querySelector('.game-container')?.closest('#app') || document.getElementById('app'));
    }, 2000);
  },

  _endGame(container) {
    GameTimer.stop();

    const total = this._currentIndex;
    const reward = CreditEngine.awardGameReward('wordProblemCorrect', this._score, total);
    const creditsEarned = reward?.credits || 0;
    const xpEarned = reward?.xp || 0;

    GameState.addGameStats('wordproblems', this._score, total);

    container.innerHTML = `
      <div class="game-container animate-bounce-in">
        <div class="game-results">
          ${this._score === this._totalQuestions ? '🏆' : this._score >= this._totalQuestions * 0.7 ? '🎉' : '💪'}
          <div class="score-big">${this._score}/${this._totalQuestions}</div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            ${this._score === this._totalQuestions ? 'Perfect score! Master problem solver!' :
              this._score >= this._totalQuestions * 0.7 ? 'Great job! You think like a mathematician!' :
              'Keep practicing! Word problems get easier with experience!'}
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
              <div class="value">${Math.round(this._score / (total || 1) * 100)}%</div>
              <div class="label">Accuracy</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); justify-content: center;">
            <button class="btn btn-primary" onclick="WordProblemsGame._startGame()">🔄 Play Again</button>
            <button class="btn btn-ghost" onclick="Router.navigate('/games')">← Back to Games</button>
          </div>
        </div>
      </div>
    `;

    GameState.set('partner.currentMood', this._score >= this._totalQuestions * 0.7 ? 'celebrating' : 'happy');
    AchievementEngine.check();
  }
};
