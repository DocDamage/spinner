'use strict';

// Experience-first layer: reduce first-run friction, expose progression and
// reward consequences, support collection goals, and focus combat presentation.
(() => {
  const {ExperienceEngine,BalanceEngine}=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const experience=new ExperienceEngine();
  const balance=new BalanceEngine();

  P.ensureV11=function(state=this.state) {
    if (!state) return state;
    state.v11Experience ||= {quickStartPreset:'',firstRunStep:state.characterReady?'complete':'hero',collectionFocus:null};
    state.v11Experience.collectionRewards ||= [];
    state.v11Experience.duplicateShards=Number(state.v11Experience.duplicateShards || 0);
    state.v11Experience.accessibility ||= {largeText:false,highContrast:false,reducedMotion:false};
    return state;
  };

  const newStateV11=P.newState;
  P.newState=function(seed){return this.ensureV11(newStateV11.call(this,seed));};
  const loadStateV11=P.loadState;
  P.loadState=function(){const state=loadStateV11.call(this);return state?this.ensureV11(state):state;};

  P.injectExperienceV11=function() {
    const modal=document.getElementById('v6-character-modal');
    const card=modal?.querySelector('.v6-character-card');
    if (!card || card.querySelector('.v11-quickstart')) return;
    const presets=experience.presets().map(preset=>`<button type="button" class="v11-preset" data-v11-preset="${preset.id}"><span>${esc(preset.label)}</span><b>${esc(preset.codename)}</b><small>${esc(preset.summary)}</small><i>START</i></button>`).join('');
    card.querySelector('.v6-modal-head')?.insertAdjacentHTML('afterend',`<section class="v11-quickstart" aria-labelledby="v11-quick-title"><div><span class="eyebrow">PLAY IN UNDER A MINUTE</span><h2 id="v11-quick-title">Choose a starting style</h2><p>Your identity can be edited later. Every preset begins before the first guaranteed power spin.</p></div><div class="v11-preset-grid">${presets}</div><button type="button" class="v11-customize" data-v11-customize>BUILD A CUSTOM ORIGIN</button></section>`);
    card.querySelector('.v6-character-grid')?.insertAdjacentHTML('beforebegin','<button type="button" class="v11-back-quick" data-v11-back-quick hidden>← BACK TO QUICK START</button>');
    const help=document.getElementById('help-modal')?.querySelector('.modal-card');
    if (help && !help.querySelector('.v11-accessibility')) help.insertAdjacentHTML('beforeend',`<section class="v11-accessibility"><h3>Display & motion</h3><p>These settings are saved with the current run.</p><div><button type="button" data-v11-accessibility="largeText">LARGER TEXT</button><button type="button" data-v11-accessibility="highContrast">HIGH CONTRAST</button><button type="button" data-v11-accessibility="reducedMotion">REDUCE MOTION</button></div></section>`);
  };

  P.updateCreatorModeV11=function() {
    const modal=document.getElementById('v6-character-modal');
    if (!modal) return;
    const quick=!this.state.characterReady && !this._customCreatorV11;
    modal.classList.toggle('v11-quick-mode',quick);
    const panel=modal.querySelector('.v11-quickstart');
    if (panel) panel.hidden=this.state.characterReady || this._customCreatorV11;
    const back=modal.querySelector('.v11-back-quick');
    if (back) back.hidden=this.state.characterReady || !this._customCreatorV11;
  };

  const openCharacterV11=P.openV6Modal;
  P.openV6Modal=function(id) {
    const result=openCharacterV11.call(this,id);
    if (id==='character') this.updateCreatorModeV11();
    return result;
  };

  P.applyQuickStartV11=function(id) {
    const preset=experience.preset(id);
    if (!preset) return;
    this.ensureV11();
    const set=(elementId,value)=>{const element=document.getElementById(elementId);if(element)element.value=value;};
    set('v6-cc-name',preset.name);set('v6-cc-codename',preset.codename);set('v6-cc-homeworld',preset.homeworld);
    set('v6-cc-archetype',preset.archetype);set('v6-cc-accent',preset.accent);set('v6-origin-tone',preset.tone);
    set('v6-origin-flaw',preset.flaw);set('v6-origin-story',preset.story);set('v6-campaign-limit','30');
    this.state.v11Experience.quickStartPreset=id;
    this.state.v11Experience.firstRunStep='spin';
    this.saveCharacterCreator();
    this.state.onboarding.step=Math.max(1,this.state.onboarding.step);
    this.save();
    this.renderAll();
    this.shell?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  P.renderFirstMissionV11=function() {
    if (!this.state.characterReady || this.state.pending || this.state.spin > 0 || this.state.v11Experience?.firstRunStep === 'complete') return;
    const panel=this.eventPanel;
    if (!panel) return;
    panel.innerHTML=`<section class="v11-first-mission" aria-labelledby="v11-first-title"><span class="eyebrow">FIRST OBJECTIVE • SAFE DISCOVERY</span><h2 id="v11-first-title">Find your first power source</h2><p>The opening wheel contains only character power sources: no hazards, shops, or surprise battles. Spin once, inspect the result, and decide whether it belongs in your build.</p><div><span>1</span><b>Spin</b><i>Guaranteed power</i><span>2</span><b>Inspect</b><i>Full abilities shown</i><span>3</span><b>Choose</b><i>Your run begins</i></div><button type="button" class="primary-btn" data-v11-first-spin>SPIN FOR FIRST POWER</button></section>`;
  };

  P.renderStageMapV11=function() {
    const strip=document.querySelector('.v9-stage-strip');
    if (!strip) return;
    let map=document.getElementById('v11-stage-map');
    if (!map) {map=document.createElement('section');map.id='v11-stage-map';map.className='v11-stage-map';strip.insertAdjacentElement('afterend',map);}
    const globalSpin=this.state.pending?Math.max(1,this.state.spin):Math.max(1,this.state.spin+1);
    const stage=Math.ceil(globalSpin/10),local=((globalSpin-1)%10)+1;
    const beats=experience.timeline({stageNumber:stage,localSpin:local});
    const next=beats.find(beat=>beat.status==='current');
    map.innerHTML=`<div><span>STAGE ${stage} ROUTE</span><b>${esc(next?.label || 'Complete')}</b></div><ol>${beats.map(beat=>`<li class="${beat.status} ${beat.type.toLowerCase()}" ${beat.status==='current'?'aria-current="step"':''}><i>${beat.status==='complete'?'✓':beat.spin}</i><span>${esc(beat.type)}</span><small>${esc(beat.label)}</small></li>`).join('')}</ol>`;
  };

  P.renderCollectionGoalV11=function() {
    const root=document.getElementById('power-library');
    if (!root || root.querySelector('.v11-collection-goal')) return;
    const progress=experience.collectionProgress(DATA.characters,this.state.discoveredCharacters || []);
    const active=this.state.v11Experience?.collectionFocus;
    const nextReward=experience.nextCollectionReward(progress.count);
    const universes=progress.universes.map(entry=>`<option value="${esc(entry.universe)}" ${active?.universe===entry.universe?'selected':''}>${esc(entry.universe)} • ${entry.discovered}/${entry.total}</option>`).join('');
    root.insertAdjacentHTML('afterbegin',`<section class="v11-collection-goal"><div><span>ROSTER DISCOVERY</span><b>${progress.count.toLocaleString()} / ${progress.total.toLocaleString()}</b><small>${nextReward?`Next: ${nextReward.label} at ${nextReward.milestone} • ${nextReward.credits} ¢${nextReward.evolution?` • ${nextReward.evolution} evolution`:''}`:'All discovery milestones complete'} • Duplicate shards ${this.state.v11Experience.duplicateShards}/3</small></div><label>Target a universe<select data-v11-focus-universe>${universes}</select></label><button type="button" data-v11-focus ${this.state.pending||active?'disabled':''}>${active?`${active.remaining} FOCUSED WHEELS LEFT`:'FOCUS 3 WHEELS • 75 ¢'}</button></section>`);
  };

  P.claimCollectionRewardsV11=function() {
    const progress=experience.collectionProgress(DATA.characters,this.state.discoveredCharacters || []);
    const rewards=experience.collectionRewards(progress.count,this.state.v11Experience.collectionRewards);
    if (!rewards.length) return false;
    for (const reward of rewards) {
      this.state.v11Experience.collectionRewards.push(reward.milestone);
      this.state.credits+=reward.credits;
      this.state.evolutionPoints+=reward.evolution;
      this.log(`COLLECTION MILESTONE: ${reward.label} (${reward.milestone}) — +${reward.credits} credits${reward.evolution?` and +${reward.evolution} evolution`:''}.`,'rare');
    }
    this.save();
    this.toast(`${rewards.at(-1).label} collection reward claimed.`);
    return true;
  };

  const landV11=P.land;
  P.land=function(slice) {
    const result=landV11.call(this,slice);
    if (this.claimCollectionRewardsV11()) this.renderAll();
    return result;
  };

  const acquireKitV11=P.acquireKit;
  P.acquireKit=function(id,quiet=false) {
    const existing=this.state.kits?.find(kit=>kit.id===id);
    if (existing && Number(existing.mastery || 1)>=5) {
      const character=CHAR.get(id);
      this.state.credits+=125;
      this.state.v11Experience.duplicateShards++;
      let evolution='';
      if (this.state.v11Experience.duplicateShards>=3) {
        this.state.v11Experience.duplicateShards-=3;
        this.state.evolutionPoints++;
        evolution=' and formed +1 Evolution Point';
      }
      this.state.record.powers++;
      this.state.lastReward={kind:'duplicate',id};
      if (!quiet) this.log(`MAXED DUPLICATE: ${character?.name || id} converted into 125 credits and one archive shard${evolution}.`,'win');
      this.save();
      return existing;
    }
    return acquireKitV11.call(this,id,quiet);
  };

  P.activateCollectionFocusV11=function() {
    if (this.state.pending) return this.toast('Set a discovery target between events.');
    const universe=document.querySelector('[data-v11-focus-universe]')?.value;
    if (!universe) return;
    if (this.state.credits < 75) return this.toast('Need 75 credits to focus the wheel.');
    this.state.credits-=75;
    this.state.v11Experience.collectionFocus={universe,remaining:3};
    this.generateWheel();
    this.save();
    this.renderAll();
    this.toast(`${universe} power sources are favored for three wheels.`);
  };

  const generateWheelV11=P.generateWheel;
  P.generateWheel=function() {
    const result=generateWheelV11.call(this);
    const focus=this.state?.v11Experience?.collectionFocus;
    const next=(this.state?.spin || 0)+1;
    if (!focus?.remaining || next===1 || next%10===0 || !this.state.slices?.length) return result;
    const owned=new Set((this.state.kits || []).map(kit=>kit.id));
    const pool=DATA.characters.filter(character=>character.universe===focus.universe && !owned.has(character.id));
    const index=this.state.slices.findIndex(slice=>['power','battle','recruit','training'].includes(slice.type));
    if (pool.length && index>=0) {
      const character=this.pick(pool);
      this.state.slices[index]=this.slice('power',character.id,character.name,`${character.universe} focused discovery`);
      focus.remaining--;
      if (focus.remaining<=0) this.state.v11Experience.collectionFocus=null;
      this.save();
      this.drawWheel();
    }
    return result;
  };

  P.renderRewardComparisonV11=function(p) {
    if (!p || p.stage!=='battle_reward') return;
    const enemy=this.battleProfile(p),loadout=this.powerLoadout(),owned=this.state.kits.find(kit=>kit.id===enemy.id);
    const rows=experience.rewardComparison({enemy,ownedKit:owned,activeCount:loadout.active.length,maxActive:3,cost:balance.powerSetCost(enemy),remainingBudget:loadout.remaining,partyCount:this.state.party.length,partyCapacity:this.partyCapacity()});
    const grid=this.eventPanel.querySelector('.choice-grid');
    if (!grid || this.eventPanel.querySelector('.v11-reward-compare')) return;
    grid.insertAdjacentHTML('beforebegin',`<section class="v11-reward-compare"><div><span>VICTORY DECISION</span><b>Choose what permanently changes</b></div><div>${rows.map(row=>`<article data-reward="${row.id}"><span>${esc(row.label)}</span><b>${esc(row.headline)}</b><p>${esc(row.gain)}</p><small>${esc(row.tradeoff)}</small></article>`).join('')}</div></section>`);
  };

  P.renderBossSummaryV11=function(p) {
    if (!p || p.type!=='boss' || p.stage!=='result' || this.eventPanel.querySelector('.v11-stage-summary')) return;
    const arc=this.state.stageArc,stage=this.stageNumber(this.state.spin),growth=5+Math.floor(stage/2);
    this.eventPanel.insertAdjacentHTML('afterbegin',`<section class="v11-stage-summary"><span>STAGE ${stage} COMPLETE</span><h2>${esc(arc?.name || 'Crisis resolved')}</h2><div><article><b>${arc?.completed?'COMPLETE':'INCOMPLETE'}</b><small>Stage objective</small></article><article><b>${arc?.decisions?.length || 0} / 3</b><small>Story decisions</small></article><article><b>+${growth} ALL</b><small>Permanent stats</small></article><article><b>+2</b><small>Evolution points</small></article></div><p>${arc?.completed?'Preparation weakened the boss and the route is secured.':'The boss adapted to the unfinished objective, but the victory still advances the run.'}</p></section>`);
  };

  const renderCombatV11=P.renderCombat;
  P.renderCombat=function(p) {
    renderCombatV11.call(this,p);
    this.renderRewardComparisonV11(p);
    if (p && ['battle','boss'].includes(p.type) && !['battle_reward','result'].includes(p.stage)) {
      const state=this.combat8(p),selected=this.fighterTech(this.battleProfile(p),state).find(technique=>technique.id===p.technique || this.techKey(technique)===p.technique);
      const intent=state.v9Plan?.intent?.label || 'Enemy response';
      const cooldowns=Object.values(state.playerCooldowns || {}).filter(Boolean).length;
      this.eventPanel.querySelector('.v6-combat-top')?.insertAdjacentHTML('beforebegin',`<div class="v11-combat-toolbar"><span>TACTICAL COMBAT</span><button type="button" data-v11-combat-focus>${document.body.classList.contains('v11-combat-focus')?'EXIT FOCUS':'FOCUS VIEW'}</button></div><ol class="v11-round-track" aria-label="Round ${state.round} sequence"><li class="current"><span>1</span><b>CHOOSE</b><small>${esc(selected?.name || 'Technique')}</small></li><li><span>2</span><b>RESOLVE</b><small>${esc(this.selectedStrategy || 'Strategy')}</small></li><li><span>3</span><b>ENEMY</b><small>${esc(intent)}</small></li><li><span>4</span><b>RESET</b><small>${cooldowns} cooldown${cooldowns===1?'':'s'} active</small></li></ol>`);
    }
  };

  const renderEventV11=P.renderEvent;
  P.renderEvent=function() {
    const result=renderEventV11.call(this);
    this.renderBossSummaryV11(this.state.pending);
    return result;
  };

  const renderAllV11=P.renderAll;
  P.renderAll=function() {
    this.ensureV11();
    const result=renderAllV11.call(this);
    const combat=['battle','boss'].includes(this.state.pending?.type) && !['battle_reward','result'].includes(this.state.pending?.stage);
    document.body.classList.toggle('v11-in-combat',combat);
    const prefs=this.state.v11Experience.accessibility;
    document.body.classList.toggle('v11-large-text',!!prefs.largeText);
    document.body.classList.toggle('v11-high-contrast',!!prefs.highContrast);
    document.body.classList.toggle('v11-reduce-motion',!!prefs.reducedMotion);
    if (!combat) document.body.classList.remove('v11-combat-focus');
    this.renderFirstMissionV11();
    this.renderStageMapV11();
    this.renderCollectionGoalV11();
    document.querySelectorAll('[data-v11-accessibility]').forEach(button=>{
      const active=!!prefs[button.dataset.v11Accessibility];
      button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('on',active);
    });
    return result;
  };

  const combatAttackV11=P.combatAttack;
  P.combatAttack=function(strategy) {
    const p=this.state.pending,state=p&&['battle','boss'].includes(p.type)?this.combat8(p):null;
    const beforeEnemy=state?.enemyHP || 0,beforePlayer=state?this.fighter(state).hp:0;
    const result=combatAttackV11.call(this,strategy);
    const dealt=Math.max(0,beforeEnemy-Number(state?.enemyHP || 0));
    const taken=Math.max(0,beforePlayer-Number(state?this.fighter(state).hp:0));
    this.showCombatImpactV11(dealt?`-${dealt} ENEMY`: 'EVADED',taken?` • -${taken} HERO`:'');
    return result;
  };

  P.showCombatImpactV11=function(primary,secondary='') {
    const panel=this.eventPanel;
    if (!panel || !document.body.classList.contains('v11-in-combat')) return;
    const impact=document.createElement('div');impact.className='v11-impact';impact.textContent=primary+secondary;panel.appendChild(impact);
    const fighters=panel.querySelectorAll('.v6-fighter');
    if (/ENEMY/.test(primary)) fighters[1]?.classList.add('v11-hit');
    if (/HERO/.test(secondary)) fighters[0]?.classList.add('v11-hit');
    setTimeout(()=>{impact.remove();fighters.forEach(fighter=>fighter.classList.remove('v11-hit'));},900);
  };

  const bindV11=P.bind;
  P.bind=function() {
    bindV11.call(this);
    this.ensureV11();
    this.injectExperienceV11();
    if (this._v11Bound) return;
    this._v11Bound=true;
    document.addEventListener('click',event=>{
      const preset=event.target.closest('[data-v11-preset]');
      if (preset) return this.applyQuickStartV11(preset.dataset.v11Preset);
      if (event.target.closest('[data-v11-customize]')) {this._customCreatorV11=true;return this.updateCreatorModeV11();}
      if (event.target.closest('[data-v11-back-quick]')) {this._customCreatorV11=false;return this.updateCreatorModeV11();}
      if (event.target.closest('[data-v11-first-spin]')) {this.state.v11Experience.firstRunStep='result';this.save();return this.spin();}
      if (event.target.closest('[data-v11-focus]')) return this.activateCollectionFocusV11();
      if (event.target.closest('[data-v11-combat-focus]')) {document.body.classList.toggle('v11-combat-focus');return this.renderAll();}
      const accessibility=event.target.closest('[data-v11-accessibility]');
      if (accessibility) {
        const key=accessibility.dataset.v11Accessibility;
        this.state.v11Experience.accessibility[key]=!this.state.v11Experience.accessibility[key];
        this.save();
        return this.renderAll();
      }
    });
  };
})();
