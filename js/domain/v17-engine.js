'use strict';

(function attachV17Engine(root){
  const V17_SCHEMA_VERSION=17;
  const MAX_QUESTS=36;
  const MAX_QUEST_HISTORY=80;
  const MAX_CHAIN_HISTORY=40;

  const LAW_AXES={
    gravity:['light','standard','heavy'],
    technology:['amplified','stable','suppressed'],
    mystic:['amplified','stable','suppressed'],
    time:['stable','dilated','fractured'],
    mortality:['anchored','normal','fragile'],
    psionics:['open','normal','shielded']
  };
  const TAG_POOLS={
    amplified:['magic','tech','speed','strength','psychic','cosmic','weapon','healing','time','space'],
    suppressed:['magic','tech','psychic','reality','time','space','energy','regeneration']
  };
  const DESTINATION_ARCHETYPES=[
    {id:'crossroads',label:'Portal Crossroads',summary:'A stable junction where routes, rumors, and travelers overlap.',questKinds:['travel','recruit','rare'],bias:['recruit','rare'],hazard:-.03},
    {id:'metropolis',label:'Living Metropolis',summary:'Dense civilian territory where reputation and collateral damage matter.',questKinds:['battle','recruit','saga'],bias:['recruit','recovery'],hazard:-.01},
    {id:'arena',label:'Convergence Arena',summary:'A public battleground built around escalating spectacle.',questKinds:['battle','training'],bias:['battle','training'],strategy:{clash:.025,blitz:.015}},
    {id:'archive',label:'Impossible Archive',summary:'Records from timelines that may never have happened.',questKinds:['rare','saga','artifact'],bias:['rare','training'],strategy:{tactics:.035}},
    {id:'laboratory',label:'Fracture Laboratory',summary:'Experimental technology studies copied powers and unstable physics.',questKinds:['training','artifact','battle'],bias:['power','training'],strategy:{tactics:.03}},
    {id:'sanctuary',label:'Reality Sanctuary',summary:'A defended refuge that reduces hostile pressure and favors recovery.',questKinds:['recruit','travel','hazard'],bias:['recovery','recruit'],strategy:{outlast:.03},hazard:-.08},
    {id:'warfront',label:'Faction Warfront',summary:'Open conflict between powers trying to control this reality.',questKinds:['battle','hazard','artifact'],bias:['battle','artifact'],strategy:{clash:.025},hazard:.08},
    {id:'shrine',label:'Veiled Shrine',summary:'A spiritual node where symbolic law can override ordinary physics.',questKinds:['rare','saga','hazard'],bias:['transform','rare'],strategy:{mystic:.04},secret:true,unlock:'corruption'},
    {id:'black-market',label:'Interdimensional Black Market',summary:'Relics, contracts, and dangerous opportunities change hands here.',questKinds:['artifact','recruit','rare'],bias:['artifact','power'],secret:true,unlock:'reputation'},
    {id:'hunters-wake',label:"Hunter's Wake",summary:'A moving trail left by something that has learned how you fight.',questKinds:['battle','artifact','hazard'],bias:['battle','artifact'],strategy:{tactics:.02},hazard:.05,secret:true,unlock:'nemesis'},
    {id:'fracture-depths',label:'Fracture Depths',summary:'A broken layer of reality where hidden rules become visible.',questKinds:['rare','hazard','saga'],bias:['transform','rare'],strategy:{mystic:.03,blitz:.015},hazard:.1,secret:true,unlock:'visits'}
  ];
  const QUEST_TEMPLATES={
    battle:{label:'Hostile Interdiction',objective:'Win {n} hostile encounter{s}.',eventTypes:['battle','boss'],outcome:'win',min:1,max:2},
    hazard:{label:'Contain the Anomaly',objective:'Resolve {n} hazard{s} without abandoning the route.',eventTypes:['hazard'],min:1,max:2},
    artifact:{label:'Relic Recovery',objective:'Acquire {n} artifact{s} for the operation.',eventTypes:['artifact'],min:1,max:2},
    recruit:{label:'Coalition Recruitment',objective:'Recruit {n} new ally or allies.',eventTypes:['recruit'],min:1,max:2},
    rare:{label:'Investigate the Impossible',objective:'Resolve {n} rare anomal{y}.',eventTypes:['rare'],min:1,max:2},
    training:{label:'Field Preparation',objective:'Complete {n} training encounter{s}.',eventTypes:['training'],min:1,max:2},
    saga:{label:'Chronicle Intervention',objective:'Resolve {n} Chronicle decision{s}.',eventTypes:['v14-saga'],min:1,max:1},
    travel:{label:'Route Survey',objective:'Travel to {n} discovered destination{s}.',eventTypes:['travel'],min:1,max:2}
  };
  const CHAIN_DEFINITIONS={
    'reality-storm':{label:'Reality Storm',duration:3,summary:'Fractured law increases anomalies and danger.',bias:{rare:1,transform:1,hazard:1},hazard:.12,conceal:0},
    'bounty-hunt':{label:'Bounty Hunt',duration:3,summary:'A hostile network is steering battles toward your route.',bias:{battle:2,artifact:1},hazard:.04,conceal:0},
    'golden-route':{label:'Golden Route',duration:2,summary:'A rare stable current is carrying high-value opportunities.',bias:{artifact:1,power:1,recruit:1},hazard:-.1,conceal:0},
    'forbidden-current':{label:'Forbidden Current',duration:3,summary:'Better rewards surface beside consequences the Wheel normally hides.',bias:{artifact:1,power:1,hazard:1},hazard:.08,conceal:1},
    'echo-chain':{label:'Echo Chain',duration:2,summary:'The previous result is reverberating into the next wheels.',bias:{},hazard:0,conceal:0,echo:true},
    'mystery-signal':{label:'??? Signal',duration:2,summary:'At least one wheel section cannot be identified until it lands.',bias:{rare:1},hazard:.03,conceal:2}
  };

  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'unknown';
  const hash32=value=>{if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;};
  const rngFrom=key=>{let x=hash32(key)||0x9e3779b9;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};};
  const choose=(list,rng)=>list[Math.floor(rng()*list.length)%list.length];
  const canonicalUniverse=value=>root.MultiverseDomain?.canonicalUniverse?.(value)||String(value||'Unknown').trim()||'Unknown';
  const currentWorld=state=>{const name=canonicalUniverse(state.v16?.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime'),id=normalize(name);return state.v16?.universes?.[id]||{id,name,stability:75,corruption:10,threat:15,visits:1,collapsed:false};};

  class RealityRulesEngine{
    ensure(state={},roster=[]){
      if(root.MultiverseDomain?.migrateV16)root.MultiverseDomain.migrateV16(state,roster);
      if(!state.v16)state.v16={currentUniverse:state.customCharacter?.homeworld||'Earth-Prime',universes:{},factions:{},nemeses:{},clock:{tick:0},memory:[],worldEvents:[]};
      state.v17||={};const v17=state.v17;v17.schemaVersion=V17_SCHEMA_VERSION;state.v17Version=V17_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V17_SCHEMA_VERSION);
      v17.universeDNA=v17.universeDNA&&typeof v17.universeDNA==='object'?v17.universeDNA:{};
      v17.routes=v17.routes&&typeof v17.routes==='object'?v17.routes:{};
      v17.currentLocation=v17.currentLocation&&typeof v17.currentLocation==='object'?v17.currentLocation:{};
      v17.quests=Array.isArray(v17.quests)?v17.quests.slice(-MAX_QUESTS):[];v17.questHistory=Array.isArray(v17.questHistory)?v17.questHistory.slice(-MAX_QUEST_HISTORY):[];v17.offerNonce=Math.max(0,Number(v17.offerNonce||0));
      v17.factionFavor=v17.factionFavor&&typeof v17.factionFavor==='object'?v17.factionFavor:{};
      v17.wheel={activeChain:null,history:[],lastResolvedType:'',secretDiscoveries:[],generatedAtSpin:-1,...(v17.wheel||{})};v17.wheel.history=Array.isArray(v17.wheel.history)?v17.wheel.history.slice(-MAX_CHAIN_HISTORY):[];v17.wheel.secretDiscoveries=Array.isArray(v17.wheel.secretDiscoveries)?v17.wheel.secretDiscoveries:[];
      v17.stats={questsAccepted:0,questsCompleted:0,questsFailed:0,locationsVisited:0,secretsFound:0,chainsTriggered:0,favorSpent:0,...(v17.stats||{})};
      const names=new Set([state.v16.currentUniverse,...Object.values(state.v16.universes||{}).map(world=>world.name)]);for(const name of names)if(name){this.dna(state,name);this.routesFor(state,name);}
      this.refreshUnlocks(state);this.ensureOffers(state);return state;
    }

    dna(state,universe){
      state.v17||={universeDNA:{}};state.v17.universeDNA||={};const name=canonicalUniverse(universe),id=normalize(name),existing=state.v17.universeDNA[id];if(existing)return existing;
      const rng=rngFrom(`${state.seed||0}|v17|dna|${name}`),laws={};for(const [axis,values] of Object.entries(LAW_AXES))laws[axis]=choose(values,rng);
      const shuffled=(list,key)=>list.map((item,index)=>({item,rank:hash32(`${state.seed||0}|${name}|${key}|${item}|${index}`)})).sort((a,b)=>a.rank-b.rank).map(entry=>entry.item);
      const amplified=shuffled(TAG_POOLS.amplified,'amp').slice(0,2),suppressed=shuffled(TAG_POOLS.suppressed.filter(tag=>!amplified.includes(tag)),'suppress').slice(0,2);
      const dna={id,name,signature:hash32(`${state.seed||0}|${name}|dna`).toString(36).toUpperCase(),laws,amplifiedTags:amplified,suppressedTags:suppressed,discoveredTick:Number(state.v16?.clock?.tick||0)};
      state.v17.universeDNA[id]=dna;return dna;
    }

    ruleModifiers(state,universe=state.v16?.currentUniverse,locationId=''){
      const dna=this.dna(state,universe),mods={clash:0,blitz:0,tactics:0,mystic:0,outlast:0,hazard:0};
      if(dna.laws.gravity==='light'){mods.blitz+=.025;mods.clash-=.01;}else if(dna.laws.gravity==='heavy'){mods.blitz-=.03;mods.clash+=.018;mods.outlast+=.012;}
      if(dna.laws.technology==='amplified')mods.tactics+=.035;else if(dna.laws.technology==='suppressed')mods.tactics-=.035;
      if(dna.laws.mystic==='amplified')mods.mystic+=.04;else if(dna.laws.mystic==='suppressed')mods.mystic-=.04;
      if(dna.laws.time==='fractured'){mods.blitz+=.012;mods.mystic+=.018;mods.hazard+=.07;}else if(dna.laws.time==='dilated'){mods.tactics+=.012;mods.blitz-=.012;}
      if(dna.laws.mortality==='anchored')mods.outlast+=.028;else if(dna.laws.mortality==='fragile'){mods.outlast-=.025;mods.clash+=.01;mods.hazard+=.025;}
      if(dna.laws.psionics==='open')mods.mystic+=.018;else if(dna.laws.psionics==='shielded')mods.mystic-=.025;
      const route=this.routesFor(state,universe).find(item=>item.id===locationId);for(const [key,value] of Object.entries(route?.strategy||{}))mods[key]+=Number(value||0);mods.hazard+=Number(route?.hazard||0);
      return Object.fromEntries(Object.entries(mods).map(([key,value])=>[key,clamp(value,-.12,.12)]));
    }

    tagPressure(state,tags=[]){const dna=this.dna(state,state.v16?.currentUniverse),set=new Set((tags||[]).map(tag=>String(tag).toLowerCase())),amp=dna.amplifiedTags.filter(tag=>set.has(tag)).length,supp=dna.suppressedTags.filter(tag=>set.has(tag)).length;return clamp(amp*.007-supp*.009,-.045,.035);}

    routesFor(state,universe=state.v16?.currentUniverse){
      state.v17.routes||={};const name=canonicalUniverse(universe),id=normalize(name);if(state.v17.routes[id])return state.v17.routes[id];const rng=rngFrom(`${state.seed||0}|v17|routes|${name}`),publicPool=DESTINATION_ARCHETYPES.filter(item=>!item.secret),secretPool=DESTINATION_ARCHETYPES.filter(item=>item.secret),picked=[];
      while(picked.length<5&&publicPool.length){const remaining=publicPool.filter(x=>!picked.some(p=>p.id===x.id)),item=choose(remaining,rng);if(item)picked.push(item);else break;}
      while(picked.length<7&&secretPool.length){const remaining=secretPool.filter(x=>!picked.some(p=>p.id===x.id)),item=choose(remaining,rng);if(item)picked.push(item);else break;}
      state.v17.routes[id]=picked.map((item,index)=>({...clone(item),universe:name,routeId:`${id}:${item.id}`,discovered:!item.secret,unlocked:!item.secret,visits:0,index}));
      if(!state.v17.currentLocation[id])state.v17.currentLocation[id]=state.v17.routes[id][0]?.id||'crossroads';return state.v17.routes[id];
    }

    unlockCondition(state,route,world=currentWorld(state)){
      if(!route.secret)return true;if(route.unlock==='corruption')return Number(world.corruption||0)>=45;if(route.unlock==='reputation')return Object.values(state.v16?.factions||{}).some(f=>Number(f.reputation||0)>=35);if(route.unlock==='nemesis')return Object.values(state.v16?.nemeses||{}).some(n=>n.status!=='broken'&&canonicalUniverse(n.universe)===canonicalUniverse(route.universe));if(route.unlock==='visits')return Number(world.visits||0)>=3;return false;
    }

    refreshUnlocks(state){
      for(const [worldId,routes] of Object.entries(state.v17.routes||{})){const world=state.v16?.universes?.[worldId]||currentWorld(state);for(const route of routes){if(!route.unlocked&&this.unlockCondition(state,route,world)){route.unlocked=true;route.discovered=true;state.v17.stats.secretsFound++;if(!state.v17.wheel.secretDiscoveries.includes(route.routeId))state.v17.wheel.secretDiscoveries.push(route.routeId);}}}return state.v17.routes;
    }

    currentLocationRecord(state){const world=currentWorld(state),routes=this.routesFor(state,world.name),id=state.v17.currentLocation[world.id]||routes[0]?.id;return routes.find(route=>route.id===id)||routes[0]||null;}

    travelLocation(state,locationId){
      this.ensure(state);const world=currentWorld(state),routes=this.routesFor(state,world.name),route=routes.find(item=>item.id===String(locationId||''));if(!route)return{ok:false,error:'Unknown destination.'};this.refreshUnlocks(state);if(!route.unlocked)return{ok:false,error:'That route is still hidden.'};state.v17.currentLocation[world.id]=route.id;route.visits=Math.max(0,Number(route.visits||0))+1;state.v17.stats.locationsVisited++;for(const quest of state.v17.quests.filter(q=>q.status==='offered'&&q.locationId&&q.locationId!==route.id)){quest.status='expired';state.v17.questHistory.push(clone(quest));}state.v17.questHistory=state.v17.questHistory.slice(-MAX_QUEST_HISTORY);
      this.progressEvent(state,{type:'travel',outcome:'success',universe:world.name,locationId:route.id,eventId:`travel:${state.v16?.clock?.tick||0}:${world.id}:${route.id}:${route.visits}`});return{ok:true,route:clone(route)};
    }

    factionFavor(state,factionId){return Math.max(0,Math.round(Number(state.v17.factionFavor[String(factionId||'')]||0)));}

    spendFavor(state,factionId,kind){
      this.ensure(state);const id=String(factionId||''),faction=state.v16?.factions?.[id];if(!faction)return{ok:false,error:'Unknown faction.'};const costs={stabilize:2,reveal:2,ceasefire:3},cost=costs[kind];if(!cost)return{ok:false,error:'Unknown favor action.'};if(this.factionFavor(state,id)<cost)return{ok:false,error:`${cost} Favor required.`};state.v17.factionFavor[id]-=cost;state.v17.stats.favorSpent+=cost;const world=currentWorld(state);
      if(kind==='stabilize'){world.stability=clamp(Number(world.stability||0)+8,0,100);world.threat=clamp(Number(world.threat||0)-5,0,100);}
      if(kind==='reveal'){const hidden=this.routesFor(state,world.name).find(route=>!route.unlocked);if(hidden){hidden.unlocked=true;hidden.discovered=true;state.v17.stats.secretsFound++;}else{state.v17.factionFavor[id]+=cost;state.v17.stats.favorSpent-=cost;return{ok:false,error:'No hidden route remains in this reality.'};}}
      if(kind==='ceasefire'){for(const relationId of Object.keys(faction.relations||{}))if(Number(faction.relations[relationId])<-25){faction.relations[relationId]=Math.min(-10,Number(faction.relations[relationId])+20);const other=state.v16.factions[relationId];if(other?.relations)other.relations[id]=faction.relations[relationId];break;}}
      return{ok:true,cost,kind,favor:this.factionFavor(state,id)};
    }

    questId(state,factionId,kind,index){return`q-${hash32(`${state.seed||0}|${state.v16?.clock?.tick||0}|${factionId}|${kind}|${index}|${state.v17.offerNonce}`).toString(36)}`;}

    makeQuest(state,faction,kind,index=0){
      const template=QUEST_TEMPLATES[kind]||QUEST_TEMPLATES.battle,rng=rngFrom(`${state.seed||0}|v17|quest|${faction.id}|${kind}|${state.v16?.clock?.tick||0}|${index}`),target=template.min+Math.floor(rng()*(template.max-template.min+1)),world=currentWorld(state),location=this.currentLocationRecord(state),rep=7+Math.floor(rng()*7),favor=1+(target>1?1:0)+(rng()>.8?1:0);
      const objective=template.objective.replace('{n}',String(target)).replace('{s}',target===1?'':'s').replace('{y}',target===1?'y':'ies');return{id:this.questId(state,faction.id,kind,index),factionId:faction.id,factionName:faction.name,kind,label:template.label,objective,target,progress:0,eventTypes:template.eventTypes.slice(),requiredOutcome:template.outcome||'',universe:world.name,locationId:location?.id||'',status:'offered',reward:{reputation:rep,favor,stability:kind==='hazard'||kind==='saga'?3:1},createdTick:Number(state.v16?.clock?.tick||0)};
    }

    ensureOffers(state){
      const offered=state.v17.quests.filter(q=>q.status==='offered'),active=state.v17.quests.filter(q=>q.status==='active');if(offered.length>=3||active.length>=3)return state.v17.quests;const factions=Object.values(state.v16?.factions||{}).filter(f=>f.status!=='destroyed');if(!factions.length)return state.v17.quests;const location=this.currentLocationRecord(state),kinds=location?.questKinds?.length?location.questKinds:Object.keys(QUEST_TEMPLATES),rng=rngFrom(`${state.seed||0}|v17|offers|${state.v16?.clock?.tick||0}|${state.v17.questHistory.length}`),needed=3-offered.length;
      for(let index=0;index<needed;index++){state.v17.offerNonce++;const faction=choose(factions,rng),kind=choose(kinds,rng),quest=this.makeQuest(state,faction,kind,index);if(!state.v17.quests.some(q=>q.id===quest.id))state.v17.quests.push(quest);}state.v17.quests=state.v17.quests.slice(-MAX_QUESTS);return state.v17.quests;
    }

    acceptQuest(state,questId){this.ensure(state);const quest=state.v17.quests.find(q=>q.id===String(questId||''));if(!quest||quest.status!=='offered')return{ok:false,error:'Quest is no longer available.'};if(state.v17.quests.filter(q=>q.status==='active').length>=3)return{ok:false,error:'Three faction quests are already active.'};quest.status='active';quest.acceptedTick=Number(state.v16?.clock?.tick||0);state.v17.stats.questsAccepted++;return{ok:true,quest:clone(quest)};}
    abandonQuest(state,questId){const quest=state.v17?.quests?.find(q=>q.id===String(questId||''));if(!quest||quest.status!=='active')return{ok:false,error:'Quest is not active.'};quest.status='failed';quest.failedTick=Number(state.v16?.clock?.tick||0);state.v17.stats.questsFailed++;state.v17.questHistory.push(clone(quest));return{ok:true,quest:clone(quest)};}

    rewardQuest(state,quest){
      const faction=state.v16?.factions?.[quest.factionId];if(faction)faction.reputation=clamp(Number(faction.reputation||0)+quest.reward.reputation,-100,100);state.v17.factionFavor[quest.factionId]=this.factionFavor(state,quest.factionId)+quest.reward.favor;const world=currentWorld(state);world.stability=clamp(Number(world.stability||0)+Number(quest.reward.stability||0),0,100);quest.status='completed';quest.completedTick=Number(state.v16?.clock?.tick||0);state.v17.stats.questsCompleted++;state.v17.questHistory.push(clone(quest));state.v17.questHistory=state.v17.questHistory.slice(-MAX_QUEST_HISTORY);return quest;
    }

    progressEvent(state,context={}){
      this.ensure(state);const eventId=String(context.eventId||`${context.type||'event'}:${state.spin||0}:${state.v16?.clock?.tick||0}`);state.v17.progressedEventIds=Array.isArray(state.v17.progressedEventIds)?state.v17.progressedEventIds.slice(-100):[];if(state.v17.progressedEventIds.includes(eventId))return[];state.v17.progressedEventIds.push(eventId);state.v17.wheel.lastResolvedType=String(context.type||state.v17.wheel.lastResolvedType||'');const completed=[];
      for(const quest of state.v17.quests.filter(q=>q.status==='active')){if(!quest.eventTypes.includes(String(context.type||'')))continue;if(quest.requiredOutcome&&quest.requiredOutcome!==context.outcome)continue;if(quest.universe&&context.universe&&canonicalUniverse(quest.universe)!==canonicalUniverse(context.universe))continue;quest.progress=Math.min(quest.target,Number(quest.progress||0)+1);if(quest.progress>=quest.target)completed.push(clone(this.rewardQuest(state,quest)));}
      if(completed.length)this.beginChain(state,'golden-route','Faction quest completion');this.ensureOffers(state);return completed;
    }

    beginChain(state,chainId,reason='Reality conditions changed'){
      this.ensure(state);const definition=CHAIN_DEFINITIONS[chainId];if(!definition)return null;const current=state.v17.wheel.activeChain;if(current&&current.remaining>0)return current;const chain={id:chainId,label:definition.label,summary:definition.summary,remaining:definition.duration,total:definition.duration,reason:String(reason),startedSpin:Number(state.spin||0),startedTick:Number(state.v16?.clock?.tick||0)};state.v17.wheel.activeChain=chain;state.v17.wheel.history.push(clone(chain));state.v17.wheel.history=state.v17.wheel.history.slice(-MAX_CHAIN_HISTORY);state.v17.stats.chainsTriggered++;return chain;
    }

    rollChain(state){
      this.ensure(state);if(state.v17.wheel.activeChain?.remaining>0)return state.v17.wheel.activeChain;const world=currentWorld(state),tick=Number(state.v16?.clock?.tick||0),spin=Number(state.spin||0),activeNemesis=Object.values(state.v16?.nemeses||{}).some(n=>n.status==='hunting'),highRep=Object.values(state.v16?.factions||{}).some(f=>Number(f.reputation||0)>=55),rng=rngFrom(`${state.seed||0}|v17|chain|${tick}|${spin}`);let id='';
      if(world.corruption>=60&&rng()<.55)id='reality-storm';else if(activeNemesis&&rng()<.58)id='bounty-hunt';else if(highRep&&rng()<.3)id='golden-route';else if(state.v17.wheel.secretDiscoveries.length>=2&&rng()<.28)id='mystery-signal';else if(state.v17.wheel.lastResolvedType&&spin>2&&spin%7===0)id='echo-chain';else if(rng()<.07)id='forbidden-current';return id?this.beginChain(state,id,'Seeded wheel condition'):null;
    }

    wheelDirective(state){
      this.ensure(state);const chain=state.v17.wheel.activeChain?.remaining>0?state.v17.wheel.activeChain:null,definition=chain?CHAIN_DEFINITIONS[chain.id]:null,location=this.currentLocationRecord(state),bias={};for(const type of location?.bias||[])bias[type]=(bias[type]||0)+1;for(const [type,count] of Object.entries(definition?.bias||{}))bias[type]=(bias[type]||0)+count;if(definition?.echo&&state.v17.wheel.lastResolvedType)bias[state.v17.wheel.lastResolvedType]=(bias[state.v17.wheel.lastResolvedType]||0)+2;const rules=this.ruleModifiers(state,state.v16.currentUniverse,location?.id||'');return{chain:chain?clone(chain):null,bias,hazard:clamp(Number(definition?.hazard||0)+Number(rules.hazard||0),-.2,.25),conceal:Number(definition?.conceal||0),location:clone(location),dna:clone(this.dna(state,state.v16.currentUniverse))};
    }

    consumeChain(state){const chain=state.v17?.wheel?.activeChain;if(!chain)return null;chain.remaining=Math.max(0,Number(chain.remaining||0)-1);if(chain.remaining===0)state.v17.wheel.activeChain=null;return clone(chain);}

    summary(state){this.ensure(state);const world=currentWorld(state),dna=this.dna(state,world.name),location=this.currentLocationRecord(state),active=state.v17.quests.filter(q=>q.status==='active'),offered=state.v17.quests.filter(q=>q.status==='offered');return{world:clone(world),dna:clone(dna),location:clone(location),activeQuests:active.map(clone),offeredQuests:offered.map(clone),activeChain:clone(state.v17.wheel.activeChain),secretsFound:Number(state.v17.stats.secretsFound||0),favorTotal:Object.values(state.v17.factionFavor).reduce((sum,value)=>sum+Number(value||0),0)};}
  }

  function migrateV17(state={},roster=[]){return new RealityRulesEngine().ensure(state,roster);}
  const api={V17_SCHEMA_VERSION,LAW_AXES,DESTINATION_ARCHETYPES,QUEST_TEMPLATES,CHAIN_DEFINITIONS,RealityRulesEngine,migrateV17};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
