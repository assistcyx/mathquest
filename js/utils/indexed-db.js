const MathQuestDB = {
  DB_NAME: 'MathQuestKB',
  DB_VERSION: 2,
  _db: null,
  _ready: null,

  /**
   * Open the IndexedDB database and create object stores if needed.
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this._db) return this._db;
    if (this._ready) return this._ready;

    this._ready = new Promise(function(resolve, reject) {
      var request = indexedDB.open(MathQuestDB.DB_NAME, MathQuestDB.DB_VERSION);

      request.onupgradeneeded = function(event) {
        var db = event.target.result;

        if (!db.objectStoreNames.contains('documents')) {
          var docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('name', 'name', { unique: false });
          docStore.createIndex('type', 'type', { unique: false });
          docStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('chunks')) {
          var chunkStore = db.createObjectStore('chunks', { keyPath: 'id', autoIncrement: true });
          chunkStore.createIndex('docId', 'docId', { unique: false });
          chunkStore.createIndex('index', 'index', { unique: false });
        }
      };

      request.onsuccess = function(event) {
        MathQuestDB._db = event.target.result;
        resolve(MathQuestDB._db);
      };

      request.onerror = function(event) {
        console.warn('IndexedDB: failed to open', event.target.error);
        reject(event.target.error);
      };
    });

    return this._ready;
  },

  /**
   * Store a record in an object store.
   * @param {string} storeName
   * @param {object} data
   * @returns {Promise}
   */
  async put(storeName, data) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var req = store.put(data);
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  },

  /**
   * Get a record by its key.
   * @param {string} storeName
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async get(storeName, id) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var req = store.get(id);
      req.onsuccess = function() { resolve(req.result || null); };
      req.onerror = function() { reject(req.error); };
    });
  },

  /**
   * Get all records from a store.
   * @param {string} storeName
   * @returns {Promise<array>}
   */
  async getAll(storeName) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var req = store.getAll();
      req.onsuccess = function() { resolve(req.result || []); };
      req.onerror = function() { reject(req.error); };
    });
  },

  /**
   * Query records by an index value.
   * @param {string} storeName
   * @param {string} indexName
   * @param {*} value
   * @returns {Promise<array>}
   */
  async getByIndex(storeName, indexName, value) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var index = store.index(indexName);
      var req = index.getAll(value);
      req.onsuccess = function() { resolve(req.result || []); };
      req.onerror = function() { reject(req.error); };
    });
  },

  /**
   * Delete a record by its key.
   * @param {string} storeName
   * @param {string|number} id
   * @returns {Promise}
   */
  async delete(storeName, id) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var req = store.delete(id);
      req.onsuccess = function() { resolve(); };
      req.onerror = function() { reject(req.error); };
    });
  },

  /**
   * Clear all records from a store.
   * @param {string} storeName
   * @returns {Promise}
   */
  async clear(storeName) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      var req = store.clear();
      req.onsuccess = function() { resolve(); };
      req.onerror = function() { reject(req.error); };
    });
  },

  /**
   * Count records in a store.
   * @param {string} storeName
   * @returns {Promise<number>}
   */
  async count(storeName) {
    var db = await this.init();
    return new Promise(function(resolve, reject) {
      var tx = db.transaction(storeName, 'readonly');
      var store = tx.objectStore(storeName);
      var req = store.count();
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
  }
};
