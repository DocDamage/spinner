'use strict';

// V9.3 combat guidance: rank the currently usable move/strategy combinations
// without taking control away from the player.
(() => {
  const {CombatAdvisor,CombatEngine} = MultiverseDomain;
  const P = MultiverseWheel.prototype;
  const advisor = new CombatAdvisor();
  const previewEngine = new CombatEngine();

  P.tacticalAdviceV10 = function(p) {
    if (!p || !['battle','boss'].includes(p.type) || p.stage === 'result' || p.stage === 'battle_reward') return null;
    const enemy = this.battleProfile(p), state = this.combat8(p), fighter = this.fighter(state);
    const plan = this.enemyIntentV9(p,enemy,state);
    const techniques = this.fighterTech(enemy,state);
    const strategies = Object.entries(STRATEGIES).map(([id,details]) => ({id,name:details.short || titleCase(id),odds:this.battleOdds(p,id)}));
    return advisor.advise({
      techniques,
      strategies,
      intent:plan.intent,
      fighterEnergy:fighter.energy,
      cooldowns:state.playerCooldowns,
      history:state.playerHistory,
      specFor:technique => this.spec(technique),
      keyFor:technique => this.techKey(technique),
      previewFor:(technique,spec,strategy) => {
        const matchup=this.interactionDelta(enemy,technique).delta;
        const resistance=this.resMult(enemy.tags || [],technique.tags || [],this.weaknessTags(enemy));
        const repetition=state.playerHistory.filter(key => key === this.techKey(technique)).length;
        return previewEngine.preview({fighter,enemy,technique,spec,strategyOdds:strategy.odds,repetition,matchup,resistance});
      }
    });
  };

  const renderCombatV10Advice = P.renderCombat;
  P.renderCombat = function(p) {
    renderCombatV10Advice.call(this,p);
    const advice=this.tacticalAdviceV10(p);
    if (!advice || !this.eventPanel) return;
    if (advice.kind === 'recover') {
      this.eventPanel.querySelector('.v9-preview')?.insertAdjacentHTML('afterend',`<div class="v10-advice recover" role="status"><span>TACTICAL READ</span><b>${esc(advice.label)}</b><p>${esc(advice.reason)}</p></div>`);
      return;
    }
    const techniqueButton=[...this.eventPanel.querySelectorAll('[data-action="technique"]')].find(button => button.dataset.value === advice.techniqueId);
    const strategyButton=[...this.eventPanel.querySelectorAll('[data-action="strategy"]')].find(button => button.dataset.value === advice.strategyId);
    techniqueButton?.classList.add('v10-recommended');
    strategyButton?.classList.add('v10-recommended');
    if (techniqueButton) techniqueButton.setAttribute('aria-label',`${techniqueButton.textContent.trim()} — recommended`);
    if (strategyButton) strategyButton.setAttribute('aria-label',`${strategyButton.textContent.trim()} — recommended`);
    const reason=advice.reasons.join(' • ');
    this.eventPanel.querySelector('.v9-preview')?.insertAdjacentHTML('afterend',`<div class="v10-advice" role="status"><span>TACTICAL READ</span><div><b>${esc(advice.techniqueName)} + ${esc(advice.strategyName)}</b><p>${esc(reason)}</p></div><button type="button" data-v10-apply-advice data-technique="${esc(advice.techniqueId)}" data-strategy="${esc(advice.strategyId)}">STAGE MOVE</button></div>`);
  };

  P.applyTacticalAdviceV10 = function(button) {
    const p=this.state.pending;
    if (!p || !['battle','boss'].includes(p.type)) return;
    p.technique=button.dataset.technique;
    this.selectedStrategy=button.dataset.strategy;
    this.renderAll();
    this.toast('Recommended move staged. Review it, then attack when ready.');
  };

  const bindV10Advice=P.bind;
  P.bind=function() {
    bindV10Advice.call(this);
    if (this._v10AdviceBound) return;
    this._v10AdviceBound=true;
    document.addEventListener('click',event => {
      const button=event.target.closest('[data-v10-apply-advice]');
      if (button) this.applyTacticalAdviceV10(button);
    });
  };
})();
