const AchievementEngine = {
  _data: null,
  _loaded: false,

  async load() {
    try {
      const res = await fetch('data/achievements.json');
      this._data = await res.json();
      this._loaded = true;
    } catch (e) {
      console.warn('Failed to load achievements');
      this._data = [];
    }
  },

  async check() {
    if (!this._loaded) await this.load();
    const unlocked = GameState.get('achievements.unlocked') || [];

    for (const achievement of this._data) {
      if (unlocked.includes(achievement.id)) continue;
      if (this._checkCondition(achievement.condition)) {
        this._unlock(achievement);
      }
    }
  },

  _checkCondition(condition) {
    if (!condition) return false;

    switch (condition.type) {
      case 'lessons_completed': {
        const completed = GameState.get(`progress.${condition.subject}.completed`) || [];
        return completed.length >= condition.count;
      }
      case 'perfect_game': {
        return (GameState.get('gameStats.totalCorrect') || 0) >= condition.count * 10;
      }
      case 'items_purchased': {
        const owned = GameState.get('player.ownedItems') || [];
        return owned.length >= condition.count;
      }
      case 'xp_reached': {
        const xp = GameState.get('player.xp') || 0;
        return xp >= condition.count;
      }
      case 'level_reached': {
        const level = GameState.get('player.level') || 1;
        return level >= condition.count;
      }
      case 'games_played': {
        const games = GameState.get('gameStats.totalGames') || 0;
        return games >= condition.count;
      }
      case 'quiz_score': {
        const scores = GameState.get('progress.calculus.quizScores') || {};
        return Object.values(scores).some(s => s >= condition.score);
      }
      default:
        return false;
    }
  },

  _unlock(achievement) {
    const unlocked = GameState.get('achievements.unlocked') || [];
    unlocked.push(achievement.id);
    GameState.set('achievements.unlocked', unlocked);

    if (achievement.creditReward) GameState.addCredits(achievement.creditReward);
    if (achievement.xpReward) GameState.addXp(achievement.xpReward);

    GameState.set('partner.currentMood', 'celebrating');
    AudioManager.play('success');
    Toast.show(`🏆 Achievement unlocked: ${achievement.title}!`, 'achievement');
  }
};
