'use strict';

// V22 gives persistent worlds civilian stakes without replacing the Wheel,
// V18 wallet, V19 relationships, or V21 faction/stronghold strategy.
(()=>{
  const {SettlementEngine,migrateV22,CIVILIAN_ACTIONS_V22}=MultiverseDomain;
  const P=MultiverseWheel.prototype,civilians=new SettlementEngine();
  const artifacts=()=>Array.from(ART.values());
  const roster=()=>Array.from(CHAR.values());
  const pct=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const safe=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const label=v=>String(v||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const money=cost=>Object.entries(cost||{}).map(([k,v])=>`${v} ${label(k)}`).join(' + ');
  const refresh=function(){this.save();this.renderAll();if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16?.('civilians');};

  P.ensureV22=function(state=this.state){if(!state)return state;migrateV22(state,artifacts(),roster());civilians.catchUp(state,6);return state;};
  const newStateV22=P.newState;P.newState=function(seed){return this.ensureV22(newStateV22.call(this,seed));};
  const loadStateV22=P.loadState;P.loadState=function(){const state=loadStateV22.call(this);return state?this.ensureV22(state):state;};
  const saveV22=P.save;P.save=function(){if(this.state)this.ensureV22();return saveV22.call(this);};

  P.civilianSummaryV22=function(){this.ensureV22();return civilians.summary(this.state);};

  // V22 local conditions modify the existing V18 market, never a second economy.
  if(MultiverseDomain.EconomyCraftingEngine&&!MultiverseDomain.EconomyCraftingEngine.prototype._v22CivilianPricing){
    const proto=MultiverseDomain.EconomyCraftingEngine.prototype,basePrice=proto.marketPrice;
    if(typeof basePrice==='function')proto.marketPrice=function(state,...args){const price=basePrice.call(this,state,...args);if(!state?.v22)return price;return Math.max(1,Math.round(price*(1+civilians.marketModifier(state))));};
    proto._v22CivilianPricing=true;
  }

  const recordOutcomeV22=P.recordOutcomeV19;
  if(typeof recordOutcomeV22==='function')P.recordOutcomeV19=function(type,outcome,enemy=null){
    const result=recordOutcomeV22.call(this,type,outcome,enemy);this.ensureV22();const event=civilians.processEvent(this.state,{id:`v22:${this.state.spin}:${type}:${outcome}:${enemy?.id||''}`,type,outcome,enemyId:enemy?.id||''},roster());
    for(const step of event?.requests||[])if(step.completed)this.log(`CIVILIAN REQUEST COMPLETE: ${step.request.label}.`,'rare');this.save();return result;
  };

  P.civilianActionV22=function(settlementId,action){const result=civilians.action(this.state,settlementId,action,roster());if(!result.ok)return this.toast(result.error);this.log(`CIVILIAN RELIEF: ${CIVILIAN_ACTIONS_V22[action]?.label||label(action)} in ${result.settlement.name}.`,'win');refresh.call(this);};
  P.buildSanctuaryV22=function(strongholdId){const result=civilians.buildSanctuary(this.state,strongholdId);if(!result.ok)return this.toast(result.error);this.log(`SANCTUARY OPENED: ${result.sanctuary.name}.`,'rare');refresh.call(this);};
  P.supplySanctuaryV22=function(id){const result=civilians.supplySanctuary(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`SANCTUARY RESUPPLIED: ${result.sanctuary.name}.`,'win');refresh.call(this);};

  P.v22Meter=function(name,value,kind=''){return `<div class="v22-meter ${kind}"><span>${safe(name)}</span><i><b style="width:${pct(value)}%"></b></i><strong>${Math.round(Number(value)||0)}</strong></div>`;};
  P.renderCiviliansV22=function(){
    this.ensureV22();const summary=civilians.summary(this.state),current=summary.current,holds=Object.values(this.state.v21?.strongholds||{}).filter(h=>h.playerAligned&&!['occupied','destroyed'].includes(h.status)),sanctuaryByHold=new Map(summary.sanctuaries.map(x=>[x.strongholdId,x]));
    if(!current)return `<section class="v22-empty"><h3>No civilian settlements discovered</h3><p>Discover a V21 territory to establish a persistent civilian world state.</p></section>`;
    const request=civilians.activeRequest(this.state,current.id),need=civilians.need(current),price=summary.marketModifier;
    const actions=Object.entries(CIVILIAN_ACTIONS_V22).map(([id,d])=>`<button type="button" data-v22-action="${safe(current.id)}|${id}" ${d.requiresDisplaced&&!current.displaced?'disabled':''}><b>${safe(d.label)}</b><small>${safe(money(d.cost))}</small></button>`).join('');
    const grid=summary.settlements.map(s=>{const n=civilians.need(s),r=civilians.activeRequest(this.state,s.id);return `<article class="${safe(s.status)}"><header><div><span>${safe(label(s.status))} • ${safe(s.universe)}</span><h3>${safe(s.name)}</h3></div><b>${Number(s.population).toLocaleString()}</b></header><p>${s.displaced?`${Number(s.displaced).toLocaleString()} displaced • `:''}${safe(n.label)} ${n.severity}%</p>${this.v22Meter('Health',s.health,s.health<40?'danger':'')}${this.v22Meter('Security',s.security,s.security<40?'danger':'')}${this.v22Meter('Prosperity',s.prosperity)}${this.v22Meter('Morale',s.morale)}<footer><span>Opinion ${s.playerOpinion>=0?'+':''}${Math.round(s.playerOpinion)}</span><span>${r?`${safe(r.label)} ${r.progress}/${r.target}`:'No active request'}</span></footer></article>`;}).join('');
    const sanctuaries=holds.map(h=>{const x=sanctuaryByHold.get(h.id);return x?`<article class="v22-sanctuary"><header><div><span>OPEN SANCTUARY</span><h4>${safe(x.name)}</h4></div><b>${x.residents}/${x.capacity}</b></header>${this.v22Meter('Safety',x.safety)}${this.v22Meter('Stockpile',x.stockpile,x.stockpile<25?'danger':'')}<button data-v22-supply-sanctuary="${safe(x.id)}" ${x.stockpile>=100?'disabled':''}>RESUPPLY • 100 Credits + 8 Salvage</button></article>`:`<article class="v22-sanctuary candidate"><span>STRONGHOLD AVAILABLE</span><h4>${safe(h.name)}</h4><p>Convert part of this V21 base into a civilian refuge. The stronghold remains a faction base.</p><button data-v22-build-sanctuary="${safe(h.id)}">OPEN SANCTUARY • 320 Credits + 36 Salvage + 4 Cosmic Fragments</button></article>`;}).join('')||'<p>No safe player stronghold is available for a sanctuary yet.</p>';
    return `<section class="v22-head"><div><span>V22 • SETTLEMENTS & CIVILIAN WORLDS</span><h3>The people beyond the battle now persist</h3><p>Territories carry population, displacement, health, security, prosperity, infrastructure, requests, and public opinion. Relief uses the existing V18 wallet and normal Wheel encounters.</p></div><aside><b>${Number(summary.population).toLocaleString()}</b><small>civilian population • ${Number(summary.displaced).toLocaleString()} displaced</small></aside></section><section class="v22-summary"><article><span>AVG HEALTH</span><b>${summary.averages.health}</b></article><article><span>AVG SECURITY</span><b>${summary.averages.security}</b></article><article><span>AVG PROSPERITY</span><b>${summary.averages.prosperity}</b></article><article><span>LOCAL MARKET</span><b>${price>0?'+':''}${Math.round(price*100)}%</b></article></section><section class="v22-current"><header><div><span>CURRENT CIVILIAN WORLD • ${safe(label(current.status))}</span><h3>${safe(current.name)}</h3><p>${safe(current.universe)} / ${safe(label(current.locationId))} • ${Number(current.population).toLocaleString()} residents • ${Number(current.displaced).toLocaleString()} displaced</p></div><b>${safe(need.label)}</b></header><div class="v22-needs">${this.v22Meter('Food',current.food,current.food<40?'danger':'')}${this.v22Meter('Housing',current.housing,current.housing<40?'danger':'')}${this.v22Meter('Health',current.health,current.health<40?'danger':'')}${this.v22Meter('Security',current.security,current.security<40?'danger':'')}${this.v22Meter('Infrastructure',current.infrastructure,current.infrastructure<40?'danger':'')}</div>${request?`<section class="v22-request"><span>ACTIVE CIVILIAN REQUEST</span><h4>${safe(request.label)}</h4><p>Progress ${request.progress}/${request.target} through normal Wheel results: ${request.events.map(label).join(', ')}${request.requiredOutcome?` • requires ${safe(label(request.requiredOutcome))}`:''}.</p></section>`:''}<div class="v22-actions">${actions}</div></section><section class="v22-sanctuaries"><div class="v22-section-head"><span>SANCTUARIES</span><p>Safe V21 strongholds can shelter displaced civilians; no parallel base economy is created.</p></div>${sanctuaries}</section><section class="v22-settlement-list"><div class="v22-section-head"><span>DISCOVERED SETTLEMENTS</span><p>${summary.activeRequests.length} active civilian request${summary.activeRequests.length===1?'':'s'} across ${summary.settlements.length} territories.</p></div><div class="v22-grid">${grid}</div></section>`;
  };

  P.injectV22UI=function(){
    const world=document.getElementById('v16-world-modal');if(world&&!world.querySelector('[data-v16-world-tab="civilians"]'))world.querySelector('[data-v16-world-tab="factions"]')?.insertAdjacentHTML('afterend','<button type="button" data-v16-world-tab="civilians">CIVILIANS</button>');
    const beacon=document.getElementById('v21-faction-beacon')||document.getElementById('v20-relic-beacon');if(beacon&&!document.getElementById('v22-civilian-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v22-civilian-beacon" class="v22-civilian-beacon" aria-label="Civilian settlement summary"></section>');
    const version=document.querySelector('.v13-title-head span'),copyNode=document.querySelector('.v13-title-head p');if(version)version.textContent='V22 • SETTLEMENTS & CIVILIAN WORLDS';if(copyNode)copyNode.textContent='Every battle leaves people behind. Rebuild settlements, shelter refugees, answer civilian requests through the Wheel, and decide what kind of worlds survive.';
    if(!document.getElementById('v22-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v22-help"><h3>Settlements & civilian worlds</h3><p>Open World → Civilians to inspect population, displacement, health, security, prosperity, infrastructure, public opinion, relief requests, and sanctuaries. Relief spends the existing V18 wallet. Requests progress through normal Wheel events; settlements cannot be silently deleted by background simulation.</p></section>');
    document.documentElement.dataset.v22='settlements-civilian-worlds';
  };
  P.renderCivilianBeaconV22=function(){const root=document.getElementById('v22-civilian-beacon');if(!root)return;const s=this.civilianSummaryV22(),current=s.current;root.innerHTML=`<button type="button" data-v22-open><span>CIVILIANS</span><b>${current?safe(current.name):'No settlement'}</b><small>${Number(s.displaced).toLocaleString()} displaced • ${s.activeRequests.length} active request${s.activeRequests.length===1?'':'s'}</small></button><div><span>RECOVERY</span><b>${s.averages.health}% health • ${s.averages.prosperity}% prosperity</b><small>${s.sanctuaries.length} sanctuar${s.sanctuaries.length===1?'y':'ies'} • market ${s.marketModifier>0?'+':''}${Math.round(s.marketModifier*100)}%</small></div>`;};

  const renderWorldV22=P.renderWorldV16;
  P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){
    if(tab!=='civilians')return renderWorldV22.call(this,tab);this.ensureV22();this._v16WorldTab='civilians';document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab==='civilians'));const body=document.querySelector('[data-v16-world-body]');if(body)body.innerHTML=this.renderCiviliansV22();
  };

  const renderAllV22=P.renderAll;
  P.renderAll=function(){this.ensureV22();const result=renderAllV22.call(this);this.injectV22UI();this.renderCivilianBeaconV22();return result;};

  const bindV22=P.bind;
  P.bind=function(){bindV22.call(this);this.injectV22UI();if(this._v22Bound)return;this._v22Bound=true;document.addEventListener('click',event=>{
    if(event.target.closest('[data-v22-open]'))return this.openWorldV16?.('civilians');
    const action=event.target.closest('[data-v22-action]');if(action){const[settlementId,id]=action.dataset.v22Action.split('|');return this.civilianActionV22(settlementId,id);}
    const build=event.target.closest('[data-v22-build-sanctuary]');if(build)return this.buildSanctuaryV22(build.dataset.v22BuildSanctuary);
    const supply=event.target.closest('[data-v22-supply-sanctuary]');if(supply)return this.supplySanctuaryV22(supply.dataset.v22SupplySanctuary);
  });};
})();
