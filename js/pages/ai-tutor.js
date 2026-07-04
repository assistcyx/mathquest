const AiTutor = {
  _messages: [],
  _apiKey: '',
  _isLoading: false,
  _showSettings: false,
  _context: { currentPage: '', subject: '', lessonTitle: '', lessonId: '', gameType: '' },
  _abortController: null,

  PROVIDERS: {
    claude: {
      label: 'Claude (Anthropic)',
      endpoint: 'https://api.anthropic.com/v1/messages',
      models: ['claude-sonnet-4-20250514', 'claude-3-haiku-20240307', 'claude-opus-4-20250514'],
      defaultModel: 'claude-sonnet-4-20250514',
      apiKeyField: 'aiApiKey',
      headers(key) {
        return { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' };
      },
      buildBody(systemPrompt, messages, key, model) {
        return { model: model || this.defaultModel, max_tokens: 2048, system: systemPrompt, messages };
      },
      parseResponse(data) {
        return data.content?.[0]?.text || '';
      },
      keyPrefix: 'sk-ant-',
      keyUrl: 'https://console.anthropic.com/'
    },
    deepseek: {
      label: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      defaultModel: 'deepseek-chat',
      apiKeyField: 'aiApiKeyDeepseek',
      headers(key) {
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
      },
      buildBody(systemPrompt, messages, key, model) {
        return { model: model || this.defaultModel, max_tokens: 2048, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
      },
      parseResponse(data) {
        return data.choices?.[0]?.message?.content || '';
      },
      keyPrefix: 'sk-',
      keyUrl: 'https://platform.deepseek.com/api_keys'
    },
    openai: {
      label: 'OpenAI (ChatGPT)',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4o-2024-11-20'],
      defaultModel: 'gpt-4o-mini',
      apiKeyField: 'aiApiKeyOpenai',
      headers(key) {
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
      },
      buildBody(systemPrompt, messages, key, model) {
        return { model: model || this.defaultModel, max_tokens: 2048, messages: [{ role: 'system', content: systemPrompt }, ...messages] };
      },
      parseResponse(data) {
        return data.choices?.[0]?.message?.content || '';
      },
      keyPrefix: 'sk-',
      keyUrl: 'https://platform.openai.com/api-keys'
    }
  },

  LEARNING_TOOLS: [
    { id: 'explain', icon: '📖', label: 'Explain This', prompt: 'Please explain the topic I\'m currently studying in a simple, clear way with examples. Break it down step by step as if I\'m new to it.' },
    { id: 'practice', icon: '✏️', label: 'Practice Problems', prompt: 'Generate 3 practice problems related to what I\'m studying. Give me the problems first, then after I respond, reveal the answers with step-by-step solutions.' },
    { id: 'summarize', icon: '📝', label: 'Summarize', prompt: 'Give me a concise summary of the key concepts from what I\'m studying. Include the most important formulas, definitions, and rules I need to remember.' },
    { id: 'quiz', icon: '🎯', label: 'Quiz Me', prompt: 'Give me a quick 3-question multiple-choice quiz on what I\'m studying. Present one question at a time and tell me if I got it right before moving to the next.' },
    { id: 'example', icon: '💡', label: 'Real-World Example', prompt: 'Give me a real-world example or application of the concept I\'m studying. Explain how it\'s used in everyday life, science, or technology.' },
    { id: 'mnemonic', icon: '🧠', label: 'Memory Tips', prompt: 'Give me some memory tricks, mnemonics, or visualizations to help me remember the key concepts of what I\'m studying.' }
  ],

  get currentProvider() {
    return GameState.get('settings.aiProvider') || 'claude';
  },

  set currentProvider(val) {
    GameState.set('settings.aiProvider', val);
  },

  get providerConfig() {
    return this.PROVIDERS[this.currentProvider] || this.PROVIDERS.claude;
  },

  get currentModel() {
    const stored = GameState.get('settings.aiModel');
    if (stored && this.providerConfig.models.includes(stored)) return stored;
    return this.providerConfig.defaultModel;
  },

  set currentModel(val) {
    if (this.providerConfig.models.includes(val)) {
      GameState.set('settings.aiModel', val);
    }
  },

  render(container) {
    this._apiKey = GameState.get('settings.' + this.providerConfig.apiKeyField) || '';

    if (!this._apiKey) {
      this._renderApiKeySetup(container);
    } else {
      this._renderChat(container);
    }
  },

  // ========== API KEY SETUP ==========

  _renderApiKeySetup(container) {
    const currentProvider = this.currentProvider;
    const provider = this.providerConfig;

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="ai-setup">
          <div class="ai-setup-card">
            <div style="font-size: 3rem; margin-bottom: var(--space-md);">🤖</div>
            <h2>AI Tutor</h2>
            <p style="margin-bottom: var(--space-sm);">Your personal learning assistant for math, Python, and more!</p>
            <p style="color: var(--color-text-muted); margin-bottom: var(--space-lg); font-size: var(--text-sm);">
              Get step-by-step explanations, practice problems, quizzes, and memory tips — all tailored to your current lesson.
            </p>

            <div style="margin-bottom: var(--space-lg);">
              <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Choose your AI Provider</p>
              <div style="display: flex; gap: var(--space-sm); justify-content: center; flex-wrap: wrap;">
                ${Object.entries(this.PROVIDERS).map(([id, cfg]) => `
                  <button class="difficulty-btn ${currentProvider === id ? 'selected' : ''}"
                    onclick="AiTutor._selectProvider('${id}')"
                    style="${currentProvider === id ? 'background: var(--color-secondary); border-color: var(--color-secondary);' : ''}">
                    ${cfg.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <div style="margin-bottom: var(--space-lg);">
              <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Model</p>
              <select class="input" id="ai-model-select" style="width: 100%;">
                ${provider.models.map(m => `
                  <option value="${m}" ${m === this.currentModel ? 'selected' : ''}>${m}</option>
                `).join('')}
              </select>
            </div>

            <input class="input" id="ai-api-key-input" type="password" placeholder="Paste your ${provider.label} API key (${provider.keyPrefix}...)" style="font-family: monospace;" autofocus>
            <button class="btn btn-primary btn-lg" onclick="AiTutor._saveApiKey()" style="width: 100%;">🔑 Save & Start</button>

            <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm); justify-content: center;">
              <button class="btn btn-sm btn-ghost" onclick="AiTutor._showDemoMode()">👀 Try Demo Mode</button>
            </div>

            <div class="ai-info">
              🔒 Your API key is stored in your browser's localStorage. It is sent directly to the API provider — never to any other server.<br><br>
              📝 <a href="${provider.keyUrl}" target="_blank" rel="noopener">Get a ${provider.label} API key</a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _showDemoMode() {
    // Use a simple mock so users can see the UI
    GameState.set('settings.aiApiKey', 'demo_mode');
    this._apiKey = 'demo_mode';
    Toast.show('👀 Demo mode — responses will be simulated', 'info');
    this.render(document.querySelector('#app'));
  },

  _selectProvider(providerId) {
    if (!this.PROVIDERS[providerId]) return;
    this.currentProvider = providerId;
    this.render(document.querySelector('#app'));
  },

  _saveApiKey() {
    const input = document.getElementById('ai-api-key-input');
    const key = input?.value?.trim();
    if (!key) {
      Toast.show('Please enter an API key', 'error');
      return;
    }
    const modelSelect = document.getElementById('ai-model-select');
    if (modelSelect) {
      this.currentModel = modelSelect.value;
    }
    const provider = this.providerConfig;
    GameState.set('settings.' + provider.apiKeyField, key);
    this._apiKey = key;
    Toast.show('✅ Ready! AI Tutor is live.', 'success');
    this.render(document.querySelector('#app'));
  },

  // ========== SETTINGS PANEL ==========

  _renderSettingsPanel() {
    const provider = this.providerConfig;
    const allProviders = Object.keys(this.PROVIDERS);

    return `
      <div class="ai-settings-overlay" onclick="AiTutor._toggleSettings()">
        <div class="ai-settings-panel" onclick="event.stopPropagation()">
          <div class="ai-settings-header">
            <h3>⚙️ AI Tutor Settings</h3>
            <button class="btn btn-sm btn-ghost" onclick="AiTutor._toggleSettings()" style="color: white;">✕</button>
          </div>
          <div class="ai-settings-body">
            <!-- Provider -->
            <div class="ai-settings-section">
              <label>AI Provider</label>
              <div style="display: flex; gap: var(--space-xs); flex-wrap: wrap;">
                ${allProviders.map(id => `
                  <button class="btn btn-sm ${this.currentProvider === id ? 'btn-primary' : 'btn-secondary'}"
                    onclick="AiTutor._changeSettingProvider('${id}')">${this.PROVIDERS[id].label}</button>
                `).join('')}
              </div>
            </div>

            <!-- Model -->
            <div class="ai-settings-section">
              <label>Model</label>
              <select class="input" id="ai-settings-model" onchange="AiTutor._changeSettingModel(this.value)">
                ${provider.models.map(m => `
                  <option value="${m}" ${m === this.currentModel ? 'selected' : ''}>${m}</option>
                `).join('')}
              </select>
            </div>

            <!-- API Key -->
            <div class="ai-settings-section">
              <label>${provider.label} API Key</label>
              <div style="display: flex; gap: var(--space-xs);">
                <input class="input" id="ai-settings-key" type="password" value="${this._apiKey && this._apiKey !== 'demo_mode' ? '••••••••' : ''}" placeholder="${provider.keyPrefix}..." style="flex: 1; font-family: monospace;">
                <button class="btn btn-sm btn-primary" onclick="AiTutor._saveSettingsKey()">Save</button>
              </div>
              <div style="margin-top: var(--space-xs);">
                <a href="${provider.keyUrl}" target="_blank" rel="noopener" style="font-size: var(--text-xs);">Get API key ↗</a>
                <button class="btn btn-sm btn-ghost" style="font-size: var(--text-xs); color: var(--color-error); margin-left: var(--space-sm);" onclick="AiTutor._clearKey()">Remove key</button>
              </div>
            </div>

            <!-- Adaptive Learning -->
            <div class="ai-settings-section">
              <label style="display: flex; align-items: center; gap: var(--space-sm);">
                <input type="checkbox" ${GameState.get('settings.adaptiveLearning') !== false ? 'checked' : ''} onchange="GameState.set('settings.adaptiveLearning', this.checked)">
                Adaptive Difficulty
              </label>
              <p style="font-size: var(--text-xs); color: var(--color-text-muted); margin: var(--space-xs) 0 0 0;">Auto-adjust quiz difficulty based on your mastery</p>
            </div>

            <!-- Stats -->
            <div class="ai-settings-section">
              <label>Usage</label>
              <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin: 0;">
                Questions asked: <strong>${GameState.get('_aiQuestionsAsked') || 0}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _toggleSettings() {
    this._showSettings = !this._showSettings;
    if (this._showSettings) {
      const panel = this._renderSettingsPanel();
      const container = document.getElementById('ai-settings-container');
      if (container) container.innerHTML = panel;
    } else {
      const container = document.getElementById('ai-settings-container');
      if (container) container.innerHTML = '';
    }
  },

  _changeSettingProvider(id) {
    if (!this.PROVIDERS[id]) return;
    this.currentProvider = id;
    this._apiKey = GameState.get('settings.' + this.providerConfig.apiKeyField) || '';
    Toast.show(`Switched to ${this.PROVIDERS[id].label}`, 'info');
    this._toggleSettings();
    this.render(document.querySelector('#app'));
  },

  _changeSettingModel(model) {
    this.currentModel = model;
    GameState.set('settings.aiModel', model);
    Toast.show(`Model set to ${model}`, 'info');
  },

  _saveSettingsKey() {
    const input = document.getElementById('ai-settings-key');
    const key = input?.value?.trim();
    if (!key) return;
    const provider = this.providerConfig;
    GameState.set('settings.' + provider.apiKeyField, key);
    this._apiKey = key;
    Toast.show('✅ API key updated', 'success');
    this._toggleSettings();
    this.render(document.querySelector('#app'));
  },

  _clearKey() {
    const provider = this.providerConfig;
    GameState.set('settings.' + provider.apiKeyField, '');
    this._apiKey = '';
    this._messages = [];
    Toast.show('API key removed', 'info');
    this._toggleSettings();
    this.render(document.querySelector('#app'));
  },

  // ========== MAIN CHAT ==========

  _renderChat(container) {
    if (this._messages.length === 0) {
      this._messages = [
        { role: 'assistant', text: this._getGreeting() }
      ];
    }

    const provider = this.providerConfig;
    const ctx = this._context;
    const contextLabel = this._getContextLabel();
    const hasContext = ctx.subject || ctx.gameType;

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div id="ai-settings-container"></div>
        <div class="ai-tutor-container">
          <!-- Header -->
          <div class="ai-tutor-header">
            <span style="font-size: 1.5rem;">🤖</span>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: var(--space-xs); flex-wrap: wrap;">
                AI Tutor
                <span class="ai-header-badge">${this.currentModel}</span>
                ${typeof MemoryEngine !== 'undefined' && MemoryEngine.inspect().stats.totalFacts > 0 ? '<span class="memory-context-indicator" title="AI remembers your learning history">🧠 Memory active</span>' : ''}
              </div>
              <div class="ai-subtitle">${contextLabel}</div>
            </div>
            <div style="display: flex; gap: var(--space-xs); flex-shrink: 0;">
              <button class="ai-header-btn" title="Settings" onclick="AiTutor._toggleSettings()">⚙️</button>
              <button class="ai-header-btn" title="Clear chat" onclick="AiTutor._clearConversation()">🗑️</button>
              <button class="ai-header-btn" title="Copy conversation" onclick="AiTutor._copyConversation()">📋</button>
            </div>
          </div>

          <!-- Context bar (when on a lesson/game page) -->
          ${hasContext ? `
            <div class="ai-context-bar">
              <span class="ai-context-badge">📍 ${contextLabel}</span>
              <span style="font-size: var(--text-xs); color: var(--color-text-muted);">The tutor knows what you're studying</span>
            </div>
          ` : ''}

          <!-- Learning Tools (quick action buttons) -->
          <div class="ai-tools-bar">
            ${this.LEARNING_TOOLS.map(tool => `
              <button class="ai-tool-btn" onclick="AiTutor._useTool('${tool.id}')" title="${tool.prompt}">
                <span>${tool.icon}</span>
                <span>${tool.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Messages -->
          <div class="ai-chat-messages" id="ai-chat-messages">
            ${this._messages.map(m => this._renderMessage(m)).join('')}
          </div>

          <!-- Input Area -->
          <div class="ai-chat-input-area">
            <input class="ai-chat-input" id="ai-chat-input" type="text" placeholder="Ask me anything about math or Python..." autofocus>
            <button class="ai-chat-send" id="ai-chat-send" onclick="AiTutor._sendMessage()">➤</button>
          </div>
        </div>
      </div>
    `;

    this._scrollToBottom();

    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._sendMessage();
      });
      setTimeout(() => input.focus(), 100);
    }
  },

  _renderMessage(msg) {
    const cssClass = msg.role === 'user' ? 'ai-message-user' :
      msg.role === 'system' ? 'ai-message-system' : 'ai-message-assistant';
    return `<div class="ai-message ${cssClass}">${msg.text}</div>`;
  },

  _getGreeting() {
    const name = GameState.get('player.name') || 'there';
    const ctx = this._context;
    const modelLabel = this.currentModel;
    let greeting = `Hi ${name}! 👋 I'm your AI tutor (${modelLabel}). `;

    if (ctx.subject) {
      greeting += `I see you're studying **${ctx.subject}**`;
      if (ctx.lessonTitle) greeting += ` — "${ctx.lessonTitle}"`;
      greeting += '. ';
    }

    greeting += `\n\nTry the quick action buttons above to get started:\n`;
    greeting += `📖 **Explain** — get a clear explanation\n`;
    greeting += `✏️ **Practice** — generate problems\n`;
    greeting += `📝 **Summarize** — key points\n`;
    greeting += `🎯 **Quiz** — test yourself\n`;
    greeting += `💡 **Example** — real-world use\n`;
    greeting += `🧠 **Memory Tips** — mnemonics & tricks`;

    return greeting;
  },

  _getContextLabel() {
    const ctx = this._context;
    if (ctx.lessonTitle) return `📖 ${ctx.lessonTitle}`;
    if (ctx.gameType) return `🎮 ${ctx.gameType}`;
    if (ctx.subject) return `📚 ${ctx.subject}`;
    return 'Ready to help!';
  },

  _scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('ai-chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
  },

  // ========== LEARNING TOOLS ==========

  _useTool(toolId) {
    const tool = this.LEARNING_TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    let fullPrompt = tool.prompt;
    const ctx = this._context;

    // Inject context into the prompt
    if (ctx.subject) {
      fullPrompt = `I'm currently studying ${ctx.subject}`;
      if (ctx.lessonTitle) fullPrompt += ` — specifically "${ctx.lessonTitle}"`;
      fullPrompt += '. ' + tool.prompt;
    }

    this._addMessage('user', `${tool.icon} **${tool.label}** — ${fullPrompt}`);
    this._scrollToBottom();
    this._showLoading();

    const aiQuestions = GameState.get('_aiQuestionsAsked') || 0;
    GameState.set('_aiQuestionsAsked', aiQuestions + 1);

    const systemPrompt = this._buildSystemPrompt();
    this._callAPI(systemPrompt, fullPrompt);
  },

  // ========== SEND / API ==========

  _sendMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || this._isLoading) return;

    input.value = '';

    this._addMessage('user', this._escapeHtml(text));
    this._scrollToBottom();
    this._showLoading();

    const aiQuestions = GameState.get('_aiQuestionsAsked') || 0;
    GameState.set('_aiQuestionsAsked', aiQuestions + 1);

    const systemPrompt = this._buildSystemPrompt();
    this._callAPI(systemPrompt, text);
  },

  _buildSystemPrompt() {
    const ctx = this._context;
    let prompt = "You are a friendly, encouraging math and coding tutor for MathQuest, a gamified learning platform for students. ";

    prompt += "Keep explanations clear, simple, and use concrete examples. Be encouraging and positive. ";
    prompt += "Use emojis occasionally for engagement. Format your responses with clear sections using simple markdown (bold for key terms, line breaks). ";
    prompt += "Break down complex problems into simple steps. ";
    prompt += "If asked about non-educational topics, gently redirect the conversation back to math, coding, or learning. ";

    // Full subject list
    prompt += "You can help with: ";
    prompt += "calculus (limits, derivatives, integrals, chain rule, product/quotient rule, l'hopital's rule, u-substitution, definite integrals, optimization, related rates); ";
    prompt += "Python (variables, types, lists, loops, functions, dicts, sets, error handling, classes/OOP, list comprehensions, modules, file I/O, JSON); ";
    prompt += "algebra (linear equations, quadratics, systems, inequalities, functions/domain, polynomials/factoring); ";
    prompt += "trigonometry (sin/cos/tan, SOH-CAH-TOA, unit circle, trig identities, graphs, radians).";

    if (ctx.subject) {
      prompt += `\n\nThe student is currently studying: ${ctx.subject}`;
      if (ctx.lessonTitle) prompt += ` - "${ctx.lessonTitle}"`;
      if (ctx.lessonId) prompt += ` (lesson ${ctx.lessonId})`;
    }
    if (ctx.gameType) {
      prompt += `\nThe student just played: ${ctx.gameType}. You can help them understand concepts they might have gotten wrong.`;
    }

    // Append memory context (known topics, struggles, recent activity)
    if (typeof MemoryEngine !== 'undefined') {
      prompt += MemoryEngine.buildMemoryContext();
    }

    return prompt;
  },

  _callAPI(systemPrompt, userMessage) {
    this._abortController = new AbortController();

    const provider = this.providerConfig;
    const apiKey = GameState.get('settings.' + provider.apiKeyField) || '';

    // Demo mode — simulate a response
    if (apiKey === 'demo_mode') {
      setTimeout(() => {
        this._removeLoading();
        this._addMessage('assistant', this._demoResponse(userMessage));
        this._scrollToBottom();
        this._isLoading = false;
        const sendBtn = document.getElementById('ai-chat-send');
        if (sendBtn) sendBtn.disabled = false;
      }, 1500);
      return;
    }

    if (!apiKey) {
      this._removeLoading();
      this._addMessage('assistant', `😅 No API key configured for ${provider.label}. Please set it up in settings (⚙️).`);
      this._isLoading = false;
      return;
    }

    const recentMessages = this._messages
      .filter(m => m.role !== 'system')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.text }));

    recentMessages.push({ role: 'user', content: userMessage });

    const body = provider.buildBody(systemPrompt, recentMessages, apiKey, this.currentModel);

    fetch(provider.endpoint, {
      method: 'POST',
      headers: provider.headers(apiKey),
      body: JSON.stringify(body),
      signal: this._abortController.signal
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid API key. Update it in settings (⚙️).');
        if (response.status === 429) throw new Error('Too many requests. Please wait a moment.');
        if (response.status === 400) throw new Error('Bad request. Try switching models in settings.');
        throw new Error(`API error: ${response.status}.`);
      }
      return response.json();
    })
    .then(data => {
      this._removeLoading();
      const reply = provider.parseResponse(data) || 'Sorry, I received an empty response.';
      this._addMessage('assistant', reply);
      this._scrollToBottom();
      AchievementEngine.check();
    })
    .catch(error => {
      this._removeLoading();
      if (error.name === 'AbortError') {
        this._addMessage('system', 'Message cancelled.');
      } else {
        this._addMessage('assistant', `😅 ${error.message}`);
      }
      this._scrollToBottom();
    })
    .finally(() => {
      this._isLoading = false;
      const sendBtn = document.getElementById('ai-chat-send');
      if (sendBtn) sendBtn.disabled = false;
    });
  },

  // Demo mode response generator
  _demoResponse(userMsg) {
    const msg = userMsg.toLowerCase();
    if (msg.includes('derivative') || msg.includes('differentiate')) {
      return `Great question about derivatives! 🎯

The **derivative** measures the rate of change of a function. Think of it like the slope at a single point on a curve.

**Power Rule:** If f(x) = xⁿ, then f'(x) = n·xⁿ⁻¹

Example: f(x) = x³ → f'(x) = 3x²

**Practice:** Try finding the derivative of f(x) = 2x⁴. (Answer: 8x³)

Want me to explain the chain rule or product rule next?`;
    }
    if (msg.includes('python') || msg.includes('code')) {
      return `Let's talk Python! 🐍

Here's a quick example of a **list comprehension** — one of Python's most elegant features:

\`\`\`
# Get squares of even numbers
squares = [x**2 for x in range(10) if x % 2 == 0]
print(squares)  # [0, 4, 16, 36, 64]
\`\`\`

This is cleaner than writing a for-loop with an if-statement!

Want me to explain functions, classes, or error handling?`;
    }
    if (msg.includes('trig') || msg.includes('sin') || msg.includes('cos')) {
      return `Trigonometry time! 📐

The **unit circle** is your best friend. At any angle θ:

• cos(θ) = x-coordinate on the unit circle
• sin(θ) = y-coordinate on the unit circle

**Key angles to memorize:**
| Angle | sin | cos |
|-------|-----|-----|
| 0°    | 0   | 1   |
| 30°   | 1/2 | √3/2 |
| 45°   | √2/2| √2/2 |
| 60°   | √3/2| 1/2 |
| 90°   | 1   | 0   |

Remember: **SOH-CAH-TOA** for right triangles!`;
    }
    if (msg.includes('algebra') || msg.includes('equation') || msg.includes('solve')) {
      return `Let's work through this algebra problem! 🔢

For **linear equations**, the goal is to isolate the variable:

Example: 3x + 7 = 22
1. Subtract 7 from both sides: 3x = 15
2. Divide both sides by 3: **x = 5** ✅

**Tip:** Whatever you do to one side, do to the other!

Want to practice with more equations or learn about quadratics?`;
    }
    if (msg.includes('explain') || msg.includes('what is') || msg.includes('how')) {
      return `I'd be happy to explain! 💡

To give you the most helpful explanation, could you tell me:
1. What specific topic or concept are you studying right now?
2. Is there a particular problem you're stuck on?

I can break it down step by step with examples! 🚀`;
    }
    if (msg.includes('practice') || msg.includes('problem') || msg.includes('exercise')) {
      return `Here are some practice problems! ✏️

**Problem 1:** Find the derivative of f(x) = 5x³ + 2x - 7
**Problem 2:** Evaluate ∫ 3x² dx
**Problem 3:** Solve for x: 2(x + 3) = 14

Try solving these, and I'll check your answers with step-by-step explanations! 🎯

*(In live mode, I'd generate problems specific to your current lesson)*`;
    }
    // Default
    return `Hi there! 👋 I'm your AI tutor in **demo mode**.

Here's what I can help with:
• 📖 **Explain** any math or Python concept
• ✏️ **Generate practice problems** with solutions
• 📝 **Summarize** lessons and key formulas
• 🎯 **Quiz you** on any topic
• 💡 **Real-world examples** of concepts
• 🧠 **Memory tricks** and mnemonics

To get the full experience, add your API key in settings (⚙️). For now, try asking me about derivatives, Python, trigonometry, or algebra! 🚀`;
  },

  // ========== UI HELPERS ==========

  _showLoading() {
    this._isLoading = true;
    const sendBtn = document.getElementById('ai-chat-send');
    if (sendBtn) sendBtn.disabled = true;

    const container = document.getElementById('ai-chat-messages');
    if (container) {
      const loadingEl = document.createElement('div');
      loadingEl.className = 'ai-loading';
      loadingEl.id = 'ai-loading-indicator';
      loadingEl.innerHTML = '<span></span><span></span><span></span>';
      container.appendChild(loadingEl);
      this._scrollToBottom();
    }
  },

  _removeLoading() {
    const loadingEl = document.getElementById('ai-loading-indicator');
    if (loadingEl) loadingEl.remove();
  },

  _addMessage(role, text) {
    this._messages.push({ role, text });
    const container = document.getElementById('ai-chat-messages');
    if (container) {
      this._removeLoading();
      container.insertAdjacentHTML('beforeend', this._renderMessage({ role, text }));
    }
  },

  _clearConversation() {
    this._messages = [];
    this.render(document.querySelector('#app'));
    Toast.show('Conversation cleared', 'info');
  },

  _copyConversation() {
    const text = this._messages.map(m => {
      const prefix = m.role === 'user' ? 'You' : m.role === 'system' ? 'System' : 'AI Tutor';
      return `[${prefix}]\n${m.text}`;
    }).join('\n\n---\n\n');

    navigator.clipboard?.writeText(text).then(() => {
      Toast.show('📋 Conversation copied to clipboard!', 'success');
    }).catch(() => {
      Toast.show('Could not copy automatically', 'error');
    });
  },

  _resetApiKey() {
    const provider = this.providerConfig;
    GameState.set('settings.' + provider.apiKeyField, '');
    this._apiKey = '';
    this._messages = [];
    this.render(document.querySelector('#app'));
    Toast.show('API key removed. You can enter a new one.', 'info');
  },

  _setContext(contextInfo) {
    this._context = { ...this._context, ...contextInfo };
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
