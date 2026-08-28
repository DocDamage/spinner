'use strict';

(function attachDerivedStateCache(root) {
  class DerivedStateCache {
    constructor() {
      this.entries = new Map();
      this.hits = 0;
      this.misses = 0;
    }

    key(parts) {
      return JSON.stringify(parts);
    }

    memo(namespace, key, compute, copy = value => value) {
      const previous = this.entries.get(namespace);
      if (previous?.key === key) {
        this.hits++;
        return copy(previous.value);
      }
      this.misses++;
      const value = compute();
      this.entries.set(namespace, {key, value});
      return copy(value);
    }

    clear(namespace) {
      if (namespace) this.entries.delete(namespace);
      else this.entries.clear();
    }

    report() {
      const total = this.hits + this.misses;
      return {
        hits:this.hits,
        misses:this.misses,
        hitRate:total ? this.hits / total : 0,
        namespaces:[...this.entries.keys()]
      };
    }
  }

  const api = {DerivedStateCache};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
