'use strict';

// V18 makes Credits and the dormant loot/equipment hooks into a full location-
// aware economy with markets, auctions, crafting, artifact evolution, and
// commerce contracts. V17 remains authoritative for realities and routes.
(()=>{
  const {EconomyCraftingEngine,migrateV18,RARITY_TIERS,CURRENCIES,RECIPES}=MultiverseDomain;
  const P=MultiverseWheel.prototype,economy=new EconomyCraftingEngine();
  const artifacts=()=>Array.from(ART.values());
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const rarityLabel=id=>RARITY_TIERS.find(tier=>tier.id===id)?.label||String(id||'Common');
  const money=(key,value)=>`${CURRENCIES[key]?.symbol||''}${Number(value||0).toLocaleString()}`;
  const statLine=bonuses=>Object.entries(bonuses||{}).map(([key,value])=>`${String(key).slice(0,3).toUpperCase()} +${value}`).join(' • ');
  const contractOutcome=pending=>pending?.v17Outcome||(['battle','boss'].includes(pending?.type)?'unknown':'success');

  P.ensureV18=function(state=this.state){if(!state)return state;migrateV18(state,artifacts());state.v18.announcedContracts=Array.isArray(state.v18.announcedContracts)?state.v18.announcedContracts:[];return state;};
  const newStateV18=P.newState;P.newState=function(seed){return this.ensureV18(newStateV18.call(this,seed));};
  const loadStateV18=P.loadState;P.loadState=function(){const state=loadStateV18.call(this);return state?this.ensureV18(state):state;};
  const saveV18=P.save;P.save=function(){if(this.state)this.ensureV18();return saveV18.call(this);};

  P.economySummaryV18=function(){this.ensureV18();return economy.summary(this.state,artifacts());};
  P.announceContractsV18=function(){this.ensureV18();for(const contract of this.state.v18.contracts.filter(item=>item.status==='completed')){if(this.state.v18.announcedContracts.includes(contract.id))continue;this.state.v18.announcedContracts.push(contract.id);this.log(`CONTRACT COMPLETE: ${contract.label} — ${contract.reward.credits} Credits${contract.reward.bountySeals?` • ${contract.reward.bountySeals} Bounty Seal${contract.reward.bountySeals===1?'':'s'}`:''}.`,'rare');}this.state.v18.announcedContracts=this.state.v18.announcedContracts.slice(-80);};

  const effectiveStatsV18=P.effectiveStats;
  P.effectiveStats=function(){const stats=effectiveStatsV18.call(this);if(!this.state?.v18)return stats;const gear=economy.equippedBonuses(this.state).stats,evolved=economy.artifactEvolutionBonuses(this.state);for(const key of STAT_KEYS)stats[key]=clamp(Math.round(Number(stats[key]||0)+Number(gear[key]||0)+Number(evolved[key]||0)),1,420);return stats;};
  const ownedTagsV18=P.ownedTags;
  P.ownedTags=function(){const base=ownedTagsV18.call(this),set=base instanceof Set?new Set(base):new Set(base||[]);if(this.state?.v18)for(const tag of economy.equippedBonuses(this.state).tags)set.add(tag);return set;};

  const acquireArtifactV18=P.acquireArtifact;
  P.acquireArtifact=function(id,quiet=false){const result=acquireArtifactV18.call(this,id,quiet);if(this.state?.v18)economy.syncArtifactEvolution(this.state,artifacts());return result;};

  const completeEventV18=P.completeEvent;
  P.completeEvent=function(){
    const pending=copy(this.state.pending);if(pending?.stage==='result'&&this.state?.v18){const outcome=contractOutcome(pending),reward=economy.eventReward(this.state,{type:pending.type,outcome,difficulty:this.state.difficulty});const completed=economy.progressContracts(this.state,{type:pending.type,outcome});if(Object.keys(reward).length)this.log(`ECONOMY: ${Object.entries(reward).map(([key,value])=>`+${value} ${CURRENCIES[key]?.label||key}`).join(' • ')}.`,'win');if(completed.length)this.announceContractsV18();}
    return completeEventV18.call(this);
  };
  if(typeof P.travelLocationV17==='function'){
    const travelLocationV18=P.travelLocationV17;P.travelLocationV17=function(locationId){const before=this.state?.v17?JSON.stringify(this.state.v17.currentLocation):'',result=travelLocationV18.call(this,locationId);if(this.state?.v18&&before!==JSON.stringify(this.state.v17.currentLocation)){economy.progressContracts(this.state,{type:'travel',outcome:'success'});this.announceContractsV18();this.save();}return result;};
  }
  if(typeof P.travelWorldV16==='function'){
    const travelWorldV18=P.travelWorldV16;P.travelWorldV16=function(name){const before=this.state?.v16?.currentUniverse,result=travelWorldV18.call(this,name);if(this.state?.v18&&before!==this.state.v16.currentUniverse){economy.progressContracts(this.state,{type:'travel',outcome:'success'});this.announceContractsV18();this.save();}return result;};
  }

  P.applyGrantV18=function(grant){if(!grant)return;if(grant.kind==='artifact'&&grant.id)this.acquireArtifact(grant.id,true);};
  P.buyV18=function(offerId){const summary=this.economySummaryV18(),offer=summary.market.offers.find(item=>item.offerId===offerId),result=economy.buy(this.state,offer,artifacts());if(!result.ok)return this.toast(result.error);this.applyGrantV18(result.grant);this.announceContractsV18();this.log(`PURCHASED: ${result.name} for ${Object.entries(result.cost).map(([key,value])=>money(key,value)).join(' + ')}.`,'win');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.sellGearV18=function(id){const result=economy.sellEquipment(this.state,id);if(!result.ok)return this.toast(result.error);this.announceContractsV18();this.log(`SOLD EQUIPMENT: +${result.value} Credits.`,'info');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.sellArtifactV18=function(id){const asset=ART.get(id),result=economy.sellArtifact(this.state,id,artifacts());if(!result.ok)return this.toast(result.error);this.announceContractsV18();this.log(`SOLD ARTIFACT: ${asset?.name||id} for ${result.value} Credits.`,'info');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.equipGearV18=function(id){const result=economy.equip(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`EQUIPPED: ${result.item.name} in ${result.item.slot}.`,'win');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.salvageGearV18=function(id){const result=economy.salvageEquipment(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`SALVAGED EQUIPMENT: +${result.amount} Salvage.`,'info');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.craftV18=function(recipe){const location=this.realitySummaryV17?.().location?.id||'',vendor=economy.vendorFor(location);if(recipe==='masterwork'&&!['forge','relic','black'].includes(vendor))return this.toast('Masterwork crafting requires a forge, relic dealer, or Black Market.');if(recipe==='forbidden'&&vendor!=='black')return this.toast('Forbidden crafting is only available at the Interdimensional Black Market.');const result=economy.craft(this.state,recipe);if(!result.ok)return this.toast(result.error);this.announceContractsV18();this.log(`CRAFTED: ${result.item.name} • ${rarityLabel(result.item.rarity)}.`,'rare');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.enchantGearV18=function(id){const result=economy.enchant(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`ENCHANTED: ${result.item.name} is now +${result.item.enchant}.`,'rare');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.transmuteGearV18=function(id){const result=economy.transmute(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`TRANSMUTED: ${result.item.name} rolled a new stat pattern.`,'rare');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.fuseArtifactsV18=function(){const primary=document.querySelector('[data-v18-fuse-primary]')?.value,secondary=document.querySelector('[data-v18-fuse-secondary]')?.value,result=economy.fuseArtifacts(this.state,primary,secondary,artifacts());if(!result.ok)return this.toast(result.error);this.log(`ARTIFACT FUSION: ${ART.get(primary)?.name||primary} reached Evolution Lv.${result.evolution.level}; ${ART.get(secondary)?.name||secondary} was consumed.`,'rare');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.acceptContractV18=function(id){const result=economy.acceptContract(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`CONTRACT ACCEPTED: ${result.contract.label}.`,'info');this.save();this.renderWorldV16('economy');};
  P.bidAuctionV18=function(){const s=this.economySummaryV18(),lot=s.auction,bid=Math.max((lot?.currentBid||0)+1,Math.ceil((lot?.currentBid||1)*1.12)),result=economy.bidAuction(this.state,bid,artifacts());if(!result.ok)return this.toast(result.error);if(!result.won){this.toast(result.message);this.save();return this.renderWorldV16('economy');}this.applyGrantV18(result.grant);this.log(`AUCTION WON: ${lot.name} for ${result.currentBid} Credits.`,'rare');this.save();this.renderAll();this.renderWorldV16('economy');};
  P.exchangeSealV18=function(){this.ensureV18();if(Number(this.state.v18.wallet.bountySeals||0)<1)return this.toast('No Bounty Seals available.');economy.addCurrency(this.state,'bountySeals',-1);economy.addCurrency(this.state,'credits',60);this.log('QUARTERMASTER EXCHANGE: 1 Bounty Seal → 60 Credits.','win');this.save();this.renderWorldV16('economy');this.renderEconomyBeaconV18();};

  P.injectV18UI=function(){
    const modal=document.getElementById('v16-world-modal'),nav=modal?.querySelector('nav');if(nav&&!nav.querySelector('[data-v16-world-tab="economy"]'))nav.insertAdjacentHTML('beforeend','<button type="button" data-v16-world-tab="economy">ECONOMY</button>');
    const beacon=document.getElementById('v17-reality-beacon');if(beacon&&!document.getElementById('v18-economy-beacon'))beacon.insertAdjacentHTML('afterend','<section id="v18-economy-beacon" class="v18-economy-beacon" aria-label="Economy summary"></section>');
    const titleVersion=document.querySelector('.v13-title-head span'),titleCopy=document.querySelector('.v13-title-head p');if(titleVersion)titleVersion.textContent='V18 • MULTIVERSAL ECONOMY';if(titleCopy)titleCopy.textContent='Travel changes the market. Reputation changes the price. Build, trade, salvage, and evolve what you find.';
    const help=document.getElementById('v18-help');if(!help)document.getElementById('help-modal')?.querySelector('.modal-card')?.insertAdjacentHTML('beforeend','<section id="v18-help"><h3>Markets, equipment, crafting, and contracts</h3><p>Credits remain the main currency. Cosmic Fragments buy and build higher-order gear, Salvage powers crafting, Void Marks unlock forbidden Black Market stock, and Bounty Seals come from hostile contracts. Market stock and prices depend on the current reality, destination, world pressure, rarity, demand, and faction reputation.</p></section>');
    document.documentElement.dataset.v18='multiversal-economy';
  };
  P.renderEconomyBeaconV18=function(){const root=document.getElementById('v18-economy-beacon');if(!root)return;const s=this.economySummaryV18(),w=s.wallet;root.innerHTML=`<button type="button" data-v18-economy-open><span>ECONOMY</span><b>${money('credits',w.credits)} Credits</b><small>${esc(s.market.vendorLabel)} • ${s.inventory.length}/24 gear</small></button><div><span>MATERIALS</span><b>${money('cosmicFragments',w.cosmicFragments)} Fragments • ${money('salvage',w.salvage)} Salvage</b><small>${money('voidMarks',w.voidMarks)} Void Marks • ${money('bountySeals',w.bountySeals)} Bounty Seals</small></div>`;};

  P.renderEconomyV18=function(){
    const s=this.economySummaryV18(),w=s.wallet,market=s.market,lot=s.auction,location=this.realitySummaryV17?.().location,active=s.contracts.filter(c=>c.status==='active'),offered=s.contracts.filter(c=>c.status==='offered'),ownedArtifacts=(this.state.artifacts||[]).map(id=>({id,asset:ART.get(id),evo:s.artifactEvolution[id]}));
    const wallet=Object.entries(CURRENCIES).map(([key,meta])=>`<article><span>${esc(meta.label)}</span><b>${esc(meta.symbol)}${Number(w[key]||0).toLocaleString()}</b></article>`).join('');
    const offers=market.offers.map(offer=>`<article class="rarity-${esc(offer.rarity)}"><header><span>${esc(rarityLabel(offer.rarity))} • ${esc(offer.kind.toUpperCase())}</span><b>${esc(offer.name)}</b></header>${offer.kind==='equipment'?`<p>${esc(offer.slot.toUpperCase())} • ${esc(statLine(offer.bonuses))}</p>`:offer.kind==='artifact'?`<p>Persistent named relic • tracked evolution</p>`:`<p>${esc(Object.entries(offer.grant||{}).map(([key,value])=>`+${value} ${CURRENCIES[key]?.label||key}`).join(' • '))}</p>`}<button type="button" data-v18-buy="${esc(offer.offerId)}">BUY • ${money(offer.currency,offer.price)}</button></article>`).join('');
    const gear=s.inventory.map(item=>{const equipped=Object.values(s.equipment).includes(item.id);return`<article class="rarity-${esc(item.rarity)} ${equipped?'equipped':''}"><header><span>${esc(rarityLabel(item.rarity))} • ${esc(item.slot.toUpperCase())}${item.cursed?' • CURSED':''}</span><b>${esc(item.name)}${item.enchant?` +${item.enchant}`:''}</b></header><p>${esc(statLine(item.bonuses))}</p><div><button data-v18-equip="${esc(item.id)}" ${equipped?'disabled':''}>${equipped?'EQUIPPED':'EQUIP'}</button><button data-v18-enchant="${esc(item.id)}">ENCHANT</button><button data-v18-transmute="${esc(item.id)}">TRANSMUTE</button><button data-v18-salvage="${esc(item.id)}">SALVAGE</button><button data-v18-sell-gear="${esc(item.id)}">SELL</button></div></article>`;}).join('');
    const artifactsUI=ownedArtifacts.map(({id,asset,evo})=>`<article class="rarity-${esc(evo?.rarity||'common')}"><header><span>${esc(rarityLabel(evo?.rarity))} • EVOLUTION LV.${evo?.level||1}</span><b>${esc(asset?.name||id)}</b></header><p>${evo?.fusions||0} fusion${evo?.fusions===1?'':'s'} • ${evo?.xp||0} evolution XP</p><button data-v18-sell-artifact="${esc(id)}">SELL RELIC</button></article>`).join('');
    const recipeUI=Object.entries(RECIPES).map(([id,recipe])=>`<article class="${id==='forbidden'?'forbidden':''}"><span>${esc(recipe.label)}</span><b>${Object.entries(recipe.cost).map(([key,value])=>`${money(key,value)} ${CURRENCIES[key]?.label||key}`).join(' • ')}</b><button data-v18-craft="${esc(id)}">CRAFT</button></article>`).join('');
    const contractUI=[...active,...offered].map(contract=>`<article class="${contract.status}"><header><span>${esc(contract.status.toUpperCase())}</span><b>${esc(contract.label)}</b></header><p>${esc(contract.objective)}</p><small>${contract.progress}/${contract.target} • Reward ${contract.reward.credits} Credits${contract.reward.bountySeals?` • ${contract.reward.bountySeals} Seal${contract.reward.bountySeals===1?'':'s'}`:''}</small>${contract.status==='offered'?`<button data-v18-contract="${esc(contract.id)}">ACCEPT</button>`:''}</article>`).join('');
    const fusion=ownedArtifacts.length>=2?`<div class="v18-fusion"><label>PRIMARY<select data-v18-fuse-primary>${ownedArtifacts.map(({id,asset})=>`<option value="${esc(id)}">${esc(asset?.name||id)}</option>`).join('')}</select></label><label>CONSUME<select data-v18-fuse-secondary>${ownedArtifacts.map(({id,asset},index)=>`<option value="${esc(id)}" ${index===1?'selected':''}>${esc(asset?.name||id)}</option>`).join('')}</select></label><button data-v18-fuse>FUSE • ${money('cosmicFragments',2)} + ${money('salvage',10)}</button></div>`:'';
    return `<section class="v18-economy-head"><div><span>MULTIVERSAL ECONOMY</span><h3>${esc(market.vendorLabel)}</h3><p>${esc(location?.label||'Current route')} • Stock rotates every 3 world ticks. Threat, corruption, stability, demand, rarity, and faction reputation move prices.</p></div><div class="v18-wallet">${wallet}</div></section><section class="v18-market"><header><span>MARKET STOCK</span><small>Rotation ${market.rotation}</small></header><div class="v18-offer-grid">${offers||'<p>No stock remains this rotation.</p>'}</div></section><section class="v18-auction"><header><span>SEALED AUCTION</span><b>${esc(lot?.name||'No active lot')}</b></header>${lot&&!lot.closed?`<p>${esc(rarityLabel(lot.rarity))} • Current bid ${money('credits',lot.currentBid)}. Rival ceiling is hidden.</p><button data-v18-auction>BID +12%</button>`:'<p>The local auction is closed until the next market rotation.</p>'}</section><section class="v18-columns"><div><header><span>EQUIPMENT INVENTORY</span><b>${s.inventory.length} / 24</b></header><div class="v18-inventory">${gear||'<p>No crafted or purchased gear yet.</p>'}</div></div><div><header><span>ARTIFACT EVOLUTION</span><b>${ownedArtifacts.length} / 6</b></header><div class="v18-artifacts">${artifactsUI||'<p>No artifacts owned.</p>'}</div>${fusion}</div></section><section class="v18-crafting"><header><span>CRAFTING & TRANSMUTATION</span><p>Field Forge works anywhere. Masterwork needs a Forge/Relic dealer/Black Market. Forbidden Craft requires the Black Market and raises local corruption.</p></header><div>${recipeUI}</div></section><section class="v18-contracts"><header><span>CONTRACT BOARD</span><b>${active.length} active</b></header><div>${contractUI}</div><button data-v18-seal-exchange ${w.bountySeals<1?'disabled':''}>EXCHANGE 1 BOUNTY SEAL → 60 CREDITS</button></section><details class="v18-ledger"><summary>Transaction ledger • ${this.state.v18.transactions.length}</summary>${this.state.v18.transactions.slice(-20).reverse().map(tx=>`<p><b>${esc(tx.type.toUpperCase())}</b><span>${esc(tx.name||tx.eventType||'Economy event')} • Tick ${tx.tick}</span></p>`).join('')}</details>`;
  };

  const renderWorldV18=P.renderWorldV16;
  P.renderWorldV16=function(tab=this._v16WorldTab||'overview'){if(tab!=='economy')return renderWorldV18.call(this,tab);const root=document.querySelector('[data-v16-world-body]');if(!root)return;this.ensureV18();this._v16WorldTab='economy';document.querySelectorAll('[data-v16-world-tab]').forEach(button=>button.classList.toggle('active',button.dataset.v16WorldTab==='economy'));root.innerHTML=this.renderEconomyV18();};
  const renderAllV18=P.renderAll;
  P.renderAll=function(){this.ensureV18();const result=renderAllV18.call(this);this.injectV18UI();this.renderEconomyBeaconV18();if(document.getElementById('v16-world-modal')?.classList.contains('open')&&this._v16WorldTab==='economy')this.renderWorldV16('economy');return result;};
  const bindV18=P.bind;
  P.bind=function(){bindV18.call(this);this.injectV18UI();if(this._v18Bound)return;this._v18Bound=true;document.addEventListener('click',event=>{
    if(event.target.closest('[data-v18-economy-open]'))return this.openWorldV16('economy');
    const buy=event.target.closest('[data-v18-buy]');if(buy)return this.buyV18(buy.dataset.v18Buy);
    const equip=event.target.closest('[data-v18-equip]');if(equip)return this.equipGearV18(equip.dataset.v18Equip);
    const sell=event.target.closest('[data-v18-sell-gear]');if(sell)return this.sellGearV18(sell.dataset.v18SellGear);
    const salvage=event.target.closest('[data-v18-salvage]');if(salvage)return this.salvageGearV18(salvage.dataset.v18Salvage);
    const enchant=event.target.closest('[data-v18-enchant]');if(enchant)return this.enchantGearV18(enchant.dataset.v18Enchant);
    const transmute=event.target.closest('[data-v18-transmute]');if(transmute)return this.transmuteGearV18(transmute.dataset.v18Transmute);
    const artifact=event.target.closest('[data-v18-sell-artifact]');if(artifact)return this.sellArtifactV18(artifact.dataset.v18SellArtifact);
    const craft=event.target.closest('[data-v18-craft]');if(craft)return this.craftV18(craft.dataset.v18Craft);
    const contract=event.target.closest('[data-v18-contract]');if(contract)return this.acceptContractV18(contract.dataset.v18Contract);
    if(event.target.closest('[data-v18-fuse]'))return this.fuseArtifactsV18();
    if(event.target.closest('[data-v18-auction]'))return this.bidAuctionV18();
    if(event.target.closest('[data-v18-seal-exchange]'))return this.exchangeSealV18();
  });};
})();
