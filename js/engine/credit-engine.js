const CreditEngine = {
  RATES: {
    lesson: { credits: 10, xp: 50 },
    quizCorrect: { credits: 5, xp: 20 },
    challengeSolve: { credits: 8, xp: 30 },
    matchComplete: { credits: 12, xp: 40 },
    achievement: { credits: 20, xp: 50 },
    dailyLogin: { credits: 15, xp: 30 },
    streakBonus: { credits: 10, xp: 20 }
  },

  awardCredits(amount, reason) {
    GameState.addCredits(amount);
    GameState.addXp(amount * 2);
  },

  awardGameReward(type, score, total) {
    const rate = this.RATES[type];
    if (!rate) return;

    const correctFraction = score / total;
    const creditsEarned = Math.round(rate.credits * correctFraction);
    const xpEarned = Math.round(rate.xp * correctFraction);

    // Daily bonus check
    const today = new Date().toISOString().split('T')[0];
    const lastGameBonus = GameState.get('_lastGameBonus');
    const isDailyBonus = lastGameBonus !== today;
    if (isDailyBonus) {
      GameState.set('_lastGameBonus', today);
    }

    const finalCredits = isDailyBonus ? creditsEarned * 2 : creditsEarned;
    const finalXp = isDailyBonus ? xpEarned * 2 : xpEarned;

    GameState.addCredits(finalCredits);
    GameState.addXp(finalXp);
    GameState.set('partner.currentMood', score === total ? 'celebrating' : 'happy');

    if (isDailyBonus) {
      Toast.show(`Double credits! (Daily first game bonus)`, 'success');
    }

    return { credits: finalCredits, xp: finalXp, isDailyBonus };
  }
};
