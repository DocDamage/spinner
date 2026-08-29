'use strict';

// V25 turns severe existing world pressure into durable multiverse-scale crisis
// arcs. It coordinates V16-V24 systems without replacing their ownership.
(()=>{
  const {CrisisArcEngine,migrateV25,CRISIS_FAMILIES_V25,CRISIS_POSTURES_V25,CRISIS_SUPPORT_TIERS_V25}=MultiverseDomain;
  const P=MultiverseWheel.prototype,crises=new CrisisArcEngine();
  const artifacts=()=>Array.from(ART.values());
  const roster=()=>Array.from(CHAR.values());
  const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const label=v=>String(v||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const charName=id=>CHAR.get(String(id||''))?.name||String(id||'Unknown');
  const resourceText=cost=>Object.entries(cost||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${v} ${label(k)}`).join(' + ')||'No resource cost';
  const refresh=function(){this.save();this.renderAll();if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16?.('crises');};

  P.ensureV25=function(state=this.state){if(!state)return state;migrateV25(state,artifacts(),roster());crises.catchUp(state,6);return state;};
  const newStateV25=P.newState;P.newState=function(seed){return this.ensureV25(newStateV25.call(this,seed));};
  const loadStateV25=P.loadState;P.loadState=function(){const state=loadStateV25.call(this);return state?this.ensureV25(state):state;};
  const saveV25=P.save;P.save=function(){if(this.state)this.ensureV25();return saveV25.call(this);};

  // A crisis is macro context, so ordinary Wheel outcomes can advance it while
  // a V23 operation or V24 activity is active. The lower layer remains the
  // immediate mission/activity owner; V25 only records crisis-scale progress.
  const recordOutcomeV25=P.recordOutcomeV19;
  if(typeof recordOutcomeV25==='function')P.recordOutcomeV19=function(type,outcome,enemy=null){
    const result=recordOutcomeV25.call(this,type,outcome,enemy);this.ensureV25();
    const event=crises.processEvent(this.state,{id:`v25:${this.state.spin}:${type}:${outcome}:${enemy?.id||''}`,type,outcome,enemyId:enemy?.id||''},roster());
    if(event?.phaseComplete&&!event.crisisComplete)this.log(`CRISIS PHASE CONTAINED: ${event.crisis?.label||'Multiverse crisis'} advances.`,'rare');
    if(event?.crisisComplete&&event.success)this.log(`CRISIS RESOLVED: ${event.crisis?.label||'Multiverse crisis'}.`,'win');
    if(event?.success===false)this.log(`CRISIS RESPONSE FAILED: ${event.crisis?.label||'Multiverse crisis'} remains recoverable.`,'loss');
    this.save();return result;
  };

  P.crisisSummaryV25=function(){this.ensureV25();return crises.summary(this.state);};
  P.selectCrisisV25=function(id){this._v25SelectedCrisisId=String(id||'');this.renderWorldV16?.('crises');};
  P.startCrisisResponseV25=function(id){
    const panel=document.querySelector(`[data-v25-planner="${String(id).replace(/"/g,'\\"')}"]`);if(!panel)return this.toast('Open the crisis response planner first.');
    const plan={
      posture:panel.querySelector('[data-v25-posture]')?.value||'adaptive',
      supportTier:Number(panel.querySelector('[data-v25-support]')?.value||0),
      allyIds:[...panel.querySelectorAll('[data-v25-ally]:checked')].map(x=>x.value),
      factionId:panel.querySelector('[data-v25-faction]')?.value||'',
      relicId:panel.querySelector('[data-v25-relic]')?.value||'',
      strongholdId:panel.querySelector('[data-v25-stronghold]')?.value||''
    };
    const result=crises.beginResponse(this.state,id,plan);if(!result.ok)return this.toast(result.error);this._v25SelectedCrisisId='';this.log(`CRISIS COMMAND: ${result.crisis.label} • ${CRISIS_POSTURES_V25[result.crisis.response.posture].label}.`,'rare');refresh.call(this);
  };
  P.standDownCrisisV25=function(id){const result=crises.standDownResponse(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`CRISIS COMMAND STOOD DOWN: ${result.crisis.label}. Pressure increased but progress was preserved.`,'loss');refresh.call(this);};
  P.reopenCrisisV25=function(id){const result=crises.retryCrisis(this.state,id);if(!result.ok)return this.toast(result.error);this._v25SelectedCrisisId=id;this.log(`CRISIS REOPENED: ${result.crisis.label}. A recovery response can be planned.`,'rare');refresh.call(this);};
  P.scanCrisesV25=function(){this.ensureV25();const created=crises.discoverCrises(this.state,12);this.log(created.length?`CRISIS WATCH: ${created.length} new emergency arc${created.length===1?'':'s'} detected.`:'CRISIS WATCH: No new multiverse-scale emergencies detected.','rare');refresh.call(this);};

  P.v25PhaseTrack=function(crisis){return `<div class="v25-phase-track">${crisis.phases.map((phase,i)=>`<article class="${safe(phase.status)}"><span>${i+1}</span><div><b>${safe(phase.label)}</b><small>${phase.progress}/${phase.target} • ${phase.events.map(label).join(', ')}</small></div></article>`).join('')}</div>`;};

  P.renderPlannerV25=function(crisis){
    const postures=Object.entries(CRISIS_POSTURES_V25).map(([id,p])=>`<option value="${id}">${safe(p.label)}</option>`).join('');
    const support=Object.entries(CRISIS_SUPPORT_TIERS_V25).map(([id,t])=>`<option value="${id}">${safe(t.label)} • ${safe(resourceText(t.cost))}</option>`).join('');
    const allies=(this.state.party||[]).map(id=>{const status=crises.allyAvailability(this.state,id);return`<label class="${status.allowed?'':'disabled'}"><input type="checkbox" data-v25-ally value="${safe(id)}" ${status.allowed?'':'disabled'}><span>${safe(charName(id))}</span><small>${safe(status.reason)}</small></label>`;}).join('')||'<p>No active allies are available. Solo Crisis Command is valid.</p>';
    const factionOptions=`<option value="">No faction coordination</option>`+Object.values(this.state.v16?.factions||{}).map(f=>`<option value="${safe(f.id)}" ${this.state.v21?.primaryFactionId===f.id?'selected':''}>${safe(f.name)} • reputation ${Math.round(f.reputation||0)}</option>`).join('');
    const relicOptions=`<option value="">No relic anchor</option>`+(this.state.artifacts||[]).filter(id=>this.state.v20?.relics?.[id]?.status!=='stolen').map(id=>`<option value="${safe(id)}">${safe(this.state.v20?.relics?.[id]?.name||ART.get(id)?.name||id)}</option>`).join('');
    const strongholds=`<option value="">No stronghold anchor</option>`+Object.values(this.state.v21?.strongholds||{}).map(h=>`<option value="${safe(h.id)}">${safe(h.name||h.id)} • integrity ${Math.round(h.integrity||0)}</option>`).join('');
    return `<section class="v25-planner" data-v25-planner="${safe(crisis.id)}"><header><div><span>CRISIS COMMAND • ${safe(CRISIS_FAMILIES_V25[crisis.family]?.label||label(crisis.family))}</span><h3>${safe(crisis.label)}</h3><p>${safe(crisis.summary)}</p></div><aside><b>${Math.round(crisis.severity)}</b><small>severity</small><b>${Math.round(crisis.pressure)}</b><small>pressure</small></aside></header><div class="v25-plan-grid"><label><span>Response posture</span><select data-v25-posture>${postures}</select></label><label><span>V18 support commitment</span><select data-v25-support>${support}</select></label><label><span>V21/V16 faction coordination</span><select data-v25-faction>${factionOptions}</select></label><label><span>V20 relic anchor</span><select data-v25-relic>${relicOptions}</select></label><label><span>V21 stronghold anchor</span><select data-v25-stronghold>${strongholds}</select></label></div><div class="v25-allies"><span>CRISIS TEAM • UP TO 3 V19 ALLIES</span>${allies}</div><div class="v25-planner-note"><b>AFFECTED REALITIES</b><span>${crisis.universeIds.map(safe).join(' • ')}</span><b>CURRENT PHASE</b><span>${safe(crisis.phases[crisis.phaseIndex].label)}</span></div><footer><button type="button" data-v25-cancel-plan>BACK</button><button type="button" data-v25-start="${safe(crisis.id)}">COMMIT RESPONSE</button></footer></section>`;
  };

  P.renderCrisesV25=function(){
    this.ensureV25();const summary=crises.summary(this.state),active=summary.active,selected=[...summary.available,...summary.failed].find(c=>c.id===this._v25SelectedCrisisId);if(selected)return this.renderPlannerV25(selected);
    const available=summary.available.map(crisis=>`<article class="v25-crisis-card"><header><div><span>${safe(CRISIS_FAMILIES_V25[crisis.family]?.label||label(crisis.family))} • ${safe(crisis.primaryUniverse)}</span><h3>${safe(crisis.label)}</h3></div><b>${Math.round(crisis.severity)}</b></header><p>${safe(crisis.summary)}</p><div class="v25-tags"><span>${crisis.universeIds.length} ${crisis.universeIds.length===1?'reality':'realities'}</span>${crisis.settlementIds.length?'<span>Civilian stakes</span>':''}${crisis.strongholdIds.length?'<span>Stronghold stakes</span>':''}${crisis.relicIds.length?'<span>Relic stakes</span>':''}${crisis.nemesisIds.length?'<span>Nemesis</span>':''}</div><footer><small>${safe(crisis.phases[crisis.phaseIndex].label)} • pressure ${Math.round(crisis.pressure)} • momentum ${Math.round(crisis.momentum)}</small><button type="button" data-v25-plan="${safe(crisis.id)}">PLAN RESPONSE</button></footer></article>`).join('')||'<section class="v25-empty"><h3>No crisis arcs are on the watch board</h3><p>Severe instability, corruption, threat, warfront pressure, displacement, sieges, relic failures, and nemesis pressure can create persistent crisis arcs.</p></section>';
    const activeBlock=active?`<section class="v25-active"><header><div><span>ACTIVE CRISIS COMMAND • ${safe(CRISIS_POSTURES_V25[active.response.posture]?.label||label(active.response.posture))}</span><h3>${safe(active.label)}</h3><p>${safe(active.primaryUniverse)} • severity ${Math.round(active.severity)} • pressure ${Math.round(active.pressure)} • momentum ${Math.round(active.momentum)}</p></div><aside><b>${active.phaseIndex+1}/5</b><small>phase</small><b>${active.failures}</b><small>setbacks</small></aside></header>${this.v25PhaseTrack(active)}<div class="v25-active-note"><b>NEXT WHEEL SIGNALS</b><span>${active.phases[active.phaseIndex].events.map(label).join(', ')}</span><small>V23 operations and V24 activities may contribute naturally when their underlying Wheel results match these signals.</small></div><footer><span>${active.response.allyIds.length?`Crisis team: ${active.response.allyIds.map(charName).map(safe).join(', ')}`:'Solo command'}${active.response.relicId?' • relic anchored':''}${active.response.strongholdId?' • stronghold anchored':''}</span><button type="button" data-v25-stand-down="${safe(active.id)}">STAND DOWN</button></footer></section>`:'';
    const failed=summary.failed.length?`<section class="v25-failed"><div class="v25-section-head"><div><span>RECOVERY PATHS</span><p>A failed response never deletes its worlds. Reopen it and build a new plan.</p></div></div><ul>${summary.failed.slice(0,6).map(c=>`<li><div><b>${safe(c.label)}</b><span>Severity ${Math.round(c.severity)} • pressure ${Math.round(c.pressure)}</span></div><button type="button" data-v25-reopen="${safe(c.id)}">REOPEN</button></li>`).join('')}</ul></section>`:'';
    const recent=summary.recent.length?summary.recent.map(c=>`<li><div><b>${safe(c.label)}</b><span>${safe(label(c.status))} • ${safe(c.primaryUniverse)} • severity ${Math.round(c.severity)}</span></div><small>${c.resolvedRewards?safe(resourceText(c.resolvedRewards)):`${c.failures} setbacks`}</small></li>`).join(''):'<li><span>No crisis responses have reached an aftermath yet.</span></li>';
    return `<section class="v25-head"><div><span>V25 • CATACLYSMS & MULTIVERSE CRISIS ARCS</span><h3>World pressure now escalates into persistent emergencies</h3><p>V25 coordinates existing instability, factions, civilians, strongholds, relics, nemeses, operations, and activities without creating another world simulator. The Wheel still decides response progress.</p></div><aside><b>${summary.stats.resolved}</b><small>resolved</small><b>${summary.available.length}</b><small>watching</small></aside></section><section class="v25-summary"><article><span>WORLDS STABILIZED</span><b>${summary.stats.worldsSaved}</b></article><article><span>CIVILIANS PROTECTED</span><b>${summary.stats.civiliansProtected}</b></article><article><span>STRONGHOLDS HELD</span><b>${summary.stats.strongholdsHeld}</b></article><article><span>COALITION RESPONSES</span><b>${summary.stats.coalitionResponses}</b></article></section>${activeBlock}<section class="v25-available"><div class="v25-section-head"><div><span>CRISIS WATCH</span><p>Only one crisis has the active Command focus, but lower-level V23/V24 play can continue underneath the macro emergency.</p></div><button type="button" data-v25-scan>SCAN CRISIS SOURCES</button></div><div class="v25-crisis-grid">${available}</div></section>${failed}<section class="v25-history"><div class="v25-section-head"><div><span>CRISIS AFTERMATH</span><p>Resolved and failed arcs write bounded consequences back into V16–V22 and existing rewards into V18.</p></div></div><ul>${recent}</ul></section>`;
  };

  P.injectV25UI=function(){
    const world=document.getElementById('v16-world-modal');if(world&&!world.querySelector('[data-v16-world-tab="crises"]'))(world.querySelector('[data-v16-world-tab="activities"]')||world.querySelector('[data-v16-world-tab="operations"]'))?.insertAdjacentHTML('afterend','<button type="button" data-v16-world-tab="crises">CRISES</button>');
    const beacon=document.getElementById('v24-activity-beacon')||document.getElementById('v23-operation-beacon');if(beacon&&!document.getElementById('v25-crisis-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v25-crisis-beacon" class="v25-crisis-beacon" aria-label="Multiverse crisis command summary"></section>');
    const version=document.querySelector('.v13-title-head span'),copyNode=document.querySelector('.v13-title-head p');if(version)version.textContent='V25 • CATACLYSMS & MULTIVERSE CRISIS ARCS';if(copyNode)copyNode.textContent='Answer persistent reality-wide emergencies through ordinary Wheel outcomes while every existing world system keeps ownership of its own state.';
    if(!document.getElementById('v25-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v25-help"><h3>Cataclysms & multiverse crisis arcs</h3><p>Open World → Crises. Severe V16 world pressure, V21 wars and strongholds, V22 displacement, V20 relic failures, and nemesis escalation can create persistent five-phase emergencies. Choose a posture and existing V18 support commitment; allies, factions, relics, and strongholds remain owned by their existing systems.</p></section>');
    document.documentElement.dataset.v25='cataclysms-multiverse-crisis-arcs';
  };

  P.renderCrisisBeaconV25=function(){const root=document.getElementById('v25-crisis-beacon');if(!root)return;const summary=this.crisisSummaryV25(),focus=summary.active||summary.available[0];root.innerHTML=`<button type="button" data-v25-open><span>CRISIS COMMAND</span><b>${focus?safe(focus.label):'No macro emergency'}</b><small>${summary.active?`Phase ${summary.active.phaseIndex+1}/5 • severity ${Math.round(summary.active.severity)}`:`${summary.available.length} watching • ${summary.stats.resolved} resolved`}</small></button><div><span>MULTIVERSE RESILIENCE</span><b>${summary.stats.worldsSaved} worlds • ${summary.stats.civiliansProtected} civilians</b><small>${summary.stats.strongholdsHeld} strongholds held • ${summary.stats.failed} failed responses</small></div>`;};

  const renderWorldV25=P.renderWorldV16;P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){if(tab!=='crises')return renderWorldV25.call(this,tab);this.ensureV25();this._v16WorldTab='crises';document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab==='crises'));const body=document.querySelector('[data-v16-world-body]');if(body)body.innerHTML=this.renderCrisesV25();};
  const renderAllV25=P.renderAll;P.renderAll=function(){this.ensureV25();const result=renderAllV25.call(this);this.injectV25UI();this.renderCrisisBeaconV25();return result;};
  const bindV25=P.bind;P.bind=function(){bindV25.call(this);this.injectV25UI();if(this._v25Bound)return;this._v25Bound=true;document.addEventListener('click',event=>{if(event.target.closest('[data-v25-open]'))return this.openWorldV16?.('crises');const plan=event.target.closest('[data-v25-plan]');if(plan)return this.selectCrisisV25(plan.dataset.v25Plan);if(event.target.closest('[data-v25-cancel-plan]')){this._v25SelectedCrisisId='';return this.renderWorldV16?.('crises');}const start=event.target.closest('[data-v25-start]');if(start)return this.startCrisisResponseV25(start.dataset.v25Start);const stand=event.target.closest('[data-v25-stand-down]');if(stand)return this.standDownCrisisV25(stand.dataset.v25StandDown);const reopen=event.target.closest('[data-v25-reopen]');if(reopen)return this.reopenCrisisV25(reopen.dataset.v25Reopen);if(event.target.closest('[data-v25-scan]'))return this.scanCrisesV25();});};
})();
