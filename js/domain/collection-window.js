'use strict';

(function attachCollectionWindow(root) {
  class CollectionWindow {
    constructor({pageSize=12}={}) {
      this.pageSize = Math.max(1,Number(pageSize || 12));
    }

    select(items,{page=0,query='',text=value => String(value)}={}) {
      const needle = String(query || '').trim().toLocaleLowerCase();
      const filtered = needle ? items.filter(item => text(item).toLocaleLowerCase().includes(needle)) : [...items];
      const pages = Math.max(1,Math.ceil(filtered.length/this.pageSize));
      const safePage = Math.max(0,Math.min(pages-1,Number(page || 0)));
      const start = safePage*this.pageSize;
      return {items:filtered.slice(start,start+this.pageSize),page:safePage,pages,total:items.length,filtered:filtered.length,start,end:Math.min(start+this.pageSize,filtered.length)};
    }
  }

  const api = {CollectionWindow};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {},api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
