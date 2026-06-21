const AiTutor = {
  _messages: [],
  _apiKey: '',
  _isLoading: false,
  _context: { currentPage: '', subject: '', lessonTitle: '', lessonId: '', gameType: '' },
  _abortController: null,

  render(container) {
    this._apiKey = GameState.get('settings.aiApiKey') || '';

    if (!this._apiKey) {
      this._renderApiKeySetup(container);
    } else {
      this._renderChat(container);
    }
  },

  _renderApiKeySetup(container) {
    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="ai-setup">
          <div class="ai-setup-card">
            <div style="font-size: 3rem; margin-bottom: var(--space-md);">🤖</div>
            <h2>AI Tutor Setup</h2>
            <p>Enter your Claude API key to unlock the AI Tutor!<br>
            The AI Tutor can help you with math, Python, and any questions you have.</p>
            <input class="input" id="ai-api-key-input" type="password" placeholder="sk-ant-..." style="font-family: monospace;" autofocus>
            <button class="btn btn-primary btn-lg" onclick="AiTutor._saveApiKey()" style="width: 100%;">🔑 Save & Start Chat</button>
            <div class="ai-info">
              🔒 Your API key is stored locally in your browser and is never sent anywhere except directly to Anthropic's API.<br><br>
              📝 Get a Claude API key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _saveApiKey() {
    const input = document.getElementById('ai-api-key-input');
    const key = input?.value?.trim();
    if (!key) {
      Toast.show('Please enter an API key', 'error');
      return;
    }
    if (!key.startsWith('sk-ant-')) {
      Toast.show('Invalid API key format (should start with sk-ant-)', 'error');
      return;
    }
    GameState.set('settings.aiApiKey', key);
    this._apiKey = key;
    Toast.show('✅ API key saved!', 'success');
    this.render(document.querySelector('#app'));
  },

  _renderChat(container) {
    if (this._messages.length === 0) {
      this._messages = [
        { role: 'assistant', text: this._getGreeting() }
      ];
    }

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="ai-tutor-container">
          <div class="ai-tutor-header">
            <span style="font-size: 1.5rem;">🤖</span>
            <div>
              <div>AI Tutor</div>
              <div class="ai-subtitle">${this._getContextLabel()}</div>
            </div>
            <div style="margin-left: auto; display: flex; gap: var(--space-xs);">
              <button class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: none;" onclick="AiTutor._clearConversation()">🗑️</button>
              <button class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: none;" onclick="AiTutor._resetApiKey()">🔑</button>
            </div>
          </div>

          <div class="ai-chat-messages" id="ai-chat-messages">
            ${this._messages.map(m => this._renderMessage(m)).join('')}
          </div>

          <div class="ai-chat-input-area">
            <input class="ai-chat-input" id="ai-chat-input" type="text" placeholder="Ask me anything about math or Python..." autofocus>
            <button class="ai-chat-send" id="ai-chat-send" onclick="AiTutor._sendMessage()">➤</button>
          </div>
        </div>
      </div>
    `;

    // Scroll to bottom
    this._scrollToBottom();

    // Enter key to send
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
    const context = this._context;
    let greeting = `Hi ${name}! 👋 I'm your AI tutor. `;

    if (context.subject) {
      greeting += `I see you're studying ${context.subject}`;
      if (context.lessonTitle) greeting += ` — "${context.lessonTitle}"`;
      greeting += '. ';
    }

    greeting += `Ask me anything about math, Python, or your current lessons!`;
    return greeting;
  },

  _getContextLabel() {
    const ctx = this._context;
    if (ctx.lessonTitle) return `📖 ${ctx.lessonTitle}`;
    if (ctx.gameType) return `🎮 Playing: ${ctx.gameType}`;
    if (ctx.subject) return `📚 ${ctx.subject}`;
    return 'Ready to help!';
  },

  _scrollToBottom() {
    setTimeout(() => {
      const msgContainer = document.getElementById('ai-chat-messages');
      if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
  },

  _sendMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || this._isLoading) return;

    input.value = '';

    // Add user message
    this._addMessage('user', this._escapeHtml(text));
    this._scrollToBottom();

    // Show loading indicator
    this._showLoading();

    // Track AI usage
    const aiQuestions = GameState.get('_aiQuestionsAsked') || 0;
    GameState.set('_aiQuestionsAsked', aiQuestions + 1);

    // Build system prompt
    const systemPrompt = this._buildSystemPrompt();

    // Call API
    this._callClaudeAPI(systemPrompt, text);
  },

  _buildSystemPrompt() {
    const ctx = this._context;
    let prompt = "You are a friendly, encouraging math and Python tutor for MathQuest, a gamified learning platform for middle and high school students. ";

    prompt += "Keep explanations clear, simple, and use concrete examples. Be encouraging and positive. ";
    prompt += "Use emojis occasionally for engagement but avoid heavy markdown. ";
    prompt += "Break down complex problems into simple steps. ";
    prompt += "If asked about non-educational topics, gently redirect the conversation back to math or Python. ";
    prompt += "You can help with: calculus (limits, derivatives, integrals, chain rule, product rule, optimization), ";
    prompt += "Python programming (variables, lists, loops, functions, dictionaries, error handling, classes), ";
    prompt += "and algebra (linear equations, quadratics, systems of equations).";

    if (ctx.subject) {
      prompt += `\n\nThe student is currently studying: ${ctx.subject}`;
      if (ctx.lessonTitle) {
        prompt += ` - "${ctx.lessonTitle}"`;
      }
    }
    if (ctx.gameType) {
      prompt += `\nThe student just played: ${ctx.gameType}`;
    }

    return prompt;
  },

  _callClaudeAPI(systemPrompt, userMessage) {
    this._abortController = new AbortController();

    // Build message history (last 10 messages for context, plus the new one)
    const recentMessages = this._messages
      .filter(m => m.role !== 'system')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.text }));

    recentMessages.push({ role: 'user', content: userMessage });

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this._apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: recentMessages
      }),
      signal: this._abortController.signal
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid API key. Please update your key in settings.');
        if (response.status === 429) throw new Error('Too many requests. Please wait a moment and try again.');
        if (response.status === 400) throw new Error('Bad request. The API may have changed.');
        throw new Error(`API error: ${response.status}. Please try again.`);
      }
      return response.json();
    })
    .then(data => {
      this._removeLoading();
      const reply = data.content?.[0]?.text || 'Sorry, I received an empty response.';
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
      // Remove loading indicator first
      this._removeLoading();
      container.insertAdjacentHTML('beforeend', this._renderMessage({ role, text }));
    }
  },

  _clearConversation() {
    this._messages = [];
    this.render(document.querySelector('#app'));
    Toast.show('Conversation cleared', 'info');
  },

  _resetApiKey() {
    GameState.set('settings.aiApiKey', '');
    this._apiKey = '';
    this._messages = [];
    this.render(document.querySelector('#app'));
    Toast.show('API key removed. You can enter a new one.', 'info');
  },

  // Set context from other pages
  _setContext(contextInfo) {
    this._context = { ...this._context, ...contextInfo };
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
