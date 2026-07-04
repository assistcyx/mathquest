const QuizGame = {
  _questions: [],
  _currentQuestion: 0,
  _score: 0,
  _totalQuestions: 0,
  _timer: null,
  _isPlaying: false,
  _difficulty: 'easy',
  _subject: 'calculus',
  _gameData: null,
  _useAiGeneration: false,

  async render(container) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    try {
      const res = await fetch('data/games-config.json');
      this._gameData = await res.json();
      this._renderStart(container);
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Failed to load game data</div>';
    }
  },

  _renderStart(container) {
    const hasApiKey = GameState.get('settings.aiApiKey') && GameState.get('settings.aiApiKey') !== 'demo_mode' ||
      GameState.get('settings.aiApiKeyOpenai') ||
      GameState.get('settings.aiApiKeyDeepseek');

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🎯 Quiz Challenge</h1>
          <p>Test your knowledge with multiple-choice questions</p>
        </div>

        <div class="game-container">
          <div class="game-card" style="text-align: center;">
            <div style="font-size: 4rem; margin-bottom: var(--space-lg);">🎯</div>
            <h2 style="margin-bottom: var(--space-md);">Ready to Test Your Skills?</h2>
            <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
              Answer multiple-choice questions on calculus, Python, algebra, and trigonometry.
              ${hasApiKey ? 'Generate fresh questions with AI!' : 'Add an API key in AI Tutor to enable AI-generated questions.'}
            </p>

            <div style="margin-bottom: var(--space-lg);">
              <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Subject</p>
              <div style="display: flex; gap: var(--space-xs); justify-content: center; flex-wrap: wrap;">
                <button class="difficulty-btn selected" onclick="QuizGame._selectSubject('calculus')" data-subj="calculus">∫ Calculus</button>
                <button class="difficulty-btn" onclick="QuizGame._selectSubject('python')" data-subj="python">🐍 Python</button>
                <button class="difficulty-btn" onclick="QuizGame._selectSubject('algebra')" data-subj="algebra">🔢 Algebra</button>
                <button class="difficulty-btn" onclick="QuizGame._selectSubject('trigonometry')" data-subj="trigonometry">📐 Trig</button>
              </div>
            </div>

            <div style="margin-bottom: var(--space-lg);">
              <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Difficulty</p>
              <div style="display: flex; gap: var(--space-xs); justify-content: center;">
                <button class="difficulty-btn selected" onclick="QuizGame._selectDifficulty('easy')">😊 Easy</button>
                <button class="difficulty-btn" onclick="QuizGame._selectDifficulty('medium')">🤔 Medium</button>
                <button class="difficulty-btn" onclick="QuizGame._selectDifficulty('hard')">😈 Hard</button>
              </div>
            </div>

            ${hasApiKey ? `
            <div style="margin-bottom: var(--space-lg); padding: var(--space-md); background: var(--color-bg-alt); border-radius: var(--radius-md);">
              <label style="display: flex; align-items: center; gap: var(--space-sm); justify-content: center; cursor: pointer;">
                <input type="checkbox" id="ai-gen-toggle" onchange="QuizGame._toggleAiGeneration(this.checked)">
                <span style="font-weight: 600;">🧠 Generate questions with AI</span>
              </label>
              <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: var(--space-xs);">
                Uses your AI provider to create fresh questions tailored to your chosen subject and difficulty.
              </p>
            </div>
            ` : ''}

            <button class="btn btn-primary btn-lg" onclick="QuizGame._startGame()">🚀 Start Quiz</button>
          </div>
        </div>
      </div>
    `;
  },

  _selectSubject(subject) {
    this._subject = subject;
    document.querySelectorAll('[data-subj]').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-subj') === subject);
    });
  },

  _selectDifficulty(diff) {
    this._difficulty = diff;
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      const isDiff = btn.textContent.includes(diff.charAt(0).toUpperCase() + diff.slice(1));
      btn.classList.toggle('selected', isDiff && btn.parentElement?.parentElement?.querySelector('p')?.textContent.includes('Difficulty'));
    });
  },

  _toggleAiGeneration(enabled) {
    this._useAiGeneration = enabled;
  },

  async _startGame() {
    this._currentQuestion = 0;
    this._score = 0;
    this._isPlaying = true;

    const container = document.querySelector('.game-container');
    if (!container) return;

    // Show loading
    container.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; margin-top: var(--space-md);">Preparing questions...</p>';

    if (this._useAiGeneration) {
      // Try AI generation first
      try {
        container.innerHTML = '<div class="loading-spinner"></div><p style="text-align: center; margin-top: var(--space-md);">🧠 Generating questions with AI...</p>';
        const generated = await QuizGenerator.generate({
          subject: this._subject,
          difficulty: this._difficulty,
          count: 8
        });
        if (generated && generated.length > 0) {
          this._questions = generated;
        } else {
          Toast.show('AI generation unavailable, using saved questions', 'info');
          this._questions = this._loadQuestions();
        }
      } catch (e) {
        console.warn('AI generation failed, falling back:', e);
        Toast.show('Using saved questions', 'info');
        this._questions = this._loadQuestions();
      }
    } else {
      this._questions = this._loadQuestions();
    }

    if (!this._questions || this._questions.length === 0) {
      container.innerHTML = `
        <div class="game-card" style="text-align: center;">
          <p>No questions available for this selection.</p>
          <button class="btn btn-primary" onclick="QuizGame.render(document.querySelector('#app'))">Back</button>
        </div>
      `;
      return;
    }

    // Shuffle
    this._questions = this._shuffle(this._questions);
    this._totalQuestions = Math.min(this._questions.length, this._getQuestionCount());

    const timerSeconds = this._difficulty === 'easy' ? 60 : this._difficulty === 'medium' ? 45 : 30;

    this._renderGame(container, timerSeconds);
    this._renderQuestion();
    this._startTimer(timerSeconds);
  },

  _loadQuestions() {
    if (!this._gameData || !this._gameData.quiz) return [];

    let questions = this._gameData.quiz.questions || [];

    // Filter by subject
    if (this._subject !== 'calculus') {
      questions = questions.filter(q => q.subject === this._subject);
    } else {
      // For calculus, include calculus + general math questions
      questions = questions.filter(q => q.subject === 'calculus' || q.subject === 'general');
    }

    // Apply adaptive difficulty
    if (typeof AdaptiveEngine !== 'undefined' && AdaptiveEngine.isEnabled()) {
      // Filter by recommended difficulty level
      const subjectTopics = Object.entries(AdaptiveEngine.TOPICS)
        .filter(([_, t]) => t.subject === this._subject)
        .map(([id]) => AdaptiveEngine.getRecommendedDifficulty(id));

      const avgDifficulty = subjectTopics.length > 0
        ? subjectTopics.reduce((a, b) => {
            const dMap = { easy: 0, medium: 1, hard: 2 };
            return dMap[a] + dMap[b];
          }) / subjectTopics.length
        : 0;

      if (avgDifficulty > 1.5) {
        questions = questions.filter(q => q.difficulty !== 'easy');
      } else if (avgDifficulty > 0.5) {
        questions = questions.filter(q => q.difficulty !== 'hard');
      }
    }

    return questions;
  },

  _getQuestionCount() {
    return this._difficulty === 'easy' ? 8 : this._difficulty === 'medium' ? 10 : 12;
  },

  _renderGame(container, timerSeconds) {
    const diffLabel = this._difficulty.charAt(0).toUpperCase() + this._difficulty.slice(1);
    container.innerHTML = `
      <div class="game-card">
        <div class="game-header">
          <div class="game-header-left">
            <span class="badge badge-pink">🎯 Quiz</span>
            <span class="badge badge-green">${diffLabel}</span>
            ${this._useAiGeneration ? '<span class="badge badge-purple">🧠 AI Generated</span>' : ''}
          </div>
          <div class="game-header-right">
            <span id="quiz-timer">${timerSeconds}s</span>
          </div>
        </div>

        <div class="progress-dots" id="progress-dots">
          ${Array.from({ length: this._totalQuestions }, (_, i) =>
            `<span class="progress-dot ${i === 0 ? 'active' : ''}"></span>`
          ).join('')}
        </div>

        <div id="question-area" class="question-area">
          <!-- Question rendered here -->
        </div>

        <div class="game-score">
          Score: <strong id="score-display">0</strong> / ${this._totalQuestions}
        </div>
      </div>
    `;
  },

  _renderQuestion() {
    const area = document.getElementById('question-area');
    if (!area) return;

    const q = this._questions[this._currentQuestion];
    if (!q) {
      this._endGame();
      return;
    }

    // Cache for hints
    if (typeof SmartHints !== 'undefined') {
      SmartHints.cacheQuestion(q);
    }

    const qNum = this._currentQuestion + 1;

    area.innerHTML = `
      <div class="quiz-question" style="animation: fadeInUp 0.3s ease;">
        <div class="quiz-question-header">
          <span class="badge badge-pink">Question ${qNum}/${this._totalQuestions}</span>
          <span class="badge badge-green">${q.difficulty || 'medium'}</span>
        </div>
        <p class="quiz-question-text">${q.question}</p>
        <div class="quiz-options" id="quiz-options">
          ${(q.options || []).map((opt, i) =>
            `<button class="quiz-option" onclick="QuizGame._selectAnswer(this, ${i}, ${q.correctIndex})">
              <span class="option-letter">${'ABCD'[i]}</span>
              <span>${opt}</span>
            </button>`
          ).join('')}
        </div>
        ${typeof SmartHints !== 'undefined' ? SmartHints.renderHintButton(q, 'quiz-' + this._currentQuestion) : ''}
        <div id="quiz-feedback" class="quiz-feedback" style="display: none;"></div>
      </div>
    `;

    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
      dot.className = 'progress-dot' +
        (i < this._currentQuestion ? ' completed' : '') +
        (i === this._currentQuestion ? ' active' : '');
    });
  },

  _selectAnswer(btn, selected, correct) {
    if (!this._isPlaying) return;
    this._isPlaying = false;

    const options = document.querySelectorAll('.quiz-option');
    const feedback = document.getElementById('quiz-feedback');
    const q = this._questions[this._currentQuestion];

    options.forEach(o => o.classList.add('disabled'));
    btn.classList.add(selected === correct ? 'correct' : 'incorrect');

    if (selected !== correct) {
      options[correct].classList.add('correct');
    }

    if (selected === correct) {
      this._score++;
      document.getElementById('score-display').textContent = this._score;
      AudioManager.play('correct');
      feedback.innerHTML = `<div class="callout callout-success">✅ Correct! ${q.explanation || ''}</div>`;
    } else {
      AudioManager.play('incorrect');
      feedback.innerHTML = `<div class="callout callout-error">❌ Oops! The correct answer was: <strong>${q.options[correct]}</strong><br>${q.explanation || ''}</div>`;
    }

    feedback.style.display = 'block';

    // Trace answer to memory
    if (typeof MemoryEngine !== 'undefined') {
      MemoryEngine.trace('quiz', 'answered', {
        questionId: q.id || ('q_' + this._currentQuestion),
        correct: selected === correct,
        subject: q.subject || this._subject,
        difficulty: q.difficulty || this._difficulty
      });
    }

    this._currentQuestion++;

    if (this._currentQuestion >= this._totalQuestions) {
      setTimeout(() => this._endGame(), 1500);
    } else {
      setTimeout(() => {
        this._isPlaying = true;
        this._renderQuestion();
      }, 1500);
    }
  },

  _startTimer(seconds) {
    if (typeof GameTimer !== 'undefined') {
      GameTimer.start(seconds, (timeLeft) => {
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
          timerEl.textContent = timeLeft + 's';
          if (timeLeft <= 10) timerEl.style.color = 'var(--color-error)';
        }
      }, () => {
        // Time's up - force end
        if (this._isPlaying) {
          this._isPlaying = false;
          Toast.show('⏰ Time\'s up!', 'error');
          this._endGame();
        }
      });
    }
  },

  _endGame() {
    if (typeof GameTimer !== 'undefined') {
      GameTimer.stop();
    }

    const container = document.querySelector('.game-container');
    if (!container) return;

    const total = this._totalQuestions;
    const correct = this._score;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Update game stats
    GameState.addGameStats('quiz', correct, total);
    GameState.set('partner.currentMood', pct >= 70 ? 'celebrating' : pct >= 40 ? 'encouraging' : 'sad');

    // Update adaptive mastery
    if (typeof AdaptiveEngine !== 'undefined' && this._subject) {
      // Update relevant topic masteries
      const subjectTopics = Object.entries(AdaptiveEngine.TOPICS)
        .filter(([_, t]) => t.subject === this._subject);
      subjectTopics.forEach(([topicId]) => {
        AdaptiveEngine.updateMastery(topicId, correct, total);
      });
    }

    // Calculate rewards
    let rewardCredits = 0;
    let rewardXp = 0;
    if (typeof CreditEngine !== 'undefined') {
      const reward = CreditEngine.awardGameReward('quiz', correct, total);
      rewardCredits = reward.credits || 0;
      rewardXp = reward.xp || 0;
    } else {
      rewardCredits = Math.floor(correct * 1.5);
      rewardXp = correct * 10;
      GameState.addCredits(rewardCredits);
      GameState.addXp(rewardXp);
    }

    AchievementEngine.check();

    container.innerHTML = `
      <div class="game-card" style="text-align: center; animation: fadeInUp 0.5s ease;">
        <div style="font-size: 4rem; margin-bottom: var(--space-md);">
          ${pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '💪'}
        </div>
        <h2 style="margin-bottom: var(--space-md);">${pct >= 90 ? 'Perfect!' : pct >= 70 ? 'Great Job!' : pct >= 50 ? 'Good Try!' : 'Keep Practicing!'}</h2>

        <div class="game-results">
          <div class="result-item">
            <span class="result-label">Correct</span>
            <span class="result-value" style="color: var(--color-success);">${correct}/${total}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Accuracy</span>
            <span class="result-value">${pct}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">Reward</span>
            <span class="result-value">⭐ ${rewardCredits} · ✨ ${rewardXp} XP</span>
          </div>
        </div>

        <div style="margin-top: var(--space-lg); display: flex; gap: var(--space-sm); justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary btn-lg" onclick="QuizGame._startGame()">🔄 Play Again</button>
          <button class="btn btn-ghost" onclick="Router.navigate('/games')">🎮 All Games</button>
        </div>
      </div>
    `;
  },

  _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};
