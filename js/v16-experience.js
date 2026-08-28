'use strict';

// V16 turns the static run backdrop into a deterministic Living Multiverse.
// Worlds, factions, nemeses, relic ownership, and remembered consequences keep
// changing while every prior V15 system remains the authoritative game layer.
(()=>{
  const {LivingMultiverseEngine,migrateV16,canonicalUniverse}=MultiverseDomain;
  const P=MultiverseWheel.prototype,living=new LivingMultiverseEngine();
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const pct=value=>`${Math.max(0,Math.min(100,Math.round(Number(value)||0)))}%`;
  const stateLabel=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
  const universeOfPending=pending=>{
    const id=pending?.profileId||pending?.ref,character=id?CHAR.get(String(id)):null;if(character?.universe)return character.universe;
    const record=pending?.type==='artifact'?ART.get(String(pending.ref||'')):pending?.type==='transform'?FORM.get(String(pending.ref||'')):pending?.type==='training'?MENTOR.get(String(pending.ref||'')):pending?.type==='hazard'?HAZARD.get(String(pending.ref||'')):pending?.type==='recovery'?RECOVERY.get(String(pending.ref||'')):null;
    return record?.universe||pending?.universe||'';
  };
  const roster=()=>Array.from(CHAR.values());

  P.ensureV16=function(state=this.state){return state?migrateV16(state,roster()):state;};
  const newStateV16=P.newState;
  P.newState=function(seed){return this.ensureV16(newStateV16.call(this,seed));};
  const loadStateV16=P.loadState;
  P.loadState=function(){
    const state=loadStateV16.call(this);if(!state)return state;this.ensureV16(state);
    this._v16OfflineReport=living.catchUp(state,{roster:roster()});return state;
  };
  const saveV16=P.save;
  P.save=function(){if(this.state){this.ensureV16();living.markSaved(this.state);}return saveV16.call(this);};

  const startTimelineV16=P.startTimelineV13;
  P.startTimelineV13=function(config={}){
    const result=startTimelineV16.call(this,config);this.ensureV16();
    const home=this.state.customCharacter?.homeworld||this.state.customCharacter?.v14?.homeworld;
    if(home)this.state.v16.currentUniverse=String(home);living.touchUniverse(this.state,home,{visited:true});
    this.save();return result;
  };
  const saveCreatorV16=P.saveCharacterCreator;
  P.saveCharacterCreator=function(){
    const result=saveCreatorV16.call(this);if(!this.state?.customCharacter)return result;this.ensureV16();
    const home=this.state.customCharacter.homeworld||this.state.customCharacter.v14?.homeworld;
    if(home&&this.state.v16.currentUniverse==='Earth-Prime'){this.state.v16.currentUniverse=String(home);living.touchUniverse(this.state,home,{visited:true});}
    this.save();return result;
  };

  P.worldSummaryV16=function(){this.ensureV16();return living.summary(this.state);};
  P.worldPressureV16=function(enemyId=''){this.ensureV16();return living.pressure(this.state,{enemyId});};

  const pickOpponentV16=P.pickOpponent;
  P.pickOpponent=function(){
    if(!this.state?.v16)return pickOpponentV16.call(this);const current=canonicalUniverse(this.state.v16.currentUniverse),used=new Set([this.state.baseId,...this.state.party]);
    const local=DATA.characters.filter(character=>!used.has(character.id)&&canonicalUniverse(character.universe)===current);
    if(local.length<3)return pickOpponentV16.call(this);
    const strength=this.overall(this.effectiveStats()),act=Math.ceil((this.state.spin+1)/10),target=strength-(act===1?4:act===2?-2:-8),pool=this.avoidRecent(local,character=>`c:${character.id}`);
    pool.sort((a,b)=>Math.abs(this.overall(a.stats)-target)-Math.abs(this.overall(b.stats)-target));return this.pick(pool.slice(0,Math.min(18,pool.length)));
  };

  const generateWheelV16=P.generateWheel;
  P.generateWheel=function(){
    if(this.state?.v16){const pressure=this.worldPressureV16();if(pressure.hazardPressure>=.72&&this.state.hazardCooldown<=0)this.state.forceHazard=true;}
    return generateWheelV16.call(this);
  };

  const battleOddsV16=P.battleOdds;
  P.battleOdds=function(p,strategy){
    const base=battleOddsV16.call(this,p,strategy);if(!this.state?.v16)return base;const enemyId=p?.profileId||p?.ref,pressure=this.worldPressureV16(enemyId);
    return clamp(base+pressure.oddsDelta,.04,.97);
  };

  P.shouldCreateNemesisV16=function(enemy,pending,playerWon){
    if(playerWon||!enemy)return false;if(pending?.type==='boss'||this.state.challenge==='nemesis')return true;
    const seed=MultiverseDomain.hash32?.(`${this.state.seed}|${this.state.spin}|${enemy.id}|nemesis`)||0;return seed%100<28;
  };
  P.trackNemesisBattleV16=function(pending,beforeWins,beforeLosses){
    if(!pending||!['battle','boss'].includes(pending.type))return;const id=String(pending.profileId||pending.ref||''),enemy=CHAR.get(id);if(!enemy)return;
    const won=Number(this.state.record?.wins||0)>beforeWins,lost=Number(this.state.record?.losses||0)>beforeLosses;if(!won&&!lost)return;
    const existing=this.state.v16.nemeses[id];if(existing)living.noteNemesisResult(this.state,id,won);
    else if(this.shouldCreateNemesisV16(enemy,pending,won))living.registerNemesis(this.state,enemy,`${enemy.name} defeated the party on Spin ${this.state.spin}.`);
  };
  const resolveBattleV16=P.resolveBattle;
  P.resolveBattle=function(strategy){
    const pending=copy(this.state.pending),wins=Number(this.state.record?.wins||0),losses=Number(this.state.record?.losses||0),result=resolveBattleV16.call(this,strategy);
    this.ensureV16();this.trackNemesisBattleV16(pending,wins,losses);living.syncArtifacts(this.state);this.save();return result;
  };
  if(typeof P.finishCombatVictory==='function'){
    const finishCombatVictoryV16=P.finishCombatVictory;
    P.finishCombatVictory=function(p,enemy){
      const result=finishCombatVictoryV16.call(this,p,enemy);this.ensureV16();const id=String(enemy?.id||p?.profileId||p?.ref||'');
      if(id&&this.state.v16.nemeses[id])living.noteNemesisResult(this.state,id,true);this.save();return result;
    };
  }

  const acquireArtifactV16=P.acquireArtifact;
  P.acquireArtifact=function(id,quiet=false){const result=acquireArtifactV16.call(this,id,quiet);if(this.state?.v16)living.syncArtifacts(this.state);return result;};

  const completeEventV16=P.completeEvent;
  P.completeEvent=function(){
    const pending=copy(this.state.pending),beforeId=pending?.id,result=completeEventV16.call(this),finished=pending&&pending.stage==='result'&&(!this.state.pending||this.state.pending.id!==beforeId);
    if(finished){
      this.ensureV16();const sourceUniverse=universeOfPending(pending),universe=this.state.v16.currentUniverse,characterId=['battle','boss','recruit','power'].includes(pending.type)?String(pending.profileId||pending.ref||''):'';
      const step=living.advance(this.state,{roster:roster(),universe,intent:this.state.v14?.intent?.stance,type:pending.type,label:pending.label||'Encounter resolved',detail:sourceUniverse&&canonicalUniverse(sourceUniverse)!==canonicalUniverse(universe)?`Encounter source: ${sourceUniverse}.`:undefined,characterId,playerPresent:false});
      if(step.event)this.log(`WORLD STATE: ${step.event.title}.`,'info');this.save();this.renderAll();
    }
    return result;
  };

  P.travelWorldV16=function(name){
    const world=living.travel(this.state,name);this.save();this.renderWorldV16();this.renderAll();this.toast(`Route focused on ${world.name}. Future opponents now favor that reality.`);return world;
  };

  P.injectV16UI=function(){
    const playbar=document.getElementById('v13-playbar');if(playbar&&!playbar.querySelector('[data-v16-world-open]'))playbar.querySelector('[data-v13-panel="more"]')?.insertAdjacentHTML('beforebegin','<button type="button" data-v16-world-open>WORLD</button>');
    if(!document.getElementById('v16-world-modal'))document.body.insertAdjacentHTML('beforeend',`<div class="modal v16-world-modal" id="v16-world-modal" role="dialog" aria-modal="true" aria-labelledby="v16-world-heading"><div class="modal-card v16-world-card"><header><div><span>LIVING MULTIVERSE</span><h2 id="v16-world-heading">World State</h2><p>Worlds, factions, nemeses, and relic ownership evolve between your decisions.</p></div><button type="button" class="icon-btn" data-v16-world-close>CLOSE</button></header><nav aria-label="World state sections"><button type="button" data-v16-world-tab="overview" class="active">OVERVIEW</button><button type="button" data-v16-world-tab="worlds">WORLDS</button><button type="button" data-v16-world-tab="factions">FACTIONS</button><button type="button" data-v16-world-tab="nemeses">NEMESES</button><button type="button" data-v16-world-tab="memory">MEMORY</button></nav><main data-v16-world-body></main></div></div>`);
    const titleVersion=document.querySelector('.v13-title-head span'),titleCopy=document.querySelector('.v13-title-head p');if(titleVersion)titleVersion.textContent='V16 • LIVING MULTIVERSE';if(titleCopy)titleCopy.textContent='Build a hero. Bend fate. Enter a multiverse that keeps moving without you.';
    const help=document.getElementById('v16-help');if(!help)document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v16-help"><h3>Living Multiverse</h3><p>Every resolved encounter advances a seeded world simulation. Universe stability, corruption, faction relations, relic ownership, and nemeses can change off-screen. Open World from the play bar to inspect routes and focus future encounters on a discovered universe.</p></section>');
    document.documentElement.dataset.v16='living-multiverse';
  };

  P.worldMeterV16=function(label,value,kind=''){return `<div class="v16-meter ${kind}"><span>${esc(label)}</span><i><b style="width:${pct(value)}"></b></i><strong>${Math.round(Number(value)||0)}</strong></div>`;};
  P.worldMapV16=function(){
    const worlds=Object.values(this.state.v16.universes),current=canonicalUniverse(this.state.v16.currentUniverse),count=Math.max(1,worlds.length),nodes=worlds.map((world,index)=>{const angle=(Math.PI*2*index/count)-Math.PI/2,radius=world.name===current?0:118+(index%3)*22,x=180+Math.cos(angle)*radius,y=150+Math.sin(angle)*radius,cls=`${world.collapsed?' collapsed':''}${world.name===current?' current':''}`;return `<g class="${cls.trim()}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="${world.name===current?18:10}"/><text y="${world.name===current?31:24}" text-anchor="middle">${esc(world.name.slice(0,24))}</text></g>`;}).join('');
    return `<svg class="v16-map" viewBox="0 0 360 300" role="img" aria-label="Discovered multiverse map"><defs><radialGradient id="v16-map-glow"><stop stop-color="#67e8f9" stop-opacity=".4"/><stop offset="1" stop-color="#67e8f9" stop-opacity="0"/></radialGradient></defs><circle cx="180" cy="150" r="142" class="orbit"/><circle cx="180" cy="150" r="92" class="orbit secondary"/><circle cx="180" cy="150" r="70" fill="url(#v16-map-glow)"/>${nodes}</svg>`;
  };

  P.renderWorldOverviewV16=function(){
    const summary=this.worldSummaryV16(),world=this.worldPressureV16().world,events=summary.recentEvents.slice(0,5);
    return `<section class="v16-overview"><div class="v16-map-wrap">${this.worldMapV16()}<article class="v16-current-world"><span>CURRENT REALITY</span><h3>${esc(world.name)}</h3>${this.worldMeterV16('Stability',world.stability,'good')}${this.worldMeterV16('Corruption',world.corruption,'bad')}${this.worldMeterV16('Threat',world.threat,'warn')}</article></div><div class="v16-world-metrics"><article><span>WORLD TICK</span><b>${summary.tick}</b><small>${summary.worldCount} discovered</small></article><article><span>ACTIVE WARS</span><b>${summary.activeWars}</b><small>${summary.alliances} alliances</small></article><article><span>NEMESES</span><b>${summary.activeNemeses}</b><small>${summary.collapsedWorlds} dead worlds</small></article><article><span>AVG STABILITY</span><b>${summary.averageStability}%</b><small>${summary.averageCorruption}% corruption</small></article></div><section class="v16-feed"><header><span>RECENT OFF-SCREEN ACTIVITY</span><small>Seeded and saved with this timeline</small></header>${events.length?events.map(event=>`<article class="${esc(event.severity)}"><div><b>${esc(event.title)}</b><small>${esc(event.universe||`Tick ${event.tick}`)}</small></div><p>${esc(event.detail)}</p></article>`).join(''):'<p class="v16-empty">The Living Multiverse has not advanced yet. Resolve an encounter to start the simulation.</p>'}</section></section>`;
  };

  P.renderWorldListV16=function(){
    const worlds=Object.values(this.state.v16.universes).sort((a,b)=>Number(b.visits||0)-Number(a.visits||0)||a.name.localeCompare(b.name)),current=canonicalUniverse(this.state.v16.currentUniverse);
    return `<section class="v16-list-head"><div><span>DISCOVERED REALITIES</span><h3>${worlds.length} routes in memory</h3></div><p>Travel changes encounter focus; it does not erase prior world state.</p></section><div class="v16-world-grid">${worlds.map(world=>`<article class="${world.collapsed?'collapsed':''} ${world.name===current?'current':''}"><header><div><span>${world.collapsed?'DEAD UNIVERSE':world.name===current?'CURRENT ROUTE':'DISCOVERED'}</span><h3>${esc(world.name)}</h3></div><b>${world.visits} visit${world.visits===1?'':'s'}</b></header>${this.worldMeterV16('Stability',world.stability,'good')}${this.worldMeterV16('Corruption',world.corruption,'bad')}${this.worldMeterV16('Threat',world.threat,'warn')}<footer><small>Last changed: Tick ${world.lastTick||0}</small><button type="button" data-v16-travel="${esc(world.name)}" ${world.name===current?'disabled':''}>${world.name===current?'FOCUSED':'TRAVEL'}</button></footer></article>`).join('')}</div>`;
  };

  P.renderFactionListV16=function(){
    const factions=Object.values(this.state.v16.factions).sort((a,b)=>b.reputation-a.reputation);
    return `<section class="v16-list-head"><div><span>FACTION MEMORY</span><h3>Every decision leaves a political trail</h3></div><p>Protect, Discover, Connect, and Defy slowly reshape faction reputation and relations.</p></section><div class="v16-faction-grid">${factions.map(faction=>{const relations=Object.entries(faction.relations||{}).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,2).map(([id,value])=>`${value>=45?'Ally':value<=-45?'War':'Tense'}: ${this.state.v16.factions[id]?.name||id}`).join(' • ');return `<article><header><div><span>${esc(stateLabel(faction.archetype))} • ${esc(faction.ethos)}</span><h3>${esc(faction.name)}</h3></div><b class="${faction.reputation>=0?'positive':'negative'}">${faction.reputation>=0?'+':''}${faction.reputation} REP</b></header><p>${esc(faction.goal)}</p>${this.worldMeterV16('Power',faction.power)}${this.worldMeterV16('Resources',faction.resources)}<footer><small>${esc(relations||faction.stance)}</small></footer></article>`;}).join('')}</div>`;
  };

  P.renderNemesisListV16=function(){
    const nemeses=Object.values(this.state.v16.nemeses).sort((a,b)=>b.level-a.level||b.grudges-a.grudges);
    return `<section class="v16-list-head"><div><span>NEMESIS NETWORK</span><h3>${nemeses.filter(item=>item.status!=='broken').length} active recurring threats</h3></div><p>Enemies can remember losses, level up off-screen, and hunt your route across realities.</p></section><div class="v16-nemesis-grid">${nemeses.length?nemeses.map(nemesis=>{const character=CHAR.get(nemesis.id),portrait=character?this.characterPortrait(character):'';return `<article class="${nemesis.status==='broken'?'broken':''}">${portrait?`<img src="${esc(portrait)}" alt="${esc(nemesis.name)}">`:''}<div><span>${esc(stateLabel(nemesis.status))} • ${esc(nemesis.universe)}</span><h3>${esc(nemesis.name)}</h3><b>LEVEL ${nemesis.level} • ${Math.round(nemesis.power*100)}% PRESSURE</b><p>${esc(nemesis.cause)}</p><small>${nemesis.victories} wins over you • ${nemesis.defeats} defeats • ${nemesis.grudges} grudges</small></div></article>`;}).join(''):'<p class="v16-empty">No enemy has become a recurring nemesis yet.</p>'}</div>`;
  };

  P.renderMemoryV16=function(){
    const memories=this.state.v16.memory.slice().sort((a,b)=>b.tick-a.tick||b.weight-a.weight).slice(0,80);
    return `<section class="v16-list-head"><div><span>LONG MEMORY</span><h3>The run remembers what matters</h3></div><p>Major choices, travel, faction reactions, collapsed worlds, and nemesis history persist with the save.</p></section><div class="v16-memory-list">${memories.length?memories.map(memory=>`<article><b>WORLD TICK ${memory.tick}</b><div><h3>${esc(memory.title)}</h3><p>${esc(memory.detail)}</p><small>${esc([memory.universe,memory.characterId&&CHAR.get(memory.characterId)?.name,memory.factionId&&this.state.v16.factions[memory.factionId]?.name].filter(Boolean).join(' • '))}</small></div></article>`).join(''):'<p class="v16-empty">Nothing important has been committed to long memory yet.</p>'}</div>`;
  };

  P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){
    const root=document.querySelector('[data-v16-world-body]');if(!root)return;this.ensureV16();this._v16WorldTab=tab;document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab===tab));
    root.innerHTML=tab==='worlds'?this.renderWorldListV16():tab==='factions'?this.renderFactionListV16():tab==='nemeses'?this.renderNemesisListV16():tab==='memory'?this.renderMemoryV16():this.renderWorldOverviewV16();
  };
  P.openWorldV16=function(tab='overview'){this.injectV16UI();const modal=document.getElementById('v16-world-modal');modal.classList.add('open');this.renderWorldV16(tab);setTimeout(()=>modal.querySelector('[data-v16-world-close]')?.focus(),0);};

  const renderAllV16=P.renderAll;
  P.renderAll=function(){this.ensureV16();const result=renderAllV16.call(this);this.injectV16UI();const summary=this.worldSummaryV16(),worldButton=document.querySelector('[data-v16-world-open]');if(worldButton){worldButton.textContent=`WORLD • ${summary.currentUniverse}`;worldButton.title=`${summary.activeWars} wars • ${summary.activeNemeses} nemeses • ${summary.averageStability}% average stability`;}
    if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16();if(this._v16OfflineReport?.ticks&&!this._v16OfflineAnnounced){this._v16OfflineAnnounced=true;setTimeout(()=>this.toast(`The multiverse advanced ${this._v16OfflineReport.ticks} world ticks while you were away.`),0);}return result;};

  const bindV16=P.bind;
  P.bind=function(){bindV16.call(this);this.injectV16UI();if(this._v16Bound)return;this._v16Bound=true;
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-v16-world-open]'))return this.openWorldV16();
      if(event.target.closest('[data-v16-world-close]'))return document.getElementById('v16-world-modal')?.classList.remove('open');
      const tab=event.target.closest('[data-v16-world-tab]');if(tab)return this.renderWorldV16(tab.dataset.v16WorldTab);
      const travel=event.target.closest('[data-v16-travel]');if(travel)return this.travelWorldV16(travel.dataset.v16Travel);
    });
    document.getElementById('v16-world-modal')?.addEventListener('click',event=>{if(event.target.id==='v16-world-modal')event.currentTarget.classList.remove('open');});
    window.addEventListener('keydown',event=>{if(event.key==='Escape')document.getElementById('v16-world-modal')?.classList.remove('open');});
  };
})();
