'use strict';

(function attachV21RuntimeFixes(root){
  const D=root.MultiverseDomain;
  const Wheel=root.MultiverseWheel?.prototype;
  if(!D?.FactionCampaignEngine||!Wheel)return;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const activeHolds=state=>Object.values(state?.v21?.strongholds||{}).filter(s=>s.playerAligned&&s.status!=='occupied'&&s.status!=='destroyed');
  const facilityLevel=(state,type)=>activeHolds(state).reduce((best,s)=>Math.max(best,Number(state.v21?.facilities?.[`${s.id}:${type}`]?.level||0)),0);
  const specialistCount=(state,role)=>Object.values(state?.v21?.specialists||{}).filter(s=>s.role===role&&activeHolds(state).some(h=>h.id===s.strongholdId)).length;
  const support=state=>({
    command:facilityLevel(state,'command'),forge:facilityLevel(state,'forge'),vault:facilityLevel(state,'vault'),medical:facilityLevel(state,'medical'),training:facilityLevel(state,'training'),intelligence:facilityLevel(state,'intelligence'),portal:facilityLevel(state,'portal'),quartermaster:facilityLevel(state,'quartermaster'),embassy:facilityLevel(state,'embassy'),defense:facilityLevel(state,'defense'),
    smith:specialistCount(state,'smith'),relicKeeper:specialistCount(state,'relic-keeper'),medic:specialistCount(state,'field-medic'),intelOfficer:specialistCount(state,'intelligence-officer'),diplomat:specialistCount(state,'diplomat'),trainer:specialistCount(state,'trainer'),portalEngineer:specialistCount(state,'portal-engineer'),archivist:specialistCount(state,'archivist'),defenseCommander:specialistCount(state,'defense-commander'),quartermasterSpecialist:specialistCount(state,'quartermaster')
  });

  // Browser scripts historically use a free clamp() helper. Keep V21 wrappers safe
  // even on pages where the base shell does not expose one globally.
  if(typeof root.clamp!=='function')root.clamp=clamp;
  if(typeof D.v21FacilitySupport!=='function')D.v21FacilitySupport=support;

  // V21 ensure must remain migration-idempotent, but newly recruited/seeded party
  // members still need V19 relationship records. Backfill only missing records;
  // do not replay the V18→V20 migration chain.
  if(typeof Wheel.ensureV21==='function'&&!Wheel.__v21PartyBackfill){
    const baseEnsure=Wheel.ensureV21;
    Wheel.ensureV21=function(state=this.state){
      const result=baseEnsure.call(this,state);
      if(state?.v19&&D.PartyConsequencesEngine){
        const party=new D.PartyConsequencesEngine();
        const roster=new Map(Array.from(root.CHAR?.values?.()||[]).map(c=>[String(c.id),c]));
        for(const id of state.party||[])if(id&&!state.v19.records?.[id])party.record(state,id,roster.get(String(id))||{});
      }
      return result;
    };
    Wheel.__v21PartyBackfill=true;
  }

  const F=D.FactionCampaignEngine.prototype;
  if(typeof F.facilitySupport!=='function')F.facilitySupport=function(state){return support(state);};
  if(typeof F.resupplyStronghold!=='function')F.resupplyStronghold=function(state,strongholdId){
    this.ensure(state);const hold=this.stronghold(state,strongholdId);if(!hold||!hold.playerAligned)return{ok:false,error:'Player-aligned stronghold not found.'};if(hold.status==='occupied')return{ok:false,error:'Liberate the stronghold before resupplying it.'};if(hold.supply>=100)return{ok:false,error:'Stronghold supply is already full.'};const s=support(state),discount=Math.min(28,s.quartermaster*6+s.quartermasterSpecialist*5),cost={credits:Math.max(20,70-discount)};if(!this.pay(state,cost))return{ok:false,error:`${cost.credits} Credits required for emergency logistics.`};const before=hold.supply,grant=14+s.quartermaster*5+s.quartermasterSpecialist*4;hold.supply=clamp(hold.supply+grant,0,100);hold.morale=clamp(hold.morale+2+s.quartermaster,0,100);hold.history=Array.isArray(hold.history)?hold.history:[];hold.history.push({tick:Number(state.v16?.clock?.tick||0),type:'resupply',before,after:hold.supply});hold.history=hold.history.slice(-40);return{ok:true,stronghold:JSON.parse(JSON.stringify(hold)),cost,grant:hold.supply-before};
  };

  if(typeof Wheel.applyFactionWheelPressureV21!=='function'){
    Wheel.applyFactionWheelPressureV21=function(){
      if(!this.state?.v21||typeof this.replaceWheelSliceV17!=='function')return false;
      const next=Number(this.state.spin||0)+1,protectedBeat=next===1||[10,20,30].includes(next)||this.state.v13?.runContext?.kind==='daily';if(protectedBeat){this.state.v21.wheelCurrent=null;return false;}
      const engine=new D.FactionCampaignEngine();engine.ensure(this.state);const campaign=engine.activeCampaign(this.state),siege=activeHolds(this.state).find(s=>s.underSiege),supported=new Set(['battle','power','transform','training','recruit','artifact','rare','recovery','hazard']),wanted=[];
      if(siege)wanted.push('battle','hazard');if(campaign?.phase==='operations'){const objective=campaign.objectives?.[campaign.phaseIndex];for(const type of objective?.events||[])if(supported.has(type))wanted.push(type);}
      const used=new Set();let changed=false;for(const type of [...new Set(wanted)].slice(0,2))changed=this.replaceWheelSliceV17(type,used)||changed;
      if(changed){this.state.v21.wheelCurrent={label:siege?'Stronghold Defense':campaign?.label||'Faction Mobilization',types:[...new Set(wanted)].slice(0,2),spin:next};this.save();this.drawWheel?.();}
      return changed;
    };
    const baseGenerate=Wheel.generateWheel;
    if(typeof baseGenerate==='function')Wheel.generateWheel=function(){const result=baseGenerate.call(this);this.applyFactionWheelPressureV21();return result;};
  }

  if(typeof Wheel.resupplyStrongholdV21!=='function')Wheel.resupplyStrongholdV21=function(id){const result=new D.FactionCampaignEngine().resupplyStronghold(this.state,id);if(!result.ok)return this.toast(result.error);this.log(`LOGISTICS: ${result.stronghold.name} gained ${Math.round(result.grant)} supply for ${result.cost.credits} Credits.`,'win');this.save();this.renderAll();if(root.document?.getElementById('v16-world-modal')?.classList.contains('open')){this._v21FactionTab='strongholds';this.renderWorldV16?.('factions');}};

  if(typeof Wheel.renderFactionStrongholdsV21==='function'&&!Wheel.__v21LogisticsRender){
    const baseRender=Wheel.renderFactionStrongholdsV21;
    Wheel.renderFactionStrongholdsV21=function(){const html=baseRender.call(this);if(String(html).includes('v21-logistics'))return html;const holds=activeHolds(this.state);if(!holds.length)return html;return`${html}<section class="v21-build-strip v21-logistics"><span>FACTION LOGISTICS</span><h4>Emergency resupply</h4><p>Quartermaster facilities and specialists reduce cost and improve supply delivered.</p>${holds.map(h=>`<button type="button" data-v21-resupply="${esc(h.id)}">${esc(h.name)} • Supply ${Math.round(h.supply)}</button>`).join('')}</section>`;};
    Wheel.__v21LogisticsRender=true;
  }

  if(typeof Wheel.bind==='function'&&!Wheel.__v21RuntimeFixBind){
    const baseBind=Wheel.bind;
    Wheel.bind=function(){baseBind.call(this);if(this._v21RuntimeFixBound)return;this._v21RuntimeFixBound=true;root.document?.addEventListener('click',event=>{const button=event.target?.closest?.('[data-v21-resupply]');if(button)this.resupplyStrongholdV21(button.dataset.v21Resupply);});};
    Wheel.__v21RuntimeFixBind=true;
  }
})(typeof globalThis!=='undefined'?globalThis:window);
