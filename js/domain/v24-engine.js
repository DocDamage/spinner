'use strict';

(function attachV24Engine(root){
  const V24_SCHEMA_VERSION=24;
  const ACTIVITY_STYLES={
    balanced:{label:'Balanced',score:0,risk:0,summary:'Stay adaptable and score consistently across every segment.'},
    aggressive:{label:'Aggressive',score:4,risk:2,summary:'Push for a higher ceiling while accepting a larger setback penalty.'},
    technical:{label:'Technical',score:3,risk:0,summary:'Lean on Skill and Mind for cleaner execution.'},
    endurance:{label:'Endurance',score:2,risk:-2,summary:'Trade peak scoring for steadier recovery after setbacks.'}
  };
  const ACTIVITY_FAMILIES={
    'speed-race':{label:'Speed Race',category:'race',summary:'Race a multiversal circuit where launches, hazards, overtakes, and the final lap are resolved by normal Wheel signals.',focus:['speed','skill'],entry:90,rewards:{credits:300,salvage:8},segments:[['Starting Grid',['training','rare']],['Launch',['travel','training']],['Hazard Run',['hazard','travel']],['Final Lap',['travel','rare','battle']]]},
    'portal-rally':{label:'Portal Rally',category:'race',summary:'Chain unstable routes across realities and finish the rally without losing the line through the multiverse.',focus:['speed','mind'],entry:100,rewards:{credits:330,salvage:9},segments:[['Route Draw',['rare','travel']],['Gate One',['travel']],['Fracture Sprint',['hazard','travel']],['Final Gate',['travel','recovery','rare']]]},
    'combat-tournament':{label:'Combat Tournament',category:'tournament',summary:'Climb a four-round bracket using the existing battle system and Wheel outcomes rather than a detached arena engine.',focus:['might','skill'],entry:120,rewards:{credits:420,salvage:12},segments:[['Qualifier',['training','battle']],['Quarterfinal',['battle']],['Semifinal',['battle','hazard']],['Championship',['boss','battle']]]},
    'arena-exhibition':{label:'Arena Exhibition',category:'tournament',summary:'Fight a prestige exhibition where style, consistency, and survival matter as much as raw victory.',focus:['skill','defense'],entry:80,rewards:{credits:280,salvage:7},segments:[['Warm-Up',['training']],['Opening Bout',['battle']],['Showcase',['battle','rare']],['Main Event',['boss','battle']]]},
    'survival-gauntlet':{label:'Survival Gauntlet',category:'trial',summary:'Endure escalating hazards and combat while preserving enough momentum to finish the final gauntlet.',focus:['defense','energy'],entry:70,rewards:{credits:310,salvage:10},segments:[['Preparation',['training','recovery']],['Pressure Zone',['hazard']],['Attrition',['hazard','battle']],['Last Stand',['battle','boss','recovery']]]},
    'relic-trial':{label:'Relic Trial',category:'trial',summary:'Prove mastery around dangerous relic conditions without adding a second relic progression system.',focus:['mind','hax'],entry:110,rewards:{credits:260,salvage:6,cosmicFragments:3},segments:[['Attunement',['artifact','rare']],['Pilgrimage',['travel','artifact']],['Trial',['hazard','artifact']],['Judgment',['boss','artifact']]]},
    'treasure-hunt':{label:'Treasure Hunt',category:'hunt',summary:'Follow clues, survive false leads, and reach a hidden cache through ordinary exploration outcomes.',focus:['mind','skill'],entry:60,rewards:{credits:250,salvage:11},segments:[['Clue',['rare']],['Trail',['travel']],['Trap',['hazard']],['Cache',['artifact','rare']]]},
    'bounty-pursuit':{label:'Bounty Pursuit',category:'hunt',summary:'Track a dangerous target across routes and hazards before resolving the pursuit through existing combat.',focus:['skill','speed'],entry:85,rewards:{credits:360,salvage:9},segments:[['Trace',['rare','travel']],['Pursuit',['travel']],['Ambush',['hazard','battle']],['Capture',['battle','boss']]]},
    'rescue-drill':{label:'Rescue Drill',category:'community',summary:'Run a scored emergency-response exercise that can strengthen the settlement hosting it.',focus:['skill','mind'],entry:40,rewards:{credits:180,salvage:5},segments:[['Briefing',['training']],['Deployment',['travel']],['Crisis',['hazard']],['Recovery',['recovery','rare']]]},
    'civilian-cup':{label:'Civilian Cup',category:'community',summary:'A settlement-hosted competition that turns rebuilding into celebration without creating a city-builder minigame.',focus:['speed','skill'],entry:35,rewards:{credits:170,salvage:4},segments:[['Opening',['training','rare']],['Heat One',['travel','training']],['Community Challenge',['hazard','recovery']],['Cup Final',['rare','battle']]]},
    'stronghold-games':{label:'Stronghold Games',category:'faction',summary:'Compete in a stronghold-hosted trial that rewards readiness and reinforces the existing V21 base layer.',focus:['might','defense'],entry:75,rewards:{credits:270,salvage:8},segments:[['Inspection',['training']],['Team Trial',['hazard','training']],['Defense Test',['battle']],['Command Final',['boss','battle']]]},
    'faction-grand-prix':{label:'Faction Grand Prix',category:'faction',summary:'Represent a faction in a high-profile circuit where victory earns recognition but never replaces V21 Authority or rank.',focus:['speed','energy'],entry:130,rewards:{credits:440,salvage:10},segments:[['Seeding',['training','rare']],['Sprint',['travel']],['Conflict Zone',['hazard','battle']],['Grand Prix Final',['travel','battle','rare']]]}
  };
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const hash32=value=>{if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const tick=state=>Number(state.v16?.clock?.tick||0);
  const worldName=state=>String(state.v16?.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime');
  const goodOutcome=outcome=>!['loss','failed','failure'].includes(String(outcome||'win').toLowerCase());
  const uniq=list=>[...new Set((list||[]).map(String).filter(Boolean))];

  class ActivityCircuitEngine{
    ensure(state={},artifacts=[],roster=[]){
      const needsMigration=Number(state.v24?.schemaVersion||0)<V24_SCHEMA_VERSION;
      if(needsMigration&&root.MultiverseDomain?.migrateV23)root.MultiverseDomain.migrateV23(state,artifacts,roster);
      state.v24||={};const v=state.v24;
      v.schemaVersion=V24_SCHEMA_VERSION;state.v24Version=V24_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V24_SCHEMA_VERSION);
      v.activities=v.activities&&typeof v.activities==='object'?v.activities:{};
      v.history=Array.isArray(v.history)?v.history.slice(-160):[];
      v.processedEvents=Array.isArray(v.processedEvents)?v.processedEvents.slice(-360):[];
      v.activeActivityId=String(v.activeActivityId||'');
      v.lastWorldTick=Math.max(0,Number(v.lastWorldTick??tick(state)));
      v.season={id:'circuit-one',points:0,bestFinish:0,streak:0,...(v.season||{})};
      v.settings={autoDiscover:true,activityHints:true,...(v.settings||{})};
      v.stats={discovered:0,entered:0,completed:0,wins:0,podiums:0,racesWon:0,tournamentsWon:0,trialsWon:0,huntsWon:0,communityWins:0,factionWins:0,withdrawals:0,...(v.stats||{})};
      for(const activity of Object.values(v.activities))this.normalizeActivity(state,activity);
      if(v.activeActivityId&&!v.activities[v.activeActivityId])v.activeActivityId='';
      if(needsMigration){if(v.settings.autoDiscover)this.discoverActivities(state,10);v.lastWorldTick=tick(state);}
      return state;
    }

    normalizeActivity(state,activity={}){
      const family=ACTIVITY_FAMILIES[activity.family]?activity.family:'speed-race',def=ACTIVITY_FAMILIES[family];
      activity.id=String(activity.id||`activity-${hash32(`${state.seed}|${family}|${activity.sourceKey||'manual'}`).toString(36)}`);
      activity.sourceKey=String(activity.sourceKey||`manual:${activity.id}`);activity.sourceType=String(activity.sourceType||'circuit');activity.sourceId=String(activity.sourceId||'');
      activity.family=family;activity.category=def.category;activity.label=String(activity.label||def.label).slice(0,90);activity.summary=String(activity.summary||def.summary).slice(0,280);
      activity.universe=String(activity.universe||worldName(state));activity.venue=String(activity.venue||activity.universe);activity.hostFactionId=String(activity.hostFactionId||'');activity.settlementId=String(activity.settlementId||'');activity.strongholdId=String(activity.strongholdId||'');
      activity.status=['available','active','completed','withdrawn'].includes(activity.status)?activity.status:'available';activity.difficulty=clamp(activity.difficulty||1,1,5);activity.heat=clamp(activity.heat??50,0,100);
      activity.entryCost=Math.max(0,Number(activity.entryCost??Math.round(def.entry*(.85+activity.difficulty*.12))));activity.rewards={...def.rewards,...(activity.rewards||{})};
      activity.segmentIndex=clamp(activity.segmentIndex||0,0,def.segments.length-1);activity.score=Math.max(0,Number(activity.score||0));activity.failures=Math.max(0,Number(activity.failures||0));activity.rank=Math.max(0,Number(activity.rank||0));
      activity.segments=Array.isArray(activity.segments)&&activity.segments.length===def.segments.length?activity.segments:def.segments.map(([label,events],i)=>({id:`${activity.id}-segment-${i}`,label,events:[...events],target:activity.difficulty>=4&&i>=2?2:1,progress:0,status:'locked'}));
      activity.segments.forEach((segment,i)=>{segment.id=String(segment.id||`${activity.id}-segment-${i}`);segment.label=String(segment.label||def.segments[i][0]);segment.events=uniq(segment.events?.length?segment.events:def.segments[i][1]);segment.target=clamp(segment.target||1,1,2);segment.progress=clamp(segment.progress||0,0,segment.target);segment.status=['locked','active','completed'].includes(segment.status)?segment.status:'locked';});
      if(activity.status==='available')activity.segments.forEach(segment=>{if(segment.status!=='completed')segment.status='locked';});
      if(activity.status==='active'&&!activity.segments.some(segment=>segment.status==='active'))activity.segments[activity.segmentIndex].status='active';
      activity.planning={style:'balanced',companionId:'',relicId:'',locked:false,...(activity.planning||{})};activity.planning.style=ACTIVITY_STYLES[activity.planning.style]?activity.planning.style:'balanced';activity.planning.companionId=String(activity.planning.companionId||'');activity.planning.relicId=String(activity.planning.relicId||'');activity.planning.locked=Boolean(activity.planning.locked);
      activity.createdTick=Math.max(0,Number(activity.createdTick||tick(state)));activity.lastTick=Math.max(0,Number(activity.lastTick||activity.createdTick));activity.completedTick=Math.max(0,Number(activity.completedTick||0));activity.history=Array.isArray(activity.history)?activity.history.slice(-48):[];
      return activity;
    }

    sourceExists(state,key){return Object.values(state.v24.activities).some(a=>a.sourceKey===key)||state.v24.history.some(a=>a.sourceKey===key);}
    activity(state,id){return state.v24?.activities?.[String(id||'')]||null;}
    activeActivity(state){return this.activity(state,state.v24?.activeActivityId)||Object.values(state.v24?.activities||{}).find(a=>a.status==='active')||null;}

    discoverActivities(state,limit=10){
      const v=state.v24;if(!v)return[];const available=Object.values(v.activities).filter(a=>['available','active'].includes(a.status)).length,room=Math.max(0,Math.min(18,Number(limit||10))-available);if(!room)return[];
      const universe=worldName(state),bucket=Math.floor(tick(state)/8),families=Object.keys(ACTIVITY_FAMILIES),start=hash32(`${state.seed}|${universe}|${bucket}`)%families.length,candidates=[];
      const push=c=>{if(c?.sourceKey&&!this.sourceExists(state,c.sourceKey))candidates.push(c);};
      for(let i=0;i<6;i++){const family=families[(start+i)%families.length];push({sourceKey:`circuit:${bucket}:${universe}:${family}`,sourceType:'circuit',family,universe,venue:universe,difficulty:1+(hash32(`${state.seed}|${family}|${bucket}`)%5),heat:40+(hash32(`${family}|${universe}`)%46)});}
      const settlements=Object.values(state.v22?.settlements||{}).filter(s=>String(s.universe||'')===universe).slice(0,2);
      for(const s of settlements)push({sourceKey:`settlement-event:${bucket}:${s.id}`,sourceType:'settlement',sourceId:s.id,settlementId:s.id,family:Number(s.morale||50)>=55?'civilian-cup':'rescue-drill',universe:s.universe||universe,venue:s.name||'Settlement Grounds',difficulty:clamp(1+Math.floor((100-Number(s.security||50))/25),1,4),heat:55,label:`${s.name||'Settlement'} ${Number(s.morale||50)>=55?'Cup':'Rescue Drill'}`});
      const strongholds=Object.values(state.v21?.strongholds||{}).filter(h=>String(h.universe||'')===universe&&h.playerAligned).slice(0,1);
      for(const h of strongholds)push({sourceKey:`stronghold-games:${bucket}:${h.id}`,sourceType:'stronghold',sourceId:h.id,strongholdId:h.id,hostFactionId:h.ownerFactionId||'',family:'stronghold-games',universe:h.universe||universe,venue:h.name||'Stronghold Arena',difficulty:clamp(Math.ceil(Number(h.level||1)/2),1,5),heat:68,label:`${h.name||'Stronghold'} Games`});
      const primary=state.v21?.primaryFactionId;if(primary)push({sourceKey:`faction-prix:${bucket}:${primary}:${universe}`,sourceType:'faction',sourceId:primary,hostFactionId:primary,family:'faction-grand-prix',universe,venue:state.v16?.factions?.[primary]?.name||'Faction Circuit',difficulty:clamp(Math.ceil(Number(state.v21?.memberships?.[primary]?.rank||1)/2),1,5),heat:76});
      candidates.sort((a,b)=>Number(b.heat||0)-Number(a.heat||0)||a.sourceKey.localeCompare(b.sourceKey));const created=[];for(const candidate of candidates.slice(0,room)){const result=this.createActivity(state,candidate);if(result.ok)created.push(result.activity);}return created;
    }

    createActivity(state,options={}){
      this.ensure(state);const family=ACTIVITY_FAMILIES[options.family]?options.family:'speed-race',sourceKey=String(options.sourceKey||`manual:${family}:${Object.keys(state.v24.activities).length}`);if(this.sourceExists(state,sourceKey))return{ok:false,error:'Activity source already exists.'};
      const id=String(options.id||`activity-${hash32(`${state.seed}|${sourceKey}|${family}`).toString(36)}`),activity=this.normalizeActivity(state,{...options,id,family,sourceKey,createdTick:tick(state)});state.v24.activities[id]=activity;state.v24.stats.discovered++;return{ok:true,activity:clone(activity)};
    }

    companionAvailability(state,id){id=String(id||'');if(!id)return{allowed:true,reason:'Solo entry'};if(!(state.party||[]).map(String).includes(id))return{allowed:false,reason:'Only active party members can join an activity.'};const rec=state.v19?.records?.[id];if(rec&&['dead','departed','defected','bench'].includes(rec.status))return{allowed:false,reason:'This companion is unavailable.'};if(Number(rec?.axes?.resentment||0)>=80)return{allowed:false,reason:'This companion refuses to participate.'};return{allowed:true,reason:'Ready'};}

    planActivity(state,id,plan={}){
      const activity=this.activity(state,id);if(!activity||activity.status!=='available')return{ok:false,error:'Only available activities can be planned.'};const style=ACTIVITY_STYLES[plan.style||activity.planning.style]?String(plan.style||activity.planning.style):'balanced',companionId=String((plan.companionId??activity.planning.companionId)||''),relicId=String((plan.relicId??activity.planning.relicId)||'');const companion=this.companionAvailability(state,companionId);if(!companion.allowed)return{ok:false,error:companion.reason};if(relicId&&(!(state.artifacts||[]).map(String).includes(relicId)||state.v20?.relics?.[relicId]?.status==='stolen'))return{ok:false,error:'Selected relic is not available.'};activity.planning={style,companionId,relicId,locked:false};activity.lastTick=tick(state);return{ok:true,planning:clone(activity.planning),entryCost:activity.entryCost};
    }

    payCredits(state,amount){amount=Math.max(0,Number(amount||0));try{return new root.MultiverseDomain.EconomyCraftingEngine().pay(state,{credits:amount});}catch{if(Number(state.credits||0)<amount)return false;state.credits=Math.max(0,Number(state.credits||0)-amount);return true;}}

    beginActivity(state,id,plan={}){
      this.ensure(state);const activity=this.activity(state,id);if(!activity||activity.status!=='available')return{ok:false,error:'Activity is not available.'};if(this.activeActivity(state)&&this.activeActivity(state).id!==activity.id)return{ok:false,error:'Finish or withdraw from the active activity first.'};if(state.v23?.activeOperationId)return{ok:false,error:'Finish or withdraw from the active V23 operation before entering a circuit activity.'};const planned=this.planActivity(state,id,Object.keys(plan).length?plan:activity.planning);if(!planned.ok)return planned;if(!this.payCredits(state,activity.entryCost))return{ok:false,error:'Insufficient V18 Credits for this entry fee.'};activity.status='active';activity.segmentIndex=0;activity.score=0;activity.failures=0;activity.rank=0;activity.planning.locked=true;activity.segments.forEach((segment,i)=>{segment.progress=0;segment.status=i===0?'active':'locked';});activity.lastTick=tick(state);activity.history.push({tick:tick(state),type:'entered',detail:`Entered with ${ACTIVITY_STYLES[activity.planning.style].label} style for ${activity.entryCost} Credits.`});state.v24.activeActivityId=activity.id;state.v24.stats.entered++;this.partyReaction(state,activity,'enter');return{ok:true,activity:clone(activity),entryCost:activity.entryCost};
    }

    heroStat(state,key){return Number(state.customCharacter?.stats?.[key]??state.stats?.[key]??50);}
    performanceGain(state,activity,good){const def=ACTIVITY_FAMILIES[activity.family],style=ACTIVITY_STYLES[activity.planning.style]||ACTIVITY_STYLES.balanced,avg=def.focus.reduce((sum,key)=>sum+this.heroStat(state,key),0)/Math.max(1,def.focus.length);let gain=good?18+Math.round(avg/12)+style.score:5+Math.round(avg/30)-style.risk;if(activity.planning.companionId)gain+=2;if(activity.planning.relicId)gain+=2;return Math.max(2,gain);}

    processEvent(state,context={},roster=[]){
      this.ensure(state,[],roster);if(state.v24.settings.autoDiscover)this.discoverActivities(state,10);const activity=this.activeActivity(state);if(!activity)return{activity:null,progressed:false};const eventId=String(context.id||`v24:${state.spin}:${context.type}:${context.outcome}:${activity.id}`);if(state.v24.processedEvents.includes(eventId))return null;state.v24.processedEvents.push(eventId);state.v24.processedEvents=state.v24.processedEvents.slice(-360);const segment=activity.segments[activity.segmentIndex],type=String(context.type||'');if(!segment||segment.status!=='active'||!segment.events.includes(type))return{activity:clone(activity),progressed:false};const good=goodOutcome(context.outcome),style=ACTIVITY_STYLES[activity.planning.style]||ACTIVITY_STYLES.balanced;activity.score+=this.performanceGain(state,activity,good);if(!good){activity.failures++;activity.score=Math.max(0,activity.score-Math.max(0,style.risk));this.partyReaction(state,activity,'setback',roster);}segment.progress=clamp(segment.progress+Math.max(1,Number(context.amount||1)),0,segment.target);activity.lastTick=tick(state);activity.history.push({tick:tick(state),type:good?'segment-progress':'setback',detail:`${segment.label}: ${type} ended in ${context.outcome||'win'}.`});let segmentComplete=false;if(segment.progress>=segment.target){segment.status='completed';segmentComplete=true;if(activity.segmentIndex<activity.segments.length-1){activity.segmentIndex++;activity.segments[activity.segmentIndex].status='active';}else return{...this.finishActivity(state,activity,roster),progressed:true,segmentComplete,activityComplete:true};}return{activity:clone(activity),progressed:true,segmentComplete,activityComplete:false};
    }

    opponentScores(state,activity){const def=ACTIVITY_FAMILIES[activity.family],base=48+activity.difficulty*7;return[0,1,2].map(i=>base+(hash32(`${state.seed}|${activity.id}|opponent|${i}`)%28)+(def.category==='tournament'?3:0)).sort((a,b)=>b-a);}
    placement(state,activity){const def=ACTIVITY_FAMILIES[activity.family],avg=def.focus.reduce((sum,key)=>sum+this.heroStat(state,key),0)/Math.max(1,def.focus.length),player=Math.round(activity.score+avg*.24-activity.failures*5);const opponents=this.opponentScores(state,activity),rank=1+opponents.filter(score=>score>player).length;return{rank:clamp(rank,1,4),playerScore:player,opponentScores:opponents};}

    finishActivity(state,activity,roster=[]){
      if(!activity||activity.status!=='active')return{ok:false,error:'Activity is not active.'};const result=this.placement(state,activity),rank=result.rank,multiplier=[0,1,.72,.48,.28][rank]||.28;activity.rank=rank;activity.status='completed';activity.completedTick=tick(state);activity.lastTick=tick(state);activity.result=result;activity.segments.forEach(segment=>{if(segment.status!=='completed')segment.status='completed';});state.v24.activeActivityId='';state.v24.stats.completed++;if(rank===1){state.v24.stats.wins++;const category=ACTIVITY_FAMILIES[activity.family].category;const key=category==='race'?'racesWon':category==='tournament'?'tournamentsWon':category==='trial'?'trialsWon':category==='hunt'?'huntsWon':category==='community'?'communityWins':'factionWins';state.v24.stats[key]=Number(state.v24.stats[key]||0)+1;}if(rank<=3)state.v24.stats.podiums++;
      const circuitPoints=[0,12,8,5,3][rank]*activity.difficulty;state.v24.season.points=Math.max(0,Number(state.v24.season.points||0)+circuitPoints);state.v24.season.bestFinish=state.v24.season.bestFinish?Math.min(state.v24.season.bestFinish,rank):rank;state.v24.season.streak=rank===1?Number(state.v24.season.streak||0)+1:0;
      this.addRewards(state,activity,multiplier);this.applyHostAftermath(state,activity,rank);this.partyReaction(state,activity,rank<=2?'podium':'finish',roster);activity.history.push({tick:tick(state),type:'finish',detail:`Finished rank ${rank} with circuit score ${result.playerScore}.`});state.v24.history.push(clone(activity));state.v24.history=state.v24.history.slice(-160);this.remember(state,activity,rank);return{ok:true,activity:clone(activity),rank,circuitPoints,rewards:clone(activity.resolvedRewards)};
    }

    addRewards(state,activity,multiplier){const resolved={};for(const[k,v]of Object.entries(activity.rewards||{}))resolved[k]=Math.max(0,Math.round(Number(v||0)*multiplier));state.credits=Math.max(0,Number(state.credits||0)+Number(resolved.credits||0));if(state.v18?.wallet){for(const key of ['salvage','cosmicFragments','voidMarks','bountySeals'])if(resolved[key])state.v18.wallet[key]=Math.max(0,Number(state.v18.wallet[key]||0)+resolved[key]);}activity.resolvedRewards=resolved;const relicId=activity.planning.relicId;if(relicId&&state.v20?.relics?.[relicId]&&activity.rank<=2){const relic=state.v20.relics[relicId];relic.bond=clamp(Number(relic.bond||0)+1,0,100);relic.history=Array.isArray(relic.history)?relic.history:[];relic.history.push({spin:Number(state.spin||0),type:'activity-podium',activityId:activity.id});relic.history=relic.history.slice(-28);}}

    applyHostAftermath(state,activity,rank){const podium=rank<=3;if(activity.hostFactionId&&podium&&state.v21?.memberships?.[activity.hostFactionId]){const membership=state.v21.memberships[activity.hostFactionId];membership.authority=clamp(Number(membership.authority||0)+(rank===1?2:1),0,100);membership.rankXp=Math.max(0,Number(membership.rankXp||0)+(rank===1?10:5));}const settlement=state.v22?.settlements?.[activity.settlementId];if(settlement&&podium){settlement.morale=clamp(Number(settlement.morale||0)+(rank===1?4:2),0,100);settlement.playerOpinion=clamp(Number(settlement.playerOpinion||0)+(rank===1?4:2),-100,100);settlement.prosperity=clamp(Number(settlement.prosperity||0)+1,0,100);}const hold=state.v21?.strongholds?.[activity.strongholdId];if(hold&&podium){hold.morale=clamp(Number(hold.morale||0)+2,0,100);hold.defense=clamp(Number(hold.defense||0)+1,0,100);}}

    partyReaction(state,activity,kind,roster=[]){const id=activity.planning?.companionId,rec=state.v19?.records?.[id];if(!id||!rec?.axes)return;const axes=rec.axes;if(kind==='enter'){axes.friendship=clamp(Number(axes.friendship??50)+1,0,100);}else if(kind==='setback'){axes.rivalry=clamp(Number(axes.rivalry||0)+1,0,100);}else if(kind==='podium'){axes.trust=clamp(Number(axes.trust??50)+2,0,100);axes.respect=clamp(Number(axes.respect??50)+3,0,100);axes.friendship=clamp(Number(axes.friendship??50)+2,0,100);}else{axes.respect=clamp(Number(axes.respect??50)+1,0,100);}}

    withdrawActivity(state,id=state.v24?.activeActivityId){const activity=this.activity(state,id);if(!activity||activity.status!=='active')return{ok:false,error:'No active activity to withdraw from.'};activity.status='withdrawn';activity.completedTick=tick(state);activity.rank=0;activity.history.push({tick:tick(state),type:'withdrawn',detail:'The player withdrew from the event. Entry fee is not refunded.'});state.v24.activeActivityId='';state.v24.stats.withdrawals++;state.v24.history.push(clone(activity));state.v24.history=state.v24.history.slice(-160);return{ok:true,activity:clone(activity)};}

    seasonTier(points=0){points=Number(points||0);if(points>=400)return'Legend';if(points>=240)return'Elite';if(points>=120)return'Contender';if(points>=50)return'Challenger';return'Rookie';}
    summary(state){const v=state.v24||{};return{active:clone(this.activeActivity(state)),available:Object.values(v.activities||{}).filter(a=>a.status==='available').sort((a,b)=>Number(b.heat||0)-Number(a.heat||0)).map(clone),recent:(v.history||[]).slice(-8).reverse().map(clone),season:{...(v.season||{}),tier:this.seasonTier(v.season?.points)},stats:clone(v.stats||{})};}
    catchUp(state,maxTicks=6){this.ensure(state);const now=tick(state),elapsed=Math.max(0,Math.min(Number(maxTicks||6),now-Number(state.v24.lastWorldTick||now)));if(elapsed>0&&state.v24.settings.autoDiscover)this.discoverActivities(state,10);state.v24.lastWorldTick=now;return elapsed;}
    processWorldTick(state){this.ensure(state);if(state.v24.settings.autoDiscover)this.discoverActivities(state,10);state.v24.lastWorldTick=tick(state);return this.summary(state);}
    remember(state,activity,rank){if(!state.v16)return;state.v16.memory=Array.isArray(state.v16.memory)?state.v16.memory:[];state.v16.memory.push({tick:tick(state),type:'activity',summary:`${activity.label}: finished ${rank===1?'1st':rank===2?'2nd':rank===3?'3rd':'4th'} in ${activity.universe}.`,activityId:activity.id});state.v16.memory=state.v16.memory.slice(-160);}
  }

  function migrateV24(state={},artifacts=[],roster=[]){return new ActivityCircuitEngine().ensure(state,artifacts,roster);}
  const api={V24_SCHEMA_VERSION,ActivityCircuitEngine,migrateV24,ACTIVITY_FAMILIES_V24:ACTIVITY_FAMILIES,ACTIVITY_STYLES_V24:ACTIVITY_STYLES};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
