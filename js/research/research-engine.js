const ResearchEngine = {
  _history: null,

  /**
   * Load research history from localStorage.
   */
  init() {
    try {
      var saved = localStorage.getItem('mathquest_research');
      this._history = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this._history = [];
    }
  },

  _save() {
    try {
      localStorage.setItem('mathquest_research', JSON.stringify(this._history));
    } catch (e) {}
  },

  /**
   * Run a deep research query.
   * @param {string} topic - research topic
   * @param {string} depth - 'standard' or 'deep'
   * @param {function} onProgress - callback for progress updates
   * @returns {Promise<object>} research result
   */
  async research(topic, depth, onProgress) {
    var self = this;
    var startTime = Date.now();

    if (onProgress) onProgress('Generating research queries...');

    // Step 1: Generate search queries
    var queries;
    try {
      queries = await this._generateQueries(topic, depth);
    } catch (e) {
      queries = [topic];
    }

    if (onProgress) onProgress('Synthesizing research report...');

    // Step 2: Generate report
    var report;
    try {
      report = await this._generateReport(topic, queries, depth);
    } catch (e) {
      report = 'Research failed: ' + e.message;
    }

    var elapsed = Math.round((Date.now() - startTime) / 1000);

    // Step 3: Store in history and memory
    var result = {
      id: 'res_' + Date.now(),
      topic: topic,
      depth: depth,
      report: report,
      queries: queries,
      createdAt: new Date().toISOString(),
      elapsed: elapsed
    };

    this._history.unshift(result);
    // Keep last 20
    if (this._history.length > 20) this._history = this._history.slice(0, 20);
    this._save();

    // Store as L3 synthesis
    if (typeof MemoryEngine !== 'undefined') {
      MemoryEngine.trace('research', 'completed', { topic: topic, depth: depth });
      MemoryEngine.storeSynthesis('research_report', report, []);
    }

    return result;
  },

  /**
   * Generate search queries using the AI provider.
   */
  async _generateQueries(topic, depth) {
    var depthCount = depth === 'deep' ? 6 : 3;
    var prompt = 'Given the research topic: "' + topic + '", generate ' + depthCount + ' specific web search queries that would help research this topic thoroughly. Return as a JSON array of strings. Focus on finding factual, educational content related to math, science, or programming.\n\nReturn ONLY the JSON array, no other text.';

    var result = await this._callAI(prompt);
    try {
      var parsed = JSON.parse(result);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      // Try extracting array from markdown
      var match = result.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          var extracted = JSON.parse(match[0]);
          if (Array.isArray(extracted)) return extracted;
        } catch (e2) {}
      }
    }
    return [topic];
  },

  /**
   * Generate the full research report.
   */
  async _generateReport(topic, queries, depth) {
    var depthInstruction = depth === 'deep'
      ? 'Write a comprehensive, detailed report with in-depth analysis, multiple perspectives, and thorough explanations.'
      : 'Write a concise but informative report covering the key points.';

    var prompt = 'Write a well-structured research report on: "' + topic + '"\n\n' +
      depthInstruction + '\n\n' +
      'The following search queries were used:\n' +
      queries.map(function(q, i) { return (i + 1) + '. ' + q; }).join('\n') + '\n\n' +
      'Structure the report with:\n' +
      '1. **Executive Summary** (2-3 sentences)\n' +
      '2. **Key Findings** (bullet points with brief explanations)\n' +
      '3. **Detailed Analysis** (2-3 paragraphs with sub-sections)\n' +
      '4. **Educational Applications** (how this connects to learning)\n' +
      '5. **Key Takeaways** (bullet points)\n\n' +
      'Write at a level appropriate for a high school or early college student. Use clear section headers with ##. Be factual and educational.';

    return await this._callAI(prompt);
  },

  /**
   * Call the configured AI provider.
   */
  async _callAI(prompt) {
    var provider = this._getProvider();
    var apiKeyField = provider.apiKeyField || 'aiApiKey';
    var apiKey = GameState.get('settings.' + apiKeyField) || '';

    if (!apiKey || apiKey === 'demo_mode') {
      return this._getDemoReport(prompt);
    }

    try {
      var response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.headers(apiKey),
        body: JSON.stringify(provider.buildBody(
          'You are a thorough research assistant specializing in educational content. Write clear, well-structured reports.',
          [{ role: 'user', content: prompt }],
          apiKey,
          this._getModel()
        ))
      });

      if (!response.ok) {
        throw new Error('API error: ' + response.status);
      }

      var data = await response.json();
      return provider.parseResponse(data) || 'No response received.';
    } catch (e) {
      throw new Error('Research failed: ' + e.message);
    }
  },

  _getProvider() {
    if (typeof AiTutor !== 'undefined') {
      return AiTutor.providerConfig;
    }
    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      apiKeyField: 'aiApiKey',
      defaultModel: 'claude-sonnet-4-20250514',
      headers: function(key) {
        return { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
      },
      buildBody: function(systemPrompt, messages) {
        return { model: 'claude-sonnet-4-20250514', max_tokens: 4096, system: systemPrompt, messages: messages };
      },
      parseResponse: function(data) {
        return data.content?.[0]?.text || '';
      }
    };
  },

  _getModel() {
    if (typeof AiTutor !== 'undefined') return AiTutor.currentModel;
    return 'claude-sonnet-4-20250514';
  },

  /**
   * Get research history.
   */
  getHistory() {
    return this._history || [];
  },

  /**
   * Delete a research result.
   */
  deleteResult(id) {
    this._history = (this._history || []).filter(function(r) { return r.id !== id; });
    this._save();
  },

  /**
   * Demo mode: return a mock report.
   */
  _getDemoReport(topic) {
    return '## Research Report: ' + topic + '\n\n' +
      '### Executive Summary\n' +
      'This report provides an overview of "' + topic + '" and its educational applications.\n\n' +
      '### Key Findings\n' +
      '- This topic is foundational to understanding advanced concepts in mathematics\n' +
      '- Multiple approaches exist for teaching and learning this subject\n' +
      '- Practice and spaced repetition are key to mastery\n\n' +
      '### Detailed Analysis\n' +
      'The topic of "' + topic + '" encompasses several important concepts that build on each other. ' +
      'Starting with the fundamentals, learners should first understand the basic principles before moving to more advanced applications.\n\n' +
      'Research shows that active learning techniques, such as problem-solving and teaching others, ' +
      'significantly improve retention compared to passive study methods.\n\n' +
      '### Educational Applications\n' +
      'This topic can be applied to real-world problems in engineering, science, and technology. ' +
      'Understanding these concepts opens doors to more advanced study.\n\n' +
      '### Key Takeaways\n' +
      '- Master the fundamentals before moving to advanced topics\n' +
      '- Practice regularly with varied problems\n' +
      '- Connect concepts to real-world applications for better understanding\n\n' +
      '*This is a demo report. Configure an API key in AI Tutor settings for full research capabilities.*';
  }
};
