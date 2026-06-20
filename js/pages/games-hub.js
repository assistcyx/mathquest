const GamesHub = {
  render(container) {
    const level = GameState.get('player.level') || 1;

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🎮 Games</h1>
          <p>Test your knowledge and earn credits!</p>
        </div>

        <div class="games-grid stagger">
          ${this._gameCard('🧮', 'Calculus Quiz', 'Timed multiple-choice calculus questions', 'quiz', 1)}
          ${this._gameCard('💻', 'Python Challenge', 'Fill in the code blanks', 'code', 2)}
          ${this._gameCard('🔗', 'Matching Game', 'Match terms to definitions', 'match', 1)}
        </div>
      </div>
    `;
  },

  _gameCard(icon, title, desc, type, minLevel) {
    const level = GameState.get('player.level') || 1;
    const isLocked = level < minLevel;
    const highScore = GameState.get(`gameStats.${type}HighScore`) || 0;

    return `
      <div class="game-card ${isLocked ? 'locked' : ''}" onclick="${isLocked ? '' : `Router.navigate('/games/${type}')`}">
        <div class="game-card-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${desc}</p>
        ${highScore > 0 ? `<div class="high-score">🏆 Best: ${highScore}</div>` : `<div class="high-score">Play to earn credits!</div>`}
        ${isLocked ? `<div style="margin-top: var(--space-sm); font-size: var(--text-xs); color: var(--color-text-muted);">🔒 Unlocks at level ${minLevel}</div>` : ''}
      </div>
    `;
  }
};
