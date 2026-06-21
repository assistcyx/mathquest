const SmartHints = {
  // Get a progressive hint for a question
  // hintLevel: 0 = vague nudge, 1 = more specific, 2 = basically the answer
  getHint(question, hintLevel) {
    const hints = this._buildHintProgression(question);
    const level = Math.min(hintLevel, hints.length - 1);
    return hints[level] || hints[0];
  },

  _buildHintProgression(question) {
    const baseHint = question.hint || 'Think carefully about the concepts involved.';
    const subject = question.subject || '';

    let specificHint = '';
    if (subject === 'calculus') {
      specificHint = '📖 Try applying the appropriate calculus rule (power rule, chain rule, etc.) to the problem.';
    } else if (subject === 'python') {
      specificHint = '📖 Think about what Python function or method fits this situation.';
    } else {
      specificHint = '📖 Break the problem down step by step.';
    }

    let answerHint = '';
    if (question.options && question.correctIndex !== undefined) {
      const correctAnswer = question.options[question.correctIndex];
      answerHint = `✨ The correct answer is: ${correctAnswer}`;
    } else {
      answerHint = '✨ Review the lesson material for the answer.';
    }

    return [
      `💡 ${baseHint}`,
      specificHint,
      answerHint
    ];
  },

  // Track and return hint usage
  useHint(question) {
    const hintKey = question.id || 'unknown';
    const used = GameState.get(`_hintsUsed.${hintKey}`) || 0;
    const newCount = used + 1;
    GameState.set(`_hintsUsed.${hintKey}`, newCount);

    const totalHints = GameState.get('gameStats.totalHintsUsed') || 0;
    GameState.set('gameStats.totalHintsUsed', totalHints + 1);

    return this.getHint(question, newCount - 1);
  },

  // Render a hint button for a question
  renderHintButton(question, containerId) {
    const hintKey = question.id || 'unknown';
    const used = GameState.get(`_hintsUsed.${hintKey}`) || 0;

    return `
      <button class="btn btn-sm btn-ghost" onclick="SmartHints._showHint('${containerId}', '${hintKey}')" style="margin-top: var(--space-sm);">
        💡 ${used > 0 ? `Hint (${used}/3)` : 'Show Hint'}
      </button>
      <div id="hint-display-${containerId}" style="display: none; margin-top: var(--space-sm);"></div>
    `;
  },

  _showHint(containerId, hintKey) {
    const displayEl = document.getElementById(`hint-display-${containerId}`);
    if (!displayEl) return;

    // We need a way to get the question back. Since the hint system
    // is called from game contexts, we look for a global hint-questions cache
    const question = this._getQuestionForHint(hintKey);
    if (!question) {
      displayEl.innerHTML = '<div class="challenge-hint">💡 Think about the concepts you\'ve learned!</div>';
      displayEl.style.display = 'block';
      return;
    }

    const hint = this.useHint(question);
    displayEl.innerHTML = `<div class="challenge-hint">${hint}</div>`;
    displayEl.style.display = 'block';
  },

  // Cache for hint questions (populated by games)
  _hintQuestionCache: {},

  cacheQuestion(question) {
    if (question && question.id) {
      this._hintQuestionCache[question.id] = question;
    }
  },

  _getQuestionForHint(id) {
    return this._hintQuestionCache[id] || null;
  }
};
