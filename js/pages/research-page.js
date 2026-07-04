const ResearchPage = {
  _isRunning: false,

  render(container) {
    var history = typeof ResearchEngine !== 'undefined' ? ResearchEngine.getHistory() : [];

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🔬 Deep Research</h1>
          <p>Generate comprehensive, well-structured research reports on any topic</p>
        </div>

        <div class="research-page">
          <!-- Input Card -->
          <div class="research-input-card card">
            <h3 style="margin-bottom: var(--space-md);">🔍 Research Topic</h3>
            <div style="margin-bottom: var(--space-md);">
              <input class="input" id="research-topic-input" type="text"
                placeholder="Enter a topic to research (e.g., 'Applications of calculus in machine learning')..."
                style="width: 100%; font-size: var(--text-lg); padding: var(--space-md);"
                onkeydown="if(event.key==='Enter')ResearchPage._startResearch()">
            </div>

            <div style="display: flex; gap: var(--space-md); align-items: center; flex-wrap: wrap; margin-bottom: var(--space-md);">
              <div>
                <label style="font-size: var(--text-sm); font-weight: 700; display: block; margin-bottom: var(--space-xs);">Depth</label>
                <div style="display: flex; gap: var(--space-xs);">
                  <button class="difficulty-btn selected" data-depth="standard" onclick="ResearchPage._selectDepth(this, 'standard')">📄 Standard</button>
                  <button class="difficulty-btn" data-depth="deep" onclick="ResearchPage._selectDepth(this, 'deep')">🔬 Deep</button>
                </div>
              </div>
              <button class="btn btn-primary btn-lg" id="research-start-btn" onclick="ResearchPage._startResearch()" style="margin-top: 6px;">
                🔍 Start Research
              </button>
            </div>
          </div>

          <!-- Progress Area -->
          <div id="research-progress" style="display: none;"></div>

          <!-- Result Area -->
          <div id="research-result"></div>

          <!-- History -->
          <div style="margin-top: var(--space-xl);">
            <h3 style="margin-bottom: var(--space-md);">📜 Research History (${history.length})</h3>
            <div id="research-history">
              ${history.length === 0
                ? '<div class="memory-empty"><div class="icon">🔬</div><h3>No research yet</h3><p>Enter a topic above to generate your first research report.</p></div>'
                : history.map(function(r) { return ResearchPage._renderHistoryItem(r); }).join('')
              }
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _selectDepth(btn, depth) {
    document.querySelectorAll('[data-depth]').forEach(function(b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    this._depth = depth;
  },

  async _startResearch() {
    if (this._isRunning) return;

    var input = document.getElementById('research-topic-input');
    var topic = input ? input.value.trim() : '';
    if (!topic) {
      Toast.show('Please enter a research topic', 'error');
      return;
    }

    var depthEl = document.querySelector('[data-depth].selected');
    var depth = depthEl ? depthEl.getAttribute('data-depth') : 'standard';

    this._isRunning = true;

    var startBtn = document.getElementById('research-start-btn');
    if (startBtn) startBtn.disabled = true;

    var progressEl = document.getElementById('research-progress');
    var resultEl = document.getElementById('research-result');

    if (progressEl) {
      progressEl.style.display = 'block';
      progressEl.innerHTML = '<div class="research-progress"><div class="research-spinner"></div><span id="research-status">Initializing research...</span></div>';
    }
    if (resultEl) resultEl.innerHTML = '';

    try {
      var result = await ResearchEngine.research(topic, depth, function(status) {
        var statusEl = document.getElementById('research-status');
        if (statusEl) statusEl.textContent = status;
      });

      if (progressEl) progressEl.style.display = 'none';
      if (resultEl) resultEl.innerHTML = this._renderReport(result);

      // Refresh history
      var historyEl = document.getElementById('research-history');
      if (historyEl) {
        var history = ResearchEngine.getHistory();
        historyEl.innerHTML = history.map(function(r) { return ResearchPage._renderHistoryItem(r); }).join('');
      }

    } catch (e) {
      if (progressEl) {
        progressEl.innerHTML = '<div class="research-error">❌ Research failed: ' + e.message + '</div>';
      }
    }

    this._isRunning = false;
    if (startBtn) startBtn.disabled = false;
  },

  _renderReport(result) {
    var dateStr = new Date(result.createdAt).toLocaleString();

    return '<div class="research-report card">' +
      '<div class="research-report-header">' +
        '<div>' +
          '<h3 style="margin-bottom: var(--space-xs);">📄 ' + result.topic + '</h3>' +
          '<div style="font-size: var(--text-xs); color: var(--color-text-muted);">' +
            dateStr + ' · ' + (result.depth === 'deep' ? '🔬 Deep' : '📄 Standard') + ' · ' + result.elapsed + 's' +
          '</div>' +
        </div>' +
        '<div style="display: flex; gap: var(--space-xs);">' +
          '<button class="btn btn-sm btn-ghost" onclick="ResearchPage._copyReport(' + result.id.replace('res_', '') + ')" title="Copy">📋</button>' +
        '</div>' +
      '</div>' +
      '<div class="research-report-body">' +
        this._renderMarkdown(result.report) +
      '</div>' +
      (result.queries && result.queries.length > 0
        ? '<div class="research-queries"><strong>🔍 Search queries:</strong> ' + result.queries.join(' · ') + '</div>'
        : '') +
    '</div>';
  },

  _renderHistoryItem(result) {
    var dateStr = new Date(result.createdAt).toLocaleDateString();
    var preview = result.report ? result.report.slice(0, 120) + '...' : '';

    return '<div class="research-history-item" onclick="ResearchPage._showResult(\'' + result.id + '\')">' +
      '<div class="research-history-icon">📄</div>' +
      '<div class="research-history-info">' +
        '<div class="research-history-title">' + result.topic + '</div>' +
        '<div class="research-history-meta">' + dateStr + ' · ' + (result.depth === 'deep' ? '🔬 Deep' : '📄 Standard') + ' · ' + result.elapsed + 's</div>' +
        '<div class="research-history-preview">' + preview + '</div>' +
      '</div>' +
      '<button class="btn btn-sm btn-ghost" style="color: var(--color-error); flex-shrink: 0;" onclick="event.stopPropagation();ResearchPage._deleteResult(\'' + result.id + '\')">🗑️</button>' +
    '</div>';
  },

  _showResult(id) {
    var history = ResearchEngine.getHistory();
    for (var i = 0; i < history.length; i++) {
      if (history[i].id === id) {
        var resultEl = document.getElementById('research-result');
        if (resultEl) {
          resultEl.scrollIntoView({ behavior: 'smooth' });
          resultEl.innerHTML = this._renderReport(history[i]);
        }
        return;
      }
    }
  },

  _deleteResult(id) {
    ResearchEngine.deleteResult(id);
    Toast.show('Research deleted', 'info');
    Router.navigate('/research');
  },

  _copyReport(id) {
    // This is a hack since we can't pass the string directly through onclick
    // Find the report from history
    var history = ResearchEngine.getHistory();
    for (var i = 0; i < history.length; i++) {
      // Match by checking if the element contains this id's text
    }
    // Alternative: copy from the visible report
    var reportBody = document.querySelector('.research-report-body');
    if (reportBody) {
      var text = reportBody.textContent || '';
      navigator.clipboard.writeText(text).then(function() {
        Toast.show('📋 Report copied!', 'success');
      }).catch(function() {
        Toast.show('Could not copy automatically', 'error');
      });
    }
  },

  /**
   * Simple Markdown to HTML renderer.
   */
  _renderMarkdown(text) {
    if (!text) return '';
    var html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d\. (.+)$/gm, '<li>$1</li>')
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return '<p>' + html + '</p>';
  }
};
