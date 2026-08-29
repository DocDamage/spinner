'use strict';

// V19 expands the V13 loyalty skeleton into multidimensional party relationships,
// reserves, injuries, pair bonds, personal quests, arguments, defections, and
// relationship-driven combat/ending consequences.
(()=>{
  const {PartyConsequencesEngine,migrateV19,AXES}=MultiverseDomain;
  const P=MultiverseWheel.prototype,relationships=new PartyConsequencesEngine();
  const roster=()=>Array.from(CHAR.values());
  const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const pct=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const title=v=>String(v||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

  P.ensureV19=function(state=this.state){if(!state)return state;migrateV19(state,roster());state.v19.processedEvents=Array.isArray(state.v19.processedEvents)?state.v19.processedEvents.slice(-120):[];state.v19.nemesisTargetSpins=Array.isArray(state.v19.nemesisTargetSpins)?state.v19.nemesisTargetSpins.slice(-30):[];return state;};
  const newStateV19=P.newState;P.newState=function(seed){return this.ensureV19(newStateV19.call(this,seed));};
  const loadStateV19=P.loadState;P.loadState=function(){const state=loadStateV19.call(this);return state?this.ensureV19(state):state;};
  const saveV19=P.save;P.save=function(){if(this.state)this.ensureV19();return saveV19.call(this);};

  P.partySummaryV19=function(){this.ensureV19();return relationships.summary(this.state,roster());};
  P.partyCombatV19=function(){this.ensureV19();return relationships.combatModifier(this.state,roster());};

  if(MultiverseDomain.EconomyCraftingEngine&&!MultiverseDomain.EconomyCraftingEngine.prototype._v19PartyPricing){
    const proto=MultiverseDomain.EconomyCraftingEngine.prototype,basePrice=proto.marketPrice;
    proto.marketPrice=function(state,...args){const base=basePrice.call(this,state,...args);if(!state?.v19)return base;return Math.max(1,Math.round(base*(1+relationships.marketModifier(state))));};
    proto._v19PartyPricing=true;
  }

  const effectiveStatsV19=P.effectiveStats;
  P.effectiveStats=function(){
    const stats=effectiveStatsV19.call(this);if(!this.state?.v19)return stats;const surge=relationships.bondSurge(this.state,roster()),activeCombat=['battle','boss'].includes(this.state.pending?.type);
    if(activeCombat&&surge.ready)for(const key of STAT_KEYS)stats[key]=clamp(Number(stats[key]||0)+surge.statBonus,1,440);
    return stats;
  };
  const battleOddsV19=P.battleOdds;
  P.battleOdds=function(p,strategy){const base=battleOddsV19.call(this,p,strategy);if(!this.state?.v19)return base;return clamp(base+this.partyCombatV19().odds,.03,.985);};
  const hitDamageV19=P.hitDamage;
  P.hitDamage=function(...args){const result=hitDamageV19.apply(this,args);if(result&&this.state?.v19){const mod=this.partyCombatV19();result.dmg=Math.max(1,Math.round(result.dmg*(1+mod.damage)));}return result;};

  const recruitV19=P.recruit;
  P.recruit=function(id,...args){const had=this.state.party.includes(id),result=recruitV19.call(this,id,...args);this.ensureV19();if(!had&&this.state.party.includes(id)){relationships.onRecruit(this.state,id,CHAR.get(id));this.log(`PARTY BOND: ${CHAR.get(id)?.name||id} joined with a personal relationship arc.`,'info');this.save();}return result;};

  const adjustLoyaltyV19=P.adjustPartyLoyaltyV13;
  if(typeof adjustLoyaltyV19==='function')P.adjustPartyLoyaltyV13=function(delta,reason){const result=adjustLoyaltyV19.call(this,delta,reason);this.ensureV19();for(const id of this.state.party||[]){const legacy=this.state.v13.relationshipArcs?.[id];if(legacy)this.state.v19.records[id].axes.loyalty=legacy.loyalty;}relationships.syncLegacy(this.state);return result;};

  const narrativeEffectV19=P.applyNarrativeEffectV13;
  if(typeof narrativeEffectV19==='function')P.applyNarrativeEffectV13=function(effect={},source='Story consequence'){const result=narrativeEffectV19.call(this,effect,source);this.ensureV19();relationships.storyEffect(this.state,effect,source);this.save();return result;};

  P.growPairBondsV19=function(type='battle'){
    const ids=this.state.party||[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const p=relationships.pair(this.state,ids[i],ids[j],roster()),boss=type==='boss';p.trust=clamp(p.trust+(boss?4:2),0,100);p.friendship=clamp(p.friendship+(boss?3:1),0,100);p.resentment=clamp(p.resentment-1,0,100);p.rivalry=clamp(p.rivalry+(p.compatibility<40?1:0),0,100);}
  };
  P.recordOutcomeV19=function(type,outcome,enemy=null){
    this.ensureV19();const key=`${this.state.spin}:${type}:${outcome}`;if(this.state.v19.processedEvents.includes(key))return null;this.state.v19.processedEvents.push(key);
    const result=relationships.applyOutcome(this.state,{type,outcome,enemyId:enemy?.id||''},roster());if(outcome==='win')this.growPairBondsV19(type);
    for(const q of result.quests||[])this.log(`PERSONAL QUEST COMPLETE: ${this.state.v19.records[q.characterId]?.name||q.characterId} — ${q.label}.`,'rare');
    if(result.argument)this.log(`PARTY CONFLICT: ${result.argument.title}. Resolve it in Team.`,'loss');
    this.save();return result;
  };

  const afterWinV19=P.afterWin;
  P.afterWin=function(enemy){const type=this.state.pending?.type==='boss'?'boss':'battle',result=afterWinV19.call(this,enemy);this.recordOutcomeV19(type,'win',enemy);return result;};

  const resolveBattleV19=P.resolveBattle;
  P.resolveBattle=function(strategy){const losses=Number(this.state.record?.losses||0),pending=copy(this.state.pending),result=resolveBattleV19.call(this,strategy);if(Number(this.state.record?.losses||0)>losses)this.recordOutcomeV19(pending?.type||'battle','loss',CHAR.get(pending?.profileId||pending?.ref));return result;};

  if(typeof P.fighterKO==='function'){
    const fighterKOV19=P.fighterKO;
    P.fighterKO=function(p,enemy,state){const result=fighterKOV19.call(this,p,enemy,state);this.recordOutcomeV19(p?.type||'battle','loss',enemy);if((p?.type==='boss'||this.state.difficulty==='impossible')&&(this.state.party||[]).length){const candidate=(this.state.party||[]).map(id=>this.state.v19.records[id]).sort((a,b)=>b.wounds.length-a.wounds.length||b.axes.fear-a.axes.fear)[0];if(candidate)relationships.severeConsequence(this.state,candidate.id,`${enemy?.name||'A catastrophic enemy'} defeated the party.`);}this.save();return result;};
  }

  const assistOptionsV19=P.assistOptionsV13;
  if(typeof assistOptionsV19==='function')P.assistOptionsV13=function(){return assistOptionsV19.call(this).filter(option=>relationships.assistDecision(this.state,option.characterId).allowed).map(option=>{const d=relationships.assistDecision(this.state,option.characterId);return{...option,cost:Math.max(25,Number(option.cost||50)+Number(d.costDelta||0)),v19Bond:true};});};
  const useAssistV19=P.useAssistV13;
  if(typeof useAssistV19==='function')P.useAssistV13=function(id){const d=relationships.assistDecision(this.state,id);if(!d.allowed){this.save();this.renderAll();return this.toast(d.reason);}relationships.adjust(this.state,id,{trust:1,friendship:1},'Answered an assist call');return useAssistV19.call(this,id);};

  const useComboV19=P.useComboV13;
  if(typeof useComboV19==='function')P.useComboV13=function(){
    const p=this.state.pending,state=p&&this.combatExperienceV13?.(p),before=state?.enemyHP||0,duo=this.partyCombatV19().duo,result=useComboV19.call(this);
    if(state&&duo?.score>=70&&state.enemyHP>1&&state.enemyHP<before){const extra=Math.min(state.enemyHP-1,Math.max(1,Math.round(state.enemyMaxHP*Math.min(.08,(duo.score-60)*.0015))));if(extra>0){state.enemyHP-=extra;this.state.v19.stats.duoTriggers++;this.log(`DUO BOND: ${CHAR.get(duo.a)?.name||duo.a} + ${CHAR.get(duo.b)?.name||duo.b} added ${extra} combo damage.`,'rare');}}
    this.save();return result;
  };

  P.processEventV19=function(pending){
    if(!pending||pending.stage!=='result')return;const id=String(pending.id||`spin-${this.state.spin}-${pending.type}`);if(this.state.v19.processedEvents.includes(`event:${id}`))return;this.state.v19.processedEvents.push(`event:${id}`);
    if(!['battle','boss'].includes(pending.type))this.recordOutcomeV19(pending.type,pending.type==='hazard'?'resolved':'success');
    if(pending.type==='training'&&pending.ref)relationships.mentorLesson(this.state,pending.ref,'hero');
    const hunting=Object.values(this.state.v16?.nemeses||{}).find(n=>n.status==='hunting'&&n.status!=='broken');if(hunting&&!this.state.v19.nemesisTargetSpins.includes(this.state.spin)){this.state.v19.nemesisTargetSpins.push(this.state.spin);const target=relationships.nemesisTarget(this.state,hunting.id);if(target)this.log(`NEMESIS THREAT: ${hunting.name} is targeting ${target.name}.`,'loss');}
  };

  const completeEventV19=P.completeEvent;
  P.completeEvent=function(){const pending=copy(this.state.pending),questHistory=Number(this.state.v17?.questHistory?.length||0);if(pending?.stage==='result'){this.ensureV19();this.processEventV19(pending);}const result=completeEventV19.call(this);this.ensureV19();const history=(this.state.v17?.questHistory||[]).slice(questHistory).filter(q=>q.status==='completed');for(const q of history){const faction=this.state.v16?.factions?.[q.factionId];if(faction)relationships.factionReaction(this.state,faction);}this.save();return result;};

  const travelLocationV19=P.travelLocationV17;
  if(typeof travelLocationV19==='function')P.travelLocationV17=function(locationId){const before=this.state.v17?.currentLocation?.[String(this.state.v16?.currentUniverse||'').toLowerCase()],result=travelLocationV19.call(this,locationId);this.ensureV19();if(before!==locationId)this.recordOutcomeV19('travel','success');return result;};

  P.benchAllyV19=function(id){const result=relationships.bench(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`RESERVE: ${CHAR.get(id)?.name||id} moved to the bench.`,'info');this.save();this.renderAll();this.renderV19Team();};
  P.activateAllyV19=function(id){const result=relationships.activate(this.state,id,this.partyCapacity?.()||4);if(!result.ok)return this.toast(result.error);this.log(`ACTIVE PARTY: ${CHAR.get(id)?.name||id} returned from reserve.`,'win');this.save();this.renderAll();this.renderV19Team();};
  P.healAllyV19=function(id){const result=relationships.healWound(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`RECOVERY: ${CHAR.get(id)?.name||id} treated ${result.wound.severity} injuries.`,'win');this.save();this.renderAll();this.renderV19Team();};
  P.resolveIncidentV19=function(id,choice){const result=relationships.resolveIncident(this.state,id,choice);if(!result.ok)return this.toast(result.error);this.log(`PARTY INCIDENT: ${title(choice)} — ${result.incident.title}.`,choice==='reconcile'?'win':'info');this.save();this.renderAll();this.renderV19Team();};
  P.togglePermadeathV19=function(){this.ensureV19();this.state.v19.settings.permadeath=!this.state.v19.settings.permadeath;this.save();this.renderV19Team();};

  P.injectV19UI=function(){
    const beacon=document.getElementById('v18-economy-beacon')||document.getElementById('v17-reality-beacon');if(beacon&&!document.getElementById('v19-party-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v19-party-beacon" class="v19-party-beacon" aria-label="Party relationship summary"></section>');
    const titleVersion=document.querySelector('.v13-title-head span'),titleCopy=document.querySelector('.v13-title-head p');if(titleVersion)titleVersion.textContent='V19 • PARTY CONSEQUENCES';if(titleCopy)titleCopy.textContent='Power builds the hero. Trust, rivalry, wounds, loyalty, and betrayal decide who reaches the ending with them.';
    const help=document.getElementById('v19-help');if(!help)document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v19-help"><h3>Party relationships and consequences</h3><p>Allies now track loyalty, trust, respect, friendship, rivalry, fear, resentment, wounds, scars, personal quests, reserve status, and pair bonds. Low morale can trigger arguments; badly fractured relationships can refuse assists or defect. Permadeath is optional and off by default.</p></section>');
    document.documentElement.dataset.v19='party-consequences';
  };

  P.renderPartyBeaconV19=function(){const root=document.getElementById('v19-party-beacon');if(!root)return;const s=this.partySummaryV19(),duo=s.duo,open=s.openIncidents.length;root.innerHTML=`<button type="button" data-v19-open-team><span>PARTY</span><b>Morale ${Math.round(s.morale)} • ${s.active.length} active</b><small>${s.bench.length} reserve • ${open} unresolved conflict${open===1?'':'s'}</small></button><div><span>STRONGEST BOND</span><b>${duo?`${esc(CHAR.get(duo.a)?.name||duo.a)} + ${esc(CHAR.get(duo.b)?.name||duo.b)} • ${Math.round(duo.score)}`:'No duo yet'}</b><small>${s.surge.ready?'Resonant Ascension ready':'Build trust and friendship to unlock a bond surge'}</small></div>`;};

  P.axisBarsV19=function(record){return`<div class="v19-axes">${AXES.map(axis=>`<div class="${axis}"><span>${esc(title(axis))}</span><i><b style="width:${pct(record.axes[axis])}%"></b></i><strong>${Math.round(record.axes[axis])}</strong></div>`).join('')}</div>`;};

  P.renderV19Team=function(){
    const body=document.getElementById('v8-body');if(!body)return;let root=document.getElementById('v19-team-layer');if(!root){root=document.createElement('section');root.id='v19-team-layer';root.className='v19-team-layer';body.appendChild(root);}const s=this.partySummaryV19(),banter=relationships.banter(this.state,roster(),'team'),quests=s.personalQuests;
    const card=(r,bench=false)=>{const q=quests[r.id],char=CHAR.get(r.id);return`<article class="v19-ally-card ${r.status}"><header><img src="${char?this.characterPortrait(char):''}" alt=""><div><span>${esc(r.status.toUpperCase())} • ${esc(r.universe)}</span><h3>${esc(r.name)}</h3><small>${r.wounds.length} wound${r.wounds.length===1?'':'s'} • ${r.scars.length} scar${r.scars.length===1?'':'s'} • ${r.refusals} refusal${r.refusals===1?'':'s'}</small></div></header>${this.axisBarsV19(r)}${q?`<section class="v19-personal-quest"><span>PERSONAL QUEST</span><b>${esc(q.label)}</b><small>${q.status==='completed'?'COMPLETE':`${q.progress}/${q.target}`}</small></section>`:''}<footer>${bench?`<button data-v19-activate="${esc(r.id)}">ACTIVATE</button>`:`<button data-v19-bench="${esc(r.id)}">BENCH</button>`}${r.wounds.length?`<button data-v19-heal="${esc(r.id)}">TREAT WOUND</button>`:''}${r.targetedBy?`<em>NEMESIS TARGET</em>`:''}</footer></article>`;};
    const incidents=s.openIncidents.map(i=>`<article><b>${esc(i.title)}</b><div><button data-v19-incident="${esc(i.id)}|reconcile">RECONCILE</button><button data-v19-incident="${esc(i.id)}|side-a">SIDE WITH ${esc(CHAR.get(i.a)?.name||i.a)}</button><button data-v19-incident="${esc(i.id)}|side-b">SIDE WITH ${esc(CHAR.get(i.b)?.name||i.b)}</button></div></article>`).join('');
    root.innerHTML=`<section class="v19-team-head"><div><span>PARTY CONSEQUENCES</span><h2>Morale ${Math.round(s.morale)} / 100</h2><p>Relationships now alter battle odds, damage, assists, vendor prices, personal quests, defections, and the ending.</p></div><button data-v19-permadeath class="${this.state.v19.settings.permadeath?'on':''}">PERMADEATH • ${this.state.v19.settings.permadeath?'ON':'OFF'}</button></section>${s.surge.ready?`<section class="v19-surge"><span>RELATIONSHIP TRANSFORMATION READY</span><b>RESONANT ASCENSION</b><p>${esc(CHAR.get(s.duo.a)?.name||s.duo.a)} + ${esc(CHAR.get(s.duo.b)?.name||s.duo.b)} have crossed the Bond 82 / Morale 70 threshold. Combat gains +4 all stats and +8% relationship damage while the bond remains intact.</p></section>`:''}<section class="v19-team-grid">${s.active.map(r=>card(r,false)).join('')||'<p>No active allies.</p>'}</section><section class="v19-reserves"><header><span>RESERVES</span><b>${s.bench.length}</b></header><div>${s.bench.map(r=>card(r,true)).join('')||'<p>No reserve allies.</p>'}</div></section>${incidents?`<section class="v19-incidents"><header><span>UNRESOLVED CONFLICTS</span></header>${incidents}</section>`:''}<section class="v19-duo"><span>DUO BOND</span><b>${s.duo?`${esc(CHAR.get(s.duo.a)?.name||s.duo.a)} + ${esc(CHAR.get(s.duo.b)?.name||s.duo.b)} • ${Math.round(s.duo.score)}`:'No active duo'}</b><small>70 unlocks stronger team-combo pressure • 82 + Morale 70 unlocks Resonant Ascension</small></section><section class="v19-banter"><span>PARTY BANTER</span>${banter.map(line=>`<p class="${line.tone}"><b>${esc(line.name)}</b> “${esc(line.text)}”</p>`).join('')||'<p>The route is quiet.</p>'}</section>`;
  };

  const renderShellV19=P.renderShell;
  P.renderShell=function(section,tab){const result=renderShellV19.call(this,section,tab);if(section==='team')this.renderV19Team();return result;};

  const createEndingV19=P.createEndingV13;
  if(typeof createEndingV19==='function')P.createEndingV13=function(finalWin=this.state.finalWin){const ending=createEndingV19.call(this,finalWin);this.ensureV19();const partyEnding=relationships.ending(this.state);this.state.v19.ending=partyEnding;if(this.state.v13?.recap){this.state.v13.recap.relationshipEnding=copy(partyEnding);this.state.v13.recap.highlights=[...(this.state.v13.recap.highlights||[]),{type:'party',title:partyEnding.label,detail:partyEnding.detail}].slice(-16);}return ending;};

  const renderAllV19=P.renderAll;
  P.renderAll=function(){this.ensureV19();const result=renderAllV19.call(this);this.injectV19UI();this.renderPartyBeaconV19();return result;};

  const bindV19=P.bind;
  P.bind=function(){bindV19.call(this);this.injectV19UI();if(this._v19Bound)return;this._v19Bound=true;document.addEventListener('click',event=>{
    if(event.target.closest('[data-v19-open-team]')){document.querySelector('[data-v13-panel="team"]')?.click();return;}
    const bench=event.target.closest('[data-v19-bench]');if(bench)return this.benchAllyV19(bench.dataset.v19Bench);
    const activate=event.target.closest('[data-v19-activate]');if(activate)return this.activateAllyV19(activate.dataset.v19Activate);
    const heal=event.target.closest('[data-v19-heal]');if(heal)return this.healAllyV19(heal.dataset.v19Heal);
    const incident=event.target.closest('[data-v19-incident]');if(incident){const [id,choice]=incident.dataset.v19Incident.split('|');return this.resolveIncidentV19(id,choice);}
    if(event.target.closest('[data-v19-permadeath]'))return this.togglePermadeathV19();
  });};
})();
