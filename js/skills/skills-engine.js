const SkillsEngine = {
  _skills: null,

  /**
   * Load skills from JSON or use defaults.
   */
  async load() {
    if (this._skills) return;
    try {
      var res = await fetch('data/skills/index.json');
      this._skills = await res.json();
    } catch (e) {
      console.warn('SkillsEngine: failed to load, using defaults');
      this._skills = this._getDefaultSkills();
    }
  },

  _getDefaultSkills() {
    return [
      { id: 'explain_simple', title: 'Explain Like I\'m 5', description: 'Simplified explanations', prompt: 'Explain using simple language and everyday analogies.', icon: '🧒' },
      { id: 'deep_dive', title: 'Deep Dive', description: 'Rigorous technical depth', prompt: 'Provide thorough, detailed explanations with derivations.', icon: '🔬' },
      { id: 'exam_prep', title: 'Exam Prep Mode', description: 'Test-focused review', prompt: 'Focus on exam-relevant content and common test questions.', icon: '📋' }
    ];
  },

  /**
   * Get all available skills.
   */
  getAll() {
    return this._skills || [];
  },

  /**
   * Get a skill by ID.
   */
  get(id) {
    if (!this._skills) return null;
    for (var i = 0; i < this._skills.length; i++) {
      if (this._skills[i].id === id) return this._skills[i];
    }
    return null;
  },

  /**
   * Apply a skill's prompt to a base system prompt.
   * @param {string} basePrompt
   * @param {string} skillId
   * @returns {string}
   */
  applyToSystemPrompt(basePrompt, skillId) {
    if (!skillId) return basePrompt;
    var skill = this.get(skillId);
    if (!skill) return basePrompt;
    return basePrompt + '\n\n---\n[Teaching Style: ' + skill.title + ']\n' + skill.prompt;
  }
};
