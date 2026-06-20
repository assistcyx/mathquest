const QuizGame = {
  _questions: [],
  _currentIndex: 0,
  _score: 0,
  _totalQuestions: 10,
  _timeLimit: 60,
  _isPlaying: false,
  _answered: false,
  _timerStarted: false,

  async render(container) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    try {
      const config = await fetch('data/games-config.json').then(r => r.json());
      this._questions = config.quiz?.questions || [];
    } catch (e) {
      this._questions = this._getDefaultQuestions();
    }

    this._currentIndex = 0;
    this._score = 0;
    this._isPlaying = false;
    this._answered = false;
    this._timerStarted = false;

    this._renderStart(container);
  },

  _getDefaultQuestions() {
    return [
      { id: 'q1', subject: 'calculus', difficulty: 'easy', question: 'What is the derivative of x²?', options: ['2x', 'x', '2', 'x²/2'], correctIndex: 0, hint: 'Power rule: bring down the exponent' },
      { id: 'q2', subject: 'calculus', difficulty: 'easy', question: 'What is the limit of 1/x as x approaches infinity?', options: ['0', '1', 'Infinity', 'Undefined'], correctIndex: 0, hint: 'Think about what happens when x gets very large' },
      { id: 'q3', subject: 'calculus', difficulty: 'easy', question: 'What is the integral of 2x?', options: ['x² + C', '2 + C', 'x²/2 + C', '2x² + C'], correctIndex: 0, hint: 'Reverse of derivative' },
      { id: 'q4', subject: 'calculus', difficulty: 'medium', question: 'What does the derivative represent?', options: ['Rate of change', 'Area under curve', 'Sum of values', 'Average value'], correctIndex: 0, hint: 'Think about slope' },
      { id: 'q5', subject: 'calculus', difficulty: 'medium', question: 'What is the derivative of sin(x)?', options: ['cos(x)', '-sin(x)', 'tan(x)', '-cos(x)'], correctIndex: 0, hint: 'Think about the derivative of trig functions' },
      { id: 'q6', subject: 'calculus', difficulty: 'easy', question: 'What is the integral of 1?', options: ['x + C', '0', '1 + C', 'x² + C'], correctIndex: 0, hint: 'What function has derivative 1?' },
      { id: 'q7', subject: 'calculus', difficulty: 'medium', question: 'What is the limit of (sin x)/x as x approaches 0?', options: ['1', '0', 'Infinity', 'Undefined'], correctIndex: 0, hint: 'This is a famous limit!' },
      { id: 'q8', subject: 'calculus', difficulty: 'hard', question: 'What is the derivative of e^x?', options: ['e^x', 'xe^(x-1)', 'ln(x)e^x', '1'], correctIndex: 0, hint: 'e^x is special' },
      { id: 'q9', subject: 'calculus', difficulty: 'medium', question: 'What is the chain rule used for?', options: ['Composite functions', 'Product of functions', 'Quotient of functions', 'Inverse functions'], correctIndex: 0, hint: 'Functions within functions' },
      { id: 'q10', subject: 'calculus', difficulty: 'hard', question: 'What is the derivative of ln(x)?', options: ['1/x', '1/x²', 'ln(x)', 'x'], correctIndex: 0, hint: 'Think about the derivative of natural log' },
    ];
  },

  _renderStart(container) {
    container.innerHTML = `
      <div class="game-container animate-fade-in" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">🧮</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm);">Calculus Quiz</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">
          Answer ${this._totalQuestions} calculus questions as fast as you can!<br>
          Earn 5 credits per correct answer.
        </p>
        <div style="margin-bottom: var(--space-xl);">
          <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Difficulty</p>
          <div class="difficulty-select">
            <button class="difficulty-btn selected" data-diff="easy" onclick="QuizGame._setDifficulty(this, 'easy')">🌟 Easy</button>
            <button class="difficulty-btn" data-diff="medium" onclick="QuizGame._setDifficulty(this, 'medium')">🔥 Medium</button>
            <button class="difficulty-btn" data-diff="hard" onclick="QuizGame._setDifficulty(this, 'hard')">⚡ Hard</button>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" onclick="QuizGame._startGame()">🚀 Start Quiz!</button>
      </div>
    `;
  },

  _setDifficulty(btn, diff) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    // Adjust time and questions based on difficulty
    const settings = { easy: { time: 60, questions: 8 }, medium: { time: 45, questions: 10 }, hard: { time: 30, questions: 12 } };
    this._timeLimit = settings[diff].time;
    this._totalQuestions = Math.min(settings[diff].questions, this._questions.length);
  },

  _startGame() {
    this._isPlaying = true;
    this._currentIndex = 0;
    this._score = 0;
    this._timerStarted = false;
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
          <div id="quiz-timer"></div>
        </div>

        <div style="margin-bottom: var(--space-md); display: flex; gap: var(--space-xs); justify-content: center;">
          ${Array.from({length: this._totalQuestions}, (_, i) => `
            <div style="width: 20px; height: 6px; border-radius: 3px; background: ${i < this._currentIndex ? 'var(--color-success)' : i === this._currentIndex ? 'var(--color-primary)' : 'var(--color-border)'};"></div>
          `).join('')}
        </div>

        <div class="quiz-question">${q.question}</div>

        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" onclick="QuizGame._selectAnswer(this, ${i}, ${q.correctIndex})">
              <span class="option-letter">${'ABCD'[i]}</span> ${opt}
            </button>
          `).join('')}
        </div>

        <div id="quiz-explain" style="display: none;"></div>
      </div>
    `;

    if (!this._timerStarted) {
      this._timerStarted = true;
      GameTimer.start(this._timeLimit, () => this._endGame(container), (remaining) => {
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
          timerEl.innerHTML = GameTimer.renderBar(remaining, this._timeLimit);
        }
      });
    } else {
      const timerEl = document.getElementById('quiz-timer');
      if (timerEl) {
        timerEl.innerHTML = GameTimer.renderBar(GameTimer.getRemaining(), this._timeLimit);
      }
    }
  },

  _selectAnswer(btn, selected, correct) {
    if (this._answered) return;
    this._answered = true;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach(o => o.classList.add('disabled'));
    btn.classList.add(selected === correct ? 'correct' : 'incorrect');

    if (selected !== correct) {
      options[correct].classList.add('correct');
    }

    const q = this._questions[this._currentIndex];
    const explainEl = document.getElementById('quiz-explain');
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

    // Auto-advance after delay
    setTimeout(() => {
      this._currentIndex++;
      this._renderQuestion(document.querySelector('.game-container')?.closest('#app') || document.getElementById('app'));
    }, 1500);
  },

  _endGame(container) {
    GameTimer.stop();

    const total = this._currentIndex;
    const reward = CreditEngine.awardGameReward('quizCorrect', this._score, total);
    const creditsEarned = reward?.credits || 0;
    const xpEarned = reward?.xp || 0;

    GameState.addGameStats('quiz', this._score, total);

    container.innerHTML = `
      <div class="game-container animate-bounce-in">
        <div class="game-results">
          ${this._score === this._totalQuestions ? '🏆' : this._score >= this._totalQuestions * 0.7 ? '🎉' : '💪'}
          <div class="score-big">${this._score}/${this._totalQuestions}</div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            ${this._score === this._totalQuestions ? 'Perfect score! Amazing!' :
              this._score >= this._totalQuestions * 0.7 ? 'Great job! Keep it up!' :
              'Good effort! Practice makes perfect!'}
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
              <div class="value">${FormatUtils.percentage(this._score, this._totalQuestions)}</div>
              <div class="label">Accuracy</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); justify-content: center;">
            <button class="btn btn-primary" onclick="QuizGame._startGame()">🔄 Play Again</button>
            <button class="btn btn-ghost" onclick="Router.navigate('/games')">← Back to Games</button>
          </div>
        </div>
      </div>
    `;

    GameState.set('partner.currentMood', this._score === this._totalQuestions ? 'celebrating' : 'happy');
    AchievementEngine.check();
  }
};
