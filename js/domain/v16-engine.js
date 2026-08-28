'use strict';

(function attachV16Engine(root){
  const V16_SCHEMA_VERSION=16;
  const OFFLINE_TICK_MS=90*60*1000;
  const MAX_OFFLINE_TICKS=12;
  const MAX_WORLD_EVENTS=160;
  const MAX_MEMORIES=240;
  const DEFAULT_FACTION_COUNT=6;

  const FACTION_PREFIXES=['Horizon','Null','Ember','Signal','Crown','Free','Veil','Iron','Astral','Rift','Glass','Dawn'];
  const FACTION_SUFFIXES=['Wardens','Concord','Syndicate','Assembly','Choir','League','Directorate','Cartel','Collective','Covenant','Compact','Pilgrims'];
  const FACTION_ARCHETYPES=[
    {id:'guardian',ethos:'mercy',goal:'Protect unstable worlds before power can exploit them.',stance:'protective'},
    {id:'archivist',ethos:'knowledge',goal:'Preserve dangerous histories and control who can rewrite them.',stance:'watchful'},
    {id:'liberator',ethos:'freedom',goal:'Break monopolies on travel, prophecy, and inherited authority.',stance:'restless'},
    {id:'imperial',ethos:'order',goal:'Force fractured realities into one enforceable order.',stance:'expansionist'},
    {id:'mystic',ethos:'balance',goal:'Keep reality, spirit, and cosmic law from consuming one another.',stance:'enigmatic'},
    {id:'broker',ethos:'ambition',goal:'Own the routes, relics, and contracts everyone else needs.',stance:'opportunistic'}
  ];
  const MEMORY_WEIGHTS={battle:3,boss:5,'v14-saga':5,artifact:3,recruit:3,rare:4,hazard:3,travel:2,nemesis:5,faction:4,world:4};

  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'unknown';
  const hash32=value=>{
    if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));
    let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;
  };
  const rngFrom=key=>{let x=hash32(key)||0x9e3779b9;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};};
  const choose=(list,rng)=>list[Math.floor(rng()*list.length)%list.length];
  const signed=value=>Number(value)>=0?`+${Number(value)}`:String(Number(value));

  function rosterMap(roster=[]){return new Map((roster||[]).filter(Boolean).map(character=>[String(character.id||''),character]));}
  function canonicalUniverse(value){return root.MultiverseDomain?.canonicalUniverse?.(value)||String(value||'Unknown').trim()||'Unknown';}

  class LivingMultiverseEngine{
    ensure(state={},roster=[]){
      if(!state||typeof state!=='object')throw new TypeError('A state object is required.');
      const now=Date.now();state.v16||={};const v16=state.v16;
      v16.schemaVersion=V16_SCHEMA_VERSION;state.v16Version=V16_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V16_SCHEMA_VERSION);
      v16.clock={tick:0,lastRealAt:now,offlineTicks:0,...(v16.clock||{})};
      v16.settings={offlineSimulation:true,offlineTickMs:OFFLINE_TICK_MS,maxOfflineTicks:MAX_OFFLINE_TICKS,...(v16.settings||{})};
      v16.universes=v16.universes&&typeof v16.universes==='object'?v16.universes:{};
      v16.factions=v16.factions&&typeof v16.factions==='object'?v16.factions:{};
      v16.nemeses=v16.nemeses&&typeof v16.nemeses==='object'?v16.nemeses:{};
      v16.artifactOwners=v16.artifactOwners&&typeof v16.artifactOwners==='object'?v16.artifactOwners:{};
      v16.memory=Array.isArray(v16.memory)?v16.memory.slice(-MAX_MEMORIES):[];
      v16.worldEvents=Array.isArray(v16.worldEvents)?v16.worldEvents.slice(-MAX_WORLD_EVENTS):[];
      v16.stats={wars:0,alliances:0,incursions:0,collapses:0,recoveries:0,nemesisHunts:0,travels:0,...(v16.stats||{})};
      v16.currentUniverse=String(v16.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime');
      this.ensureFactions(state);
      this.discoverFromState(state,roster);
      const current=this.touchUniverse(state,v16.currentUniverse);
      if(!current.visits){current.visits=1;current.lastVisitedTick=Number(v16.clock.tick||0);}
      this.syncArtifacts(state);
      return state;
    }

    ensureFactions(state){
      const v16=state.v16;if(Object.keys(v16.factions).length>=DEFAULT_FACTION_COUNT)return v16.factions;
      const rng=rngFrom(`${state.seed||0}|v16|factions`),used=new Set(Object.keys(v16.factions));
      for(let index=0;index<DEFAULT_FACTION_COUNT;index++){
        const archetype=FACTION_ARCHETYPES[index%FACTION_ARCHETYPES.length];
        let name=`${choose(FACTION_PREFIXES,rng)} ${choose(FACTION_SUFFIXES,rng)}`,id=`${normalize(name)}-${index+1}`;
        while(used.has(id)){name=`${choose(FACTION_PREFIXES,rng)} ${choose(FACTION_SUFFIXES,rng)}`;id=`${normalize(name)}-${index+1}`;}
        used.add(id);
        v16.factions[id]={id,name,archetype:archetype.id,ethos:archetype.ethos,goal:archetype.goal,stance:archetype.stance,reputation:0,power:Math.round(48+rng()*34),resources:Math.round(42+rng()*42),cohesion:Math.round(48+rng()*38),relations:{},homeUniverse:v16.currentUniverse,status:'active',lastActionTick:0};
      }
      return v16.factions;
    }

    touchUniverse(state,name,options={}){
      const v16=state.v16,canonical=canonicalUniverse(name),id=normalize(canonical),existing=v16.universes[id],rng=rngFrom(`${state.seed||0}|universe|${canonical}`);
      const world=existing||{id,name:canonical,stability:Math.round(82+rng()*14),corruption:Math.round(rng()*9),threat:Math.round(8+rng()*18),visits:0,discoveredTick:Number(v16.clock.tick||0),lastTick:Number(v16.clock.tick||0),collapsed:false,dominantFaction:null,tags:[]};
      world.name=canonical;world.stability=clamp(world.stability,0,100);world.corruption=clamp(world.corruption,0,100);world.threat=clamp(world.threat,0,100);world.visits=Math.max(0,Number(world.visits||0));world.tags=Array.isArray(world.tags)?world.tags:[];
      if(options.visited){world.visits++;world.lastVisitedTick=Number(v16.clock.tick||0);}
      if(options.tag&&!world.tags.includes(options.tag))world.tags.push(String(options.tag));
      v16.universes[id]=world;return world;
    }

    discoverFromState(state,roster=[]){
      const map=rosterMap(roster),names=new Set([state.customCharacter?.homeworld,state.customCharacter?.v14?.homeworld]);
      for(const id of [state.baseId,...(state.party||[]),...(state.kits||[]).map(kit=>kit.id)]){const character=map.get(String(id||''));if(character?.universe)names.add(character.universe);}
      for(const name of names)if(name)this.touchUniverse(state,name);
      return Object.values(state.v16.universes);
    }

    syncArtifacts(state){
      const owned=new Set((state.artifacts||[]).map(String)),owners=state.v16.artifactOwners;
      for(const id of owned){const record=owners[id];if(!record||record.ownerType!=='player')owners[id]={artifactId:id,ownerType:'player',ownerId:'player',sinceTick:Number(state.v16.clock.tick||0)};}
      for(const record of Object.values(owners))if(record?.ownerType==='player'&&!owned.has(record.artifactId)){record.ownerType='lost';record.ownerId='multiverse';record.sinceTick=Number(state.v16.clock.tick||0);}
      return owners;
    }

    travel(state,universe){
      this.ensure(state);const world=this.touchUniverse(state,universe,{visited:true});state.v16.currentUniverse=world.name;state.v16.stats.travels++;
      this.recordMemory(state,{type:'travel',title:`Traveled to ${world.name}`,detail:`Stability ${world.stability}% • Corruption ${world.corruption}%`,universe:world.name});
      this.pushEvent(state,{type:'travel',severity:'info',title:`Route opened to ${world.name}`,detail:'The next hostile selection now favors this reality.',universe:world.name});return world;
    }

    factionReputation(state,factionId,delta,reason='Decision'){
      this.ensure(state);const faction=state.v16.factions[String(factionId||'')];if(!faction)return null;const change=Math.round(Number(delta)||0);faction.reputation=clamp(faction.reputation+change,-100,100);
      this.recordMemory(state,{type:'faction',title:`${faction.name} ${change>=0?'noticed':'resented'} your choice`,detail:`${reason} • Reputation ${signed(change)} → ${faction.reputation}`,factionId:faction.id});return faction;
    }

    applyIntentReputation(state,intent=''){
      const key=String(intent||'').toLowerCase(),map={protect:['mercy','balance'],discover:['knowledge','balance'],connect:['mercy','freedom'],defy:['freedom','ambition']},favored=new Set(map[key]||[]);
      if(!favored.size)return;
      for(const faction of Object.values(state.v16.factions)){if(favored.has(faction.ethos))faction.reputation=clamp(faction.reputation+1,-100,100);else if((key==='defy'&&faction.ethos==='order')||(key==='protect'&&faction.ethos==='ambition'))faction.reputation=clamp(faction.reputation-1,-100,100);}
    }

    recordMemory(state,memory={}){
      this.ensure(state);const tick=Number(state.v16.clock.tick||0),entry={id:String(memory.id||`m-${tick}-${hash32(JSON.stringify(memory)).toString(36)}`),tick,at:Number(memory.at||Date.now()),type:String(memory.type||'world'),title:String(memory.title||'The multiverse remembered').slice(0,120),detail:String(memory.detail||'').slice(0,420),universe:memory.universe?String(memory.universe):'',characterId:memory.characterId?String(memory.characterId):'',factionId:memory.factionId?String(memory.factionId):'',weight:Number(memory.weight||MEMORY_WEIGHTS[memory.type]||2)};
      const duplicate=state.v16.memory.find(item=>item.id===entry.id);if(duplicate)return duplicate;state.v16.memory.push(entry);state.v16.memory=state.v16.memory.sort((a,b)=>b.weight-a.weight||b.tick-a.tick).slice(0,MAX_MEMORIES);return entry;
    }

    registerNemesis(state,character={},cause='Survived an encounter'){
      this.ensure(state);const id=String(character.id||normalize(character.name));if(!id)return null;const existing=state.v16.nemeses[id]||{};
      const nemesis=state.v16.nemeses[id]={id,name:String(character.name||existing.name||id),universe:canonicalUniverse(character.universe||existing.universe||state.v16.currentUniverse),level:Math.max(1,Number(existing.level||1)),power:Math.max(1,Number(existing.power||1)),encounters:Number(existing.encounters||0)+1,grudges:Number(existing.grudges||0)+1,defeats:Number(existing.defeats||0),victories:Number(existing.victories||0),stolenArtifacts:Array.isArray(existing.stolenArtifacts)?existing.stolenArtifacts:[],status:existing.status||'active',lastSeenTick:Number(state.v16.clock.tick||0),cause:String(cause).slice(0,180)};
      this.recordMemory(state,{type:'nemesis',title:`${nemesis.name} became a recurring nemesis`,detail:cause,characterId:id,universe:nemesis.universe});this.pushEvent(state,{type:'nemesis',severity:'danger',title:`Nemesis marked: ${nemesis.name}`,detail:'They can now grow, hunt across worlds, and return stronger.',universe:nemesis.universe,characterId:id});return nemesis;
    }

    noteNemesisResult(state,characterId,playerWon){
      this.ensure(state);const nemesis=state.v16.nemeses[String(characterId||'')];if(!nemesis)return null;nemesis.encounters++;nemesis.lastSeenTick=Number(state.v16.clock.tick||0);
      if(playerWon){nemesis.defeats++;nemesis.status=nemesis.defeats>=3?'broken':'wounded';nemesis.power=Math.max(1,nemesis.power-.06);}
      else{nemesis.victories++;nemesis.grudges++;nemesis.status='active';nemesis.power+=.12;nemesis.level++;}
      this.recordMemory(state,{type:'nemesis',title:`${playerWon?'Defeated':'Lost to'} nemesis ${nemesis.name}`,detail:`Encounter ${nemesis.encounters} • Nemesis Level ${nemesis.level}`,characterId:nemesis.id,universe:nemesis.universe});return nemesis;
    }

    pushEvent(state,event={}){
      const tick=Number(state.v16.clock.tick||0),entry={id:String(event.id||`w-${tick}-${hash32(JSON.stringify(event)).toString(36)}`),tick,at:Number(event.at||Date.now()),type:String(event.type||'world'),severity:String(event.severity||'info'),title:String(event.title||'World state changed').slice(0,140),detail:String(event.detail||'').slice(0,420),universe:event.universe?String(event.universe):'',factionIds:Array.isArray(event.factionIds)?event.factionIds.map(String):[],characterId:event.characterId?String(event.characterId):''};
      state.v16.worldEvents.push(entry);state.v16.worldEvents=state.v16.worldEvents.slice(-MAX_WORLD_EVENTS);return entry;
    }

    relation(a,b,delta){if(!a||!b||a.id===b.id)return;const next=clamp(Number(a.relations[b.id]||0)+Number(delta||0),-100,100);a.relations[b.id]=next;b.relations[a.id]=next;}

    advanceFactions(state,rng,world){
      const factions=Object.values(state.v16.factions).filter(f=>f.status==='active');if(factions.length<2)return null;const a=choose(factions,rng),b=choose(factions.filter(item=>item.id!==a.id),rng),relation=Number(a.relations[b.id]||0),roll=rng();
      if(roll<.46){const swing=Math.max(2,Math.round(3+rng()*7)),winner=(a.power+a.resources*.35+rng()*20)>=(b.power+b.resources*.35+rng()*20)?a:b,loser=winner.id===a.id?b:a;winner.power=clamp(winner.power+Math.ceil(swing/2),1,100);loser.power=clamp(loser.power-swing,1,100);winner.resources=clamp(winner.resources-2,0,100);loser.resources=clamp(loser.resources-4,0,100);this.relation(a,b,-12-Math.round(rng()*12));world.threat=clamp(world.threat+4,0,100);world.stability=clamp(world.stability-3,0,100);state.v16.stats.wars++;return this.pushEvent(state,{type:'war',severity:'danger',title:`${winner.name} pushed back ${loser.name}`,detail:`A faction war changed control pressure in ${world.name}.`,universe:world.name,factionIds:[a.id,b.id]});}
      if(roll<.72&&relation<55){this.relation(a,b,10+Math.round(rng()*12));a.resources=clamp(a.resources+3,0,100);b.resources=clamp(b.resources+3,0,100);world.stability=clamp(world.stability+2,0,100);state.v16.stats.alliances++;return this.pushEvent(state,{type:'alliance',severity:'good',title:`${a.name} and ${b.name} signed a temporary accord`,detail:`Trade routes and shared defense improved stability in ${world.name}.`,universe:world.name,factionIds:[a.id,b.id]});}
      a.resources=clamp(a.resources+Math.round(rng()*4)-1,0,100);b.cohesion=clamp(b.cohesion+Math.round(rng()*4)-1,0,100);return null;
    }

    advanceNemeses(state,rng){
      const active=Object.values(state.v16.nemeses).filter(n=>n.status!=='broken');if(!active.length)return null;for(const nemesis of active){if(Number(state.v16.clock.tick||0)%3===0){nemesis.level=Math.min(99,nemesis.level+1);nemesis.power=Math.min(3,nemesis.power+.04);}}
      const candidates=active.filter(n=>Number(state.v16.clock.tick||0)-Number(n.lastSeenTick||0)>=4);if(!candidates.length||rng()>.32)return null;const nemesis=choose(candidates,rng);nemesis.lastSeenTick=Number(state.v16.clock.tick||0);nemesis.status='hunting';state.v16.stats.nemesisHunts++;return this.pushEvent(state,{type:'nemesis-hunt',severity:'danger',title:`${nemesis.name} is hunting your route`,detail:`Nemesis Level ${nemesis.level} • Their next matchup receives a scaling pressure bonus.`,universe:nemesis.universe,characterId:nemesis.id});
    }

    advance(state,context={}){
      this.ensure(state,context.roster||[]);const v16=state.v16;v16.clock.tick++;const tick=v16.clock.tick,rng=rngFrom(`${state.seed||0}|v16|tick|${tick}`);
      const world=this.touchUniverse(state,context.universe||v16.currentUniverse,{visited:Boolean(context.playerPresent)});v16.currentUniverse=world.name;this.discoverFromState(state,context.roster||[]);this.syncArtifacts(state);this.applyIntentReputation(state,context.intent||state.v14?.intent?.stance||'');
      for(const universe of Object.values(v16.universes)){
        if(universe.collapsed)continue;const local=rngFrom(`${state.seed||0}|v16|world|${universe.id}|${tick}`),chaos=String(state.balanceMode||state.balance||'').includes('chaos')?1:0;
        universe.corruption=clamp(universe.corruption+(local()<.48+chaos*.12?1:0)-(local()<.10?1:0),0,100);universe.threat=clamp(universe.threat+(local()<.42?1:0)-(local()<.22?1:0),0,100);universe.stability=clamp(universe.stability+(local()<.26?1:0)-(local()<.38?1:0)-(universe.corruption>65?1:0),0,100);universe.lastTick=tick;
        if(universe.stability<=7&&!universe.collapsed&&local()<.22){universe.collapsed=true;universe.stability=0;v16.stats.collapses++;this.pushEvent(state,{type:'collapse',severity:'critical',title:`${universe.name} collapsed`,detail:'Its route is now a dead universe: dangerous, unstable, and rich in rare salvage.',universe:universe.name});this.recordMemory(state,{type:'world',title:`${universe.name} became a dead universe`,detail:'The collapse permanently changed this run.',universe:universe.name,weight:6});}
      }
      const factionEvent=this.advanceFactions(state,rng,world);let event=factionEvent;
      if(!event){const roll=rng();if(roll<.22){world.corruption=clamp(world.corruption+4,0,100);world.threat=clamp(world.threat+5,0,100);world.stability=clamp(world.stability-3,0,100);v16.stats.incursions++;event=this.pushEvent(state,{type:'incursion',severity:'danger',title:`Cross-reality incursion in ${world.name}`,detail:'Hostile traffic increased corruption and threat.',universe:world.name});}
        else if(roll<.42){world.stability=clamp(world.stability-2,0,100);world.corruption=clamp(world.corruption+2,0,100);event=this.pushEvent(state,{type:'fracture',severity:'warning',title:`Dimensional fracture opened in ${world.name}`,detail:'A temporary route now leaks rules and inhabitants between realities.',universe:world.name});}
        else if(roll<.60){world.stability=clamp(world.stability+3,0,100);world.threat=clamp(world.threat-2,0,100);v16.stats.recoveries++;event=this.pushEvent(state,{type:'recovery',severity:'good',title:`${world.name} stabilized without you`,detail:'Local defenders repaired part of the damage while the party was elsewhere.',universe:world.name});}
        else if(roll<.72){const lost=Object.values(v16.artifactOwners).filter(record=>record.ownerType==='lost');if(lost.length){const record=choose(lost,rng),faction=choose(Object.values(v16.factions),rng);record.ownerType='faction';record.ownerId=faction.id;record.sinceTick=tick;event=this.pushEvent(state,{type:'artifact',severity:'warning',title:`${faction.name} recovered a lost artifact`,detail:`Artifact ${record.artifactId} changed hands off-screen.`,universe:faction.homeUniverse,factionIds:[faction.id]});}}
        else if(roll>.92){event=this.pushEvent(state,{type:'emergence',severity:'mystery',title:`A new power bloc emerged in ${world.name}`,detail:'The Living Multiverse created a new political pressure point that may matter later.',universe:world.name});}}
      const nemesisEvent=this.advanceNemeses(state,rng);if(nemesisEvent)event=nemesisEvent;
      if(context.type||context.label)this.recordMemory(state,{type:context.type||'world',title:String(context.label||'Encounter resolved'),detail:String(context.detail||`Resolved during world tick ${tick}.`),universe:world.name,characterId:context.characterId||''});
      return{tick,event,world,summary:this.summary(state)};
    }

    catchUp(state,{now=Date.now(),roster=[]}={}){
      this.ensure(state,roster);const clock=state.v16.clock,settings=state.v16.settings;if(!settings.offlineSimulation){clock.lastRealAt=now;return{ticks:0,events:[]};}
      const elapsed=Math.max(0,Number(now)-Number(clock.lastRealAt||now)),interval=Math.max(15*60*1000,Number(settings.offlineTickMs||OFFLINE_TICK_MS)),ticks=Math.min(Math.max(0,Math.floor(elapsed/interval)),Math.max(0,Number(settings.maxOfflineTicks||MAX_OFFLINE_TICKS)));if(!ticks)return{ticks:0,events:[]};
      const before=state.v16.worldEvents.length;for(let i=0;i<ticks;i++)this.advance(state,{roster,offline:true,playerPresent:false,label:'Off-screen multiverse evolution',type:'world'});const liveClock=state.v16.clock;liveClock.offlineTicks=Math.max(0,Number(liveClock.offlineTicks||0))+ticks;liveClock.lastRealAt=Number(now);const events=state.v16.worldEvents.slice(before);this.recordMemory(state,{id:`offline-${liveClock.tick}`,type:'world',title:`The multiverse moved while you were away`,detail:`${ticks} off-screen world tick${ticks===1?'':'s'} resolved.`,weight:4});return{ticks,events};
    }

    markSaved(state,now=Date.now()){this.ensure(state);state.v16.clock.lastRealAt=Number(now);return state.v16.clock;}

    pressure(state,{enemyId=''}={}){
      this.ensure(state);const world=this.touchUniverse(state,state.v16.currentUniverse),nemesis=enemyId?state.v16.nemeses[String(enemyId)]:null,avgRep=Object.values(state.v16.factions).reduce((sum,f)=>sum+Number(f.reputation||0),0)/Math.max(1,Object.keys(state.v16.factions).length);
      let oddsDelta=(world.stability-50)*.00045-world.corruption*.00035+avgRep*.00012;if(nemesis&&nemesis.status!=='broken')oddsDelta-=Math.min(.09,Math.max(0,(nemesis.power-1)*.08+nemesis.level*.002));
      return{oddsDelta:clamp(oddsDelta,-.12,.08),hazardPressure:clamp((world.corruption*.6+world.threat*.4)/100,0,1),world:clone(world),nemesis:nemesis?clone(nemesis):null};
    }

    summary(state){
      this.ensure(state);const worlds=Object.values(state.v16.universes),factions=Object.values(state.v16.factions),nemeses=Object.values(state.v16.nemeses).filter(n=>n.status!=='broken'),average=key=>worlds.length?Math.round(worlds.reduce((sum,w)=>sum+Number(w[key]||0),0)/worlds.length):0,relations=[];
      for(const faction of factions)for(const [otherId,value] of Object.entries(faction.relations||{}))if(faction.id<otherId)relations.push(Number(value||0));
      return{tick:Number(state.v16.clock.tick||0),currentUniverse:state.v16.currentUniverse,worldCount:worlds.length,collapsedWorlds:worlds.filter(w=>w.collapsed).length,averageStability:average('stability'),averageCorruption:average('corruption'),activeWars:relations.filter(v=>v<=-45).length,alliances:relations.filter(v=>v>=45).length,factionCount:factions.length,activeNemeses:nemeses.length,highestReputation:factions.slice().sort((a,b)=>b.reputation-a.reputation)[0]||null,lowestReputation:factions.slice().sort((a,b)=>a.reputation-b.reputation)[0]||null,recentEvents:state.v16.worldEvents.slice(-8).reverse().map(clone),recentMemories:state.v16.memory.slice().sort((a,b)=>b.tick-a.tick||b.weight-a.weight).slice(0,8).map(clone)};
    }
  }

  function migrateV16(state={},roster=[]){return new LivingMultiverseEngine().ensure(state,roster);}
  const api={V16_SCHEMA_VERSION,OFFLINE_TICK_MS,MAX_OFFLINE_TICKS,FACTION_ARCHETYPES,LivingMultiverseEngine,migrateV16};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
