const MatchingGame = {
  _pairs: [],
  _cards: [],
  _selected: null,
  _matched: 0,
  _attempts: 0,
  _timeLimit: 90,
  _isPlaying: false,
  _timerStarted: false,
  _lockSelection: false,

  async render(container) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    try {
      const config = await fetch('data/games-config.json').then(r => r.json());
      this._pairs = config.matching?.sets?.[0]?.pairs || [];
    } catch (e) {
      this._pairs = this._getDefaultPairs();
    }

    this._matched = 0;
    this._attempts = 0;
    this._isPlaying = false;
    this._timerStarted = false;

    this._renderStart(container);
  },

  _getDefaultPairs() {
    return [
      { term: 'Derivative', definition: 'Rate of change of a function' },
      { term: 'Integral', definition: 'Area under a curve' },
      { term: 'Limit', definition: 'Value a function approaches' },
      { term: 'Variable', definition: 'A symbol that represents a value' },
      { term: 'Function', definition: 'Maps inputs to outputs' },
      { term: 'Algorithm', definition: 'Step-by-step procedure' },
      { term: 'Loop', definition: 'Repeats a block of code' },
      { term: 'Conditional', definition: 'Executes code based on a condition' }
    ];
  },

  _renderStart(container) {
    container.innerHTML = `
      <div class="game-container animate-fade-in" style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">🔗</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm);">Matching Game</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-xl);">
          Match terms to their definitions!<br>
          Earn 12 credits per game completed.
        </p>

        <div style="margin-bottom: var(--space-xl);">
          <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Pairs</p>
          <div class="difficulty-select">
            <button class="difficulty-btn" data-pairs="4" onclick="MatchingGame._setPairs(this, 4)">4 pairs</button>
            <button class="difficulty-btn selected" data-pairs="6" onclick="MatchingGame._setPairs(this, 6)">6 pairs</button>
            <button class="difficulty-btn" data-pairs="8" onclick="MatchingGame._setPairs(this, 8)">8 pairs</button>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" onclick="MatchingGame._startGame()">🚀 Start Game!</button>
      </div>
    `;
  },

  _setPairs(btn, count) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const pairsToUse = Math.min(count, this._pairs.length);
    const timeSettings = { 4: 45, 6: 60, 8: 90 };
    this._timeLimit = timeSettings[pairsToUse] || 90;
  },

  _startGame() {
    this._isPlaying = true;
    this._matched = 0;
    this._attempts = 0;
    this._selected = null;
    this._timerStarted = false;
    this._lockSelection = false;

    const selectedBtn = document.querySelector('.difficulty-btn.selected');
    const pairCount = parseInt(selectedBtn?.dataset?.pairs || '6');
    const shuffledPairs = [...this._pairs].sort(() => Math.random() - 0.5).slice(0, pairCount);

    // Create cards: terms and definitions
    this._cards = [];
    shuffledPairs.forEach((pair, i) => {
      this._cards.push({ id: `term-${i}`, pairId: i, type: 'term', text: pair.term, matched: false });
      this._cards.push({ id: `def-${i}`, pairId: i, type: 'definition', text: pair.definition, matched: false });
    });
    this._cards.sort(() => Math.random() - 0.5);

    this._renderGame(document.getElementById('app'));
  },

  _renderGame(container) {
    container.innerHTML = `
      <div class="game-container animate-fade-in">
        <div class="game-header">
          <div style="display: flex; gap: var(--space-md);">
            <div class="game-score">✅ ${this._matched}/${this._cards.length / 2}</div>
            <div class="game-score">🎯 ${this._attempts} tries</div>
          </div>
          <div id="match-timer"></div>
        </div>

        <div class="match-grid">
          ${this._cards.map((card, i) => `
            <div class="match-card ${card.type} ${card.matched ? 'matched' : ''}"
                 data-index="${i}"
                 onclick="${card.matched ? '' : "MatchingGame._selectCard(" + i + ")"}"
                 style="${card.matched ? 'cursor: default;' : ''}">
              ${card.matched ? '✅ ' + card.text : card.text}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (!this._timerStarted) {
      this._timerStarted = true;
      GameTimer.start(this._timeLimit, () => this._endGame(container), (remaining) => {
        const timerEl = document.getElementById('match-timer');
        if (timerEl) timerEl.innerHTML = GameTimer.renderBar(remaining, this._timeLimit);
      });
    }
  },

  _selectCard(index) {
    if (this._lockSelection) return;
    const card = this._cards[index];
    if (card.matched) return;

    const cardEl = document.querySelector(`.match-card[data-index="${index}"]`);
    if (!cardEl) return;

    if (!this._selected) {
      this._selected = { index, card, el: cardEl };
      cardEl.classList.add('selected');
      AudioManager.play('tick');
      return;
    }

    // Second selection
    if (this._selected.index === index) return;
    const first = this._selected;
    this._selected = null;
    this._attempts++;
    this._lockSelection = true;

    cardEl.classList.add('selected');

    if (first.card.pairId === card.pairId && first.card.type !== card.type) {
      // Match!
      setTimeout(() => {
        first.card.matched = true;
        card.matched = true;
        first.el.classList.remove('selected');
        cardEl.classList.remove('selected');
        first.el.classList.add('matched');
        cardEl.classList.add('matched');
        this._matched++;
        this._lockSelection = false;
        AudioManager.play('correct');

        // Update match count
        const scoreEl = document.querySelector('.game-score');
        if (scoreEl) {
          scoreEl.textContent = `✅ ${this._matched}/${this._cards.length / 2}`;
        }

        if (this._matched >= this._cards.length / 2) {
          this._endGame(document.getElementById('app'));
        }
      }, 300);
    } else {
      // No match
      cardEl.classList.add('wrong');
      first.el.classList.add('wrong');
      AudioManager.play('incorrect');

      setTimeout(() => {
        cardEl.classList.remove('selected', 'wrong');
        first.el.classList.remove('selected', 'wrong');
        this._lockSelection = false;
      }, 600);
    }
  },

  _endGame(container) {
    GameTimer.stop();

    // Calculate score
    const totalPairs = this._cards.length / 2;
    const accuracy = this._attempts > 0 ? (totalPairs / this._attempts) * 100 : 100;
    const bonus = accuracy >= 100 ? 1.5 : accuracy >= 70 ? 1.2 : 1;
    const baseCredits = Math.round(12 * bonus);
    const baseXp = Math.round(40 * bonus);

    GameState.addCredits(baseCredits);
    GameState.addXp(baseXp);
    GameState.addGameStats('match', totalPairs, totalPairs);

    GameState.set('partner.currentMood', this._matched === this._cards.length / 2 ? 'celebrating' : 'happy');

    container.innerHTML = `
      <div class="game-container animate-bounce-in">
        <div class="game-results">
          🧩
          <div class="score-big">${this._matched}/${totalPairs}</div>
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
            ${this._matched === totalPairs ? 'All matched! Amazing memory!' : 'Good effort!'}
          </p>

          <div class="result-stats">
            <div class="result-stat">
              <div class="value">${this._attempts}</div>
              <div class="label">Attempts</div>
            </div>
            <div class="result-stat">
              <div class="value">+${baseCredits}</div>
              <div class="label">Credits</div>
            </div>
            <div class="result-stat">
              <div class="value">+${baseXp}</div>
              <div class="label">XP</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); justify-content: center;">
            <button class="btn btn-primary" onclick="MatchingGame._startGame()">🔄 Play Again</button>
            <button class="btn btn-ghost" onclick="Router.navigate('/games')">← Back to Games</button>
          </div>
        </div>
      </div>
    `;

    AchievementEngine.check();
  }
};
