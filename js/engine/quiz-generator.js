const QuizGenerator = {

  /**
   * Generate quiz questions using the configured AI provider.
   * @param {object} options
   * @param {string} options.subject - 'calculus', 'python', 'algebra', 'trigonometry'
   * @param {string} [options.topic] - specific topic (optional)
   * @param {number} [options.count=5] - number of questions
   * @param {string} [options.difficulty='medium'] - 'easy', 'medium', 'hard'
   * @param {string} [options.format='multiple_choice'] - question format
   * @returns {Promise<array|null>} array of question objects or null
   */
  async generate(options) {
    const opts = options || {};
    const subject = opts.subject || 'calculus';
    const topic = opts.topic || '';
    const count = opts.count || 5;
    const difficulty = opts.difficulty || 'medium';
    const format = opts.format || 'multiple_choice';

    // Check API key
    const provider = this._getProvider();
    const apiKey = GameState.get('settings.' + provider.apiKeyField) || '';

    if (!apiKey || apiKey === 'demo_mode') {
      // Demo mode: return mock questions
      return this._getDemoQuestions(subject, difficulty, count);
    }

    const prompt = this._buildGenerationPrompt(subject, topic, count, difficulty, format);

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: provider.headers(apiKey),
        body: JSON.stringify(provider.buildBody(
          'You are a math quiz generator. Return ONLY valid JSON. No explanations, no markdown formatting.',
          [{ role: 'user', content: prompt }],
          apiKey,
          this._getModel()
        ))
      });

      if (!response.ok) {
        console.warn('QuizGenerator: API error', response.status);
        return null;
      }

      const data = await response.json();
      const text = provider.parseResponse(data);
      return this._parseQuestions(text);

    } catch (e) {
      console.warn('QuizGenerator: generation failed', e);
      return null;
    }
  },

  /**
   * Build the prompt for the AI to generate questions.
   */
  _buildGenerationPrompt(subject, topic, count, difficulty, format) {
    var topicStr = topic ? ' focused on "' + topic + '"' : '';
    var prompt = 'Generate ' + count + ' ' + difficulty + ' ' + format + ' questions about ' + subject + topicStr + '.\n\n';
    prompt += 'Return a JSON array of objects. Each object must have:\n';
    prompt += '- "question": string (the question text)\n';
    prompt += '- "options": array of 4 strings (answer choices)\n';
    prompt += '- "correctIndex": number (0-3, index of correct answer)\n';
    prompt += '- "explanation": string (why the answer is correct)\n';
    prompt += '- "difficulty": "' + difficulty + '"\n\n';
    prompt += 'Example:\n';
    prompt += '[{"question": "What is the derivative of x²?", "options": ["2x", "x", "2", "x²/2"], "correctIndex": 0, "explanation": "Power rule: bring down the exponent", "difficulty": "easy"}]\n\n';
    prompt += 'Return ONLY the JSON array, no other text.';
    return prompt;
  },

  /**
   * Parse AI response to extract question array.
   */
  _parseQuestions(text) {
    if (!text) return null;

    // Try direct parse first
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON array from markdown
      var match = text.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e2) {
          // Try cleaning common issues
          var cleaned = match[0]
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/,(\s*[}\]])/g, '$1'); // trailing commas
          try {
            return JSON.parse(cleaned);
          } catch (e3) {
            console.warn('QuizGenerator: failed to parse JSON', e3);
            return null;
          }
        }
      }
    }
    return null;
  },

  /**
   * Get the current AI provider config.
   */
  _getProvider() {
    if (typeof AiTutor !== 'undefined') {
      return AiTutor.providerConfig;
    }
    // Fallback: use first available provider
    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      models: ['claude-sonnet-4-20250514'],
      defaultModel: 'claude-sonnet-4-20250514',
      apiKeyField: 'aiApiKey',
      headers: function(key) {
        return { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
      },
      buildBody: function(systemPrompt, messages) {
        return { model: 'claude-sonnet-4-20250514', max_tokens: 2048, system: systemPrompt, messages: messages };
      },
      parseResponse: function(data) {
        return data.content?.[0]?.text || '';
      }
    };
  },

  /**
   * Get the current model name.
   */
  _getModel() {
    if (typeof AiTutor !== 'undefined') {
      return AiTutor.currentModel;
    }
    return 'claude-sonnet-4-20250514';
  },

  /**
   * Demo mode: return mock questions for testing.
   */
  _getDemoQuestions(subject, difficulty, count) {
    var pools = {
      calculus: [
        { question: "What is the derivative of x³?", options: ["3x²", "3x", "x²", "3x³"], correctIndex: 0, explanation: "Power rule: bring down the exponent 3, reduce power by 1", difficulty: "easy" },
        { question: "What is ∫ 2x dx?", options: ["x² + C", "2x² + C", "x + C", "2x + C"], correctIndex: 0, explanation: "∫ xⁿ dx = xⁿ⁺¹/(n+1) + C, so ∫ 2x dx = x² + C", difficulty: "easy" },
        { question: "What is the limit of (sin x)/x as x→0?", options: ["1", "0", "∞", "undefined"], correctIndex: 0, explanation: "This is a fundamental limit in calculus", difficulty: "medium" },
        { question: "If f(x) = e^x, what is f'(x)?", options: ["e^x", "xe^(x-1)", "ln(x)·e^x", "e^x·ln(e)"], correctIndex: 0, explanation: "The derivative of e^x is e^x", difficulty: "easy" },
        { question: "What does the chain rule state?", options: ["d/dx[f(g(x))] = f'(g(x))·g'(x)", "d/dx[f·g] = f'·g + f·g'", "d/dx[f/g] = (f'·g - f·g')/g²", "d/dx[c] = 0"], correctIndex: 0, explanation: "Chain rule: derivative of outer function evaluated at inner, times derivative of inner", difficulty: "medium" }
      ],
      python: [
        { question: "What does len('hello') return?", options: ["5", "4", "hello", "TypeError"], correctIndex: 0, explanation: "len() returns the number of characters in the string", difficulty: "easy" },
        { question: "Which keyword defines a function in Python?", options: ["def", "function", "func", "define"], correctIndex: 0, explanation: "Python uses 'def' to define functions", difficulty: "easy" },
        { question: "What is the output of: print(type([]))", options: ["<class 'list'>", "<class 'array'>", "<class 'dict'>", "list"], correctIndex: 0, explanation: "[] creates an empty list", difficulty: "easy" }
      ],
      algebra: [
        { question: "Solve for x: 2x + 5 = 13", options: ["x = 4", "x = 9", "x = 6", "x = 3"], correctIndex: 0, explanation: "2x = 8, so x = 4", difficulty: "easy" },
        { question: "What is the quadratic formula?", options: ["x = (-b ± √(b²-4ac))/(2a)", "x = -b/2a", "x = (-b ± √(b²+4ac))/(2a)", "x = (b ± √(b²-4ac))/(2a)"], correctIndex: 0, explanation: "The quadratic formula solves ax² + bx + c = 0", difficulty: "medium" }
      ],
      trigonometry: [
        { question: "What is sin(90°)?", options: ["1", "0", "1/2", "√2/2"], correctIndex: 0, explanation: "On the unit circle, sin(90°) = 1", difficulty: "easy" },
        { question: "What does SOH-CAH-TOA stand for?", options: ["Sin=Opp/Hyp, Cos=Adj/Hyp, Tan=Opp/Adj", "Sin=Opp/Adj, Cos=Hyp/Opp, Tan=Adj/Hyp", "Sin=Hyp/Opp, Cos=Opp/Adj, Tan=Hyp/Adj", "Sin=Adj/Hyp, Cos=Opp/Hyp, Tan=Hyp/Opp"], correctIndex: 0, explanation: "SOH-CAH-TOA is the fundamental mnemonic for right triangle trig", difficulty: "easy" }
      ]
    };

    var pool = pools[subject] || pools.calculus;
    // Filter by difficulty if possible, otherwise return what we have
    var filtered = pool.filter(function(q) { return q.difficulty === difficulty; });
    if (filtered.length < count) filtered = pool;

    // Take up to 'count' questions
    return filtered.slice(0, Math.min(count, filtered.length)).map(function(q, i) {
      return { id: 'gen_q_' + i, ...q };
    });
  }
};
