'use strict';

(function attachV21Integrations(root){
  const D=root.MultiverseDomain;if(!D?.FactionCampaignEngine)return;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const hash32=value=>D.hash32?D.hash32(String(value)):(()=>{let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;})();
  const activeHolds=state=>Object.values(state?.v21?.strongholds||{}).filter(s=>s.playerAligned&&s.status!=='occupied'&&s.status!=='destroyed');
  const facilityLevel=(state,type)=>activeHolds(state).reduce((best,s)=>Math.max(best,Number(state.v21.facilities?.[`${s.id}:${type}`]?.level||0)),0);
  const specialistCount=(state,role)=>Object.values(state?.v21?.specialists||{}).filter(s=>s.role===role&&activeHolds(state).some(h=>h.id===s.strongholdId)).length;
  const support=state=>({
    command:facilityLevel(state,'command'),forge:facilityLevel(state,'forge'),vault:facilityLevel(state,'vault'),medical:facilityLevel(state,'medical'),training:facilityLevel(state,'training'),intelligence:facilityLevel(state,'intelligence'),portal:facilityLevel(state,'portal'),quartermaster:facilityLevel(state,'quartermaster'),embassy:facilityLevel(state,'embassy'),defense:facilityLevel(state,'defense'),
    smith:specialistCount(state,'smith'),relicKeeper:specialistCount(state,'relic-keeper'),medic:specialistCount(state,'field-medic'),intelOfficer:specialistCount(state,'intelligence-officer'),diplomat:specialistCount(state,'diplomat'),trainer:specialistCount(state,'trainer'),portalEngineer:specialistCount(state,'portal-engineer'),archivist:specialistCount(state,'archivist'),defenseCommander:specialistCount(state,'defense-commander'),quartermasterSpecialist:specialistCount(state,'quartermaster')
  });
  D.v21FacilitySupport=support;

  const F=D.FactionCampaignEngine.prototype;
  F.facilitySupport=function(state){return support(state);};
  F.resupplyStronghold=function(state,strongholdId){
    this.ensure(state);const hold=this.stronghold(state,strongholdId);if(!hold||!hold.playerAligned)return{ok:false,error:'Player-aligned stronghold not found.'};if(hold.status==='occupied')return{ok:false,error:'Liberate the stronghold before resupplying it.'};if(hold.supply>=100)return{ok:false,error:'Stronghold supply is already full.'};const s=support(state),discount=Math.min(28,s.quartermaster*6+s.quartermasterSpecialist*5),cost={credits:Math.max(20,70-discount)};if(!this.pay(state,cost))return{ok:false,error:`${cost.credits} Credits required for emergency logistics.`};const before=hold.supply,grant=14+s.quartermaster*5+s.quartermasterSpecialist*4;hold.supply=clamp(hold.supply+grant,0,100);hold.morale=clamp(hold.morale+2+s.quartermaster,0,100);hold.history.push({tick:Number(state.v16?.clock?.tick||0),type:'resupply',before,after:hold.supply});hold.history=hold.history.slice(-40);return{ok:true,stronghold:clone(hold),cost,grant:hold.supply-before};
  };

  if(!F.__v21CampaignSupport){
    const baseCombat=F.campaignCombatModifier;
    F.campaignCombatModifier=function(state){const mod=baseCombat.call(this,state),rec=this.primaryMembership(state),faction=rec?state.v16?.factions?.[rec.factionId]:null,s=support(state);let odds=Number(mod.odds||0)+s.command*.0015,damage=Number(mod.damage||0)+s.command*.0025;if(rec?.rank>=5&&faction){const archetype=String(faction.archetype||'');const technique={guardian:[.006,.006],archivist:[.004,.004],liberator:[.006,.008],imperial:[.005,.007],mystic:[.004,.009],broker:[.007,.003]}[archetype]||[.004,.004];odds+=technique[0];damage+=technique[1];}return{odds:clamp(odds,-.06,.06),damage:clamp(damage,-.08,.08)};};
    const baseProgress=F.progressCampaign;
    F.progressCampaign=function(state,context={}){const result=baseProgress.call(this,state,context),s=support(state);if(result.length&&(s.command||s.archivist)){const bonus=Math.min(4,s.command+(s.archivist?1:0));for(const item of result){const c=this.campaign(state,item.campaignId);if(c?.status==='active')c.momentum=clamp(Number(c.momentum||0)+bonus,-40,40);}}return result;};
    const baseInfiltration=F.resolveInfiltration;
    F.resolveInfiltration=function(state,action,factionId=''){const result=baseInfiltration.call(this,state,action,factionId),s=support(state);if(result?.ok&&s.intelOfficer){const id=String(factionId||Object.keys(state.v21.infiltration||{}).find(k=>!state.v21.infiltration[k].discovered)||''),inf=state.v21.infiltration?.[id];if(inf){if(result.success)inf.intel=clamp(inf.intel+Math.min(8,s.intelOfficer*3),0,100);else inf.suspicion=clamp(inf.suspicion-Math.min(8,s.intelOfficer*3),0,100);result.infiltration=clone(inf);}}return result;};
    const baseDiplomacy=F.diplomacyOptions;
    F.diplomacyOptions=function(state,factionId){const options=baseDiplomacy.call(this,state,factionId),s=support(state),primary=state.v21?.primaryFactionId,ours=state.v16?.factions?.[primary],target=state.v16?.factions?.[String(factionId||'')],rec=primary?this.membership(state,primary):null;if(!s.diplomat||!ours||!target||!rec)return options;const relation=Number(ours.relations?.[target.id]||0),authority=rec.authority+s.diplomat*5;for(const o of options){if(o.id==='alliance'&&relation>=25&&authority>=35)o.available=true;if(o.id==='ceasefire'&&relation<=-20&&authority>=20)o.available=true;}return options;};
    const baseWorld=F.processWorldTick;
    F.processWorldTick=function(state){const result=baseWorld.call(this,state);if(state.v21)state.v21.lastWorldTick=Number(state.v16?.clock?.tick||0);return result;};
    F.catchUp=function(state,maxTicks=6){this.ensure(state);const current=Number(state.v16?.clock?.tick||0);if(!Number.isFinite(state.v21.lastWorldTick)){state.v21.lastWorldTick=current;return{ticks:0,from:current,to:current};}const previous=Math.max(0,Number(state.v21.lastWorldTick||0));if(current<=previous)return{ticks:0,from:previous,to:current};const start=Math.max(previous+1,current-Math.max(1,Number(maxTicks||6))+1),original=current;let ticks=0;for(let t=start;t<=current;t++){state.v16.clock.tick=t;baseWorld.call(this,state);ticks++;}state.v16.clock.tick=original;state.v21.lastWorldTick=current;return{ticks,from:start,to:current};};
    F.__v21CampaignSupport=true;
  }

  if(D.RelicMasteryEngine&&!D.RelicMasteryEngine.prototype.__v21StrongholdSupport){
    const R=D.RelicMasteryEngine.prototype;
    const factionEligible=(engine,state,setId)=>{if(!String(setId).startsWith('faction:'))return true;const factionId=String(setId).slice(8),m=state.v21?.memberships?.[factionId],f=state.v16?.factions?.[factionId],s=support(state);return Boolean(m&&['member','allied'].includes(m.status)&&Number(m.rank||0)>=4&&Number(f?.reputation||0)>=35&&(Number(state.v21?.stats?.campaignsWon||0)>=1||s.forge>=1||s.smith>=1));};
    const baseSets=R.availableSets;
    R.availableSets=function(state){const list=baseSets.call(this,state).filter(x=>factionEligible(this,state,x.id)),primary=state.v21?.primaryFactionId,setId=primary?`faction:${primary}`:'';if(setId&&factionEligible(this,state,setId)&&!list.some(x=>x.id===setId)){const def=this.setDefinition(state,setId);if(def)list.push({id:setId,...def});}return list;};
    const baseForge=R.forgeSetPiece;
    R.forgeSetPiece=function(state,setId,slot='weapon'){if(!factionEligible(this,state,setId))return{ok:false,error:'Faction Regalia requires Veteran rank plus campaign or stronghold Forge access.'};const result=baseForge.call(this,state,setId,slot);if(!result?.ok)return result;const s=support(state),econ=new D.EconomyCraftingEngine(),refund={salvage:Math.min(9,s.forge*2+s.smith*2),cosmicFragments:s.forge>=3||s.smith>=2?1:0};for(const [key,value] of Object.entries(refund))if(value>0)econ.addCurrency(state,key,value);result.v21Refund=refund;if(String(setId).startsWith('faction:')&&slot==='weapon'){const factionId=String(setId).slice(8),m=state.v21?.memberships?.[factionId];if(Number(m?.rank||0)>=6&&(s.forge>=2||s.smith)){const item=(state.lootInventory||[]).find(x=>x.id===result.item.id);if(item&&!item.tags.includes('faction-signature-ready'))item.tags.push('faction-signature-ready');result.item=clone(item);}}return result;};
    const baseReforge=R.reforgeSet;
    R.reforgeSet=function(state,itemId,setId){if(!factionEligible(this,state,setId))return{ok:false,error:'That faction set is not authorized at your current rank.'};const result=baseReforge.call(this,state,itemId,setId);if(!result?.ok)return result;const s=support(state),econ=new D.EconomyCraftingEngine(),refund={salvage:Math.min(6,s.forge+s.smith*2),cosmicFragments:s.forge>=3?1:0};for(const [key,value] of Object.entries(refund))if(value>0)econ.addCurrency(state,key,value);result.v21Refund=refund;return result;};
    const baseMastery=R.gainGearMastery;
    R.gainGearMastery=function(state,context={}){const leveled=baseMastery.call(this,state,context),s=support(state);if(context.outcome==='loss'||String(context.type)!=='training'||(!s.training&&!s.trainer))return leveled;const bonus=Math.min(10,2+s.training*2+s.trainer*2),equipped=new Set(Object.values(state.equipment||{}));for(const item of (state.lootInventory||[]).filter(i=>equipped.has(i.id))){const r=this.gearRecord(state,item);r.xp+=bonus;while(r.level<10&&r.xp>=this.masteryThreshold(r.level)){r.xp-=this.masteryThreshold(r.level);r.level++;state.v20.stats.masteryLevels++;leveled.push({id:r.id,level:r.level,name:this.displayName(state,item),v21Training:true});}if(r.level>=10&&!r.awakened){r.awakened=true;state.v20.stats.awakenedGear++;this.chronicle(state,'gear-awakened',`${this.displayName(state,item)} awakened`,'Stronghold training completed the mastery path.');}}return leveled;};
    const baseProgressRelics=R.progressRelics;
    R.progressRelics=function(state,context={}){const result=baseProgressRelics.call(this,state,context),s=support(state);if((s.vault<2&&!s.archivist)||context.outcome==='loss')return result;for(const id of state.artifacts||[]){const r=this.relicRecord(state,id),q=r.quest;if(q?.status!=='active'||!q.events.includes(String(context.type||''))||q.progress>=q.target)continue;const threshold=Math.min(75,s.vault*16+s.archivist*14),roll=hash32(`${state.seed}|v21|vault-quest|${state.spin}|${id}|${context.type}`)%100;if(roll>=threshold)continue;q.progress=Math.min(q.target,q.progress+1);if(q.progress>=q.target){q.status='completed';r.bond=clamp(r.bond+10,0,100);r.purity=clamp(r.purity+6,0,100);state.v20.stats.relicQuests++;result.completed.push(clone(r));this.chronicle(state,'relic-quest',`${r.name}: ${q.label} complete`,'Relic Vault research accelerated the final step.');const evo=state.v18?.artifactEvolution?.[id];if(!r.awakened&&r.bond>=80&&r.purity>=55&&(Number(evo?.level||1)>=4||q.status==='completed')){r.awakened=true;state.v20.stats.relicAwakenings++;result.awakened.push(clone(r));}}}return result;};
    const basePurify=R.purify;
    R.purify=function(state,id){const result=basePurify.call(this,state,id);if(!result?.ok)return result;const s=support(state),r=state.v20?.relics?.[id];if(r&&(s.vault||s.relicKeeper)){const extra=4*s.vault+3*s.relicKeeper;r.corruption=clamp(r.corruption-extra,0,100);r.purity=clamp(r.purity+Math.min(12,s.vault*3+s.relicKeeper*2),0,100);result.relic=clone(r);result.v21VaultBonus=extra;}return result;};
    const baseSteal=R.maybeSteal;
    R.maybeSteal=function(state,context={}){const s=support(state);if(!context.forceTheft&&(s.vault||s.relicKeeper)){const protection=Math.min(62,s.vault*16+s.relicKeeper*12),roll=hash32(`${state.seed}|v21|vault-theft|${state.spin}|${context.enemyId||''}`)%100;if(roll<protection)return null;}return baseSteal.call(this,state,context);};
    R.__v21StrongholdSupport=true;
  }

  if(D.PartyConsequencesEngine&&!D.PartyConsequencesEngine.prototype.__v21MedicalSupport){
    const P=D.PartyConsequencesEngine.prototype,baseWound=P.wound,baseHeal=P.healWound;
    P.wound=function(state,id,severity='minor',cause='Hard encounter'){const s=support(state);let adjusted=severity;if(severity==='severe'&&(s.medical||s.medic)){const chance=Math.min(55,s.medical*13+s.medic*12),roll=hash32(`${state.seed}|v21|medical|${state.spin}|${id}|${cause}`)%100;if(roll<chance)adjusted='minor';}const wound=baseWound.call(this,state,id,adjusted,cause);if(wound&&adjusted!==severity)wound.v21PreventedSeverity=severity;return wound;};
    P.healWound=function(state,id){const result=baseHeal.call(this,state,id);if(!result?.ok)return result;const s=support(state);if(s.medical||s.medic){this.changeMorale(state,Math.min(10,s.medical*2+s.medic*2),'Stronghold medical support accelerated recovery');this.adjust(state,id,{fear:-Math.min(6,s.medical+s.medic),trust:Math.min(3,s.medic)},'Stronghold medical follow-up');result.v21RecoveryBonus=s.medical*2+s.medic*2;}return result;};
    P.__v21MedicalSupport=true;
  }

  if(D.RealityRulesEngine&&!D.RealityRulesEngine.prototype.__v21PortalSupport){
    const R=D.RealityRulesEngine.prototype,baseRefresh=R.refreshUnlocks;
    R.refreshUnlocks=function(state){const routes=baseRefresh.call(this,state),s=support(state),capacity=Math.min(4,s.portal+(s.portalEngineer?1:0));if(!capacity||!state.v21)return routes;state.v21.portalUnlocks=Array.isArray(state.v21.portalUnlocks)?state.v21.portalUnlocks:[];while(state.v21.portalUnlocks.length<capacity){const hidden=Object.values(state.v17?.routes||{}).flat().filter(r=>!r.unlocked&&!state.v21.portalUnlocks.includes(r.routeId));if(!hidden.length)break;const route=hidden[hash32(`${state.seed}|v21|portal|${state.v21.portalUnlocks.length}|${hidden.length}`)%hidden.length];route.unlocked=true;route.discovered=true;route.v21PortalUnlocked=true;state.v17.stats.secretsFound++;if(!state.v17.wheel.secretDiscoveries.includes(route.routeId))state.v17.wheel.secretDiscoveries.push(route.routeId);state.v21.portalUnlocks.push(route.routeId);}return routes;};
    R.__v21PortalSupport=true;
  }

  if(D.EconomyCraftingEngine&&!D.EconomyCraftingEngine.prototype.__v21QuartermasterSupport){
    const E=D.EconomyCraftingEngine.prototype,baseMarket=E.rotateMarket;
    E.rotateMarket=function(state,artifacts=[]){const market=baseMarket.call(this,state,artifacts),s=support(state);if((s.quartermaster>=2||s.quartermasterSpecialist)&&market&&!market.offers.some(o=>o.v21Logistics)){const level=Math.max(s.quartermaster,s.quartermasterSpecialist?1:0);market.offers.push({offerId:`v21-logistics-${market.rotation}`,kind:'material',name:'Faction Logistics Crate',rarity:'rare',price:Math.max(35,75-level*10),currency:'credits',grant:{salvage:5+level*2},v21Logistics:true});}return market;};
    E.__v21QuartermasterSupport=true;
  }

  const Wheel=root.MultiverseWheel?.prototype;
  if(Wheel&&!Wheel.__v21Integration){
    Wheel.applyFactionWheelPressureV21=function(){
      if(!this.state?.v21||typeof this.replaceWheelSliceV17!=='function')return false;const next=Number(this.state.spin||0)+1,protectedBeat=next===1||[10,20,30].includes(next)||this.state.v13?.runContext?.kind==='daily';if(protectedBeat)return false;const engine=new D.FactionCampaignEngine();engine.ensure(this.state);const campaign=engine.activeCampaign(this.state),siege=Object.values(this.state.v21.strongholds||{}).find(s=>s.playerAligned&&s.underSiege),supported=new Set(['battle','power','transform','training','recruit','artifact','rare','recovery','hazard']),wanted=[];if(siege)wanted.push('battle','hazard');if(campaign?.phase==='operations'){const objective=campaign.objectives?.[campaign.phaseIndex];for(const type of objective?.events||[])if(supported.has(type))wanted.push(type);}const used=new Set();let changed=false;for(const type of [...new Set(wanted)].slice(0,2))changed=this.replaceWheelSliceV17(type,used)||changed;if(changed){const label=siege?'Stronghold Defense':campaign?campaign.label:'Faction Mobilization';this.state.v21.wheelCurrent={label,types:[...new Set(wanted)].slice(0,2),spin:next};this.save();this.drawWheel();}return changed;
    };
    const baseGenerate=Wheel.generateWheel;
    Wheel.generateWheel=function(){const result=baseGenerate.call(this);this.applyFactionWheelPressureV21();return result;};
    const baseLoad=Wheel.loadState;
    Wheel.loadState=function(){const state=baseLoad.call(this);if(state?.v21)new D.FactionCampaignEngine().catchUp(state,6);return state;};
    Wheel.resupplyStrongholdV21=function(id){const result=new D.FactionCampaignEngine().resupplyStronghold(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`LOGISTICS: ${result.stronghold.name} gained ${Math.round(result.grant)} supply for ${result.cost.credits} Credits.`,'win');this.save();this.renderAll();if(document.getElementById('v16-world-modal')?.classList.contains('open')){this._v21FactionTab='strongholds';this.renderWorldV16('factions');}};
    if(typeof Wheel.renderFactionStrongholdsV21==='function'){
      const baseRender=Wheel.renderFactionStrongholdsV21;
      Wheel.renderFactionStrongholdsV21=function(){const html=baseRender.call(this),holds=activeHolds(this.state);if(!holds.length)return html;return`${html}<section class="v21-build-strip v21-logistics"><span>FACTION LOGISTICS</span><h4>Emergency resupply</h4><p>Quartermaster facilities and specialists reduce cost and improve supply delivered.</p>${holds.map(h=>`<button data-v21-resupply="${String(h.id).replace(/"/g,'&quot;')}">${String(h.name).replace(/</g,'&lt;')} • Supply ${Math.round(h.supply)}</button>`).join('')}</section>`;};
    }
    const baseBind=Wheel.bind;
    Wheel.bind=function(){baseBind.call(this);if(this._v21IntegrationBound)return;this._v21IntegrationBound=true;document.addEventListener('click',event=>{const button=event.target.closest('[data-v21-resupply]');if(button)this.resupplyStrongholdV21(button.dataset.v21Resupply);});};
    Wheel.__v21Integration=true;
  }

  if(typeof module!=='undefined'&&module.exports)module.exports={v21FacilitySupport:support};
})(typeof globalThis!=='undefined'?globalThis:window);
