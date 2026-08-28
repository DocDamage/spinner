'use strict';

(function attachTabController(root) {
  const tabIndexForKey = (current,length,key) => {
    if (!length) return -1;
    if (key === 'Home') return 0;
    if (key === 'End') return length - 1;
    if (key === 'ArrowRight' || key === 'ArrowDown') return (current + 1 + length) % length;
    if (key === 'ArrowLeft' || key === 'ArrowUp') return (current - 1 + length) % length;
    return current;
  };

  class TabController {
    constructor(element,{onActivate=()=>{}}={}) {
      this.element = element;
      this.onActivate = onActivate;
      element?.addEventListener('keydown',event => this.onKeyDown(event));
    }

    tabs() { return this.element ? [...this.element.querySelectorAll('[role="tab"]')] : []; }

    sync(value) {
      this.tabs().forEach(tab => {
        const active = tab.dataset.v9Tab === value;
        tab.classList.toggle('on',active);
        tab.setAttribute('aria-selected',String(active));
        tab.tabIndex = active ? 0 : -1;
      });
    }

    onKeyDown(event) {
      const tab = event.target.closest?.('[role="tab"]');
      if (!tab) return;
      const tabs = this.tabs(), current = tabs.indexOf(tab), next = tabIndexForKey(current,tabs.length,event.key);
      if (next === current || next < 0) return;
      event.preventDefault();
      const target = tabs[next];
      this.onActivate(target.dataset.v9Tab);
      target.focus();
    }
  }

  const api = {TabController,tabIndexForKey};
  root.MultiverseUI = Object.assign(root.MultiverseUI || {},api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
