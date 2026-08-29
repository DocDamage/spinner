'use strict';

// V24 adds persistent races, tournaments, trials, hunts, and community events
// around ordinary Wheel outcomes without creating detached minigames or wallets.
(()=>{
  const {ActivityCircuitEngine,migrateV24,ACTIVITY_FAMILIES_V24,ACTIVITY_STYLES_V24}=MultiverseDomain;
  const P=MultiverseWheel.prototype,activities=new ActivityCircuitEngine();
  const artifacts=()=>Array.from(ART.values());
  const roster=()=>Array.from(CHAR.values());
  const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const label=v=>String(v||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const charName=id=>CHAR.get(String(id||''))?.name||String(id||'Unknown');
  const rewardText=rewards=>Object.entries(rewards||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${v} ${label(k)}`).join(' + ')||'Record only';
  const refresh=function(){this.save();this.renderAll();if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16?.('activities');};

  P.ensureV24=function(state=this.state){if(!state)return state;migrateV24(state,artifacts(),roster());activities.catchUp(state,6);return state;};
  const newStateV24=P.newState;P.newState=function(seed){return this.ensureV24(newStateV24.call(this,seed));};
  const loadStateV24=P.loadState;P.loadState=function(){const state=loadStateV24.call(this);return state?this.ensureV24(state):state;};
  const saveV24=P.save;P.save=function(){if(this.state)this.ensureV24();return saveV24.call(this);};

  if(MultiverseDomain.TacticalOperationsEngine&&!MultiverseDomain.TacticalOperationsEngine.prototype._v24ActivityFocusGuard){
    const proto=MultiverseDomain.TacticalOperationsEngine.prototype,base=proto.beginOperation;
    if(typeof base==='function')proto.beginOperation=function(state,...args){if(state?.v24?.activeActivityId)return{ok:false,error:'Finish or withdraw from the active V24 activity before deploying an operation.'};return base.call(this,state,...args);};
    proto._v24ActivityFocusGuard=true;
  }

  const recordOutcomeV24=P.recordOutcomeV19;
  if(typeof recordOutcomeV24==='function')P.recordOutcomeV19=function(type,outcome,enemy=null){
    const result=recordOutcomeV24.call(this,type,outcome,enemy);this.ensureV24();
    const event=activities.processEvent(this.state,{id:`v24:${this.state.spin}:${type}:${outcome}:${enemy?.id||''}`,type,outcome,enemyId:enemy?.id||''},roster());
    if(event?.segmentComplete&&!event.activityComplete)this.log(`ACTIVITY SEGMENT COMPLETE: ${event.activity?.label||'Circuit event'} advances.`,'rare');
    if(event?.activityComplete)this.log(`ACTIVITY FINISH: ${event.activity?.label||'Circuit event'} — rank ${event.rank}.`,'win');
    this.save();return result;
  };

  P.activitySummaryV24=function(){this.ensureV24();return activities.summary(this.state);};
  P.selectActivityV24=function(id){this._v24SelectedActivityId=String(id||'');this.renderWorldV16?.('activities');};
  P.enterActivityV24=function(id){
    const panel=document.querySelector(`[data-v24-planner="${String(id).replace(/"/g,'\\"')}"]`);if(!panel)return this.toast('Open the activity planner first.');
    const plan={style:panel.querySelector('[data-v24-style]')?.value||'balanced',companionId:panel.querySelector('[data-v24-companion]')?.value||'',relicId:panel.querySelector('[data-v24-relic]')?.value||''};
    const result=activities.beginActivity(this.state,id,plan);if(!result.ok)return this.toast(result.error);this._v24SelectedActivityId='';this.log(`ACTIVITY ENTERED: ${result.activity.label} • ${result.entryCost} Credits.`,'rare');refresh.call(this);
  };
  P.withdrawActivityV24=function(id){const result=activities.withdrawActivity(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`ACTIVITY WITHDRAWAL: ${result.activity.label}. Entry fee was not refunded.`,'loss');refresh.call(this);};
  P.scanActivitiesV24=function(){this.ensureV24();const created=activities.discoverActivities(this.state,12);this.log(created.length?`ACTIVITY CIRCUIT: ${created.length} new event${created.length===1?'':'s'} posted.`:'ACTIVITY CIRCUIT: No new events are available right now.','rare');refresh.call(this);};

  P.v24SegmentTrack=function(activity){return `<div class="v24-segment-track">${activity.segments.map((segment,i)=>`<article class="${safe(segment.status)}"><span>${i+1}</span><div><b>${safe(segment.label)}</b><small>${segment.progress}/${segment.target} • ${segment.events.map(label).join(', ')}</small></div></article>`).join('')}</div>`;};

  P.renderPlannerV24=function(activity){
    const companions=`<option value="">Solo entry</option>`+(this.state.party||[]).map(id=>{const status=activities.companionAvailability(this.state,id);return`<option value="${safe(id)}" ${status.allowed?'':'disabled'}>${safe(charName(id))}${status.allowed?'':` • ${safe(status.reason)}`}</option>`;}).join('');
    const relics=`<option value="">No relic support</option>`+(this.state.artifacts||[]).filter(id=>this.state.v20?.relics?.[id]?.status!=='stolen').map(id=>`<option value="${safe(id)}">${safe(this.state.v20?.relics?.[id]?.name||ART.get(id)?.name||id)}</option>`).join('');
    const styles=Object.entries(ACTIVITY_STYLES_V24).map(([id,style])=>`<option value="${id}">${safe(style.label)} • ${style.score>=0?'+':''}${style.score} score bias</option>`).join('');
    const def=ACTIVITY_FAMILIES_V24[activity.family];
    return `<section class="v24-planner" data-v24-planner="${safe(activity.id)}"><header><div><span>EVENT ENTRY • ${safe(label(def.category))}</span><h3>${safe(activity.label)}</h3><p>${safe(activity.summary)}</p></div><aside><b>${activity.entryCost}</b><small>V18 Credits</small></aside></header><div class="v24-plan-grid"><label><span>Competition style</span><select data-v24-style>${styles}</select></label><label><span>V19 companion</span><select data-v24-companion>${companions}</select></label><label><span>V20 relic support</span><select data-v24-relic>${relics}</select></label></div><div class="v24-planner-note"><b>FOCUS STATS</b><span>${def.focus.map(label).join(' + ')}</span><b>BASE PURSE</b><span>${safe(rewardText(activity.rewards))}</span></div><footer><button type="button" data-v24-cancel-plan>BACK</button><button type="button" data-v24-enter="${safe(activity.id)}">PAY ENTRY & START</button></footer></section>`;
  };

  P.renderActivitiesV24=function(){
    this.ensureV24();const summary=activities.summary(this.state),active=summary.active,selected=summary.available.find(a=>a.id===this._v24SelectedActivityId);if(selected)return this.renderPlannerV24(selected);
    const available=summary.available.map(activity=>{const def=ACTIVITY_FAMILIES_V24[activity.family];return`<article class="v24-activity-card"><header><div><span>${safe(label(def.category))} • ${safe(activity.universe)}</span><h3>${safe(activity.label)}</h3></div><b>${Math.round(activity.heat)}</b></header><p>${safe(activity.summary)}</p><div class="v24-tags"><span>${safe(def.label)}</span><span>Difficulty ${activity.difficulty}/5</span><span>${safe(activity.venue)}</span></div><footer><small>${activity.entryCost} Credits entry • ${safe(rewardText(activity.rewards))}</small><button type="button" data-v24-plan="${safe(activity.id)}">VIEW & ENTER</button></footer></article>`;}).join('')||'<section class="v24-empty"><h3>No activities are posted</h3><p>Scan the circuit to discover deterministic events from the current universe, settlements, strongholds, and faction hosts.</p></section>';
    const activeBlock=active?`<section class="v24-active"><header><div><span>ACTIVE ${safe(label(ACTIVITY_FAMILIES_V24[active.family]?.category))}</span><h3>${safe(active.label)}</h3><p>${safe(active.venue)} • ${safe(ACTIVITY_STYLES_V24[active.planning.style]?.label||label(active.planning.style))} style • score ${Math.round(active.score)}</p></div><aside><b>${Math.round(active.score)}</b><small>live score</small><b>${active.failures}</b><small>setbacks</small></aside></header>${this.v24SegmentTrack(active)}<div class="v24-active-note"><b>NEXT WHEEL SIGNALS</b><span>${active.segments[active.segmentIndex].events.map(label).join(', ')}</span></div><footer><span>${active.planning.companionId?`Companion: ${safe(charName(active.planning.companionId))}`:'Solo entry'}${active.planning.relicId?' • relic support active':''}</span><button type="button" data-v24-withdraw="${safe(active.id)}">WITHDRAW</button></footer></section>`:'';
    const recent=summary.recent.length?summary.recent.map(activity=>`<li><div><b>${safe(activity.label)}</b><span>${activity.rank?`Rank ${activity.rank}`:'Withdrawn'} • ${safe(activity.universe)} • score ${Math.round(activity.result?.playerScore||activity.score||0)}</span></div><small>${safe(rewardText(activity.resolvedRewards||{}))}</small></li>`).join(''):'<li><span>No completed circuit events yet.</span></li>';
    return `<section class="v24-head"><div><span>V24 • MULTIVERSE ACTIVITIES & COMPETITION CIRCUITS</span><h3>Race, compete, hunt, train, and celebrate through the Wheel</h3><p>Activities turn the wider multiverse into repeatable competition without a separate racing engine, arena combat system, currency, or minigame layer.</p></div><aside><b>${summary.season.points}</b><small>circuit score</small><b>${safe(summary.season.tier)}</b><small>season tier</small></aside></section><section class="v24-summary"><article><span>WINS</span><b>${summary.stats.wins}</b></article><article><span>PODIUMS</span><b>${summary.stats.podiums}</b></article><article><span>RACES WON</span><b>${summary.stats.racesWon}</b></article><article><span>TOURNAMENTS WON</span><b>${summary.stats.tournamentsWon}</b></article></section>${activeBlock}<section class="v24-available"><div class="v24-section-head"><div><span>AVAILABLE ACTIVITIES</span><p>Only one circuit activity can be active, and it cannot overlap a V23 operation.</p></div><button type="button" data-v24-scan>SCAN CIRCUIT</button></div><div class="v24-activity-grid">${available}</div></section><section class="v24-history"><div class="v24-section-head"><div><span>RESULTS BOARD</span><p>Circuit score is a non-spendable ranking record; all actual costs and rewards use V18.</p></div></div><ul>${recent}</ul></section>`;
  };

  P.injectV24UI=function(){
    const world=document.getElementById('v16-world-modal');if(world&&!world.querySelector('[data-v16-world-tab="activities"]'))(world.querySelector('[data-v16-world-tab="operations"]')||world.querySelector('[data-v16-world-tab="civilians"]'))?.insertAdjacentHTML('afterend','<button type="button" data-v16-world-tab="activities">ACTIVITIES</button>');
    const beacon=document.getElementById('v23-operation-beacon')||document.getElementById('v22-civilian-beacon');if(beacon&&!document.getElementById('v24-activity-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v24-activity-beacon" class="v24-activity-beacon" aria-label="Multiverse activity circuit summary"></section>');
    const version=document.querySelector('.v13-title-head span'),copyNode=document.querySelector('.v13-title-head p');if(version)version.textContent='V24 • MULTIVERSE ACTIVITIES & COMPETITION CIRCUITS';if(copyNode)copyNode.textContent='Enter races, tournaments, trials, hunts, and community events, then let normal Wheel outcomes decide every segment and final placement.';
    if(!document.getElementById('v24-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v24-help"><h3>Activities & competition circuits</h3><p>Open World → Activities. Enter races, combat tournaments, portal rallies, survival gauntlets, relic trials, treasure hunts, bounty pursuits, rescue drills, civilian cups, stronghold games, and faction grand prix events. Entry fees and purses use V18; companions, relics, factions, settlements, and strongholds keep their existing ownership systems.</p></section>');
    document.documentElement.dataset.v24='multiverse-activities-competition-circuits';
  };

  P.renderActivityBeaconV24=function(){const root=document.getElementById('v24-activity-beacon');if(!root)return;const summary=this.activitySummaryV24(),focus=summary.active||summary.available[0];root.innerHTML=`<button type="button" data-v24-open><span>ACTIVITY CIRCUIT</span><b>${focus?safe(focus.label):'No event posted'}</b><small>${summary.active?`Segment ${summary.active.segmentIndex+1}/${summary.active.segments.length} • score ${Math.round(summary.active.score)}`:`${summary.available.length} available • ${summary.stats.completed} completed`}</small></button><div><span>SEASON RECORD</span><b>${summary.season.points} points • ${safe(summary.season.tier)}</b><small>${summary.stats.wins} wins • ${summary.stats.podiums} podiums</small></div>`;};

  const renderWorldV24=P.renderWorldV16;P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){if(tab!=='activities')return renderWorldV24.call(this,tab);this.ensureV24();this._v16WorldTab='activities';document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab==='activities'));const body=document.querySelector('[data-v16-world-body]');if(body)body.innerHTML=this.renderActivitiesV24();};
  const renderAllV24=P.renderAll;P.renderAll=function(){this.ensureV24();const result=renderAllV24.call(this);this.injectV24UI();this.renderActivityBeaconV24();return result;};
  const bindV24=P.bind;P.bind=function(){bindV24.call(this);this.injectV24UI();if(this._v24Bound)return;this._v24Bound=true;document.addEventListener('click',event=>{if(event.target.closest('[data-v24-open]'))return this.openWorldV16?.('activities');const plan=event.target.closest('[data-v24-plan]');if(plan)return this.selectActivityV24(plan.dataset.v24Plan);if(event.target.closest('[data-v24-cancel-plan]')){this._v24SelectedActivityId='';return this.renderWorldV16?.('activities');}const enter=event.target.closest('[data-v24-enter]');if(enter)return this.enterActivityV24(enter.dataset.v24Enter);const withdraw=event.target.closest('[data-v24-withdraw]');if(withdraw)return this.withdrawActivityV24(withdraw.dataset.v24Withdraw);if(event.target.closest('[data-v24-scan]'))return this.scanActivitiesV24();});};
})();
