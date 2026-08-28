'use strict';

(function attachViewTemplates(root) {
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

  class ViewTemplates {
    intent(plan) {
      const danger = [1,2,3].map(value => `<i class="${value <= plan.intent.danger ? 'on' : ''}"></i>`).join('');
      return `<div class="v9-intent"><span class="icon">${escapeHtml(plan.intent.icon)}</span><div><b>ENEMY INTENT • ${escapeHtml(plan.intent.label)}</b><small>${escapeHtml(plan.technique.t.name)} — ${escapeHtml(plan.intent.telegraph)}</small></div><span class="v9-danger">${danger}</span></div>`;
    }

    combatPreview(preview, details = {}) {
      const reasons = (preview.reasons || []).map(reason => `<li>${escapeHtml(reason)}</li>`).join('');
      return `<div class="v9-preview"><span><b>${Math.round(preview.accuracy*100)}%</b>HIT</span><span><b>${preview.minDamage}–${preview.maxDamage}</b>DAMAGE</span><span><b>${preview.energy}</b>ENERGY</span><span><b>${preview.cooldown}</b>COOLDOWN</span></div><details class="v9-breakdown"><summary>Why these numbers?</summary><ul>${reasons}<li>Counter coverage: ${Math.round(Number(details.counterCoverage || 0)*100)}%</li><li>Synergy: ${Number(details.synergyScore || 0)}</li></ul></details>`;
    }
  }

  const api = {ViewTemplates, escapeHtml};
  root.MultiverseUI = Object.assign(root.MultiverseUI || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
