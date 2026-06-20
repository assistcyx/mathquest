const ProgressBar = {
  render(options = {}) {
    const { value = 0, max = 1, label = '', showPercent = true, variant = '' } = options;
    const percent = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

    return `
      <div class="progress-bar ${variant ? 'progress-bar-' + variant : ''}">
        <div class="progress-bar-fill" style="width: ${percent}%"></div>
      </div>
      ${showPercent ? `<div class="xp-numbers">${Math.round(percent)}%</div>` : ''}
    `;
  },

  renderXP() {
    const level = GameState.get('player.level') || 1;
    const xp = GameState.get('player.xp') || 0;
    const currentLevelXp = GameState.xpForLevel(level);
    const nextLevelXp = GameState.xpForLevel(level + 1);
    const progress = nextLevelXp > currentLevelXp
      ? (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)
      : 0;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);

    return `
      <div class="xp-display">
        <div class="xp-bar-container">
          ${this.render({ value: xp - currentLevelXp, max: nextLevelXp - currentLevelXp, showPercent: false })}
        </div>
        <div class="xp-numbers">${xp} / ${nextLevelXp} XP</div>
      </div>
    `;
  }
};
