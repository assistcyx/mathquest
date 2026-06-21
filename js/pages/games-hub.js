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
          ${this._gameCard('⚡', 'Speed Math', 'Rapid-fire arithmetic challenge', 'speedmath', 1)}
          ${this._gameCard('📝', 'Word Problems', 'Solve real-world math problems', 'wordproblems', 2)}
          ${this._gameCard('🐉', 'Boss Battle', 'Face the ultimate 3-phase challenge!', 'bossbattle', 3)}
        </div>
      </div>
    `;
  },

  _gameCard(icon, title, desc, type, minLevel) {
    const level = GameState.get('player.level') || 1;
    const isLocked = level < minLevel;

    // Get appropriate high score or stat
    let statText = 'Play to earn credits!';
    if (type === 'speedmath') {
      const played = GameState.get('gameStats.speedMathPlayed') || 0;
      if (played > 0) statText = `⚡ Played ${played} times`;
    } else if (type === 'wordproblems') {
      const played = GameState.get('gameStats.wordProblemsPlayed') || 0;
      if (played > 0) statText = `📝 Played ${played} times`;
    } else if (type === 'bossbattle') {
      const won = GameState.get('gameStats.bossBattlesWon') || 0;
      if (won > 0) statText = `🏆 ${won} wins`;
    } else {
      const highScore = GameState.get(`gameStats.${type}HighScore`) || 0;
      if (highScore > 0) statText = `🏆 Best: ${highScore}`;
    }

    return `
      <div class="game-card ${isLocked ? 'locked' : ''}" onclick="${isLocked ? '' : `Router.navigate('/games/${type}')`}">
        <div class="game-card-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="high-score">${statText}</div>
        ${isLocked ? `<div style="margin-top: var(--space-sm); font-size: var(--text-xs); color: var(--color-text-muted);">🔒 Unlocks at level ${minLevel}</div>` : ''}
      </div>
    `;
  }
};
