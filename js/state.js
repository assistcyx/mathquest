const GameState = {
  _data: null,
  _listeners: {},
  _saveTimer: null,
  STORAGE_KEY: 'mathquest_save',
  VERSION: 2,

  _defaults() {
    return {
      version: this.VERSION,
      player: {
        name: '',
        credits: 0,
        xp: 0,
        level: 1
      },
      progress: {
        calculus: { completed: [], quizScores: {} },
        python: { completed: [], challengeScores: {} },
        algebra: { completed: [], quizScores: {} }
      },
      partner: {
        outfit: 'default',
        accessory: 'none',
        background: 'classroom',
        currentMood: 'idle',
        affection: 0
      },
      achievements: {
        unlocked: [],
        seen: []
      },
      settings: {
        soundEnabled: true,
        musicEnabled: false,
        aiApiKey: '',
        aiTutorEnabled: false,
        adaptiveLearning: true
      },
      gameStats: {
        quizzesPlayed: 0,
        challengesSolved: 0,
        matchesCompleted: 0,
        speedMathPlayed: 0,
        wordProblemsPlayed: 0,
        bossBattlesFought: 0,
        bossBattlesWon: 0,
        totalCorrect: 0,
        totalGames: 0,
        totalHintsUsed: 0
      },
      mastery: {},
      _aiQuestionsAsked: 0
    };
  },

  init() {
    this._load();
    this._checkDailyBonus();
    this._emit('ready');
  },

  _load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version === this.VERSION) {
          this._data = this._mergeDefaults(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load save data, starting fresh');
    }
    this._data = this._defaults();
    this._save();
  },

  _mergeDefaults(saved) {
    const defaults = this._defaults();
    const deepMerge = (target, source) => {
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else if (target[key] === undefined) {
          target[key] = source[key];
        }
      }
      return target;
    };
    return deepMerge(saved, defaults);
  },

  _save() {
    if (this._saveTimer) cancelAnimationFrame(this._saveTimer);
    this._saveTimer = requestAnimationFrame(() => {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
      } catch (e) {
        console.warn('Failed to save data');
      }
    });
  },

  _checkDailyBonus() {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = this._data.lastLogin;
    if (lastLogin !== today) {
      if (lastLogin) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (lastLogin === yesterdayStr) {
          this._data.streak = (this._data.streak || 0) + 1;
        } else {
          this._data.streak = 1;
        }
        this.addCredits(15);
        this.addXp(30);
        Toast.show(`Daily login bonus! +15 credits`, 'success');
        if (this._data.streak >= 3) {
          this.addCredits(10);
          this.addXp(20);
          Toast.show(`Streak bonus (${this._data.streak} days)! +10 extra credits`, 'success');
        }
      } else {
        this._data.streak = 1;
        this.addCredits(15);
        this.addXp(30);
        Toast.show('Welcome back! Daily bonus +15 credits!', 'success');
      }
      this._data.lastLogin = today;
      this._save();
      this._emit('dailyBonus');
    }
  },

  get(path) {
    const parts = path.split('.');
    let current = this._data;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  },

  set(path, value) {
    const parts = path.split('.');
    let current = this._data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined) current[parts[i]] = {};
      current = current[parts[i]];
    }
    const key = parts[parts.length - 1];
    const oldValue = current[key];
    if (oldValue !== value) {
      current[key] = value;
      this._save();
      this._emit(`change:${path}`, value, oldValue);
    }
  },

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => {
      this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    };
  },

  _emit(event, ...args) {
    (this._listeners[event] || []).forEach(fn => {
      try { fn(...args); } catch (e) { console.warn('Listener error:', e); }
    });
    // Also emit wildcard
    (this._listeners['*'] || []).forEach(fn => {
      try { fn(event, ...args); } catch (e) { console.warn('Listener error:', e); }
    });
  },

  // Convenience methods
  addCredits(amount) {
    const current = this.get('player.credits');
    this.set('player.credits', current + amount);
    this._emit('credits:added', amount);
  },

  addXp(amount) {
    const current = this.get('player.xp');
    const newXp = current + amount;
    this.set('player.xp', newXp);
    this._checkLevelUp();
    this._emit('xp:added', amount);
  },

  _checkLevelUp() {
    const level = this.get('player.level');
    const xp = this.get('player.xp');
    const nextLevelXp = this.xpForLevel(level + 1);

    if (xp >= nextLevelXp) {
      this.set('player.level', level + 1);
      this.set('partner.currentMood', 'celebrating');
      AudioManager.play('levelup');
      Toast.show(`🎉 Level up! You're now level ${level + 1}!`, 'achievement');
      this._emit('levelUp', level + 1);
      // Check again for multiple level ups
      this._checkLevelUp();
    }
  },

  xpForLevel(n) {
    return 50 * n * (n - 1);
  },

  xpProgress() {
    const level = this.get('player.level');
    const xp = this.get('player.xp');
    const currentLevelXp = this.xpForLevel(level);
    const nextLevelXp = this.xpForLevel(level + 1);
    const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    return Math.min(Math.max(progress, 0), 1);
  },

  hasCompletedLesson(subject, lessonId) {
    const completed = this.get(`progress.${subject}.completed`) || [];
    return completed.includes(lessonId);
  },

  completeLesson(subject, lessonId) {
    const completed = this.get(`progress.${subject}.completed`) || [];
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      this.set(`progress.${subject}.completed`, completed);
      this.addCredits(10);
      this.addXp(50);
      this.set('partner.currentMood', 'happy');
      AudioManager.play('success');
      AchievementEngine.check();
      return true;
    }
    return false;
  },

  addQuizScore(subject, quizId, score) {
    const scores = this.get(`progress.${subject}.quizScores`) || {};
    if (!scores[quizId] || score > scores[quizId]) {
      scores[quizId] = score;
      this.set(`progress.${subject}.quizScores`, scores);
    }
  },

  addGameStats(type, correct, total, won) {
    const stats = this.get('gameStats');
    stats.totalGames = (stats.totalGames || 0) + 1;
    stats.totalCorrect = (stats.totalCorrect || 0) + correct;
    if (type === 'quiz') stats.quizzesPlayed = (stats.quizzesPlayed || 0) + 1;
    if (type === 'challenge') stats.challengesSolved = (stats.challengesSolved || 0) + 1;
    if (type === 'match') stats.matchesCompleted = (stats.matchesCompleted || 0) + 1;
    if (type === 'speedmath') stats.speedMathPlayed = (stats.speedMathPlayed || 0) + 1;
    if (type === 'wordproblems') stats.wordProblemsPlayed = (stats.wordProblemsPlayed || 0) + 1;
    if (type === 'bossbattle') {
      stats.bossBattlesFought = (stats.bossBattlesFought || 0) + 1;
      if (won) stats.bossBattlesWon = (stats.bossBattlesWon || 0) + 1;
    }
    this.set('gameStats', stats);
  },

  purchaseItem(itemId, cost) {
    const credits = this.get('player.credits');
    if (credits < cost) return false;
    const owned = this.get('player.ownedItems') || [];
    if (owned.includes(itemId)) return false;
    this.set('player.credits', credits - cost);
    owned.push(itemId);
    this.set('player.ownedItems', owned);
    this._save();
    AudioManager.play('purchase');
    AchievementEngine.check();
    return true;
  },

  hasItem(itemId) {
    const owned = this.get('player.ownedItems') || [];
    return owned.includes(itemId);
  },

  equipItem(type, itemId) {
    const equipped = this.get('partner') || {};
    equipped[type] = itemId;
    this.set(`partner.${type}`, itemId);
    this._save();
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._data = this._defaults();
    this._save();
    window.location.hash = '#/';
    window.location.reload();
  }
};
