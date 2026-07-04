const KBEngine = {
  _initialized: false,

  /**
   * Initialize the knowledge base engine.
   */
  async init() {
    if (this._initialized) return;
    try {
      await MathQuestDB.init();
      this._initialized = true;
    } catch (e) {
      console.warn('KBEngine: IndexedDB not available', e);
    }
  },

  // ========== DOCUMENT MANAGEMENT ==========

  /**
   * Add a document to the knowledge base.
   * @param {string} name - document name
   * @param {string} text - document content
   * @param {string} [type='notes'] - document type
   * @returns {Promise<string|null>} document ID or null
   */
  async addDocument(name, text, type) {
    if (!this._initialized) await this.init();
    if (!text || !text.trim()) return null;

    type = type || 'notes';
    var docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    // Store document metadata
    await MathQuestDB.put('documents', {
      id: docId,
      name: name,
      type: type,
      text: text,
      charCount: text.length,
      createdAt: new Date().toISOString()
    });

    // Chunk and store
    var chunks = this._chunkText(text, 500, 100);
    for (var i = 0; i < chunks.length; i++) {
      await MathQuestDB.put('chunks', {
        docId: docId,
        index: i,
        text: chunks[i],
        charCount: chunks[i].length
      });
    }

    // Trace to memory
    if (typeof MemoryEngine !== 'undefined') {
      MemoryEngine.trace('knowledge', 'added', {
        docId: docId,
        name: name,
        chunks: chunks.length,
        chars: text.length
      });
    }

    return docId;
  },

  /**
   * List all documents.
   * @returns {Promise<array>}
   */
  async listDocuments() {
    if (!this._initialized) await this.init();
    try {
      var docs = await MathQuestDB.getAll('documents');
      // Add chunk count for each doc
      for (var i = 0; i < docs.length; i++) {
        var chunks = await MathQuestDB.getByIndex('chunks', 'docId', docs[i].id);
        docs[i].chunkCount = chunks ? chunks.length : 0;
      }
      // Sort by createdAt descending
      docs.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return docs;
    } catch (e) {
      console.warn('KBEngine: list failed', e);
      return [];
    }
  },

  /**
   * Delete a document and its chunks.
   * @param {string} docId
   */
  async deleteDocument(docId) {
    if (!this._initialized) await this.init();
    try {
      // Delete chunks
      var chunks = await MathQuestDB.getByIndex('chunks', 'docId', docId);
      for (var i = 0; i < chunks.length; i++) {
        await MathQuestDB.delete('chunks', chunks[i].id);
      }
      // Delete document
      await MathQuestDB.delete('documents', docId);

      if (typeof MemoryEngine !== 'undefined') {
        MemoryEngine.trace('knowledge', 'deleted', { docId: docId });
      }
    } catch (e) {
      console.warn('KBEngine: delete failed', e);
    }
  },

  /**
   * Get a single document by ID.
   * @param {string} docId
   * @returns {Promise<object|null>}
   */
  async getDocument(docId) {
    if (!this._initialized) await this.init();
    try {
      return await MathQuestDB.get('documents', docId);
    } catch (e) {
      return null;
    }
  },

  /**
   * Get the total document count.
   * @returns {Promise<number>}
   */
  async getDocumentCount() {
    if (!this._initialized) await this.init();
    try {
      return await MathQuestDB.count('documents');
    } catch (e) {
      return 0;
    }
  },

  // ========== TEXT CHUNKING ==========

  /**
   * Split text into overlapping chunks.
   * @param {string} text
   * @param {number} chunkSize
   * @param {number} overlap
   * @returns {array}
   */
  _chunkText(text, chunkSize, overlap) {
    var chunks = [];
    var start = 0;
    while (start < text.length) {
      var end = Math.min(start + chunkSize, text.length);

      // Try to break at a sentence boundary near the end
      if (end < text.length) {
        var breakAt = this._findBreakPoint(text, end, 50);
        if (breakAt > start) end = breakAt;
      }

      chunks.push(text.slice(start, end));
      start = end - overlap;
      if (start >= text.length) break;
    }
    if (chunks.length === 0 && text.length > 0) {
      chunks.push(text);
    }
    return chunks;
  },

  /**
   * Find a good break point (sentence end or newline) near a position.
   */
  _findBreakPoint(text, around, searchWindow) {
    var start = Math.max(0, around - searchWindow);
    var end = Math.min(text.length, around + Math.floor(searchWindow / 2));
    var segment = text.slice(start, end);

    // Prefer newlines
    var newlineIdx = segment.lastIndexOf('\n');
    if (newlineIdx > Math.floor(searchWindow / 3)) return start + newlineIdx + 1;

    // Then sentence endings
    var sentenceEnd = segment.lastIndexOf('. ');
    if (sentenceEnd > Math.floor(searchWindow / 3)) return start + sentenceEnd + 2;
    sentenceEnd = segment.lastIndexOf('! ');
    if (sentenceEnd > Math.floor(searchWindow / 3)) return start + sentenceEnd + 2;
    sentenceEnd = segment.lastIndexOf('? ');
    if (sentenceEnd > Math.floor(searchWindow / 3)) return start + sentenceEnd + 2;

    // Then period at end of line
    var periodIdx = segment.lastIndexOf('.');
    if (periodIdx > Math.floor(searchWindow / 3)) return start + periodIdx + 1;

    return around;
  },

  // ========== SEARCH / RETRIEVAL ==========

  /**
   * Search for relevant chunks using TF-IDF scoring.
   * @param {string} query
   * @param {number} [topK=3]
   * @returns {Promise<array>} scored results
   */
  async search(query, topK) {
    if (!this._initialized) await this.init();
    if (!query || !query.trim()) return [];
    topK = topK || 3;

    try {
      var chunks = await MathQuestDB.getAll('chunks');
      if (!chunks || chunks.length === 0) return [];

      var queryTerms = query.toLowerCase().split(/\s+/).filter(function(t) { return t.length > 1; });
      if (queryTerms.length === 0) return [];

      var chunkTexts = chunks.map(function(c) { return c.text; });
      var scored = this._computeTFIDF(queryTerms, chunkTexts);

      // Take top K with non-zero score
      var results = [];
      for (var i = 0; i < scored.length && results.length < topK; i++) {
        if (scored[i].score > 0) {
          var chunk = chunks[scored[i].index];
          var doc = await MathQuestDB.get('documents', chunk.docId);
          results.push({
            text: scored[i].chunk,
            score: Math.round(scored[i].score * 1000) / 1000,
            docId: chunk.docId,
            docName: doc ? doc.name : 'Unknown',
            chunkIndex: chunk.index
          });
        }
      }

      return results;
    } catch (e) {
      console.warn('KBEngine: search failed', e);
      return [];
    }
  },

  /**
   * Compute TF-IDF scores for chunks against query terms.
   */
  _computeTFIDF(queryTerms, chunks) {
    var totalDocs = chunks.length;

    // Compute IDF for each term
    var idf = {};
    for (var t = 0; t < queryTerms.length; t++) {
      var term = queryTerms[t];
      var docsWithTerm = 0;
      for (var i = 0; i < chunks.length; i++) {
        if (chunks[i].toLowerCase().indexOf(term) !== -1) {
          docsWithTerm++;
        }
      }
      idf[term] = Math.log((totalDocs + 1) / (docsWithTerm + 1)) + 1;
    }

    // Score each chunk
    var results = [];
    for (var j = 0; j < chunks.length; j++) {
      var chunkLower = chunks[j].toLowerCase();
      var score = 0;
      for (var k = 0; k < queryTerms.length; k++) {
        var qTerm = queryTerms[k];
        // Term frequency in this chunk
        var tf = 0;
        var idx = -1;
        while ((idx = chunkLower.indexOf(qTerm, idx + 1)) !== -1) {
          tf++;
        }
        if (tf > 0) {
          // Normalized TF
          var normalizedTf = 1 + Math.log(tf);
          score += normalizedTf * (idf[qTerm] || 1);
        }
      }
      results.push({ chunk: chunks[j], index: j, score: score });
    }

    results.sort(function(a, b) { return b.score - a.score; });
    return results;
  },

  /**
   * Build RAG context string for AI Tutor system prompt.
   * @param {string} userMessage
   * @returns {Promise<string>}
   */
  async buildRAGContext(userMessage) {
    if (!userMessage) return '';
    try {
      var results = await this.search(userMessage, 3);
      if (!results || results.length === 0) return '';

      var context = '\n\n[Relevant Notes]\n';
      for (var i = 0; i < results.length; i++) {
        context += 'From "' + results[i].docName + '":\n' + results[i].text + '\n\n';
      }
      return context;
    } catch (e) {
      return '';
    }
  }
};
