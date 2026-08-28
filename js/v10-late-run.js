'use strict';

// V9.2 late-run UI: window large collections and create expensive power
// descriptions only when the player opens a source card.
(() => {
  const {CollectionWindow} = MultiverseDomain;
  const P = MultiverseWheel.prototype;
  const powerWindow = new CollectionWindow({pageSize:12});

  P.powerLibraryStateV10 = function() {
    return this._powerLibraryStateV10 ||= {page:0,query:'',open:new Set()};
  };

  P.powerSourceBodyV10 = function(character) {
    const trait = MultiverseDomain.SIGNATURE_TRAITS?.[character.id];
    return `<div class="item-meta">${esc(character.version)} • ${esc(character.signature)}</div><div class="tags">${(character.tags||[]).map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}</div>${trait?`<div class="v9-note"><b>${esc(trait.name)}</b> • ${esc(trait.description)}</div>`:''}<ul class="power-list">${(character.powers||[]).map(power=>`<li>${esc(power)}</li>`).join('')}</ul>${character.forms?.length?`<div class="item-special">Forms in profile: ${character.forms.map(esc).join(' • ')}</div>`:''}<div class="weakness"><strong>Source weakness:</strong> ${esc(character.weakness)}</div>`;
  };

  P.renderPowerLibrary = function() {
    const root = document.getElementById('power-library');
    if (!root) return;
    const state = this.powerLibraryStateV10();
    const loadout = this.powerLoadout();
    const active = new Set(loadout.active);
    const sources = (this.state.kits || []).map(kit => ({kit,character:CHAR.get(kit.id)})).filter(item => item.character);
    const view = powerWindow.select(sources,{page:state.page,query:state.query,text:item => `${item.character.name} ${item.character.universe} ${(item.character.tags||[]).join(' ')}`});
    state.page = view.page;
    document.getElementById('power-set-count').textContent = `${sources.length} sets • ${loadout.active.length}/3 active`;
    const controls = `<div class="v10-library-tools"><label><span>FILTER POWER SOURCES</span><input type="search" data-v10-power-search value="${esc(state.query)}" placeholder="Name, universe, or tag" autocomplete="off"></label><div><span>Showing ${view.filtered?view.start+1:0}–${view.end} of ${view.filtered}</span><button type="button" data-v10-power-page="${view.page-1}" ${view.page<=0?'disabled':''}>PREVIOUS</button><b>${view.page+1}/${view.pages}</b><button type="button" data-v10-power-page="${view.page+1}" ${view.page>=view.pages-1?'disabled':''}>NEXT</button></div></div>`;
    const cards = view.items.map(({kit,character}) => {
      const open = state.open.has(character.id);
      return `<details class="power-card v10-power-card ${active.has(character.id)?'active':''}" data-v10-power-card="${character.id}" ${open?'open':''}><summary><span class="v6-summary-person"><img loading="lazy" src="${this.characterPortrait(character)}" alt=""><i><b>${esc(character.name)}</b><small>${esc(character.universe)} • Mastery ${kit.mastery||1}/5 • ${active.has(character.id)?'ACTIVE':'PASSIVE'}</small></i></span><span>${character.powers.length} POWERS</span></summary><div class="power-body" data-v10-power-body>${open?this.powerSourceBodyV10(character):''}</div></details>`;
    }).join('');
    root.innerHTML = controls + (cards || '<div class="event-empty v10-library-empty">No acquired power sources match this filter.</div>');
  };

  P.renderLog = function() {
    const root = document.getElementById('log-list');
    if (!root) return;
    document.getElementById('seed-label').textContent = `SEED ${String(this.state.seed>>>0).padStart(10,'0')}`;
    document.documentElement.dataset.v5Origins = String(DATA.characters.length);
    document.documentElement.dataset.v5Forms = String(DATA.transformations.length);
    document.documentElement.dataset.v5Mode = this.state.balanceMode;
    const fallback = [{message:`[INIT] Real-roster matrix ready. ${DATA.characters.length} character profiles, ${DATA.hazards.length} hazards, and a power-heavy wheel are loaded.`,type:'info'}];
    const entries = this.state.log.length ? this.state.log : fallback;
    const limit = this._expandedLogV10 ? entries.length : Math.min(40,entries.length);
    root.innerHTML = entries.slice(0,limit).map(entry => `<div class="log-entry ${esc(entry.type)}">${esc(entry.message)}</div>`).join('') + (entries.length>40?`<button type="button" class="v10-log-toggle" data-v10-log-more>${this._expandedLogV10?'SHOW RECENT 40':`SHOW ALL ${entries.length}`}</button>`:'');
  };

  const bindV10Late = P.bind;
  P.bind = function() {
    bindV10Late.call(this);
    if (this._v10LateBound) return;
    this._v10LateBound = true;
    document.addEventListener('click',event => {
      const page = event.target.closest('[data-v10-power-page]');
      if (page) { this.powerLibraryStateV10().page=Number(page.dataset.v10PowerPage); return this.renderPowerLibrary(); }
      if (event.target.closest('[data-v10-log-more]')) { this._expandedLogV10=!this._expandedLogV10; return this.renderLog(); }
    });
    document.addEventListener('input',event => {
      if (!event.target.matches('[data-v10-power-search]')) return;
      const value = event.target.value;
      clearTimeout(this._powerSearchTimerV10);
      this._powerSearchTimerV10 = setTimeout(() => {
        const state=this.powerLibraryStateV10();state.query=value;state.page=0;this.renderPowerLibrary();
        const input=document.querySelector('[data-v10-power-search]');input?.focus();input?.setSelectionRange(value.length,value.length);
      },120);
    });
    document.addEventListener('toggle',event => {
      const card = event.target.closest?.('[data-v10-power-card]');
      if (!card) return;
      const id=card.dataset.v10PowerCard,state=this.powerLibraryStateV10();
      if (!card.open) { state.open.delete(id); return; }
      state.open.add(id);
      const body=card.querySelector('[data-v10-power-body]');
      if (body && !body.childElementCount) body.innerHTML=this.powerSourceBodyV10(CHAR.get(id));
    },true);
  };
})();
