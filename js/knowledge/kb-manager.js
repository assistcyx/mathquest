const KBManager = {
  _searchResults: null,

  async render(container) {
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      await KBEngine.init();
      var docs = await KBEngine.listDocuments();
      this._render(container, docs);
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Failed to load knowledge base</div>';
    }
  },

  _render(container, docs) {
    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>📚 Knowledge Base</h1>
          <p>Upload study notes and documents — the AI Tutor will use them to give better answers</p>
        </div>

        <div class="kb-page">
          <!-- Upload Section -->
          <div class="kb-upload-card card">
            <h3 style="margin-bottom: var(--space-md);">📄 Add Document</h3>
            <div style="margin-bottom: var(--space-md);">
              <input class="input" id="kb-doc-name" type="text" placeholder="Document name..." style="margin-bottom: var(--space-sm);">
              <textarea class="input" id="kb-doc-text" placeholder="Paste or type your notes here..." style="min-height: 120px; resize: vertical; width: 100%; font-family: var(--font-body);"></textarea>
            </div>
            <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="KBManager._addDocument()">📥 Add to Knowledge Base</button>
              <button class="btn btn-secondary" onclick="KBManager._uploadFile()">📂 Upload .txt / .md</button>
            </div>
            <div id="kb-upload-status" style="margin-top: var(--space-sm);"></div>
          </div>

          <!-- Search Section -->
          <div class="kb-search-card card" style="margin-top: var(--space-lg);">
            <h3 style="margin-bottom: var(--space-md);">🔍 Search Notes</h3>
            <div style="display: flex; gap: var(--space-sm);">
              <input class="input" id="kb-search-input" type="text" placeholder="Search your notes..." style="flex: 1;" onkeydown="if(event.key==='Enter')KBManager._search()">
              <button class="btn btn-primary" onclick="KBManager._search()">🔍 Search</button>
            </div>
            <div id="kb-search-results" style="margin-top: var(--space-md);"></div>
          </div>

          <!-- Document List -->
          <div style="margin-top: var(--space-lg);">
            <h3 style="margin-bottom: var(--space-md);">📋 Your Documents (${docs.length})</h3>
            <div id="kb-doc-list">
              ${docs.length === 0 ? this._emptyState() : docs.map(function(d) { return KBManager._renderDocItem(d); }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _emptyState() {
    return '<div class="memory-empty"><div class="icon">📚</div><h3>No documents yet</h3><p>Upload study notes or paste text above to build your knowledge base. The AI Tutor will search these notes when answering questions.</p></div>';
  },

  _renderDocItem(doc) {
    var dateStr = new Date(doc.createdAt).toLocaleDateString();
    var typeIcons = { notes: '📝', textbook: '📖', cheatsheet: '📋', summary: '📄' };
    var icon = typeIcons[doc.type] || '📄';
    var preview = doc.text ? doc.text.slice(0, 100) + (doc.text.length > 100 ? '...' : '') : '';

    return '<div class="kb-doc-item" data-doc-id="' + doc.id + '">' +
      '<div class="kb-doc-icon">' + icon + '</div>' +
      '<div class="kb-doc-info">' +
        '<div class="kb-doc-name">' + doc.name + '</div>' +
        '<div class="kb-doc-meta">' + doc.type + ' · ' + (doc.charCount || 0) + ' chars · ' + (doc.chunkCount || 0) + ' chunks · ' + dateStr + '</div>' +
        '<div class="kb-doc-preview">' + this._escapeHtml(preview) + '</div>' +
      '</div>' +
      '<div class="kb-doc-actions">' +
        '<button class="btn btn-sm btn-ghost" onclick="KBManager._viewDocument(\'' + doc.id + '\')" title="View">👁️</button>' +
        '<button class="btn btn-sm btn-ghost" style="color: var(--color-error);" onclick="KBManager._deleteDocument(\'' + doc.id + '\', \'' + doc.name.replace(/'/g, "\\'") + '\')" title="Delete">🗑️</button>' +
      '</div>' +
    '</div>';
  },

  // ========== ADD DOCUMENT ==========

  async _addDocument() {
    var nameInput = document.getElementById('kb-doc-name');
    var textInput = document.getElementById('kb-doc-text');
    var statusEl = document.getElementById('kb-upload-status');

    var name = (nameInput ? nameInput.value.trim() : '') || 'Untitled Notes';
    var text = textInput ? textInput.value.trim() : '';

    if (!text) {
      if (statusEl) statusEl.innerHTML = '<div style="color: var(--color-error); font-size: var(--text-sm);">Please enter or paste some text.</div>';
      return;
    }

    if (statusEl) statusEl.innerHTML = '<div style="color: var(--color-text-muted); font-size: var(--text-sm);">⏳ Indexing document...</div>';

    var docId = await KBEngine.addDocument(name, text, 'notes');

    if (statusEl) {
      statusEl.innerHTML = '<div style="color: var(--color-success); font-size: var(--text-sm);">✅ Added "' + name + '" to knowledge base!</div>';
    }

    if (nameInput) nameInput.value = '';
    if (textInput) textInput.value = '';

    // Refresh document list
    var docs = await KBEngine.listDocuments();
    var listEl = document.getElementById('kb-doc-list');
    if (listEl) {
      listEl.innerHTML = docs.map(function(d) { return KBManager._renderDocItem(d); }).join('');
    }
  },

  async _uploadFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.csv';
    input.onchange = async function(event) {
      var file = event.target.files[0];
      if (!file) return;

      var nameInput = document.getElementById('kb-doc-name');
      var statusEl = document.getElementById('kb-upload-status');
      if (nameInput) nameInput.value = file.name.replace(/\.[^/.]+$/, '');

      if (statusEl) statusEl.innerHTML = '<div style="color: var(--color-text-muted); font-size: var(--text-sm);">⏳ Reading file...</div>';

      var reader = new FileReader();
      reader.onload = async function(e) {
        var textArea = document.getElementById('kb-doc-text');
        if (textArea) textArea.value = e.target.result;
        if (statusEl) statusEl.innerHTML = '<div style="color: var(--color-success); font-size: var(--text-sm);">✅ File loaded! Click "Add to Knowledge Base" to index it.</div>';
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // ========== SEARCH ==========

  async _search() {
    var input = document.getElementById('kb-search-input');
    var resultsEl = document.getElementById('kb-search-results');
    if (!input || !resultsEl) return;

    var query = input.value.trim();
    if (!query) {
      resultsEl.innerHTML = '';
      return;
    }

    resultsEl.innerHTML = '<div style="color: var(--color-text-muted); font-size: var(--text-sm);">🔍 Searching...</div>';

    var results = await KBEngine.search(query, 5);

    if (!results || results.length === 0) {
      resultsEl.innerHTML = '<div style="color: var(--color-text-muted); font-size: var(--text-sm);">No relevant results found.</div>';
      return;
    }

    var html = '<div style="font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-sm);">Top ' + results.length + ' results:</div>';
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      html += '<div class="kb-search-result">' +
        '<div class="kb-result-header">' +
          '<span class="kb-result-source">📄 ' + r.docName + '</span>' +
          '<span class="kb-result-score" style="color: ' + (r.score > 0.5 ? 'var(--color-success)' : 'var(--color-text-muted)') + ';">' + (r.score * 100).toFixed(0) + '% match</span>' +
        '</div>' +
        '<div class="kb-result-text">' + this._escapeHtml(r.text) + '</div>' +
      '</div>';
    }
    resultsEl.innerHTML = html;
  },

  // ========== VIEW / DELETE ==========

  async _viewDocument(docId) {
    var doc = await KBEngine.getDocument(docId);
    if (!doc) {
      Toast.show('Document not found', 'error');
      return;
    }

    var html = '<div style="max-height: 60vh; overflow-y: auto;">' +
      '<pre style="white-space: pre-wrap; font-family: var(--font-body); font-size: var(--text-sm); line-height: 1.7; background: var(--color-bg-alt); padding: var(--space-md); border-radius: var(--radius-md);">' +
      this._escapeHtml(doc.text) +
      '</pre></div>';

    Modal.confirm({
      title: '📄 ' + doc.name,
      content: html,
      confirmText: 'Close',
      onConfirm: function() { Modal.close(); }
    });
  },

  async _deleteDocument(docId, docName) {
    Modal.confirm({
      title: '🗑️ Delete Document',
      message: 'Are you sure you want to delete "' + docName + '"? It will no longer be searchable by the AI Tutor.',
      confirmText: '🗑️ Delete',
      variant: 'btn-error',
      onConfirm: async function() {
        await KBEngine.deleteDocument(docId);
        Toast.show('Deleted "' + docName + '"', 'info');
        Router.navigate('/knowledge-base');
      }
    });
  },

  _escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
