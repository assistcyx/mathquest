const MemoryInspector = {
  _activeTab: 'events',

  render(container) {
    const mem = MemoryEngine.inspect();

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🧠 Learning Memory</h1>
          <p>See everything the AI remembers about your learning journey</p>
        </div>

        <div class="memory-page">
          <!-- Stats -->
          <div class="memory-stats">
            <div class="memory-stat-card">
              <div class="stat-value">${mem.stats.totalEvents}</div>
              <div class="stat-label">📋 Events (L1)</div>
            </div>
            <div class="memory-stat-card">
              <div class="stat-value">${mem.stats.totalFacts}</div>
              <div class="stat-label">💡 Facts (L2)</div>
            </div>
            <div class="memory-stat-card">
              <div class="stat-value">${mem.stats.totalSyntheses}</div>
              <div class="stat-label">📝 Syntheses (L3)</div>
            </div>
            <div class="memory-stat-card">
              <div class="stat-value" style="font-size: var(--text-sm);">${mem.stats.lastEvent ? new Date(mem.stats.lastEvent.timestamp).toLocaleDateString() : '—'}</div>
              <div class="stat-label">🕐 Last Activity</div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="memory-tabs">
            <button class="memory-tab active" onclick="MemoryInspector._switchTab('events')">📋 Events (L1)</button>
            <button class="memory-tab" onclick="MemoryInspector._switchTab('facts')">💡 Facts (L2)</button>
            <button class="memory-tab" onclick="MemoryInspector._switchTab('syntheses')">📝 Syntheses (L3)</button>
            <button class="memory-tab" onclick="MemoryInspector._switchTab('trace')">🔍 Trace Explorer</button>
          </div>

          <!-- Events Tab -->
          <div class="memory-tab-content active" id="mem-tab-events">
            ${this._renderEvents(mem.events)}
          </div>

          <!-- Facts Tab -->
          <div class="memory-tab-content" id="mem-tab-facts">
            ${this._renderFacts(mem.facts)}
          </div>

          <!-- Syntheses Tab -->
          <div class="memory-tab-content" id="mem-tab-syntheses">
            ${this._renderSyntheses(mem.syntheses)}
          </div>

          <!-- Trace Tab -->
          <div class="memory-tab-content" id="mem-tab-trace">
            ${this._renderTraceExplorer()}
          </div>
        </div>
      </div>
    `;
  },

  _switchTab(tabId) {
    this._activeTab = tabId;
    // Update tab buttons
    document.querySelectorAll('.memory-tab').forEach(function(tab, i) {
      var tabs = ['events', 'facts', 'syntheses', 'trace'];
      tab.classList.toggle('active', tabs[i] === tabId);
    });
    // Update tab content
    document.querySelectorAll('.memory-tab-content').forEach(function(content) {
      content.classList.remove('active');
    });
    var activeContent = document.getElementById('mem-tab-' + tabId);
    if (activeContent) activeContent.classList.add('active');
  },

  // ========== EVENTS (L1) ==========

  _renderEvents(events) {
    if (!events || events.length === 0) {
      return this._emptyState('📋', 'No events yet', 'Events are recorded when you complete lessons, answer quizzes, or use hints.');
    }

    // Category icons
    var catIcons = {
      lesson: '📖',
      quiz: '🎯',
      hint: '💡',
      ai_chat: '🤖',
      game: '🎮',
      knowledge: '📚',
      research: '🔬'
    };

    // Build unique categories for filters
    var categories = {};
    events.forEach(function(e) {
      categories[e.category] = true;
    });
    var catList = Object.keys(categories);

    var html = '';

    // Filters
    html += '<div class="memory-filters" id="mem-event-filters">';
    html += '<button class="memory-filter-btn active" data-cat="all" onclick="MemoryInspector._filterEvents(\'all\')">All</button>';
    catList.forEach(function(cat) {
      html += '<button class="memory-filter-btn" data-cat="' + cat + '" onclick="MemoryInspector._filterEvents(\'' + cat + '\')">' + (catIcons[cat] || '📌') + ' ' + cat + '</button>';
    });
    html += '</div>';

    // Timeline
    html += '<div class="memory-timeline" id="mem-event-timeline">';
    // Show newest first (reverse)
    for (var i = events.length - 1; i >= 0; i--) {
      var e = events[i];
      var time = new Date(e.timestamp);
      var timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      var icon = catIcons[e.category] || '📌';

      html += '<div class="memory-event memory-event-type-' + e.category + '" data-cat="' + e.category + '">';
      html += '  <div class="memory-event-header">';
      html += '    <span class="memory-event-category">' + icon + ' ' + e.category + ' → ' + e.action + '</span>';
      html += '    <span class="memory-event-time">' + timeStr + '</span>';
      html += '  </div>';
      html += '  <div class="memory-event-details">' + this._formatDetails(e.details) + '</div>';
      html += '  <div style="font-size: 10px; color: var(--color-text-muted); margin-top: var(--space-xs); font-family: monospace;">' + e.id + '</div>';
      html += '</div>';
    }
    html += '</div>';

    return html;
  },

  _formatDetails(details) {
    if (!details || Object.keys(details).length === 0) return '—';
    var parts = [];
    for (var key in details) {
      if (details.hasOwnProperty(key)) {
        parts.push('<code>' + key + '</code>: ' + details[key]);
      }
    }
    return parts.join(' · ');
  },

  _filterEvents(category) {
    // Update filter buttons
    document.querySelectorAll('.memory-filter-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === category);
    });

    // Show/hide events
    document.querySelectorAll('.memory-event').forEach(function(el) {
      if (category === 'all' || el.getAttribute('data-cat') === category) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  },

  // ========== FACTS (L2) ==========

  _renderFacts(facts) {
    var keys = Object.keys(facts);
    if (keys.length === 0) {
      return this._emptyState('💡', 'No facts yet', 'Facts are created when the system learns about your progress, strengths, and areas for improvement.');
    }

    var html = '';
    html += '<div style="overflow-x: auto;">';
    html += '<table class="memory-facts-table">';
    html += '  <thead><tr><th>Key</th><th>Value</th><th>Confidence</th><th>Updated</th><th>Source</th><th></th></tr></thead>';
    html += '  <tbody>';

    // Sort by key
    var sortedKeys = keys.slice().sort();
    for (var i = 0; i < sortedKeys.length; i++) {
      var key = sortedKeys[i];
      var f = facts[key];
      var confClass = f.confidence >= 0.6 ? 'high' : f.confidence >= 0.3 ? 'medium' : 'low';
      var valueStr = typeof f.value === 'object' ? JSON.stringify(f.value) : String(f.value);
      var dateStr = new Date(f.updatedAt).toLocaleDateString();

      html += '<tr>';
      html += '  <td><code style="font-size: var(--text-xs);">' + key + '</code></td>';
      html += '  <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + valueStr.replace(/"/g, '&quot;') + '">' + valueStr + '</td>';
      html += '  <td>';
      html += '    <span class="confidence-bar"><span class="confidence-fill confidence-' + confClass + '" style="width: ' + (f.confidence * 100) + '%"></span></span>';
      html += '    <span style="font-size: var(--text-xs); margin-left: var(--space-xs);">' + Math.round(f.confidence * 100) + '%</span>';
      html += '  </td>';
      html += '  <td style="font-size: var(--text-xs);">' + dateStr + '</td>';
      html += '  <td><span class="fact-source" title="' + (f.source || '') + '">' + (f.source || '—') + '</span></td>';
      html += '  <td>';
      if (f.history && f.history.length > 0) {
        html += '    <button class="fact-history-btn" onclick="MemoryInspector._showFactHistory(\'' + key.replace(/'/g, "\\'") + '\')">📜 ' + f.history.length + '</button>';
      }
      html += '  </td>';
      html += '</tr>';
    }

    html += '  </tbody>';
    html += '</table>';
    html += '</div>';

    return html;
  },

  _showFactHistory(key) {
    var fact = MemoryEngine.recall(key);
    if (!fact || !fact.history) return;

    var html = '<div style="padding: var(--space-md);">';
    html += '<h4 style="margin-bottom: var(--space-md);">History for: <code>' + key + '</code></h4>';
    html += '<div style="display: flex; flex-direction: column; gap: var(--space-xs);">';

    // Current value first
    html += '<div style="padding: var(--space-sm); background: var(--color-primary-lighter); border-radius: var(--radius-sm);">';
    html += '  <strong>Current:</strong> ' + fact.value + ' (confidence: ' + Math.round(fact.confidence * 100) + '%)';
    html += '</div>';

    // History (oldest to newest)
    for (var i = 0; i < fact.history.length; i++) {
      html += '<div style="padding: var(--space-sm); background: var(--color-bg-alt); border-radius: var(--radius-sm);">';
      html += '  <span style="font-size: var(--text-xs); color: var(--color-text-muted);">v' + (i + 1) + ':</span> ' + fact.history[i];
      html += '</div>';
    }

    html += '</div></div>';

    Modal.confirm({
      title: '📜 Fact History',
      content: html,
      confirmText: 'Close',
      onConfirm: function() { Modal.close(); }
    });
  },

  // ========== SYNTHESES (L3) ==========

  _renderSyntheses(syntheses) {
    if (!syntheses || syntheses.length === 0) {
      return this._emptyState('📝', 'No syntheses yet', 'Syntheses are AI-generated summaries of your learning progress. They appear after using AI research or study planning.');
    }

    var typeIcons = {
      study_plan: '📋',
      weakness_analysis: '🔍',
      recommendation: '💡',
      research_report: '📄'
    };

    var html = '';
    // Show newest first
    for (var i = syntheses.length - 1; i >= 0; i--) {
      var s = syntheses[i];
      var icon = typeIcons[s.type] || '📝';
      var dateStr = new Date(s.createdAt).toLocaleDateString() + ' ' + new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += '<div class="synthesis-card">';
      html += '  <div class="synthesis-header">';
      html += '    <span class="synthesis-type">' + icon + ' ' + s.type.split('_').join(' ') + '</span>';
      html += '    <span class="synthesis-date">' + dateStr + '</span>';
      html += '  </div>';
      html += '  <div class="synthesis-content">' + s.content + '</div>';
      if (s.sourceEvents && s.sourceEvents.length > 0) {
        html += '  <div class="synthesis-sources">📎 Sources: ' + s.sourceEvents.join(', ') + '</div>';
      }
      html += '</div>';
    }

    return html;
  },

  // ========== TRACE EXPLORER ==========

  _renderTraceExplorer() {
    return `
      <div class="trace-explorer">
        <h3>🔍 Trace Explorer</h3>
        <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-md);">
          Enter a fact key to trace its evidence chain back to the original learning events.
        </p>
        <div class="trace-input-group">
          <input type="text" id="trace-input" placeholder="e.g. mastery.derivatives, struggle.chain-rule" onkeydown="if(event.key==='Enter')MemoryInspector._doTrace()">
          <button class="btn btn-primary" onclick="MemoryInspector._doTrace()">🔍 Trace</button>
        </div>
        <div id="trace-result"></div>
      </div>

      <div style="margin-top: var(--space-lg);">
        <h4 style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-sm);">Suggestions</h4>
        <div style="display: flex; gap: var(--space-xs); flex-wrap: wrap;">
          ${this._getSuggestions()}
        </div>
      </div>
    `;
  },

  _getSuggestions() {
    var facts = MemoryEngine.inspect().facts;
    var keys = Object.keys(facts);
    if (keys.length === 0) return '<span style="font-size: var(--text-xs); color: var(--color-text-muted);">No facts yet — complete a lesson to create one!</span>';

    return keys.slice(0, 8).map(function(key) {
      return '<button class="btn btn-sm btn-ghost" onclick="document.getElementById(\'trace-input\').value=\'' + key.replace(/'/g, "\\'") + '\';MemoryInspector._doTrace()">' + key + '</button>';
    }).join('');
  },

  _doTrace() {
    var input = document.getElementById('trace-input');
    var resultDiv = document.getElementById('trace-result');
    if (!input || !resultDiv) return;

    var key = input.value.trim();
    if (!key) {
      resultDiv.innerHTML = '<div style="color: var(--color-error);">Please enter a fact key.</div>';
      return;
    }

    var trace = MemoryEngine.traceClaim(key);
    if (!trace) {
      resultDiv.innerHTML = '<div style="color: var(--color-text-muted);">No fact found for key: <code>' + key + '</code></div>';
      return;
    }

    var html = '<div class="trace-result">';
    html += '<strong>Fact:</strong> <code>' + key + '</code><br>';
    html += '<strong>Value:</strong> ' + trace.fact.value + '<br>';
    html += '<strong>Confidence:</strong> ' + Math.round(trace.fact.confidence * 100) + '%<br>';
    html += '<strong>Last updated:</strong> ' + new Date(trace.fact.updatedAt).toLocaleString() + '<br>';

    if (trace.sourceEvent) {
      var e = trace.sourceEvent;
      html += '<strong>Source event:</strong> ' + e.category + '/' + e.action + ' at ' + new Date(e.timestamp).toLocaleString() + '<br>';
      html += '<div style="margin-left: var(--space-md); font-size: var(--text-xs); color: var(--color-text-muted);">';
      html += '  Event ID: ' + e.id + '<br>';
      html += '  Details: ' + JSON.stringify(e.details);
      html += '</div>';
    }

    if (trace.chain && trace.chain.length > 0) {
      html += '<div class="trace-chain"><strong>Previous values:</strong><br>';
      for (var i = 0; i < trace.chain.length; i++) {
        html += '• v' + (i + 1) + ': ' + trace.chain[i].value + ' (' + trace.chain[i].note + ')<br>';
      }
      html += '</div>';
    }

    html += '</div>';
    resultDiv.innerHTML = html;
  },

  // ========== UTILITY ==========

  _emptyState(icon, title, message) {
    return '<div class="memory-empty"><div class="icon">' + icon + '</div><h3>' + title + '</h3><p>' + message + '</p></div>';
  }
};
