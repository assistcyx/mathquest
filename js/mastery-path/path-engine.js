const PathEngine = {
  _paths: null,

  /**
   * Load mastery paths from JSON, with hardcoded fallback.
   */
  async load() {
    if (this._paths) return;
    try {
      var res = await fetch('data/mastery-paths.json');
      this._paths = await res.json();
    } catch (e) {
      console.warn('PathEngine: failed to load mastery-paths.json, using defaults');
      this._paths = this._getDefaultPaths();
    }
  },

  _getDefaultPaths() {
    return [
      {
        id: 'calculus_fundamentals', title: 'Calculus Fundamentals', subject: 'calculus',
        icon: '∫', description: 'Master the core concepts of calculus',
        gates: [
          { id: 'limits_gate', title: 'Limits', topicId: 'limits', prerequisites: [], requiredMastery: 0.5 },
          { id: 'derivatives_gate', title: 'Derivatives', topicId: 'derivatives', prerequisites: ['limits_gate'], requiredMastery: 0.6 },
          { id: 'integration_gate', title: 'Integration', topicId: 'basic-integration', prerequisites: ['derivatives_gate'], requiredMastery: 0.5 }
        ]
      },
      {
        id: 'python_fundamentals', title: 'Python Fundamentals', subject: 'python',
        icon: '🐍', description: 'Learn Python programming',
        gates: [
          { id: 'py_vars', title: 'Variables', topicId: 'variables', prerequisites: [], requiredMastery: 0.5 },
          { id: 'py_lists', title: 'Lists & Loops', topicId: 'lists-loops', prerequisites: ['py_vars'], requiredMastery: 0.5 },
          { id: 'py_funcs', title: 'Functions', topicId: 'functions', prerequisites: ['py_vars', 'py_lists'], requiredMastery: 0.5 }
        ]
      }
    ];
  },

  /**
   * Get a path by ID.
   */
  getPath(pathId) {
    if (!this._paths) return null;
    for (var i = 0; i < this._paths.length; i++) {
      if (this._paths[i].id === pathId) return this._paths[i];
    }
    return null;
  },

  /**
   * Get all paths.
   */
  getAllPaths() {
    return this._paths || [];
  },

  /**
   * Get progress for each gate in a path.
   * @param {string} pathId
   * @returns {array|null} gates with mastery, isUnlocked, isCompleted
   */
  getPathProgress(pathId) {
    var path = this.getPath(pathId);
    if (!path) return null;

    var self = this;
    return path.gates.map(function(gate) {
      var mastery = typeof AdaptiveEngine !== 'undefined'
        ? AdaptiveEngine.getMastery(gate.topicId) : 0;

      var prereqsMet = gate.prerequisites.every(function(preReqId) {
        var preReqGate = self._findGateInPath(path, preReqId);
        if (!preReqGate) return true;
        var preReqMastery = typeof AdaptiveEngine !== 'undefined'
          ? AdaptiveEngine.getMastery(preReqGate.topicId) : 0;
        return preReqMastery >= (preReqGate.requiredMastery || 0.5);
      });

      var isUnlocked = prereqsMet;
      var required = gate.requiredMastery || 0.5;
      var isCompleted = mastery >= required;
      var progress = required > 0 ? Math.min(mastery / required, 1) : 0;

      return {
        id: gate.id,
        title: gate.title,
        topicId: gate.topicId,
        prerequisites: gate.prerequisites,
        requiredMastery: required,
        mastery: mastery,
        isUnlocked: isUnlocked,
        isCompleted: isCompleted,
        progress: Math.round(progress * 100) / 100,
        lessons: gate.lessons || []
      };
    });
  },

  _findGateInPath(path, gateId) {
    if (!path || !path.gates) return null;
    for (var i = 0; i < path.gates.length; i++) {
      if (path.gates[i].id === gateId) return path.gates[i];
    }
    return null;
  },

  /**
   * Get the next recommended gate across all paths.
   * @returns {object|null} { path, gate }
   */
  getNextRecommended() {
    var paths = this._paths || [];
    for (var p = 0; p < paths.length; p++) {
      var gates = this.getPathProgress(paths[p].id);
      if (!gates) continue;
      for (var g = 0; g < gates.length; g++) {
        if (gates[g].isUnlocked && !gates[g].isCompleted) {
          return { path: paths[p], gate: gates[g] };
        }
      }
    }
    return null;
  },

  /**
   * Get overall progress for a path (percentage of gates completed).
   */
  getPathCompletion(pathId) {
    var gates = this.getPathProgress(pathId);
    if (!gates || gates.length === 0) return 0;
    var completed = 0;
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].isCompleted) completed++;
    }
    return Math.round((completed / gates.length) * 100);
  }
};
