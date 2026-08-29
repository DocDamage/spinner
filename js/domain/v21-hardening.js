'use strict';

(function hardenV21WorldTicks(root){
  const D=root.MultiverseDomain;
  if(!D?.FactionCampaignEngine)return;
  const P=D.FactionCampaignEngine.prototype;
  if(P.__v21TickHardening)return;

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const hash32=value=>{
    if(D.hash32)return D.hash32(String(value));
    let h=2166136261;
    for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return h>>>0;
  };
  const tick=state=>Number(state.v16?.clock?.tick||0);
  const rngFrom=key=>{
    let x=hash32(key)||0x9e3779b9;
    return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
  };

  P.prepareWorldTickV21=function(state){
    if(!state?.v21||Number(state.v21.schemaVersion)!==21||!state.v16){
      this.ensure(state);
      return state.v21;
    }
    const v=state.v21;
    v.processedEvents=Array.isArray(v.processedEvents)?v.processedEvents:[];
    v.fronts=v.fronts&&typeof v.fronts==='object'?v.fronts:{};
    v.territories=v.territories&&typeof v.territories==='object'?v.territories:{};
    v.strongholds=v.strongholds&&typeof v.strongholds==='object'?v.strongholds:{};
    v.facilities=v.facilities&&typeof v.facilities==='object'?v.facilities:{};
    v.specialists=v.specialists&&typeof v.specialists==='object'?v.specialists:{};
    v.campaigns=v.campaigns&&typeof v.campaigns==='object'?v.campaigns:{};
    // Newly hostile V16 relations may create a front between load-time ensures.
    // This is a small 6-faction pass and does not re-run migrations or V17 routes.
    this.ensureFronts(state);
    return v;
  };

  P.advanceFronts=function(state){
    const v=this.prepareWorldTickV21(state),currentTick=tick(state),results=[];
    for(const front of Object.values(v.fronts)){
      if(front.status!=='active'||Number(front.lastResolvedTick||0)>=currentTick)continue;
      const attacker=state.v16.factions?.[front.attackerId],defender=state.v16.factions?.[front.defenderId];
      if(!attacker||!defender)continue;
      const rng=rngFrom(`${state.seed}|v21|front|${front.id}|${currentTick}`);
      const advance=((Number(attacker.resources||0)-Number(defender.resources||0))/100)*4+(rng()-.5)*5;
      front.pressure=clamp(Number(front.pressure||50)+advance,10,90);
      front.supply=clamp(Number(front.supply||60)+(rng()-.48)*4,15,100);
      front.morale=clamp(Number(front.morale||60)+(rng()-.5)*3,20,100);
      front.lastResolvedTick=currentTick;
      const territory=this.territory(state,front.territoryId);
      if(territory){
        territory.contested=true;
        territory.supply=clamp(Number(territory.supply||50)+(front.pressure>65?-2:front.pressure<35?2:0),10,100);
      }
      results.push(JSON.parse(JSON.stringify(front)));
    }
    return results;
  };

  P.processWorldTick=function(state){
    const v=this.prepareWorldTickV21(state),current=tick(state),key=`world:${current}`;
    if(v.processedEvents.includes(key))return null;
    v.processedEvents.push(key);
    if(v.processedEvents.length>240)v.processedEvents=v.processedEvents.slice(-240);

    this.advanceFronts(state);
    const changed=[];
    for(const stronghold of Object.values(v.strongholds)){
      if(!stronghold.playerAligned)continue;
      const territory=this.territory(state,stronghold.territoryId);
      const hostile=Boolean(territory?.controllerFactionId&&territory.controllerFactionId!==stronghold.ownerFactionId);
      if(stronghold.underSiege||hostile){
        const loss=Math.min(4,1+(hash32(`${state.seed}|hold|${stronghold.id}|${current}`)%4));
        stronghold.integrity=clamp(Number(stronghold.integrity||0)-loss,1,100);
        stronghold.supply=clamp(Number(stronghold.supply||0)-2,5,100);
        stronghold.status=stronghold.integrity<30?'compromised':stronghold.underSiege?'under-siege':'threatened';
        changed.push(stronghold.id);
      }else{
        stronghold.integrity=clamp(Number(stronghold.integrity||0)+1+this.facilityLevel(state,stronghold.id,'defense'),1,100);
        stronghold.supply=clamp(Number(stronghold.supply||0)+1+this.facilityLevel(state,stronghold.id,'quartermaster'),5,100);
        if(stronghold.integrity>=55)stronghold.status='safe';
      }
    }

    for(const campaign of Object.values(v.campaigns)){
      if(campaign.status!=='active')continue;
      campaign.lastTick=current;
      if(campaign.phase==='operations')campaign.momentum=clamp(Number(campaign.momentum||0)-1,-40,40);
    }
    this.syncNemeses(state);
    return{tick:current,strongholdsChanged:changed};
  };

  P.__v21TickHardening=true;
  if(typeof module!=='undefined'&&module.exports)module.exports={hardened:true};
})(typeof globalThis!=='undefined'?globalThis:window);
