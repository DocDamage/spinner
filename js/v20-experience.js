'use strict';

// V20 turns V18 inventory into persistent mastery/relic progression and connects
// it to V16 ownership, V19 relationships, combat, vendors, Chronicle, and endings.
(()=>{
  const {RelicMasteryEngine,migrateV20,SET_DEFS}=MultiverseDomain;
  const P=MultiverseWheel.prototype,relics=new RelicMasteryEngine();
  const artifacts=()=>Array.from(ART.values());
  const roster=()=>Array.from(CHAR.values());
  const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const statLine=stats=>Object.entries(stats||{}).filter(([,v])=>Number(v)).map(([k,v])=>`${k.slice(0,3).toUpperCase()} ${Number(v)>0?'+':''}${Math.round(v)}`).join(' • ')||'No active bonus';
  const pct=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  const label=v=>String(v||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const refresh=function(){this.save();this.renderAll();if(document.getElementById('v16-world-modal')?.classList.contains('open'))this.renderWorldV16?.('economy');};

  P.ensureV20=function(state=this.state){if(!state)return state;migrateV20(state,artifacts(),roster());return state;};
  const newStateV20=P.newState;P.newState=function(seed){return this.ensureV20(newStateV20.call(this,seed));};
  const loadStateV20=P.loadState;P.loadState=function(){const state=loadStateV20.call(this);return state?this.ensureV20(state):state;};
  const saveV20=P.save;P.save=function(){if(this.state)this.ensureV20();return saveV20.call(this);};

  P.relicSummaryV20=function(){this.ensureV20();return relics.summary(this.state,artifacts(),roster());};

  const effectiveStatsV20=P.effectiveStats;
  P.effectiveStats=function(){const stats=effectiveStatsV20.call(this);if(!this.state?.v20)return stats;const gear=relics.masteryBonuses(this.state),artifact=relics.relicBonuses(this.state),convergence=relics.convergence(this.state),combat=['battle','boss'].includes(this.state.pending?.type);for(const key of STAT_KEYS)stats[key]=clamp(Number(stats[key]||0)+Number(gear[key]||0)+Number(artifact[key]||0)+(combat&&convergence.ready?convergence.statBonus:0),1,460);return stats;};

  const ownedTagsV20=P.ownedTags;
  P.ownedTags=function(){const base=ownedTagsV20.call(this),set=base instanceof Set?new Set(base):new Set(base||[]);if(!this.state?.v20)return set;for(const active of relics.setBonuses(this.state).active){const def=relics.setDefinition(this.state,active.id);for(const tag of def?.tags||[])set.add(tag);}for(const r of Object.values(this.state.v20.relics||{}))if(r.status==='owned'&&r.awakened)set.add(`relic-${r.personality?.id||'awakened'}`);return set;};

  const recordOutcomeV20=P.recordOutcomeV19;
  if(typeof recordOutcomeV20==='function')P.recordOutcomeV19=function(type,outcome,enemy=null){const result=recordOutcomeV20.call(this,type,outcome,enemy);this.ensureV20();const v20=relics.processOutcome(this.state,{type,outcome,enemyId:enemy?.id||''},artifacts(),roster());if(v20){for(const g of v20.leveled||[])this.log(`EQUIPMENT MASTERY: ${g.name} reached Level ${g.level}.`,'rare');for(const r of v20.relics?.completed||[])this.log(`RELIC QUEST COMPLETE: ${r.name} — ${r.quest.label}.`,'rare');for(const r of v20.relics?.awakened||[])this.log(`RELIC AWAKENED: ${r.name} entered ${r.personality.label} resonance.`,'rare');if(v20.theft)this.log(`RELIC STOLEN: ${v20.theft.name} was taken by a nemesis. Hunt them to recover it.`,'loss');for(const r of v20.recovered||[])this.log(`RELIC RECOVERED: ${r.name} returned to the collection.`,'win');if(v20.convergence?.ready)this.log(`LEGACY CONVERGENCE READY: an awakened relic and the party's strongest bond can transform combat.`,'rare');this.save();}return result;};

  const acquireArtifactV20=P.acquireArtifact;
  P.acquireArtifact=function(id,quiet=false){const had=(this.state.artifacts||[]).includes(id),result=acquireArtifactV20.call(this,id,quiet);this.ensureV20();if(!had&&(this.state.artifacts||[]).includes(id)){const r=relics.relicRecord(this.state,id,ART.get(id));r.status='owned';r.bond=Math.max(r.bond,15);relics.chronicle(this.state,'relic-found',`${r.name} entered the collection`,`${r.personality.label} personality detected.`);this.save();}return result;};

  const economySummaryV20=P.economySummaryV18;
  if(typeof economySummaryV20==='function')P.economySummaryV18=function(){const summary=economySummaryV20.call(this);this.ensureV20();const discount=relics.vendorDiscount(this.state);summary.market.offers=summary.market.offers.map(offer=>({...offer,price:relics.discountedPrice(this.state,offer.price),v20Discount:discount}));summary.v20Vendor={...copy(relics.vendor(this.state)),discount};return summary;};

  const noteCommerceWrapper=(name,type,amountResolver)=>{const base=P[name];if(typeof base!=='function')return;P[name]=function(...args){this.ensureV20();const tx=Number(this.state.v18?.transactions?.length||0),beforeIds=new Set((this.state.lootInventory||[]).map(i=>i.id)),result=base.apply(this,args);this.ensureV20();if(Number(this.state.v18?.transactions?.length||0)>tx){const last=this.state.v18.transactions.at(-1),amount=amountResolver?.call(this,last,args,beforeIds)||last?.amount||0;relics.noteCommerce(this.state,type,amount);relics.syncGear(this.state);this.save();}return result;};};
  noteCommerceWrapper('buyV18','purchase',last=>last?.amount||0);
  noteCommerceWrapper('sellGearV18','sale',last=>last?.amount||0);
  noteCommerceWrapper('sellArtifactV18','sale',last=>last?.amount||0);
  noteCommerceWrapper('craftV18','craft',()=>120);
  noteCommerceWrapper('enchantGearV18','service',()=>70);
  noteCommerceWrapper('transmuteGearV18','service',()=>55);

  const fuseV20=P.fuseArtifactsV18;
  if(typeof fuseV20==='function')P.fuseArtifactsV18=function(){const before=new Set(this.state.artifacts||[]),result=fuseV20.call(this);this.ensureV20();for(const id of before)if(!(this.state.artifacts||[]).includes(id)){const r=this.state.v20.relics[id];if(r&&r.status!=='stolen')r.status='consumed';}this.save();return result;};

  P.forgeSetV20=function(){const setId=document.querySelector('[data-v20-forge-set]')?.value,slot=document.querySelector('[data-v20-forge-slot]')?.value,result=relics.forgeSetPiece(this.state,setId,slot);if(!result.ok)return this.toast(result.error);this.log(`LEGACY FORGE: ${result.item.name} created as a ${label(result.item.rarity)} set piece.`,'rare');refresh.call(this);};
  P.reforgeSetV20=function(itemId,select){const setId=select?.value,result=relics.reforgeSet(this.state,itemId,setId);if(!result.ok)return this.toast(result.error);this.log(`REFORGED: ${relics.displayName(this.state,(this.state.lootInventory||[]).find(i=>i.id===itemId))} now belongs to ${relics.setDefinition(this.state,setId)?.label}.`,'rare');refresh.call(this);};
  P.signatureGearV20=function(itemId){const result=relics.nameSignature(this.state,itemId);if(!result.ok)return this.toast(result.error);this.log(`SIGNATURE EQUIPMENT: ${result.name}.`,'rare');refresh.call(this);};
  P.attuneRelicV20=function(id,bearerId='hero'){const result=relics.attune(this.state,id,bearerId,roster());if(!result.ok)return this.toast(result.error);this.log(`RELIC ATTUNED: ${result.relic.name} → ${bearerId==='hero'?'Hero':CHAR.get(bearerId)?.name||bearerId}.`,'rare');refresh.call(this);};
  P.purifyRelicV20=function(id){const result=relics.purify(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`PURIFIED: ${result.relic.name} • Corruption ${Math.round(result.relic.corruption)}%.`,'win');refresh.call(this);};
  P.corruptRelicV20=function(id){const result=relics.embraceCorruption(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`TEMPTATION ACCEPTED: ${result.relic.name} gained power at ${Math.round(result.relic.corruption)}% corruption.`,'loss');refresh.call(this);};
  P.resolveRelicDisputeV20=function(id,winner){const result=relics.resolveDispute(this.state,id,winner);if(!result.ok)return this.toast(result.error);this.log(`RELIC CLAIM RESOLVED: ${CHAR.get(winner)?.name||winner} carries ${this.state.v20.relics[id]?.name||id}.`,'info');refresh.call(this);};

  P.injectV20UI=function(){
    const beacon=document.getElementById('v19-party-beacon')||document.getElementById('v18-economy-beacon');if(beacon&&!document.getElementById('v20-relic-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v20-relic-beacon" class="v20-relic-beacon" aria-label="Relic and equipment mastery summary"></section>');
    const version=document.querySelector('.v13-title-head span'),copyNode=document.querySelector('.v13-title-head p');if(version)version.textContent='V20 • RELIC BONDS & EQUIPMENT MASTERY';if(copyNode)copyNode.textContent='Equipment learns your fighting style. Relics choose bearers, remember choices, awaken, corrupt, get stolen, and come home changed.';
    if(!document.getElementById('v20-help'))document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v20-help"><h3>Relic bonds, set gear, and mastery</h3><p>Equipped gear earns mastery from completed encounters, unlocks signature naming and awakening, and can be reforged into equipment sets. Relics have personalities, bond, purity, corruption, quests, bearers, party claims, theft/recovery, and awakening. Vendor loyalty discounts local stock over time.</p></section>');
    document.documentElement.dataset.v20='relic-mastery';
  };

  P.renderRelicBeaconV20=function(){const root=document.getElementById('v20-relic-beacon');if(!root)return;const s=this.relicSummaryV20(),awake=s.relics.filter(r=>r.awakened).length,signature=s.gear.filter(g=>g.mastery.signatureName).length;root.innerHTML=`<button type="button" data-v20-open><span>RELIC MASTERY</span><b>${awake} awakened • ${signature} signature</b><small>${s.relics.length} owned relics • ${s.stolen.length} stolen</small></button><div><span>LEGACY CONVERGENCE</span><b>${s.convergence.ready?'READY':'DORMANT'}</b><small>Vendor Rank ${s.vendor.rank} • ${Math.round(s.discount*100)}% loyalty discount</small></div>`;};

  P.renderV20Economy=function(){
    const s=this.relicSummaryV20(),sets=s.availableSets,party=[...(this.state.party||[]),...(this.state.v19?.benchIds||[])];
    const setOptions=sets.map(x=>`<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');
    const gear=s.gear.map(({item,mastery,equipped})=>{const def=relics.setDefinition(this.state,mastery.setId),threshold=relics.masteryThreshold(mastery.level);return`<article class="v20-gear-card ${equipped?'equipped':''} ${mastery.awakened?'awakened':''}"><header><span>${equipped?'EQUIPPED • ':''}${esc(relics.rank(mastery.level))}</span><b>${esc(relics.displayName(this.state,item))}</b></header><p>${esc(def?.label||'Unbound')} • Mastery Lv.${mastery.level}/10 • ${mastery.level<10?`${mastery.xp}/${threshold} XP`:'AWAKENED'}</p><div class="v20-progress"><i style="width:${mastery.level>=10?100:pct(mastery.xp/threshold*100)}%"></i></div><small>${esc(statLine(item.bonuses))}</small><footer>${mastery.level>=6&&!mastery.signatureName?`<button data-v20-signature="${esc(item.id)}">MAKE SIGNATURE</button>`:''}<select data-v20-reforge-set="${esc(item.id)}">${sets.map(x=>`<option value="${esc(x.id)}" ${x.id===mastery.setId?'selected':''}>${esc(x.label)}</option>`).join('')}</select><button data-v20-reforge="${esc(item.id)}">REFORGE SET</button></footer></article>`;}).join('');
    const activeSets=s.sets.active.map(x=>`<article><span>${esc(x.label)} • ${x.count}/4</span><b>${esc(statLine(x.bonuses))}</b><small>${x.count>=4?'4-PIECE ACTIVE':x.count>=2?'2-PIECE ACTIVE':'Equip 2 matching pieces'}</small></article>`).join('');
    const relicCards=s.relics.map(r=>{const bearer=r.bearerId==='hero'?'Hero':r.bearerId?(CHAR.get(r.bearerId)?.name||r.bearerId):'Unattuned',q=r.quest||{},partyOptions=party.map(id=>`<option value="${esc(id)}">${esc(CHAR.get(id)?.name||id)}</option>`).join('');return`<article class="v20-relic-card ${r.awakened?'awakened':''} ${r.corruption>=50?'corrupt':''}"><header><span>${esc(r.personality.label)} • ${r.awakened?'AWAKENED':'DORMANT'}</span><b>${esc(r.name)}</b></header><div class="v20-relic-bars"><label>BOND <i><b style="width:${pct(r.bond)}%"></b></i><strong>${Math.round(r.bond)}</strong></label><label>PURITY <i><b style="width:${pct(r.purity)}%"></b></i><strong>${Math.round(r.purity)}</strong></label><label>CORRUPTION <i><b style="width:${pct(r.corruption)}%"></b></i><strong>${Math.round(r.corruption)}</strong></label></div><p>Bearer: <b>${esc(bearer)}</b> • Favored ${esc((r.personality.favored||[]).map(label).join(' + '))}</p><section><span>RELIC QUEST</span><b>${esc(q.label||'Unknown')}</b><small>${q.status==='completed'?'COMPLETE':`${q.progress||0}/${q.target||0}`}</small></section><footer><button data-v20-attune="${esc(r.id)}|hero">ATTUNE HERO</button>${partyOptions?`<select data-v20-bearer="${esc(r.id)}"><option value="">Choose ally…</option>${partyOptions}</select><button data-v20-attune-ally="${esc(r.id)}">ATTUNE ALLY</button>`:''}${r.corruption>0?`<button data-v20-purify="${esc(r.id)}">PURIFY</button>`:''}<button data-v20-corrupt="${esc(r.id)}">EMBRACE TEMPTATION</button></footer></article>`;}).join('');
    const stolen=s.stolen.map(r=>`<article class="v20-stolen"><span>STOLEN RELIC</span><b>${esc(r.name)}</b><small>${esc(this.state.v16?.nemeses?.[r.stolenBy]?.name||r.stolenBy)} • ${esc(r.stolenWorld||'Unknown world')}</small></article>`).join('');
    const disputes=s.disputes.map(d=>`<article><span>RELIC CLAIM DISPUTE</span><b>${esc(this.state.v20.relics[d.artifactId]?.name||d.artifactId)}</b><div>${d.allies.map(id=>`<button data-v20-dispute="${esc(d.artifactId)}|${esc(id)}">TRUST ${esc(CHAR.get(id)?.name||id)}</button>`).join('')}</div></article>`).join('');
    return `<section class="v20-head"><div><span>V20 • RELIC BONDS & EQUIPMENT MASTERY</span><h3>Make the inventory part of the story</h3><p>Mastery adds bonuses on top of V18 gear. Matching sets activate 2/4-piece bonuses. Relics can bond to the hero or trusted allies, awaken, corrupt, be disputed, stolen by nemeses, and recovered.</p></div><aside><b>VENDOR RANK ${s.vendor.rank}</b><span>${Math.round(s.discount*100)}% local discount</span><small>${Math.round(s.vendor.points)} loyalty points</small></aside></section>${s.convergence.ready?`<section class="v20-convergence"><span>COMBINED TRANSFORMATION READY</span><b>LEGACY CONVERGENCE</b><p>${esc(s.convergence.relic?.name||'An awakened relic')} + Resonant party bond • +2 all stats during battle on top of the existing V19 bond surge.</p></section>`:''}<section class="v20-set-status"><header><span>ACTIVE EQUIPMENT SETS</span></header><div>${activeSets||'<p>No set bonus active. Equip two pieces from the same set.</p>'}</div></section><section class="v20-legacy-forge"><header><span>LEGACY FORGE</span><p>Faction Regalia unlocks at 35 reputation. Void Covenant unlocks when Void Marks are available.</p></header><select data-v20-forge-set>${setOptions}</select><select data-v20-forge-slot><option value="weapon">Weapon</option><option value="armor">Armor</option><option value="focus">Focus</option><option value="charm">Charm</option></select><button data-v20-forge>FORGE SET PIECE • 26 SALVAGE + 4 FRAGMENTS</button></section><section class="v20-grid"><div><header><span>EQUIPMENT MASTERY</span><b>${s.gear.length} tracked</b></header>${gear||'<p>No equipment to master yet.</p>'}</div><div><header><span>RELIC BONDS</span><b>${s.relics.length} owned</b></header>${relicCards||'<p>No artifacts owned yet.</p>'}${stolen}</div></section>${disputes?`<section class="v20-disputes"><header><span>PARTY RELIC CLAIMS</span></header>${disputes}</section>`:''}<details class="v20-chronicle"><summary>Relic & equipment Chronicle • ${this.state.v20.chronicle.length}</summary>${s.chronicle.slice().reverse().map(e=>`<p><b>${esc(e.title)}</b><span>${esc(e.detail)} • Spin ${e.spin}</span></p>`).join('')}</details>`;
  };

  const renderEconomyV20=P.renderEconomyV18;
  if(typeof renderEconomyV20==='function')P.renderEconomyV18=function(){return`${renderEconomyV20.call(this)}${this.renderV20Economy()}`;};

  const createEndingV20=P.createEndingV13;
  if(typeof createEndingV20==='function')P.createEndingV13=function(finalWin=this.state.finalWin){const ending=createEndingV20.call(this,finalWin);this.ensureV20();const relicEnding=relics.epilogue(this.state);this.state.v20.ending=copy(relicEnding);if(this.state.v13?.recap){this.state.v13.recap.relicEnding=copy(relicEnding);this.state.v13.recap.highlights=[...(this.state.v13.recap.highlights||[]),{type:'relic',title:relicEnding.title,detail:relicEnding.text}].slice(-18);}return ending;};

  const renderAllV20=P.renderAll;
  P.renderAll=function(){this.ensureV20();const result=renderAllV20.call(this);this.injectV20UI();this.renderRelicBeaconV20();return result;};

  const bindV20=P.bind;
  P.bind=function(){bindV20.call(this);this.injectV20UI();if(this._v20Bound)return;this._v20Bound=true;document.addEventListener('click',event=>{
    if(event.target.closest('[data-v20-open]'))return this.openWorldV16?.('economy');
    if(event.target.closest('[data-v20-forge]'))return this.forgeSetV20();
    const sig=event.target.closest('[data-v20-signature]');if(sig)return this.signatureGearV20(sig.dataset.v20Signature);
    const ref=event.target.closest('[data-v20-reforge]');if(ref)return this.reforgeSetV20(ref.dataset.v20Reforge,document.querySelector(`[data-v20-reforge-set="${CSS.escape(ref.dataset.v20Reforge)}"]`));
    const attune=event.target.closest('[data-v20-attune]');if(attune){const [id,bearer]=attune.dataset.v20Attune.split('|');return this.attuneRelicV20(id,bearer);}
    const ally=event.target.closest('[data-v20-attune-ally]');if(ally){const id=ally.dataset.v20AttuneAlly,bearer=document.querySelector(`[data-v20-bearer="${CSS.escape(id)}"]`)?.value;if(!bearer)return this.toast('Choose an ally first.');return this.attuneRelicV20(id,bearer);}
    const purify=event.target.closest('[data-v20-purify]');if(purify)return this.purifyRelicV20(purify.dataset.v20Purify);
    const corrupt=event.target.closest('[data-v20-corrupt]');if(corrupt)return this.corruptRelicV20(corrupt.dataset.v20Corrupt);
    const dispute=event.target.closest('[data-v20-dispute]');if(dispute){const [id,winner]=dispute.dataset.v20Dispute.split('|');return this.resolveRelicDisputeV20(id,winner);}
  });};
})();
