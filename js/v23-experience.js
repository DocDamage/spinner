'use strict';

// V23 turns V21 strategy and V22 civilian stakes into persistent Wheel-driven
// operations without introducing a second tactical combat game or reward wallet.
(()=>{
  const {TacticalOperationsEngine,migrateV23,OPERATION_FAMILIES_V23,APPROACHES_V23,SUPPLY_TIERS_V23}=MultiverseDomain;
  const P=MultiverseWheel.prototype,operations=new TacticalOperationsEngine();
  const artifacts=()=>Array.from(ART.values());
  const roster=()=>Array.from(CHAR.values());
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const label=v=>String(v||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const pct=v=>`${Math.round(Number(v||0)*100)}%`;
  const money=cost=>Object.entries(cost||{}).map(([k,v])=>`${v} ${label(k)}`).join(' + ')||'No resource cost';
  const charName=id=>CHAR.get(String(id||''))?.name||String(id||'Unknown');
  const refresh=function(){this.save();this.renderAll();if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16?.('operations');};

  P.ensureV23=function(state=this.state){if(!state)return state;migrateV23(state,artifacts(),roster());operations.catchUp(state,6);return state;};
  const newStateV23=P.newState;P.newState=function(seed){return this.ensureV23(newStateV23.call(this,seed));};
  const loadStateV23=P.loadState;P.loadState=function(){const state=loadStateV23.call(this);return state?this.ensureV23(state):state;};
  const saveV23=P.save;P.save=function(){if(this.state)this.ensureV23();return saveV23.call(this);};

  // Planning bonuses add to the authoritative V19 combat relationship modifier.
  // V23 contributes at most ±6% odds and ±8% damage.
  if(MultiverseDomain.PartyConsequencesEngine&&!MultiverseDomain.PartyConsequencesEngine.prototype._v23OperationPlanning){
    const proto=MultiverseDomain.PartyConsequencesEngine.prototype,base=proto.combatModifier;
    if(typeof base==='function')proto.combatModifier=function(state,...args){
      const result=base.call(this,state,...args);if(!state?.v23)return result;const mod=operations.combatModifier(state);
      return{...result,odds:clamp(Number(result.odds||0)+mod.odds,-.15,.14),damage:clamp(Number(result.damage||0)+mod.damage,-.20,.20),operation:mod};
    };
    proto._v23OperationPlanning=true;
  }

  const recordOutcomeV23=P.recordOutcomeV19;
  if(typeof recordOutcomeV23==='function')P.recordOutcomeV19=function(type,outcome,enemy=null){
    const result=recordOutcomeV23.call(this,type,outcome,enemy);this.ensureV23();
    const event=operations.processEvent(this.state,{id:`v23:${this.state.spin}:${type}:${outcome}:${enemy?.id||''}`,type,outcome,enemyId:enemy?.id||''},roster());
    if(event?.stageComplete&&!event.operationComplete)this.log(`OPERATION STAGE COMPLETE: ${event.operation?.label||'Tactical operation'} advances.`,'rare');
    if(event?.operationComplete)this.log(`OPERATION COMPLETE: ${event.operation?.label||'Mission resolved'}.`,'win');
    if(event?.success===false)this.log(`OPERATION FAILED: ${event.operation?.label||'Mission'} remains recoverable through future operations.`,'loss');
    this.save();return result;
  };

  P.operationSummaryV23=function(){this.ensureV23();return operations.summary(this.state);};
  P.selectOperationV23=function(id){this._v23SelectedOperationId=String(id||'');this.renderWorldV16?.('operations');};
  P.deployOperationV23=function(id){
    const panel=document.querySelector(`[data-v23-planner="${CSS.escape(String(id))}"]`);if(!panel)return this.toast('Open the operation planner first.');
    const plan={
      approach:panel.querySelector('[data-v23-approach]')?.value||'adaptive',
      allyIds:[...panel.querySelectorAll('[data-v23-ally]:checked')].map(x=>x.value),
      specialistId:panel.querySelector('[data-v23-specialist]')?.value||'',
      relicId:panel.querySelector('[data-v23-relic]')?.value||'',
      factionSupport:Boolean(panel.querySelector('[data-v23-faction-support]')?.checked),
      supplyCommitment:Number(panel.querySelector('[data-v23-supply]')?.value||0),
      priority:panel.querySelector('[data-v23-priority]')?.value||'balanced'
    };
    const result=operations.beginOperation(this.state,id,plan);if(!result.ok)return this.toast(result.error);this._v23SelectedOperationId='';this.log(`OPERATION DEPLOYED: ${result.operation.label}. Planning bonus ${pct(result.operation.modifiers.odds)} odds / ${pct(result.operation.modifiers.damage)} damage.`,'rare');refresh.call(this);
  };
  P.abortOperationV23=function(id){const result=operations.abortOperation(this.state,id,roster());if(!result.ok)return this.toast(result.error);this.log(`OPERATION WITHDRAWAL: ${result.operation.label}. The strategic source remains recoverable.`,'loss');refresh.call(this);};
  P.retryOperationV23=function(id){const result=operations.retryOperation(this.state,id);if(!result.ok)return this.toast(result.error);this._v23SelectedOperationId=result.operation.id;this.log(`OPERATION REOPENED: ${result.operation.label}. Replan before the next attempt.`,'rare');refresh.call(this);};
  P.scanOperationsV23=function(){this.ensureV23();const created=operations.discoverOperations(this.state,12);this.log(created.length?`OPERATIONS UPDATED: ${created.length} new strategic lead${created.length===1?'':'s'}.`:'OPERATIONS: No new strategic leads right now.','rare');refresh.call(this);};

  P.v23StageTrack=function(op){
    return `<div class="v23-stage-track">${op.stages.map((s,i)=>`<article class="${safe(s.status)}"><span>${i+1}</span><div><b>${safe(s.label)}</b><small>${s.progress}/${s.target} • ${s.events.map(label).join(', ')}${s.requiredOutcome?` • ${safe(label(s.requiredOutcome))}`:''}</small></div></article>`).join('')}</div>`;
  };

  P.renderPlannerV23=function(op){
    const activeParty=(this.state.party||[]).map(id=>({id:String(id),name:charName(id),available:operations.allyAvailability(this.state,id)}));
    const specialistIds=Object.keys(this.state.v21?.assignments||{}),relicIds=(this.state.artifacts||[]).filter(id=>this.state.v20?.relics?.[id]?.status!=='stolen');
    const approaches=Object.entries(APPROACHES_V23).map(([id,d])=>`<option value="${id}">${safe(d.label)} • ${pct(d.odds)} odds • ${pct(d.damage)} damage</option>`).join('');
    const supply=Object.entries(SUPPLY_TIERS_V23).map(([id,d])=>`<option value="${id}">${safe(d.label)} • ${safe(money(d.cost))}</option>`).join('');
    const allies=activeParty.length?activeParty.map(x=>`<label class="${x.available.allowed?'':'disabled'}"><input type="checkbox" data-v23-ally value="${safe(x.id)}" ${x.available.allowed?'':'disabled'}><span>${safe(x.name)}</span><small>${safe(x.available.reason)}</small></label>`).join(''):'<p>No active allies available. Solo deployment remains valid.</p>';
    const specialists=`<option value="">No specialist</option>`+specialistIds.map(id=>{const a=this.state.v21.assignments[id];return`<option value="${safe(id)}">${safe(charName(id))} • ${safe(label(a.role))}</option>`;}).join('');
    const relics=`<option value="">No relic support</option>`+relicIds.map(id=>`<option value="${safe(id)}">${safe(this.state.v20?.relics?.[id]?.name||ART.get(id)?.name||id)}</option>`).join('');
    const faction=this.state.v21?.primaryFactionId?this.state.v16?.factions?.[this.state.v21.primaryFactionId]:null;
    return `<section class="v23-planner" data-v23-planner="${safe(op.id)}"><header><div><span>MISSION PLANNING</span><h3>${safe(op.label)}</h3><p>Planning changes bounded odds; it never guarantees a Wheel result.</p></div><b>Urgency ${Math.round(op.urgency)}</b></header><div class="v23-plan-grid"><label><span>Approach</span><select data-v23-approach>${approaches}</select></label><label><span>Supply commitment</span><select data-v23-supply>${supply}</select></label><label><span>Priority</span><select data-v23-priority><option value="balanced">Balanced</option><option value="civilians">Civilians First</option><option value="objective">Objective First</option><option value="team">Team Safety</option></select></label><label><span>V21 specialist</span><select data-v23-specialist>${specialists}</select></label><label><span>V20 relic support</span><select data-v23-relic>${relics}</select></label><label class="v23-check"><input type="checkbox" data-v23-faction-support ${faction?'':'disabled'}><span>${faction?`Request ${safe(faction.name)} support`:'No primary faction support available'}</span></label></div><div class="v23-allies"><span>SELECT ACTIVE ALLIES • MAX 3</span>${allies}</div><footer><button type="button" data-v23-cancel-plan>BACK</button><button type="button" data-v23-deploy="${safe(op.id)}">LOCK PLAN & DEPLOY</button></footer></section>`;
  };

  P.renderOperationsV23=function(){
    this.ensureV23();const summary=operations.summary(this.state),active=summary.active,selected=summary.available.find(op=>op.id===this._v23SelectedOperationId);
    if(selected)return this.renderPlannerV23(selected);
    const available=summary.available.map(op=>`<article class="v23-operation-card"><header><div><span>${safe(label(op.sourceType))} • ${safe(op.universe)}</span><h3>${safe(op.label)}</h3></div><b>${Math.round(op.urgency)}</b></header><p>${safe(op.summary)}</p><div class="v23-tags"><span>${safe(OPERATION_FAMILIES_V23[op.family]?.label||label(op.family))}</span>${op.settlementId?'<span>Civilian stakes</span>':''}${op.frontId?'<span>Warfront</span>':''}${op.strongholdId?'<span>Stronghold</span>':''}${op.relicId?'<span>Relic</span>':''}</div><footer><small>${op.stages.length} Wheel-driven stages • ${op.rewards.credits} Credits + ${op.rewards.salvage} Salvage</small><button type="button" data-v23-plan="${safe(op.id)}">PLAN OPERATION</button></footer></article>`).join('')||'<section class="v23-empty"><h3>No operations are available</h3><p>Campaigns, active fronts, civilian crises, sieges, infiltration problems, stolen relics, and nemesis activity can create new operations.</p></section>';
    const activeBlock=active?`<section class="v23-active"><header><div><span>ACTIVE OPERATION • ${safe(OPERATION_FAMILIES_V23[active.family]?.label||label(active.family))}</span><h3>${safe(active.label)}</h3><p>${safe(active.universe)} • stress ${Math.round(active.stress)} • ${safe(APPROACHES_V23[active.planning.approach]?.label||label(active.planning.approach))} approach</p></div><aside><b>${pct(active.modifiers.odds)}</b><small>mission odds</small><b>${pct(active.modifiers.damage)}</b><small>mission damage</small></aside></header>${this.v23StageTrack(active)}<div class="v23-active-note"><b>NEXT WHEEL SIGNALS</b><span>${active.stages[active.stageIndex].events.map(label).join(', ')}${active.stages[active.stageIndex].requiredOutcome?` • requires ${safe(label(active.stages[active.stageIndex].requiredOutcome))}`:''}</span></div><footer><span>${active.planning.allyIds.length?`Deployed: ${active.planning.allyIds.map(charName).map(safe).join(', ')}`:'Solo deployment'}${active.planning.specialistId?` • ${safe(charName(active.planning.specialistId))} supporting`:''}</span><button type="button" data-v23-abort="${safe(active.id)}">ORDER WITHDRAWAL</button></footer></section>`:'';
    const history=summary.resolved.length?summary.resolved.slice(0,6).map(op=>{const live=this.state.v23.operations[op.id],canRetry=live?.status==='failed'&&!active;return`<li><div><b>${safe(op.label)}</b><span>${safe(label(op.status))} • ${safe(op.universe)} • ${op.failures} setback${op.failures===1?'':'s'}</span></div>${canRetry?`<button type="button" data-v23-retry="${safe(op.id)}">REOPEN</button>`:''}</li>`;}).join(''):'<li><span>No resolved operations yet.</span></li>';
    return `<section class="v23-head"><div><span>V23 • TACTICAL MISSIONS & WARFRONT OPERATIONS</span><h3>Strategic pressure becomes playable Wheel missions</h3><p>Operations connect V21 campaigns and fronts to V22 civilians, V19 allies, V20 relics, and the existing V18 economy. There is no separate tactical combat engine.</p></div><aside><b>${summary.stats.completed}</b><small>completed</small><b>${summary.available.length}</b><small>available</small></aside></section><section class="v23-summary"><article><span>ACTIVE</span><b>${active?'1':'0'}</b></article><article><span>FLOTILLA / RELIEF</span><b>${summary.stats.civiliansRescued}</b><small>civilians recovered</small></article><article><span>FRONT SHIFTS</span><b>${summary.stats.frontsShifted}</b></article><article><span>FLAWLESS OPS</span><b>${summary.stats.flawless}</b></article></section>${activeBlock}<section class="v23-available"><div class="v23-section-head"><div><span>AVAILABLE OPERATIONS</span><p>Only one operation can be active. Opening this screen never advances a stage.</p></div><button type="button" data-v23-scan>SCAN STRATEGIC SOURCES</button></div><div class="v23-operation-grid">${available}</div></section><section class="v23-history"><div class="v23-section-head"><div><span>AFTERMATH LOG</span><p>Resolved operations write bounded consequences back to their authoritative systems.</p></div></div><ul>${history}</ul></section>`;
  };

  P.injectV23UI=function(){
    const world=document.getElementById('v16-world-modal');if(world&&!world.querySelector('[data-v16-world-tab="operations"]'))(world.querySelector('[data-v16-world-tab="civilians"]')||world.querySelector('[data-v16-world-tab="factions"]'))?.insertAdjacentHTML('afterend','<button type="button" data-v16-world-tab="operations">OPERATIONS</button>');
    const beacon=document.getElementById('v22-civilian-beacon')||document.getElementById('v21-faction-beacon');if(beacon&&!document.getElementById('v23-operation-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v23-operation-beacon" class="v23-operation-beacon" aria-label="Tactical operation summary"></section>');
    const version=document.querySelector('.v13-title-head span'),copyNode=document.querySelector('.v13-title-head p');if(version)version.textContent='V23 • TACTICAL MISSIONS & WARFRONT OPERATIONS';if(copyNode)copyNode.textContent='Plan one persistent operation, then let normal Wheel results decide the intel, approach, complication, objective, extraction, and aftermath.';
    if(!document.getElementById('v23-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v23-help"><h3>Tactical missions & warfront operations</h3><p>Open World → Operations. Strategic V21/V22 conditions create persistent missions. Choose an approach, active allies, assigned specialist, faction support, relic support, supply commitment, and priority. Planning bonuses are bounded; actual progress still comes from normal Wheel events. Rewards and consequences flow back into V18–V22 instead of creating duplicate currencies or meters.</p></section>');
    document.documentElement.dataset.v23='tactical-missions-warfront-operations';
  };

  P.renderOperationBeaconV23=function(){
    const root=document.getElementById('v23-operation-beacon');if(!root)return;const s=this.operationSummaryV23(),focus=s.active||s.available[0];
    root.innerHTML=`<button type="button" data-v23-open><span>OPERATIONS</span><b>${focus?safe(focus.label):'No active lead'}</b><small>${s.active?`Stage ${s.active.stageIndex+1}/5 • stress ${Math.round(s.active.stress)}`:`${s.available.length} available • ${s.stats.completed} completed`}</small></button><div><span>FIELD RECORD</span><b>${s.stats.flawless} flawless • ${s.stats.failed} failed</b><small>${s.stats.civiliansRescued} civilians recovered • ${s.stats.strongholdsDefended} strongholds defended</small></div>`;
  };

  const renderWorldV23=P.renderWorldV16;
  P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){
    if(tab!=='operations')return renderWorldV23.call(this,tab);this.ensureV23();this._v16WorldTab='operations';document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab==='operations'));const body=document.querySelector('[data-v16-world-body]');if(body)body.innerHTML=this.renderOperationsV23();
  };

  const renderAllV23=P.renderAll;
  P.renderAll=function(){this.ensureV23();const result=renderAllV23.call(this);this.injectV23UI();this.renderOperationBeaconV23();return result;};

  const bindV23=P.bind;
  P.bind=function(){bindV23.call(this);this.injectV23UI();if(this._v23Bound)return;this._v23Bound=true;document.addEventListener('click',event=>{
    if(event.target.closest('[data-v23-open]'))return this.openWorldV16?.('operations');
    const plan=event.target.closest('[data-v23-plan]');if(plan)return this.selectOperationV23(plan.dataset.v23Plan);
    if(event.target.closest('[data-v23-cancel-plan]')){this._v23SelectedOperationId='';return this.renderWorldV16?.('operations');}
    const deploy=event.target.closest('[data-v23-deploy]');if(deploy)return this.deployOperationV23(deploy.dataset.v23Deploy);
    const abort=event.target.closest('[data-v23-abort]');if(abort)return this.abortOperationV23(abort.dataset.v23Abort);
    const retry=event.target.closest('[data-v23-retry]');if(retry)return this.retryOperationV23(retry.dataset.v23Retry);
    if(event.target.closest('[data-v23-scan]'))return this.scanOperationsV23();
  });};
})();
