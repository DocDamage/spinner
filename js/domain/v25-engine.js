'use strict';

(function attachV25Engine(root){
  const V25_SCHEMA_VERSION=25;
  const PHASE_NAMES=['Warning','Outbreak','Escalation','Convergence','Resolution'];
  const CRISIS_POSTURES={
    adaptive:{label:'Adaptive Command',risk:0,summary:'Keep the response flexible while the Wheel reveals what the crisis actually needs.'},
    containment:{label:'Containment',risk:-2,summary:'Slow spread and reduce setback pressure through hazards, training, and recovery.'},
    evacuation:{label:'Civilian Lifeline',risk:-1,summary:'Prioritize travel, recovery, and civilian survival over raw offensive momentum.'},
    counterstrike:{label:'Strike the Source',risk:3,summary:'Push battle and boss outcomes harder, accepting more pressure when the plan fails.'},
    stabilization:{label:'Reality Stabilization',risk:-1,summary:'Use travel, artifact, recovery, and rare events to repair the underlying reality damage.'},
    coalition:{label:'Coalition Response',risk:0,summary:'Coordinate faction leverage, allies, and strategic legitimacy across affected worlds.'}
  };
  const SUPPORT_TIERS={
    0:{label:'Local Response',cost:{},progress:0,pressure:0},
    1:{label:'Prepared',cost:{credits:120,salvage:4},progress:0,pressure:1},
    2:{label:'Mobilized',cost:{credits:250,salvage:10,cosmicFragments:1},progress:1,pressure:2},
    3:{label:'Total Response',cost:{credits:450,salvage:18,cosmicFragments:2},progress:1,pressure:3}
  };
  const CRISIS_FAMILIES={
    'reality-fracture':{label:'Reality Fracture',summary:'A universe is losing structural stability and must be contained before ordinary routes become cascading breaks.',baseSeverity:62,events:[['rare','travel'],['travel','hazard'],['hazard','artifact'],['artifact','recovery','battle'],['recovery','rare','boss']]},
    'corruption-surge':{label:'Corruption Surge',summary:'Corruption is spreading beyond local anomalies and threatening settlements, relics, and faction territory at once.',baseSeverity:60,events:[['rare','hazard'],['hazard','travel'],['artifact','hazard'],['battle','recovery'],['artifact','boss','recovery']]},
    'invasion-wave':{label:'Invasion Wave',summary:'Sustained hostile pressure has become a world-scale invasion that requires more than a single battle or operation.',baseSeverity:66,events:[['rare','faction-quest'],['travel','battle'],['battle','hazard'],['battle','boss'],['boss','recovery','faction-quest']]},
    'temporal-storm':{label:'Temporal Storm',summary:'Time and route continuity are failing together, turning ordinary travel into a multi-stage reality emergency.',baseSeverity:64,events:[['rare','travel'],['travel','hazard'],['hazard','training'],['artifact','travel'],['recovery','rare','artifact']]},
    'relic-cascade':{label:'Relic Cascade',summary:'A stolen or corrupted relic has become an amplifier for instability across the surrounding world state.',baseSeverity:63,events:[['artifact','rare'],['travel','artifact'],['hazard','artifact'],['battle','boss'],['artifact','recovery','boss']]},
    'faction-world-war':{label:'Faction World War',summary:'A strategic front has escalated far enough to threaten the wider civilian and reality layers around it.',baseSeverity:68,events:[['faction-quest','rare'],['travel','battle'],['battle','hazard'],['battle','boss','faction-quest'],['faction-quest','recovery','boss']]},
    'refugee-exodus':{label:'Refugee Exodus',summary:'Displacement has exceeded local relief capacity and now requires a coordinated multiversal response.',baseSeverity:58,events:[['rare','recovery'],['travel','recovery'],['hazard','travel'],['recovery','battle'],['recovery','rare','recruit']]},
    'stronghold-breach':{label:'Stronghold Breach',summary:'A strategic sanctuary or base is close to becoming a regional disaster rather than a normal siege problem.',baseSeverity:65,events:[['faction-quest','training'],['battle','hazard'],['battle','recovery'],['boss','battle'],['recovery','faction-quest','boss']]},
    'nemesis-uprising':{label:'Nemesis Uprising',summary:'A recurring enemy has accumulated enough pressure to become a world-scale destabilizing force.',baseSeverity:67,events:[['rare','travel'],['battle','travel'],['hazard','battle'],['boss','battle'],['boss','recovery','rare']]},
    'convergence-event':{label:'Convergence Event',summary:'Multiple unstable worlds are beginning to pull one another into a shared catastrophe that cannot be treated as isolated incidents.',baseSeverity:74,events:[['rare','travel'],['hazard','travel'],['artifact','battle'],['boss','faction-quest'],['recovery','artifact','boss']]}
  };

  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const uniq=list=>[...new Set((list||[]).map(String).filter(Boolean))];
  const tick=state=>Number(state.v16?.clock?.tick||0);
  const hash32=value=>{if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const goodOutcome=outcome=>!['loss','failed','failure'].includes(String(outcome||'win').toLowerCase());
  const currentUniverse=state=>String(state.v16?.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime');

  class CrisisArcEngine{
    ensure(state={},artifacts=[],roster=[]){
      const needsMigration=Number(state.v25?.schemaVersion||0)<V25_SCHEMA_VERSION;
      if(needsMigration&&root.MultiverseDomain?.migrateV24)root.MultiverseDomain.migrateV24(state,artifacts,roster);
      state.v25||={};const v=state.v25;
      v.schemaVersion=V25_SCHEMA_VERSION;state.v25Version=V25_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V25_SCHEMA_VERSION);
      v.crises=v.crises&&typeof v.crises==='object'?v.crises:{};
      v.history=Array.isArray(v.history)?v.history.slice(-160):[];
      v.processedEvents=Array.isArray(v.processedEvents)?v.processedEvents.slice(-420):[];
      v.activeCrisisId=String(v.activeCrisisId||'');
      v.lastWorldTick=Math.max(0,Number(v.lastWorldTick??tick(state)));
      v.settings={autoDiscover:true,crisisHints:true,...(v.settings||{})};
      v.stats={discovered:0,responded:0,resolved:0,failed:0,reopened:0,worldsSaved:0,civiliansProtected:0,strongholdsHeld:0,coalitionResponses:0,relicStabilizations:0,standDowns:0,...(v.stats||{})};
      for(const crisis of Object.values(v.crises))this.normalizeCrisis(state,crisis);
      if(v.activeCrisisId&&!v.crises[v.activeCrisisId])v.activeCrisisId='';
      if(needsMigration){if(v.settings.autoDiscover)this.discoverCrises(state,10);v.lastWorldTick=tick(state);}
      return state;
    }

    normalizeCrisis(state,crisis={}){
      const family=CRISIS_FAMILIES[crisis.family]?crisis.family:'reality-fracture',def=CRISIS_FAMILIES[family];
      crisis.id=String(crisis.id||`crisis-${hash32(`${state.seed}|${family}|${crisis.sourceKey||'manual'}`).toString(36)}`);
      crisis.sourceKey=String(crisis.sourceKey||`manual:${crisis.id}`);crisis.sourceType=String(crisis.sourceType||'world');crisis.sourceId=String(crisis.sourceId||'');
      crisis.family=family;crisis.label=String(crisis.label||def.label).slice(0,100);crisis.summary=String(crisis.summary||def.summary).slice(0,320);
      crisis.primaryUniverse=String(crisis.primaryUniverse||currentUniverse(state));crisis.universeIds=uniq(crisis.universeIds?.length?crisis.universeIds:[crisis.primaryUniverse]);
      crisis.settlementIds=uniq(crisis.settlementIds);crisis.factionIds=uniq(crisis.factionIds);crisis.strongholdIds=uniq(crisis.strongholdIds);crisis.relicIds=uniq(crisis.relicIds);crisis.nemesisIds=uniq(crisis.nemesisIds);
      crisis.status=['watching','active','resolved','failed'].includes(crisis.status)?crisis.status:'watching';
      crisis.severity=clamp(crisis.severity??def.baseSeverity,20,100);crisis.pressure=clamp(crisis.pressure||0,0,100);crisis.momentum=clamp(crisis.momentum||0,-100,100);crisis.failures=Math.max(0,Number(crisis.failures||0));crisis.successes=Math.max(0,Number(crisis.successes||0));
      crisis.phaseIndex=clamp(crisis.phaseIndex||0,0,PHASE_NAMES.length-1);
      crisis.phases=Array.isArray(crisis.phases)&&crisis.phases.length===PHASE_NAMES.length?crisis.phases:this.makePhases(crisis.id,family,crisis.severity);
      crisis.phases.forEach((phase,i)=>{phase.id=String(phase.id||`${crisis.id}-phase-${i}`);phase.label=PHASE_NAMES[i];phase.events=uniq(phase.events?.length?phase.events:def.events[i]);phase.target=clamp(phase.target||this.phaseTarget(crisis.severity,i),1,3);phase.progress=clamp(phase.progress||0,0,phase.target);phase.status=['locked','active','completed'].includes(phase.status)?phase.status:'locked';});
      if(crisis.status==='watching')crisis.phases.forEach((phase,i)=>{if(i!==crisis.phaseIndex&&phase.status!=='completed')phase.status='locked';if(i===crisis.phaseIndex&&phase.status==='active')phase.status='locked';});
      if(crisis.status==='active'&&!crisis.phases.some(p=>p.status==='active'))crisis.phases[crisis.phaseIndex].status='active';
      crisis.response={posture:'adaptive',supportTier:0,allyIds:[],factionId:'',relicId:'',strongholdId:'',locked:false,...(crisis.response||{})};
      crisis.response.posture=CRISIS_POSTURES[crisis.response.posture]?crisis.response.posture:'adaptive';crisis.response.supportTier=clamp(crisis.response.supportTier||0,0,3);crisis.response.allyIds=uniq(crisis.response.allyIds).slice(0,3);crisis.response.factionId=String(crisis.response.factionId||'');crisis.response.relicId=String(crisis.response.relicId||'');crisis.response.strongholdId=String(crisis.response.strongholdId||'');crisis.response.locked=Boolean(crisis.response.locked);
      crisis.createdTick=Math.max(0,Number(crisis.createdTick||tick(state)));crisis.lastTick=Math.max(0,Number(crisis.lastTick||crisis.createdTick));crisis.resolvedTick=Math.max(0,Number(crisis.resolvedTick||0));crisis.history=Array.isArray(crisis.history)?crisis.history.slice(-80):[];
      return crisis;
    }

    makePhases(id,family,severity){const def=CRISIS_FAMILIES[family]||CRISIS_FAMILIES['reality-fracture'];return PHASE_NAMES.map((label,i)=>({id:`${id}-phase-${i}`,label,events:[...def.events[i]],target:this.phaseTarget(severity,i),progress:0,status:'locked'}));}
    phaseTarget(severity,index){return Number(severity)>=82&&index>=2?2:1;}
    crisis(state,id){return state.v25?.crises?.[String(id||'')]||null;}
    activeCrisis(state){return this.crisis(state,state.v25?.activeCrisisId)||Object.values(state.v25?.crises||{}).find(c=>c.status==='active')||null;}
    sourceExists(state,key){return Object.values(state.v25.crises).some(c=>c.sourceKey===key)||state.v25.history.some(c=>c.sourceKey===key);}

    discoverCrises(state,limit=10){
      const v=state.v25;if(!v)return[];const live=Object.values(v.crises).filter(c=>['watching','active'].includes(c.status)).length,room=Math.max(0,Math.min(18,Number(limit||10))-live);if(!room)return[];
      const epoch=Math.floor(tick(state)/16),candidates=[];
      const push=c=>{if(c?.sourceKey&&!this.sourceExists(state,c.sourceKey))candidates.push(c);};
      const worlds=Object.values(state.v16?.universes||{});
      for(const w of worlds){
        const stability=Number(w.stability??80),corruption=Number(w.corruption||0),threat=Number(w.threat||0),id=String(w.id||w.name||'world'),name=String(w.name||id);
        if(stability<=32)push({sourceKey:`world:${epoch}:${id}:fracture`,sourceType:'universe',sourceId:id,family:'reality-fracture',primaryUniverse:name,universeIds:[name],severity:clamp(62+(32-stability)*.8+threat*.12,55,96),label:`${name} Reality Fracture`});
        if(corruption>=68)push({sourceKey:`world:${epoch}:${id}:corruption`,sourceType:'universe',sourceId:id,family:'corruption-surge',primaryUniverse:name,universeIds:[name],severity:clamp(58+(corruption-68)*.75+threat*.1,55,97),label:`${name} Corruption Surge`});
        if(threat>=75)push({sourceKey:`world:${epoch}:${id}:invasion`,sourceType:'universe',sourceId:id,family:'invasion-wave',primaryUniverse:name,universeIds:[name],severity:clamp(64+(threat-75)*.8+(100-stability)*.1,60,98),label:`${name} Invasion Wave`});
        if((w.tags||[]).some(tag=>/time|temporal|fracture|paradox/i.test(String(tag))))push({sourceKey:`world:${epoch}:${id}:temporal`,sourceType:'universe-tag',sourceId:id,family:'temporal-storm',primaryUniverse:name,universeIds:[name],severity:clamp(58+(100-stability)*.18+corruption*.18,54,92),label:`${name} Temporal Storm`});
      }
      for(const f of Object.values(state.v21?.fronts||{})){if(Number(f.pressure||0)>=82)push({sourceKey:`front:${epoch}:${f.id}:world-war`,sourceType:'front',sourceId:f.id,family:'faction-world-war',primaryUniverse:f.universe||currentUniverse(state),universeIds:[f.universe||currentUniverse(state)],factionIds:[f.attackerId,f.defenderId],severity:clamp(64+(Number(f.pressure||82)-82)*.9,64,96),label:`${f.objective||'Warfront'} World War`});}
      for(const s of Object.values(state.v22?.settlements||{})){const pop=Math.max(1,Number(s.population||0)),ratio=Number(s.displaced||0)/pop;if(s.status==='crisis'||ratio>=.18)push({sourceKey:`settlement:${epoch}:${s.id}:exodus`,sourceType:'settlement',sourceId:s.id,family:'refugee-exodus',primaryUniverse:s.universe||currentUniverse(state),universeIds:[s.universe||currentUniverse(state)],settlementIds:[s.id],severity:clamp(56+ratio*110+(s.status==='crisis'?10:0),56,95),label:`${s.name||'Settlement'} Refugee Exodus`});}
      for(const h of Object.values(state.v21?.strongholds||{})){if(h.underSiege||Number(h.integrity||100)<30)push({sourceKey:`stronghold:${epoch}:${h.id}:breach`,sourceType:'stronghold',sourceId:h.id,family:'stronghold-breach',primaryUniverse:h.universe||currentUniverse(state),universeIds:[h.universe||currentUniverse(state)],strongholdIds:[h.id],factionIds:[h.ownerFactionId],severity:h.underSiege?82:72,label:`${h.name||'Stronghold'} Breach`});}
      for(const r of Object.values(state.v20?.relics||{})){if(r.status==='stolen'||Number(r.corruption||0)>=72)push({sourceKey:`relic:${epoch}:${r.id}:cascade`,sourceType:'relic',sourceId:r.id,family:'relic-cascade',primaryUniverse:r.stolenWorld||currentUniverse(state),universeIds:[r.stolenWorld||currentUniverse(state)],relicIds:[r.id],nemesisIds:r.stolenBy?[r.stolenBy]:[],severity:clamp(62+Number(r.corruption||0)*.18+(r.status==='stolen'?8:0),62,96),label:`${r.name||'Relic'} Cascade`});}
      for(const n of Object.values(state.v16?.nemeses||{})){const pressure=Number(n.pressure||n.level*10||0);if(!['broken','dead','retired'].includes(String(n.status||''))&&(pressure>=70||Number(n.level||1)>=7))push({sourceKey:`nemesis:${epoch}:${n.id}:uprising`,sourceType:'nemesis',sourceId:n.id,family:'nemesis-uprising',primaryUniverse:n.universe||currentUniverse(state),universeIds:[n.universe||currentUniverse(state)],nemesisIds:[n.id],severity:clamp(62+pressure*.3,62,96),label:`${n.name||'Nemesis'} Uprising`});}
      const severeWorlds=worlds.filter(w=>Number(w.stability??100)<=38||Number(w.corruption||0)>=65||Number(w.threat||0)>=72);
      if(severeWorlds.length>=2){const names=severeWorlds.slice(0,4).map(w=>String(w.name||w.id));push({sourceKey:`convergence:${epoch}:${names.sort().join('|')}`,sourceType:'multiverse',sourceId:`epoch-${epoch}`,family:'convergence-event',primaryUniverse:names[0]||currentUniverse(state),universeIds:names,severity:clamp(72+severeWorlds.length*4,74,98),label:`${severeWorlds.length}-World Convergence Event`});}
      candidates.sort((a,b)=>Number(b.severity||0)-Number(a.severity||0)||a.sourceKey.localeCompare(b.sourceKey));const created=[];
      for(const candidate of candidates.slice(0,room)){const result=this.createCrisis(state,candidate);if(result.ok)created.push(result.crisis);}return created;
    }

    createCrisis(state,options={}){
      this.ensure(state);const family=CRISIS_FAMILIES[options.family]?options.family:'reality-fracture',sourceKey=String(options.sourceKey||`manual:${family}:${Object.keys(state.v25.crises).length}`);if(this.sourceExists(state,sourceKey))return{ok:false,error:'Crisis source already exists.'};
      const id=String(options.id||`crisis-${hash32(`${state.seed}|${sourceKey}|${family}`).toString(36)}`),crisis=this.normalizeCrisis(state,{...options,id,family,sourceKey,createdTick:tick(state)});state.v25.crises[id]=crisis;state.v25.stats.discovered++;this.remember(state,crisis,'discovered');return{ok:true,crisis:clone(crisis)};
    }

    allyAvailability(state,id){id=String(id||'');if(!id)return{allowed:true,reason:'No ally assigned.'};if(!(state.party||[]).map(String).includes(id))return{allowed:false,reason:'Only active party members can join Crisis Command.'};const rec=state.v19?.records?.[id];if(rec&&['dead','departed','defected','bench'].includes(rec.status))return{allowed:false,reason:'This ally is unavailable.'};if(Number(rec?.axes?.resentment||0)>=78||Number(rec?.axes?.trust??50)<20)return{allowed:false,reason:'This ally refuses the crisis assignment.'};return{allowed:true,reason:'Ready'};}

    planResponse(state,id,plan={}){
      const crisis=this.crisis(state,id);if(!crisis||!['watching','failed'].includes(crisis.status))return{ok:false,error:'Only unresolved inactive crises can be planned.'};
      const posture=CRISIS_POSTURES[plan.posture||crisis.response.posture]?String(plan.posture||crisis.response.posture):'adaptive',supportTier=clamp(plan.supportTier??crisis.response.supportTier,0,3),allyIds=uniq(plan.allyIds??crisis.response.allyIds).slice(0,3);
      for(const allyId of allyIds){const available=this.allyAvailability(state,allyId);if(!available.allowed)return{ok:false,error:available.reason,refused:allyId};}
      const factionId=String((plan.factionId??crisis.response.factionId)||'');if(factionId&&!state.v16?.factions?.[factionId])return{ok:false,error:'Selected faction is not part of the V16 faction layer.'};if(posture==='coalition'&&!factionId&&!state.v21?.primaryFactionId)return{ok:false,error:'Coalition Response requires an existing faction relationship.'};
      const relicId=String((plan.relicId??crisis.response.relicId)||'');if(relicId&&(!(state.artifacts||[]).includes(relicId)||state.v20?.relics?.[relicId]?.status==='stolen'))return{ok:false,error:'Selected V20 relic is not available for crisis support.'};
      const strongholdId=String((plan.strongholdId??crisis.response.strongholdId)||'');if(strongholdId&&!state.v21?.strongholds?.[strongholdId])return{ok:false,error:'Selected V21 stronghold does not exist.'};
      crisis.response={posture,supportTier,allyIds,factionId:factionId||state.v21?.primaryFactionId||'',relicId,strongholdId,locked:false};crisis.lastTick=tick(state);return{ok:true,response:clone(crisis.response),cost:clone(SUPPORT_TIERS[supportTier].cost)};
    }

    pay(state,cost){try{return new root.MultiverseDomain.EconomyCraftingEngine().pay(state,cost);}catch{const wallet={credits:Number(state.credits||0),...(state.v18?.wallet||{})};for(const[k,v]of Object.entries(cost||{}))if(Number(wallet[k]||0)<Number(v||0))return false;for(const[k,v]of Object.entries(cost||{})){if(k==='credits')state.credits=Math.max(0,Number(state.credits||0)-Number(v||0));else if(state.v18?.wallet)state.v18.wallet[k]=Math.max(0,Number(state.v18.wallet[k]||0)-Number(v||0));}return true;}}

    beginResponse(state,id,plan={}){
      this.ensure(state);const crisis=this.crisis(state,id);if(!crisis||!['watching','failed'].includes(crisis.status))return{ok:false,error:'Crisis is not available for response.'};const active=this.activeCrisis(state);if(active&&active.id!==crisis.id)return{ok:false,error:'Only one crisis can have the active Command focus.'};
      if(crisis.status==='failed')this.retryCrisis(state,id);
      const planned=this.planResponse(state,id,Object.keys(plan).length?plan:crisis.response);if(!planned.ok)return planned;const cost=SUPPORT_TIERS[crisis.response.supportTier].cost;if(!this.pay(state,cost))return{ok:false,error:'Insufficient V18 resources for the selected crisis response.'};
      crisis.status='active';crisis.response.locked=true;crisis.phases.forEach((phase,i)=>{if(i===crisis.phaseIndex&&phase.status!=='completed')phase.status='active';else if(phase.status!=='completed')phase.status='locked';});crisis.lastTick=tick(state);crisis.history.push({tick:tick(state),type:'response-started',detail:`${CRISIS_POSTURES[crisis.response.posture].label} • ${SUPPORT_TIERS[crisis.response.supportTier].label}`});state.v25.activeCrisisId=crisis.id;state.v25.stats.responded++;if(crisis.response.posture==='coalition')state.v25.stats.coalitionResponses++;this.partyReaction(state,crisis,'deploy');this.remember(state,crisis,'response');return{ok:true,crisis:clone(crisis),cost:clone(cost)};
    }

    postureBonus(crisis,eventType){const posture=crisis.response?.posture||'adaptive',map={containment:['hazard','training','recovery'],evacuation:['travel','recovery','recruit'],counterstrike:['battle','boss'],stabilization:['travel','artifact','recovery','rare'],coalition:['faction-quest','rare','recruit']};return(map[posture]||[]).includes(String(eventType||''))?1:0;}

    processEvent(state,context={},roster=[]){
      this.ensure(state,[],roster);if(state.v25.settings.autoDiscover)this.discoverCrises(state,10);const crisis=this.activeCrisis(state);if(!crisis)return{crisis:null,progressed:false};
      const eventId=String(context.id||`v25:${state.spin}:${context.type}:${context.outcome}:${crisis.id}`);if(state.v25.processedEvents.includes(eventId))return null;state.v25.processedEvents.push(eventId);state.v25.processedEvents=state.v25.processedEvents.slice(-420);
      const phase=crisis.phases[crisis.phaseIndex],type=String(context.type||''),outcome=String(context.outcome||'win');if(!phase||phase.status!=='active'||!phase.events.includes(type))return{crisis:clone(crisis),progressed:false};crisis.lastTick=tick(state);
      if(!goodOutcome(outcome)){crisis.failures++;const risk=Number(CRISIS_POSTURES[crisis.response.posture]?.risk||0);crisis.pressure=clamp(crisis.pressure+Math.max(6,10+risk-SUPPORT_TIERS[crisis.response.supportTier].pressure),0,100);crisis.severity=clamp(crisis.severity+2,20,100);crisis.momentum=clamp(crisis.momentum-6,-100,100);crisis.history.push({tick:tick(state),type:'setback',detail:`${phase.label}: ${type} ended in ${outcome}.`});this.partyReaction(state,crisis,'setback');if(crisis.pressure>=100)return this.finishCrisis(state,crisis,false,roster,'Crisis pressure exceeded the active response threshold.');return{crisis:clone(crisis),progressed:false,setback:true};}
      crisis.successes++;const support=SUPPORT_TIERS[crisis.response.supportTier],amount=Math.min(2,1+this.postureBonus(crisis,type)+(support.progress&&phase.target>1?1:0));phase.progress=clamp(phase.progress+amount,0,phase.target);crisis.pressure=clamp(crisis.pressure-Math.max(2,2+support.pressure),0,100);crisis.momentum=clamp(crisis.momentum+4+crisis.response.supportTier,-100,100);let phaseComplete=false;
      if(phase.progress>=phase.target){phase.status='completed';phaseComplete=true;crisis.history.push({tick:tick(state),type:'phase-complete',detail:`${phase.label} contained through ${type}.`});this.partyReaction(state,crisis,'phase');if(crisis.phaseIndex<crisis.phases.length-1){crisis.phaseIndex++;crisis.phases[crisis.phaseIndex].status='active';}else{const result=this.finishCrisis(state,crisis,true,roster,'Resolution phase completed.');return{...result,progressed:true,phaseComplete,crisisComplete:true};}}
      return{crisis:clone(crisis),progressed:true,phaseComplete,crisisComplete:false};
    }

    finishCrisis(state,crisis,success,roster=[],reason='Crisis resolved'){
      if(!crisis||crisis.status!=='active')return{ok:false,error:'Crisis is not actively being answered.'};crisis.status=success?'resolved':'failed';crisis.resolvedTick=tick(state);crisis.lastTick=tick(state);crisis.history.push({tick:tick(state),type:success?'resolved':'failed',detail:reason});if(success)crisis.phases.forEach(p=>p.status='completed');state.v25.activeCrisisId=state.v25.activeCrisisId===crisis.id?'':state.v25.activeCrisisId;
      if(success){state.v25.stats.resolved++;this.addRewards(state,crisis);this.applyAftermath(state,crisis,true);this.partyReaction(state,crisis,'success',roster);}else{state.v25.stats.failed++;this.applyAftermath(state,crisis,false);this.partyReaction(state,crisis,'failure',roster);}state.v25.history.push(clone(crisis));state.v25.history=state.v25.history.slice(-160);this.remember(state,crisis,success?'resolved':'failed');return{ok:true,success,crisis:clone(crisis)};
    }

    standDownResponse(state,id=state.v25?.activeCrisisId){const crisis=this.crisis(state,id);if(!crisis||crisis.status!=='active')return{ok:false,error:'No active crisis response to stand down.'};crisis.status='watching';crisis.response.locked=false;crisis.pressure=clamp(crisis.pressure+5,0,95);crisis.severity=clamp(crisis.severity+2,20,98);crisis.phases[crisis.phaseIndex].status='locked';crisis.history.push({tick:tick(state),type:'stand-down',detail:'Crisis Command stood down; progress remains but pressure increased.'});state.v25.activeCrisisId='';state.v25.stats.standDowns++;return{ok:true,crisis:clone(crisis)};}

    retryCrisis(state,id){const crisis=this.crisis(state,id);if(!crisis||crisis.status!=='failed')return{ok:false,error:'Only failed crisis responses can be reopened.'};if(this.activeCrisis(state))return{ok:false,error:'Finish the active crisis response first.'};crisis.status='watching';crisis.phaseIndex=0;crisis.pressure=clamp(crisis.pressure,0,65);crisis.severity=clamp(crisis.severity,20,90);crisis.resolvedTick=0;crisis.response.locked=false;crisis.phases.forEach(p=>{p.progress=0;p.status='locked';});crisis.history.push({tick:tick(state),type:'reopened',detail:'The failed crisis was reopened with a recoverable response path.'});state.v25.stats.reopened++;return{ok:true,crisis:clone(crisis)};}

    addRewards(state,crisis){const severity=Number(crisis.severity||60),credits=Math.round(120+severity*2.2),salvage=Math.round(5+severity/14),fragments=severity>=80?2:severity>=65?1:0;state.credits=Math.max(0,Number(state.credits||0)+credits);if(state.v18?.wallet){state.v18.wallet.salvage=Math.max(0,Number(state.v18.wallet.salvage||0)+salvage);state.v18.wallet.cosmicFragments=Math.max(0,Number(state.v18.wallet.cosmicFragments||0)+fragments);}crisis.resolvedRewards={credits,salvage,cosmicFragments:fragments};}

    applyAftermath(state,crisis,success){
      const sign=success?1:-1;for(const name of crisis.universeIds||[]){const world=Object.values(state.v16?.universes||{}).find(w=>String(w.name||w.id)===String(name)||String(w.id)===String(name));if(!world)continue;if(success){world.stability=clamp(Number(world.stability||0)+8,0,100);world.corruption=clamp(Number(world.corruption||0)-7,0,100);world.threat=clamp(Number(world.threat||0)-9,0,100);state.v25.stats.worldsSaved++;}else{world.stability=clamp(Number(world.stability||0)-4,8,100);world.corruption=clamp(Number(world.corruption||0)+4,0,95);world.threat=clamp(Number(world.threat||0)+5,0,95);}}
      for(const id of crisis.settlementIds||[]){const s=state.v22?.settlements?.[id];if(!s)continue;if(success){const protectedCount=Math.min(Number(s.displaced||0),Math.max(10,Math.round(Number(s.population||0)*.02)));s.displaced=Math.max(0,Number(s.displaced||0)-protectedCount);s.population=Math.max(0,Number(s.population||0)+protectedCount);s.security=clamp(Number(s.security||0)+5,0,100);s.health=clamp(Number(s.health||0)+4,0,100);s.morale=clamp(Number(s.morale||0)+6,0,100);s.infrastructure=clamp(Number(s.infrastructure||0)+4,0,100);s.playerOpinion=clamp(Number(s.playerOpinion||0)+7,-100,100);state.v25.stats.civiliansProtected+=protectedCount;}else{try{new root.MultiverseDomain.SettlementEngine().createDisplacement(state,s,Math.max(3,Math.round(Number(s.population||0)*.003)),`Failed crisis response: ${crisis.label}`);}catch{}s.security=clamp(Number(s.security||0)-3,0,100);s.morale=clamp(Number(s.morale||0)-3,0,100);}}
      for(const id of crisis.strongholdIds||[]){const h=state.v21?.strongholds?.[id];if(!h)continue;if(success){h.integrity=clamp(Number(h.integrity||0)+8,0,100);h.supply=clamp(Number(h.supply||0)+5,0,100);h.morale=clamp(Number(h.morale||0)+6,0,100);if(crisis.family==='stronghold-breach'&&h.integrity>=30){h.underSiege=false;h.status='safe';state.v25.stats.strongholdsHeld++;}}else{h.integrity=clamp(Number(h.integrity||0)-6,20,100);h.supply=clamp(Number(h.supply||0)-4,0,100);h.morale=clamp(Number(h.morale||0)-4,0,100);h.status='threatened';}}
      const factionId=crisis.response?.factionId||state.v21?.primaryFactionId;if(factionId&&state.v21?.memberships?.[factionId]){try{const f=new root.MultiverseDomain.FactionCampaignEngine();f.addRankXp(state,factionId,success?20:5,`V25 crisis: ${crisis.label}`);f.adjustAuthority(state,factionId,success?4:-1,success?'Crisis leadership':'Failed crisis response');}catch{const m=state.v21.memberships[factionId];m.authority=clamp(Number(m.authority||0)+(success?4:-1),0,100);}}
      const relicId=crisis.response?.relicId;if(relicId&&state.v20?.relics?.[relicId]){const r=state.v20.relics[relicId];r.bond=clamp(Number(r.bond||0)+(success?2:0),0,100);r.purity=clamp(Number(r.purity||0)+(success?1:0),0,100);r.corruption=clamp(Number(r.corruption||0)+(success?-1:1),0,100);r.history=Array.isArray(r.history)?r.history:[];r.history.push({spin:Number(state.spin||0),type:'crisis-response',crisisId:crisis.id,outcome:success?'resolved':'failed'});r.history=r.history.slice(-32);if(success)state.v25.stats.relicStabilizations++;}
    }

    partyReaction(state,crisis,kind){for(const id of crisis.response?.allyIds||[]){const rec=state.v19?.records?.[id];if(!rec?.axes)continue;const a=rec.axes;if(kind==='deploy'){a.respect=clamp(Number(a.respect??50)+1,0,100);}else if(kind==='phase'){a.trust=clamp(Number(a.trust??50)+1,0,100);}else if(kind==='setback'){a.fear=clamp(Number(a.fear||0)+2,0,100);}else if(kind==='success'){a.trust=clamp(Number(a.trust??50)+3,0,100);a.respect=clamp(Number(a.respect??50)+3,0,100);a.loyalty=clamp(Number(a.loyalty??50)+1,0,100);}else if(kind==='failure'){a.trust=clamp(Number(a.trust??50)-2,0,100);a.resentment=clamp(Number(a.resentment||0)+2,0,100);a.fear=clamp(Number(a.fear||0)+2,0,100);}}
    }

    remember(state,crisis,kind){try{const world=new root.MultiverseDomain.LivingMultiverseEngine();const title=kind==='resolved'?`Crisis resolved: ${crisis.label}`:kind==='failed'?`Crisis response failed: ${crisis.label}`:kind==='response'?`Crisis Command mobilized: ${crisis.label}`:`Crisis detected: ${crisis.label}`;world.recordMemory(state,{type:'world',title,detail:`${CRISIS_FAMILIES[crisis.family].label} • severity ${Math.round(crisis.severity)} • ${crisis.universeIds.join(', ')}`,universe:crisis.primaryUniverse,weight:5});world.pushEvent(state,{type:'crisis',severity:kind==='resolved'?'info':kind==='failed'?'danger':'warning',title,detail:crisis.summary,universe:crisis.primaryUniverse,factionIds:crisis.factionIds});}catch{} }

    processWorldTick(state){this.ensure(state);const now=tick(state);if(now<=Number(state.v25.lastWorldTick||0))return[];const changes=[];if(state.v25.settings.autoDiscover)changes.push(...this.discoverCrises(state,10));for(const crisis of Object.values(state.v25.crises)){if(!['watching','active'].includes(crisis.status))continue;const rise=crisis.status==='watching'?2:1;crisis.severity=clamp(Number(crisis.severity||0)+rise,20,98);if(crisis.status==='active')crisis.pressure=clamp(Number(crisis.pressure||0)+(crisis.severity>=85?2:1),0,96);crisis.lastTick=now;}state.v25.lastWorldTick=now;return changes;}
    catchUp(state,maxTicks=6){this.ensure(state);const current=tick(state),last=Number(state.v25.lastWorldTick||current),steps=Math.max(0,Math.min(Number(maxTicks||6),current-last));const discovered=[];for(let i=0;i<steps;i++){state.v25.lastWorldTick=last+i;discovered.push(...this.processWorldTick(state));}state.v25.lastWorldTick=current;return discovered;}

    summary(state){const v=state.v25||{},active=this.activeCrisis(state),available=Object.values(v.crises||{}).filter(c=>c.status==='watching').sort((a,b)=>b.severity-a.severity||a.label.localeCompare(b.label)),failed=Object.values(v.crises||{}).filter(c=>c.status==='failed').sort((a,b)=>b.resolvedTick-a.resolvedTick),recent=(v.history||[]).slice().sort((a,b)=>b.resolvedTick-a.resolvedTick).slice(0,8);return{active:clone(active),available:clone(available),failed:clone(failed),recent:clone(recent),stats:clone(v.stats||{}),count:Object.keys(v.crises||{}).length};}
  }

  const migrateV25=(state={},artifacts=[],roster=[])=>new CrisisArcEngine().ensure(state,artifacts,roster);
  const api={V25_SCHEMA_VERSION,CrisisArcEngine,migrateV25,CRISIS_FAMILIES_V25:CRISIS_FAMILIES,CRISIS_POSTURES_V25:CRISIS_POSTURES,CRISIS_SUPPORT_TIERS_V25:SUPPORT_TIERS};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
