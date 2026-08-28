'use strict';

(function attachDialogController(root) {
  const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const wrappedIndex = (index,length) => length ? (index + length) % length : -1;

  class DialogController {
    constructor(element,{openClass='open',onClose=null}={}) {
      this.element = element;
      this.openClass = openClass;
      this.onClose = onClose;
      this.trigger = null;
      this.onKeyDown = this.onKeyDown.bind(this);
      element?.setAttribute('role','dialog');
      element?.setAttribute('aria-modal','true');
      element?.setAttribute('aria-hidden','true');
      element?.addEventListener('keydown',this.onKeyDown);
    }

    focusable() {
      return this.element ? [...this.element.querySelectorAll(FOCUSABLE)].filter(node => !node.hidden && node.getAttribute('aria-hidden') !== 'true') : [];
    }

    open(trigger = null) {
      if (!this.element) return;
      this.trigger = trigger || (typeof document !== 'undefined' ? document.activeElement : null);
      this.element.classList.add(this.openClass);
      this.element.setAttribute('aria-hidden','false');
      const focus = () => (this.element.querySelector('[data-dialog-initial]') || this.focusable()[0])?.focus();
      if (typeof queueMicrotask === 'function') queueMicrotask(focus); else focus();
    }

    close() {
      if (!this.element?.classList.contains(this.openClass)) return;
      this.element.classList.remove(this.openClass);
      this.element.setAttribute('aria-hidden','true');
      this.onClose?.();
      this.trigger?.focus?.();
      this.trigger = null;
    }

    onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = this.focusable();
      if (!items.length) return event.preventDefault();
      const current = items.indexOf(event.target);
      const next = event.shiftKey ? wrappedIndex(current <= 0 ? -1 : current - 1,items.length) : wrappedIndex(current < 0 || current === items.length - 1 ? 0 : current + 1,items.length);
      if ((event.shiftKey && current <= 0) || (!event.shiftKey && (current < 0 || current === items.length - 1))) {
        event.preventDefault();
        items[next].focus();
      }
    }
  }

  const api = {DialogController, wrappedIndex};
  root.MultiverseUI = Object.assign(root.MultiverseUI || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
