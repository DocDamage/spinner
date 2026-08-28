'use strict';

(function attachSaveRepository(root) {
  class SaveRepository {
    constructor(storage, key, version = 9) {
      this.storage = storage;
      this.key = key;
      this.version = version;
    }

    load(migrate = value => value) {
      try {
        const raw = this.storage?.getItem(this.key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const state = migrate(parsed);
        return state && typeof state === 'object' ? state : null;
      } catch {
        return null;
      }
    }

    save(state) {
      if (!state || typeof state !== 'object') throw new TypeError('A state object is required.');
      const snapshot = {...state, schemaVersion:this.version};
      this.storage?.setItem(this.key, JSON.stringify(snapshot));
      return snapshot;
    }

    clear() {
      this.storage?.removeItem(this.key);
    }
  }

  const api = {SaveRepository};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
