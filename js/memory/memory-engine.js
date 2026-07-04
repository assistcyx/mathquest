const MemoryEngine = {
  STORAGE_KEY: 'mathquest_memory',
  MAX_EVENTS: 500,
  MAX_SYNTHESES: 20,

  _data: null,

  // ========== INIT ==========

  init() {
    this._load();
  },

  _load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this._events = parsed.events || [];
        this._facts = parsed.facts || {};
        this._syntheses = parsed.syntheses || [];
        return;
      }
    } catch (e) {
      console.warn('MemoryEngine: failed to load, starting fresh');
    }
    this._events = [];
    this._facts = {};
    this._syntheses = [];
    this._save();
  },

  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        events: this._events,
        facts: this._facts,
        syntheses: this._syntheses
      }));
    } catch (e) {
      console.warn('MemoryEngine: failed to save');
    }
  },

  reset() {
    this._events = [];
    this._facts = {};
    this._syntheses = [];
    this._save();
  },

  // ========== L1: EVENT TRACES ==========

  /**
   * Record an L1 event trace.
   * @param {string} category - 'lesson', 'quiz', 'hint', 'ai_chat', 'game', 'knowledge', 'research'
   * @param {string} action - 'completed', 'answered', 'used', 'asked', 'started', etc.
   * @param {object} details - contextual data (subject, lessonId, questionId, etc.)
   * @returns {string} event id
   */
  trace(category, action, details) {
    const event = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      category: category,
      action: action,
      details: details || {}
    };
    this._events.push(event);

    // Cap at MAX_EVENTS
    if (this._events.length > this.MAX_EVENTS) {
      this._events = this._events.slice(-this.MAX_EVENTS);
    }

    this._save();
    return event.id;
  },

  /**
   * Get events with optional filtering.
   * @param {string} [category] - filter by category
   * @param {object} [options] - { limit, since (ISO string) }
   * @returns {array}
   */
  getEvents(category, options) {
    let events = this._events;
    if (category) {
      events = events.filter(function(e) { return e.category === category; });
    }
    if (options && options.since) {
      var since = new Date(options.since);
      events = events.filter(function(e) { return new Date(e.timestamp) > since; });
    }
    if (options && options.limit) {
      events = events.slice(-options.limit);
    }
    return events;
  },

  // ========== L2: CURATED FACTS ==========

  /**
   * Store a fact with confidence scoring (weighted moving average).
   * @param {string} key - e.g. 'mastery.derivatives', 'struggle.chain-rule'
   * @param {*} value - the fact value
   * @param {number} confidence - 0.0 to 1.0
   * @param {string} [source] - L1 event id that supports this fact
   */
  rememberFact(key, value, confidence, source) {
    if (confidence === undefined) confidence = 0.5;
    var existing = this._facts[key];
    var newConfidence = existing
      ? (existing.confidence * 0.7 + confidence * 0.3)
      : confidence;

    var history = existing ? (existing.history || []).concat([existing.value]) : [];

    this._facts[key] = {
      value: value,
      confidence: Math.round(newConfidence * 100) / 100,
      updatedAt: new Date().toISOString(),
      source: source || (this._events.length > 0 ? this._events[this._events.length - 1].id : null),
      history: history.slice(-10) // keep last 10 values
    };
    this._save();
  },

  /**
   * Recall a specific fact by key.
   * @param {string} key
   * @returns {object|null} fact object or null
   */
  recall(key) {
    return this._facts[key] || null;
  },

  /**
   * Get all facts whose key starts with a prefix.
   * @param {string} prefix - e.g. 'mastery', 'struggle'
   * @returns {array}
   */
  recallByPrefix(prefix) {
    var results = [];
    for (var key in this._facts) {
      if (this._facts.hasOwnProperty(key) && key.indexOf(prefix) === 0) {
        results.push({ key: key, fact: this._facts[key] });
      }
    }
    return results;
  },

  /**
   * Build a human-readable context string for AI system prompts.
   * @returns {string}
   */
  buildMemoryContext() {
    var parts = [];

    // Known mastered topics
    var mastered = [];
    for (var key in this._facts) {
      if (!this._facts.hasOwnProperty(key)) continue;
      if (key.indexOf('mastery.') === 0 && this._facts[key].confidence > 0.5) {
        var topicName = key.replace('mastery.', '');
        var pct = Math.round((this._facts[key].value || 0) * 100);
        mastered.push(topicName + ': ' + pct + '%');
      }
    }
    if (mastered.length > 0) {
      parts.push('Known topics: ' + mastered.join(', '));
    }

    // Struggles
    var struggles = [];
    for (var key2 in this._facts) {
      if (!this._facts.hasOwnProperty(key2)) continue;
      if (key2.indexOf('struggle.') === 0 && this._facts[key2].confidence > 0.3) {
        struggles.push(this._facts[key2].value);
      }
    }
    if (struggles.length > 0) {
      parts.push('Struggling with: ' + struggles.join('; '));
    }

    // Recent activity (last 3 events)
    var recent = this._events.slice(-3).map(function(e) {
      var time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return e.category + ':' + e.action + ' at ' + time;
    });
    if (recent.length > 0) {
      parts.push('Recent activity: ' + recent.join(' | '));
    }

    if (parts.length === 0) return '';
    return '\n\n[Learning Memory]\n' + parts.join('\n');
  },

  // ========== L3: SYNTHESIS ==========

  /**
   * Store an AI-generated synthesis (L3).
   * @param {string} type - 'study_plan', 'weakness_analysis', 'recommendation', 'research_report'
   * @param {string} content - the synthesis text
   * @param {array} [sourceEvents] - L1 event IDs that informed this synthesis
   */
  storeSynthesis(type, content, sourceEvents) {
    this._syntheses.push({
      id: 'syn_' + Date.now(),
      type: type,
      content: content,
      sourceEvents: sourceEvents || [],
      createdAt: new Date().toISOString()
    });

    // Cap at MAX_SYNTHESES
    if (this._syntheses.length > this.MAX_SYNTHESES) {
      this._syntheses = this._syntheses.slice(-this.MAX_SYNTHESES);
    }

    this._save();
  },

  /**
   * Get all syntheses, optionally filtered by type.
   */
  getSyntheses(type) {
    if (type) {
      return this._syntheses.filter(function(s) { return s.type === type; });
    }
    return this._syntheses;
  },

  // ========== TRACE EXPLORER ==========

  /**
   * Given a fact key, trace its evidence chain back to source L1 events.
   * @param {string} claimKey - fact key to investigate
   * @returns {object|null} { fact, sourceEvent, chain }
   */
  traceClaim(claimKey) {
    var fact = this._facts[claimKey];
    if (!fact) return null;

    var sourceEvent = null;
    if (fact.source) {
      for (var i = 0; i < this._events.length; i++) {
        if (this._events[i].id === fact.source) {
          sourceEvent = this._events[i];
          break;
        }
      }
    }

    // Build chain: follow history back through previous values' sources
    var chain = [];
    if (fact.history && fact.history.length > 0) {
      chain.push({ value: fact.history[fact.history.length - 1], note: 'previous value' });
    }

    return {
      fact: fact,
      sourceEvent: sourceEvent,
      chain: chain
    };
  },

  // ========== INSPECT ==========

  /**
   * Return the full memory state for the inspector UI.
   * @returns {object}
   */
  inspect() {
    return {
      events: this._events,
      facts: this._facts,
      syntheses: this._syntheses,
      stats: {
        totalEvents: this._events.length,
        totalFacts: Object.keys(this._facts).length,
        totalSyntheses: this._syntheses.length,
        lastEvent: this._events.length > 0 ? this._events[this._events.length - 1] : null
      }
    };
  }
};
