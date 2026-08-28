'use strict';

// V17 turns each discovered reality into a rules-bearing place with its own
// destinations, faction work, and Wheel currents. It extends V16 rather than
// replacing the Living Multiverse simulation.
(()=>{
  const {RealityRulesEngine,migrateV17,canonicalUniverse:canonicalFromV16}=MultiverseDomain;
  const P=MultiverseWheel.prototype,reality=new RealityRulesEngine();
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const roster=()=>Array.from(CHAR.values());
  const canonical=value=>canonicalFromV16?.(value)||String(value||'Unknown');
  const title=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
  const signed=value=>`${Number(value)>=0?'+':''}${Math.round(Number(value)*100)}%`;
  const questOutcome=pending=>pending?.v17Outcome||(['battle','boss'].includes(pending?.type)?'unknown':'resolved');
  const protectedWheelTypes=new Set(['origin','boss','v9-story','v9-camp','ending']);

  P.ensureV17=function(state=this.state){return state?migrateV17(state,roster()):state;};
  const newStateV17=P.newState;
  P.newState=function(seed){return this.ensureV17(newStateV17.call(this,seed));};
  const loadStateV17=P.loadState;
  P.loadState=function(){const state=loadStateV17.call(this);return state?this.ensureV17(state):state;};
  const saveV17=P.save;
  P.save=function(){if(this.state)this.ensureV17();return saveV17.call(this);};

  P.realitySummaryV17=function(){this.ensureV17();return reality.summary(this.state);};
  P.currentRealityRulesV17=function(){this.ensureV17();const location=reality.currentLocationRecord(this.state);return reality.ruleModifiers(this.state,this.state.v16.currentUniverse,location?.id||'');};

  const battleOddsV17=P.battleOdds;
  P.battleOdds=function(p,strategy){
    const base=battleOddsV17.call(this,p,strategy);if(!this.state?.v17)return base;const mods=this.currentRealityRulesV17(),tagDelta=reality.tagPressure(this.state,[...this.ownedTags()]);return clamp(base+Number(mods[strategy]||0)+tagDelta,.04,.97);
  };
  const hazardOddsV17=P.hazardOdds;
  P.hazardOdds=function(h){const base=hazardOddsV17.call(this,h);if(!this.state?.v17)return base;const danger=Number(this.currentRealityRulesV17().hazard||0);return{...base,odds:clamp(Number(base.odds||0)-danger*.45,.12,.95),v17RealityDanger:danger};};

  P.replaceWheelSliceV17=function(type,used=new Set()){
    const focusPower=Boolean(this.state.v11Experience?.collectionFocus?.remaining),candidates=this.state.slices.map((slice,index)=>({slice,index})).filter(({slice,index})=>!used.has(index)&&!protectedWheelTypes.has(slice.type)&&slice.type!=='hazard'&&slice.type!==type&&!(focusPower&&slice.type==='power'));if(!candidates.length)return false;
    const key=MultiverseDomain.hash32?.(`${this.state.seed}|${this.state.spin}|${type}|${used.size}|v17`)||0,selected=candidates[key%candidates.length];this.state.slices[selected.index]=this.buildSlice(type);used.add(selected.index);return true;
  };
  P.applyWheelDirectiveV17=function(){
    const next=Number(this.state.spin||0)+1;if(next===1||[10,20,30].includes(next)||this.state.v13?.runContext?.kind==='daily')return;const directive=reality.wheelDirective(this.state),used=new Set(),supported=new Set(['battle','power','transform','training','recruit','artifact','rare','recovery','hazard']);
    for(const [type,count] of Object.entries(directive.bias||{})){if(!supported.has(type))continue;for(let i=0;i<Math.min(3,Number(count||0));i++)this.replaceWheelSliceV17(type,used);}
    const hasHazard=this.state.slices.some(slice=>slice.type==='hazard');if(directive.hazard>=.07&&!hasHazard)this.replaceWheelSliceV17('hazard',used);else if(directive.hazard<=-.07&&hasHazard){const index=this.state.slices.findIndex(slice=>slice.type==='hazard');if(index>=0)this.state.slices[index]=this.buildSlice('recovery');}
    let hidden=Math.max(0,Math.min(3,Number(directive.conceal||0)));if(hidden){const candidates=this.state.slices.map((slice,index)=>({slice,index})).filter(({slice})=>slice.type!=='hazard'&&!protectedWheelTypes.has(slice.type));while(hidden&&candidates.length){const key=MultiverseDomain.hash32?.(`${this.state.seed}|${this.state.spin}|secret|${hidden}|${candidates.length}`)||0,{slice,index}=candidates.splice(key%candidates.length,1)[0];this.state.slices[index]={...slice,v17Secret:true,v17RevealLabel:slice.label,v17RevealSub:slice.sub,label:'???',sub:'UNRESOLVED SIGNAL',color:'#e5e7eb'};hidden--;}}
    this.save();this.drawWheel();
  };
  const generateWheelV17=P.generateWheel;
  P.generateWheel=function(){
    if(this.state?.v17){this.ensureV17();const next=Number(this.state.spin||0)+1,protectedBeat=next===1||[10,20,30].includes(next)||this.state.v13?.runContext?.kind==='daily';if(!protectedBeat)reality.rollChain(this.state);}
    const result=generateWheelV17.call(this);if(this.state?.v17)this.applyWheelDirectiveV17();return result;
  };

  const landV17=P.land;
  P.land=function(slice){
    const secret=Boolean(slice?.v17Secret),revealed=secret?{...slice,label:slice.v17RevealLabel||'Unknown Signal',sub:slice.v17RevealSub||'',v17WasSecret:true}:slice,chain=this.state?.v17?.wheel?.activeChain?copy(this.state.v17.wheel.activeChain):null,protectedLanding=protectedWheelTypes.has(revealed?.type)||this.state.v13?.runContext?.kind==='daily';
    const result=landV17.call(this,revealed);if(this.state?.v17&&chain&&!protectedLanding){const consumed=reality.consumeChain(this.state);if(consumed?.remaining===0)this.log(`WHEEL CURRENT ENDED: ${consumed.label}.`,'info');}
    if(secret){this.log(`SECRET SLICE REVEALED: ${revealed.label}.`,'rare');this.audio.rare();}this.save();return result;
  };

  const resolveBattleV17=P.resolveBattle;
  P.resolveBattle=function(strategy){const beforeWins=Number(this.state.record?.wins||0),beforeLosses=Number(this.state.record?.losses||0),result=resolveBattleV17.call(this,strategy),pending=this.state.pending;if(pending){if(Number(this.state.record?.wins||0)>beforeWins)pending.v17Outcome='win';else if(Number(this.state.record?.losses||0)>beforeLosses)pending.v17Outcome='loss';}return result;};
  if(typeof P.finishCombatVictory==='function'){
    const finishCombatVictoryV17=P.finishCombatVictory;P.finishCombatVictory=function(p,enemy){if(p)p.v17Outcome='win';return finishCombatVictoryV17.call(this,p,enemy);};
  }
  if(typeof P.fighterKO==='function'){
    const fighterKOV17=P.fighterKO;P.fighterKO=function(p,enemy,state){if(p)p.v17Outcome='loss';return fighterKOV17.call(this,p,enemy,state);};
  }
  const resolveHazardV17=P.resolveHazard;
  P.resolveHazard=function(mode){if(this.state.pending)this.state.pending.v17Outcome='resolved';return resolveHazardV17.call(this,mode);};

  const completeEventV17=P.completeEvent;
  P.completeEvent=function(){
    const pending=copy(this.state.pending);if(pending?.stage==='result'&&this.state?.v17){const completed=reality.progressEvent(this.state,{type:pending.type,outcome:questOutcome(pending),universe:this.state.v16.currentUniverse,locationId:reality.currentLocationRecord(this.state)?.id||'',eventId:`event:${pending.id||this.state.spin}`});for(const quest of completed)this.log(`FACTION QUEST COMPLETE: ${quest.factionName} — ${quest.label}. +${quest.reward.reputation} reputation, +${quest.reward.favor} Favor.`,'rare');}
    return completeEventV17.call(this);
  };

  const travelWorldV17=P.travelWorldV16;
  P.travelWorldV16=function(name){const result=travelWorldV17.call(this,name);this.ensureV17();const current=canonical(this.state.v16.currentUniverse);for(const quest of this.state.v17.quests.filter(q=>q.status==='offered'&&canonical(q.universe)!==current)){quest.status='expired';this.state.v17.questHistory.push(copy(quest));}this.state.v17.questHistory=this.state.v17.questHistory.slice(-80);reality.ensureOffers(this.state);this.save();this.renderAll();return result;};

  P.travelLocationV17=function(locationId){const result=reality.travelLocation(this.state,locationId);if(!result.ok)return this.toast(result.error);this.log(`DESTINATION FOCUSED: ${result.route.label} in ${result.route.universe}.`,'info');this.save();this.renderAll();this.renderWorldV16('routes');};
  P.acceptQuestV17=function(id){const result=reality.acceptQuest(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`FACTION QUEST ACCEPTED: ${result.quest.factionName} — ${result.quest.label}.`,'info');this.save();this.renderWorldV16('quests');this.renderRealityBeaconV17();};
  P.abandonQuestV17=function(id){const result=reality.abandonQuest(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`FACTION QUEST ABANDONED: ${result.quest.label}.`,'loss');this.save();this.renderWorldV16('quests');this.renderRealityBeaconV17();};
  P.spendFavorV17=function(factionId,kind){const result=reality.spendFavor(this.state,factionId,kind);if(!result.ok)return this.toast(result.error);this.log(`FACTION FAVOR: ${title(kind)} purchased for ${result.cost} Favor.`,'win');this.save();this.renderAll();this.renderWorldV16('quests');};

  P.injectV17UI=function(){
    const modal=document.getElementById('v16-world-modal'),nav=modal?.querySelector('nav');if(nav&&!nav.querySelector('[data-v16-world-tab="dna"]'))nav.insertAdjacentHTML('beforeend','<button type="button" data-v16-world-tab="dna">DNA</button><button type="button" data-v16-world-tab="routes">ROUTES</button><button type="button" data-v16-world-tab="quests">QUESTS</button>');
    const header=modal?.querySelector('.v16-world-card>header div');if(header){header.querySelector('span').textContent='REALITY ENGINE';header.querySelector('h2').textContent='World State & Reality Rules';header.querySelector('p').textContent='Universe DNA, destinations, faction work, nemeses, and Wheel currents all persist with this timeline.';}
    const rail=document.getElementById('v13-build-rail');if(rail&&!document.getElementById('v17-reality-beacon'))rail.insertAdjacentHTML('afterend','<section id="v17-reality-beacon" class="v17-reality-beacon" aria-label="Reality rules summary"></section>');
    const titleVersion=document.querySelector('.v13-title-head span'),titleCopy=document.querySelector('.v13-title-head p');if(titleVersion)titleVersion.textContent='V17 • REALITY RULES';if(titleCopy)titleCopy.textContent='Every universe has laws. Every destination changes the Wheel. Every faction remembers the work.';
    const help=document.getElementById('v17-help');if(!help)document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v17-help"><h3>Universe DNA, routes, and faction quests</h3><p>Each discovered universe now receives deterministic physical, technological, mystical, temporal, mortality, and psionic laws. Choose destinations inside the current reality to bias encounters, unlock hidden routes through world conditions, accept faction quests for reputation and Favor, and watch multi-spin Wheel currents alter future results.</p></section>');
    document.documentElement.dataset.v17='reality-rules';
  };

  P.renderRealityBeaconV17=function(){const root=document.getElementById('v17-reality-beacon');if(!root)return;const s=this.realitySummaryV17(),dna=s.dna,chain=s.activeChain,questCount=s.activeQuests.length;root.innerHTML=`<button type="button" data-v16-world-open><span>REALITY</span><b>${esc(s.world.name)}</b><small>${esc(s.location?.label||'Unknown destination')}</small></button><div><span>LOCAL LAWS</span><b>${esc(title(dna.laws.gravity))} gravity • ${esc(title(dna.laws.time))} time</b><small>${esc(title(dna.laws.technology))} tech • ${esc(title(dna.laws.mystic))} mystic</small></div><div class="${chain?'active':''}"><span>WHEEL CURRENT</span><b>${esc(chain?.label||'Stable')}</b><small>${chain?`${chain.remaining} spin${chain.remaining===1?'':'s'} remaining`:'No active chain'}</small></div><div><span>FACTION WORK</span><b>${questCount} active • ${s.favorTotal} Favor</b><small>${s.secretsFound} hidden route${s.secretsFound===1?'':'s'} found</small></div>`;};

  P.renderDNAV17=function(){const s=this.realitySummaryV17(),dna=s.dna,mods=this.currentRealityRulesV17();return `<section class="v17-section-head"><div><span>UNIVERSE DNA • ${esc(dna.signature)}</span><h3>${esc(dna.name)}</h3></div><p>These laws are deterministic for this run and reality. They modify real battle/hazard probabilities within hard safety caps.</p></section><div class="v17-law-grid">${Object.entries(dna.laws).map(([key,value])=>`<article><span>${esc(key.toUpperCase())}</span><b>${esc(title(value))}</b><small>${esc(key==='gravity'?'Movement and physical leverage':key==='technology'?'Tactical and engineered solutions':key==='mystic'?'Magic and symbolic law':key==='time'?'Initiative, prediction, anomalies':key==='mortality'?'Durability and survival':'Psychic and mind-space pressure')}</small></article>`).join('')}</div><div class="v17-affinity-grid"><article><span>AMPLIFIED TAGS</span><b>${dna.amplifiedTags.map(esc).join(' • ')}</b></article><article><span>SUPPRESSED TAGS</span><b>${dna.suppressedTags.map(esc).join(' • ')}</b></article></div><section class="v17-modifiers"><span>ACTIVE STRATEGY MODIFIERS</span>${['clash','blitz','tactics','mystic','outlast'].map(key=>`<div><b>${esc(STRATEGIES[key].name)}</b><i class="${mods[key]>=0?'good':'bad'}">${signed(mods[key])}</i></div>`).join('')}<div><b>Hazard severity</b><i class="${mods.hazard<=0?'good':'bad'}">${signed(mods.hazard)}</i></div></section>`;};

  P.renderRoutesV17=function(){const s=this.realitySummaryV17(),routes=reality.routesFor(this.state,s.world.name);reality.refreshUnlocks(this.state);return `<section class="v17-section-head"><div><span>BRANCHING DESTINATIONS</span><h3>${esc(s.world.name)}</h3></div><p>Your current location changes encounter weighting and local rule modifiers without erasing the universe's persistent state.</p></section><div class="v17-route-grid">${routes.map(route=>{const active=s.location?.id===route.id,locked=!route.unlocked;return `<article class="${active?'active':''} ${locked?'locked':''}"><header><span>${locked?'HIDDEN ROUTE':active?'CURRENT DESTINATION':route.secret?'SECRET ROUTE':'KNOWN ROUTE'}</span><h3>${locked?'???':esc(route.label)}</h3></header><p>${locked?'Conditions in this reality have not exposed this path yet.':esc(route.summary)}</p>${locked?`<small>Unlock through ${esc(route.unlock==='corruption'?'high corruption':route.unlock==='reputation'?'faction trust':route.unlock==='nemesis'?'a local nemesis':'repeated visits')} or spend faction Favor to reveal it.</small>`:`<div class="v17-route-tags"><span>Wheel: ${route.bias.map(title).map(esc).join(' • ')}</span><span>Quests: ${route.questKinds.map(title).map(esc).join(' • ')}</span></div><button type="button" data-v17-route="${esc(route.id)}" ${active?'disabled':''}>${active?'FOCUSED':'TRAVEL HERE'}</button>`}</article>`;}).join('')}</div>`;};

  P.renderQuestsV17=function(){reality.ensureOffers(this.state);const s=this.realitySummaryV17(),active=s.activeQuests,offered=s.offeredQuests,factions=Object.values(this.state.v16.factions||{}).sort((a,b)=>reality.factionFavor(this.state,b.id)-reality.factionFavor(this.state,a.id));const card=(quest,activeQuest=false)=>`<article class="${activeQuest?'active':''}"><header><div><span>${esc(quest.factionName)}</span><h3>${esc(quest.label)}</h3></div><b>${quest.progress}/${quest.target}</b></header><p>${esc(quest.objective)}</p><div class="v17-quest-reward"><span>+${quest.reward.reputation} REP</span><span>+${quest.reward.favor} FAVOR</span><span>+${quest.reward.stability} STABILITY</span></div><button type="button" ${activeQuest?`data-v17-quest-abandon="${esc(quest.id)}" class="danger">ABANDON`:`data-v17-quest-accept="${esc(quest.id)}">ACCEPT`}</button></article>`;return `<section class="v17-section-head"><div><span>FACTION OPERATIONS</span><h3>${active.length} active / 3 maximum</h3></div><p>Complete work to change faction reputation, earn Favor, stabilize worlds, and trigger high-value Wheel currents.</p></section>${active.length?`<h4 class="v17-subhead">ACTIVE QUESTS</h4><div class="v17-quest-grid">${active.map(q=>card(q,true)).join('')}</div>`:''}<h4 class="v17-subhead">AVAILABLE AT ${esc(s.location?.label||s.world.name)}</h4><div class="v17-quest-grid">${offered.length?offered.map(q=>card(q,false)).join(''):'<p class="v16-empty">No new operations are available until the current activity changes.</p>'}</div><h4 class="v17-subhead">FACTION FAVOR</h4><div class="v17-favor-grid">${factions.map(faction=>`<article><div><span>${esc(faction.name)}</span><b>${reality.factionFavor(this.state,faction.id)} FAVOR</b><small>Reputation ${Number(faction.reputation||0)>=0?'+':''}${Number(faction.reputation||0)}</small></div><div><button type="button" data-v17-favor="${esc(faction.id)}|stabilize">STABILIZE • 2</button><button type="button" data-v17-favor="${esc(faction.id)}|reveal">REVEAL ROUTE • 2</button><button type="button" data-v17-favor="${esc(faction.id)}|ceasefire">CEASEFIRE • 3</button></div></article>`).join('')}</div>`;};

  const renderWorldV17=P.renderWorldV16;
  P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){if(!['dna','routes','quests'].includes(tab))return renderWorldV17.call(this,tab);const root=document.querySelector('[data-v16-world-body]');if(!root)return;this.ensureV17();this._v16WorldTab=tab;document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab===tab));root.innerHTML=tab==='dna'?this.renderDNAV17():tab==='routes'?this.renderRoutesV17():this.renderQuestsV17();};

  const renderAllV17=P.renderAll;
  P.renderAll=function(){this.ensureV17();const result=renderAllV17.call(this);this.injectV17UI();this.renderRealityBeaconV17();if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16();return result;};
  const bindV17=P.bind;
  P.bind=function(){bindV17.call(this);this.injectV17UI();if(this._v17Bound)return;this._v17Bound=true;document.addEventListener('click',event=>{const route=event.target.closest('[data-v17-route]');if(route)return this.travelLocationV17(route.dataset.v17Route);const accept=event.target.closest('[data-v17-quest-accept]');if(accept)return this.acceptQuestV17(accept.dataset.v17QuestAccept);const abandon=event.target.closest('[data-v17-quest-abandon]');if(abandon)return this.abandonQuestV17(abandon.dataset.v17QuestAbandon);const favor=event.target.closest('[data-v17-favor]');if(favor){const [factionId,kind]=favor.dataset.v17Favor.split('|');return this.spendFavorV17(factionId,kind);}});};
})();
