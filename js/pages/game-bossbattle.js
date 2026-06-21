const BossBattleGame = {
  _phases: [
    { name: 'Arithmetic Assault', subject: 'math', bossHP: 100, icon: '🔢' },
    { name: 'Calculus Onslaught', subject: 'calculus', bossHP: 150, icon: '∫' },
    { name: 'Python Finale', subject: 'python', bossHP: 200, icon: '🐍' }
  ],
  _bossQuestions: [],
  _currentPhase: 0,
  _currentQuestion: 0,
  _phaseQuestions: [],
  _bossHP: 0,
  _maxBossHP: 0,
  _playerLives: 3,
  _score: 0,
  _totalQuestions: 0,
  _difficulty: 'easy',
  _isPlaying: false,
  _answered: false,
  _timerStarted: false,
  _timeLimit: 15,
  _questionsPerPhase: 5,

  async render(container) {
    container.innerHTML = `
      <div class="game-container animate-fade-in" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">🐉</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm);">Boss Battle</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">
          Face the ultimate challenge! Defeat the boss across 3 phases:<br>
          🔢 Arithmetic → ∫ Calculus → 🐍 Python<br>
          Each correct answer deals damage. Wrong answers cost a life!
        </p>
        <div style="margin-bottom: var(--space-xl);">
          <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Difficulty</p>
          <div class="difficulty-select">
            <button class="difficulty-btn selected" data-diff="easy" onclick="BossBattleGame._setDifficulty(this, 'easy')">🌟 Easy</button>
            <button class="difficulty-btn" data-diff="medium" onclick="BossBattleGame._setDifficulty(this, 'medium')">🔥 Medium</button>
            <button class="difficulty-btn" data-diff="hard" onclick="BossBattleGame._setDifficulty(this, 'hard')">⚡ Hard</button>
          </div>
        </div>
        <button class="btn btn-danger btn-lg" onclick="BossBattleGame._startGame()">⚔️ Start Battle!</button>
      </div>
    `;
  },

  _setDifficulty(btn, diff) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this._difficulty = diff;
  },

  async _startGame() {
    // Load boss questions
    try {
      const config = await fetch('data/games-config.json').then(r => r.json());
      this._bossQuestions = config.bossBattle?.questions || [];
      // Also load quiz questions for calculus/python phases
      this._quizQuestions = config.quiz?.questions || [];
    } catch (e) {
      this._bossQuestions = this._getDefaultBossQuestions();
      this._quizQuestions = [];
    }

    // Set difficulty params
    const diffSettings = {
      easy: { hpMultiplier: 0.7, lives: 3, timePerQuestion: 20 },
      medium: { hpMultiplier: 1.0, lives: 3, timePerQuestion: 15 },
      hard: { hpMultiplier: 1.3, lives: 2, timePerQuestion: 10 }
    };
    const settings = diffSettings[this._difficulty];
    this._playerLives = settings.lives;
    this._timeLimit = settings.timePerQuestion;

    // Scale boss HP
    this._phases = [
      { name: 'Arithmetic Assault', subject: 'math', bossHP: Math.round(100 * settings.hpMultiplier), icon: '🔢' },
      { name: 'Calculus Onslaught', subject: 'calculus', bossHP: Math.round(150 * settings.hpMultiplier), icon: '∫' },
      { name: 'Python Finale', subject: 'python', bossHP: Math.round(200 * settings.hpMultiplier), icon: '🐍' }
    ];

    this._currentPhase = 0;
    this._score = 0;
    this._totalQuestions = 0;
    this._isPlaying = true;
    this._timerStarted = false;

    this._buildPhaseQuestions();
    this._renderPhaseIntro();
  },

  _buildPhaseQuestions() {
    this._phaseQuestions = [];
    for (let p = 0; p < this._phases.length; p++) {
      const phase = this._phases[p];
      let pool = [];
      if (phase.subject === 'math') {
        pool = this._bossQuestions.filter(q => q.subject === 'math');
        if (pool.length < this._questionsPerPhase) {
          pool = pool.concat(this._generateArithmeticQuestions());
        }
      } else if (phase.subject === 'calculus') {
        pool = this._bossQuestions.filter(q => q.subject === 'calculus');
        if (pool.length < this._questionsPerPhase) {
          pool = pool.concat(this._quizQuestions.filter(q => q.subject === 'calculus' && q.difficulty !== 'easy'));
        }
      } else if (phase.subject === 'python') {
        pool = this._bossQuestions.filter(q => q.subject === 'python');
        if (pool.length < this._questionsPerPhase) {
          pool = pool.concat(this._quizQuestions.filter(q => q.subject === 'python' && q.difficulty !== 'easy'));
        }
      }
      // Shuffle and take questionsPerPhase
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      this._phaseQuestions[p] = pool.slice(0, this._questionsPerPhase);
    }
  },

  _generateArithmeticQuestions() {
    const questions = [];
    const ops = ['+', '-', '*'];
    for (let i = 0; i < 10; i++) {
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b, answer;
      switch (op) {
        case '+': a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 50) + 10; answer = a + b; break;
        case '-': a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * a); answer = a - b; break;
        case '*': a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; break;
      }
      const options = [answer];
      while (options.length < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        const d = answer + (offset === 0 ? 1 : offset);
        if (d >= 0 && !options.includes(d)) options.push(d);
      }
      for (let j = options.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [options[j], options[k]] = [options[k], options[j]];
      }
      questions.push({
        id: 'gen_' + i,
        subject: 'math',
        difficulty: 'hard',
        question: `What is ${a} ${op} ${b}?`,
        options: options,
        correctIndex: options.indexOf(answer),
        hint: 'Calculate carefully!'
      });
    }
    return questions;
  },

  _getDefaultBossQuestions() {
    return [
      { id: 'bb1', subject: 'math', difficulty: 'hard', question: 'What is 15 × 13?', options: ['185', '195', '205', '175'], correctIndex: 1, hint: '15 × 10 + 15 × 3' },
      { id: 'bb2', subject: 'math', difficulty: 'hard', question: 'What is 144 ÷ 12?', options: ['10', '11', '12', '13'], correctIndex: 2, hint: '12 × 12 = 144' },
      { id: 'bb3', subject: 'calculus', difficulty: 'hard', question: 'What is the derivative of 3x⁴?', options: ['12x³', '7x³', '12x⁴', '3x³'], correctIndex: 0, hint: 'Power rule' }
    ];
  },

  _renderPhaseIntro() {
    const phase = this._phases[this._currentPhase];
    const container = document.querySelector('.game-container')?.closest('#app') || document.getElementById('app');

    container.innerHTML = `
      <div class="game-container animate-bounce-in" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: var(--space-md);">${phase.icon}</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm); color: var(--color-error);">Phase ${this._currentPhase + 1}</h2>
        <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-lg);">${phase.name}</h3>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
          Boss HP: <strong>${phase.bossHP}</strong> | Your Lives: ${'❤️'.repeat(this._playerLives)}
        </p>
        <button class="btn btn-danger btn-lg" onclick="BossBattleGame._beginPhase()">⚔️ Fight!</button>
      </div>
    `;
  },

  _beginPhase() {
    this._currentQuestion = 0;
    this._answered = false;
    this._timerStarted = false;
    const container = document.querySelector('.game-container')?.closest('#app') || document.getElementById('app');
    this._renderQuestion(container);
  },

  _renderQuestion(container) {
    const phase = this._phases[this._currentPhase];
    const questions = this._phaseQuestions[this._currentPhase];

    if (this._currentQuestion >= questions.length || phase.bossHP <= 0) {
      this._onPhaseComplete(container);
      return;
    }

    if (this._playerLives <= 0) {
      this._endGame(container, false);
      return;
    }

    const q = questions[this._currentQuestion];
    this._answered = false;

    const bossHPPercent = Math.max(0, (phase.bossHP / (this._phases[this._currentPhase].bossHP + phase.bossHP * 0.5)) * 100);
    const bossHPColor = bossHPPercent > 50 ? 'var(--color-success)' : bossHPPercent > 25 ? 'var(--color-warning)' : 'var(--color-error)';

    container.innerHTML = `
      <div class="game-container animate-fade-in">
        <div class="game-header">
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <span>${phase.icon}</span>
            <span style="font-weight: 700;">${phase.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: var(--space-sm);">
            <span>${'❤️'.repeat(Math.max(0, this._playerLives))}${'🖤'.repeat(Math.max(0, 3 - this._playerLives))}</span>
            <span id="bb-timer"></span>
          </div>
        </div>

        <!-- Boss HP Bar -->
        <div style="margin-bottom: var(--space-lg);">
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-bottom: var(--space-xs);">
            <span style="font-weight: 700;">🐉 Boss</span>
            <span style="font-weight: 700;">HP: ${phase.bossHP}</span>
          </div>
          <div class="boss-hp-bar">
            <div class="boss-hp-fill" style="width: ${bossHPPercent}%; background: ${bossHPColor};"></div>
          </div>
        </div>

        <div style="margin-bottom: var(--space-md); display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;">
          ${Array.from({length: questions.length}, (_, i) => `
            <div style="width: 20px; height: 6px; border-radius: 3px; background: ${i < this._currentQuestion ? 'var(--color-success)' : i === this._currentQuestion ? 'var(--color-primary)' : 'var(--color-border)'};"></div>
          `).join('')}
        </div>

        <div class="quiz-question">${q.question}</div>

        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" onclick="BossBattleGame._selectAnswer(this, ${i}, ${q.correctIndex})">
              <span class="option-letter">${'ABCD'[i]}</span> ${opt}
            </button>
          `).join('')}
        </div>

        <div id="bb-explain" style="display: none;" class="quiz-explain"></div>
      </div>
    `;

    if (!this._timerStarted) {
      this._timerStarted = true;
      GameTimer.start(this._timeLimit, () => {
        // Time's up — lose a life
        this._playerLives--;
        if (this._playerLives <= 0) {
          this._endGame(container, false);
        } else {
          this._currentQuestion++;
          this._timerStarted = false;
          this._renderQuestion(container);
        }
      }, (remaining) => {
        const timerEl = document.getElementById('bb-timer');
        if (timerEl) timerEl.innerHTML = GameTimer.renderBar(remaining, this._timeLimit);
      });
    } else {
      const timerEl = document.getElementById('bb-timer');
      if (timerEl) timerEl.innerHTML = GameTimer.renderBar(GameTimer.getRemaining(), this._timeLimit);
    }
  },

  _selectAnswer(btn, selected, correct) {
    if (this._answered) return;
    this._answered = true;

    const phase = this._phases[this._currentPhase];
    const questions = this._phaseQuestions[this._currentPhase];
    const q = questions[this._currentQuestion];
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(o => o.classList.add('disabled'));

    const isCorrect = selected === correct;

    if (isCorrect) {
      btn.classList.add('correct');
      const damage = this._difficulty === 'easy' ? 30 : this._difficulty === 'medium' ? 25 : 20;
      phase.bossHP -= damage;
      this._score++;
      AudioManager.play('correct');
    } else {
      btn.classList.add('incorrect');
      options[correct].classList.add('correct');
      this._playerLives--;
      AudioManager.play('incorrect');
    }

    const explainEl = document.getElementById('bb-explain');
    if (explainEl) {
      explainEl.style.display = 'block';
      explainEl.innerHTML = `<strong>${isCorrect ? '✅ Hit! -' + (this._difficulty === 'easy' ? 30 : this._difficulty === 'medium' ? 25 : 20) + ' HP' : '❌ Miss! Lost a life!'}</strong><br>${q.hint || ''}`;
    }

    this._totalQuestions++;

    setTimeout(() => {
      this._currentQuestion++;
      this._timerStarted = false;
      if (this._timerStarted) GameTimer.stop();
      this._renderQuestion(document.querySelector('.game-container')?.closest('#app') || document.getElementById('app'));
    }, 1200);
  },

  _onPhaseComplete(container) {
    GameTimer.stop();
    const phase = this._phases[this._currentPhase];

    if (this._currentPhase < this._phases.length - 1 && this._playerLives > 0) {
      // Show phase victory and advance
      container.innerHTML = `
        <div class="game-container animate-bounce-in" style="text-align: center;">
          <div style="font-size: 4rem; margin-bottom: var(--space-md);">🎉</div>
          <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm); color: var(--color-success);">Phase ${this._currentPhase + 1} Defeated!</h2>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            Boss HP: 0 | Your Lives: ${'❤️'.repeat(Math.max(0, this._playerLives))}
          </p>
          <button class="btn btn-primary btn-lg" onclick="BossBattleGame._nextPhase()">➡️ Next Phase</button>
        </div>
      `;
    } else {
      // All phases complete or dead
      this._endGame(container, this._playerLives > 0);
    }
  },

  _nextPhase() {
    this._currentPhase++;
    this._timerStarted = false;
    this._renderPhaseIntro();
  },

  _endGame(container, won) {
    GameTimer.stop();

    const phase = this._phases[this._currentPhase];
    const reward = CreditEngine.awardGameReward(won ? 'bossBattleWin' : 'bossBattleParticipation', this._score, this._totalQuestions);
    const creditsEarned = won ? (reward?.credits || 50) : (reward?.credits || 10);
    const xpEarned = won ? (reward?.xp || 150) : (reward?.xp || 30);

    GameState.addGameStats('bossbattle', this._score, this._totalQuestions, won);

    container.innerHTML = `
      <div class="game-container ${won ? 'animate-bounce-in' : 'animate-fade-in'}">
        <div class="game-results">
          ${won ? '🏆' : '💀'}
          <div class="score-big">${won ? 'VICTORY!' : 'DEFEATED'}</div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            ${won
              ? 'You defeated the boss! Incredible achievement!'
              : 'The boss was too strong this time. Try again!'}
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
              <div class="value">${this._score}/${this._totalQuestions}</div>
              <div class="label">Correct</div>
            </div>
            <div class="result-stat">
              <div class="value">${Math.round(this._score / (this._totalQuestions || 1) * 100)}%</div>
              <div class="label">Accuracy</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); justify-content: center;">
            <button class="btn btn-danger" onclick="BossBattleGame._startGame()">⚔️ Battle Again</button>
            <button class="btn btn-ghost" onclick="Router.navigate('/games')">← Back to Games</button>
          </div>
        </div>
      </div>
    `;

    GameState.set('partner.currentMood', won ? 'celebrating' : 'encouraging');
    AchievementEngine.check();
  }
};
