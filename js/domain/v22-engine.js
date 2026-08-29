'use strict';

(function attachV22Engine(root){
  const V22_SCHEMA_VERSION=22;
  const NEED_DEFS={
    refugees:{label:'Refugee Influx',events:['recovery','travel','recruit'],target:2},
    food:{label:'Food Shortage',events:['recovery','travel','rare'],target:2},
    housing:{label:'Housing Crisis',events:['training','travel','recovery'],target:2},
    health:{label:'Medical Emergency',events:['recovery','training'],target:2},
    security:{label:'Civilian Security',events:['battle','boss'],target:2,requiredOutcome:'win'},
    infrastructure:{label:'Infrastructure Damage',events:['training','artifact','travel'],target:2},
    prosperity:{label:'Local Economy Shock',events:['rare','travel','faction-quest'],target:2}
  };
  const ACTIONS={
    aid:{label:'Emergency Aid',cost:{credits:90},effects:{food:16,health:8,morale:6,prosperity:2,opinion:7}},
    rebuild:{label:'Rebuild District',cost:{credits:140,salvage:18},effects:{infrastructure:18,housing:14,prosperity:5,morale:3,opinion:5}},
    medical:{label:'Medical Relief',cost:{credits:70,salvage:6},effects:{health:20,morale:5,opinion:6}},
    'relief-route':{label:'Open Relief Route',cost:{credits:110,salvage:8},effects:{food:10,security:7,prosperity:10,opinion:6}},
    resettle:{label:'Resettle Refugees',cost:{credits:120,salvage:12},effects:{housing:-4,morale:8,prosperity:3,opinion:9},requiresDisplaced:true}
  };
  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const normalize=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'unknown';
  const hash32=value=>{if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const rngFrom=key=>{let x=hash32(key)||0x9e3779b9;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};};
  const tick=state=>Number(state.v16?.clock?.tick||0);
  const worldName=state=>String(state.v16?.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime');
  const basePopulation=type=>({metropolis:3600,sanctuary:1400,crossroads:950,archive:620,warfront:360,laboratory:520,arena:760,shrine:580,'black-market':720,'fracture-zone':320}[String(type||'')]||650);

  class SettlementEngine{
    ensure(state={},artifacts=[],roster=[]){
      const needsBaseMigration=Number(state.v22?.schemaVersion||0)<V22_SCHEMA_VERSION;
      if(needsBaseMigration&&root.MultiverseDomain?.migrateV21)root.MultiverseDomain.migrateV21(state,artifacts,roster);
      state.v22||={};const v=state.v22;
      v.schemaVersion=V22_SCHEMA_VERSION;state.v22Version=V22_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V22_SCHEMA_VERSION);
      v.settlements=v.settlements&&typeof v.settlements==='object'?v.settlements:{};
      v.sanctuaries=v.sanctuaries&&typeof v.sanctuaries==='object'?v.sanctuaries:{};
      v.requests=v.requests&&typeof v.requests==='object'?v.requests:{};
      v.processedEvents=Array.isArray(v.processedEvents)?v.processedEvents.slice(-260):[];
      v.lastWorldTick=Math.max(0,Number(v.lastWorldTick??tick(state)));
      v.stats={aidActions:0,rebuilds:0,medicalRelief:0,reliefRoutes:0,resettled:0,displacedCreated:0,sanctuariesBuilt:0,requestsCompleted:0,civiliansHelped:0,...(v.stats||{})};
      v.settings={civilianHints:true,autoRefugeeTransfer:true,...(v.settings||{})};
      v.ending=v.ending||null;
      this.ensureSettlements(state);
      for(const settlement of Object.values(v.settlements))this.normalizeSettlement(state,settlement);
      for(const settlement of Object.values(v.settlements))if(!Object.values(v.requests).some(r=>r.settlementId===settlement.id))this.ensureRequest(state,settlement.id);
      if(needsBaseMigration)v.lastWorldTick=tick(state);
      return state;
    }

    ensureSettlements(state){
      const territories=Object.values(state.v21?.territories||{});
      for(const territory of territories){
        const id=String(territory.id),old=state.v22.settlements[id];if(old)continue;
        const rng=rngFrom(`${state.seed}|v22|settlement|${id}`),pressure=this.territoryPressure(state,territory),population=Math.max(80,Math.round(basePopulation(territory.type)*(.78+rng()*.5)));
        state.v22.settlements[id]={
          id,territoryId:id,universe:String(territory.universe||worldName(state)),locationId:String(territory.locationId||'crossroads'),name:`${this.locationLabel(territory.locationId)} Community`,population,displaced:Math.round(population*(pressure/100)*(.01+rng()*.025)),
          food:clamp(Math.round(68+rng()*20-pressure*.18),20,100),housing:clamp(Math.round(66+rng()*22-pressure*.15),20,100),health:clamp(Math.round(72+rng()*18-pressure*.13),20,100),security:clamp(Math.round(62+Number(territory.fortification||0)*.28-pressure*.28+rng()*12),15,100),prosperity:clamp(Math.round(58+Number(territory.supply||50)*.28-pressure*.18+rng()*14),15,100),morale:clamp(Math.round(64+Number(territory.stability||60)*.18-pressure*.22+rng()*12),15,100),infrastructure:clamp(Math.round(62+Number(territory.stability||60)*.22-pressure*.18+rng()*12),15,100),
          playerOpinion:0,factionOpinion:{},status:'stable',lastTick:tick(state),history:[]
        };
      }
      return state.v22.settlements;
    }

    normalizeSettlement(state,s){
      const territory=state.v21?.territories?.[s.territoryId];s.universe=String(s.universe||territory?.universe||worldName(state));s.locationId=String(s.locationId||territory?.locationId||'crossroads');s.name=String(s.name||`${this.locationLabel(s.locationId)} Community`).slice(0,80);
      s.population=Math.max(0,Math.round(Number(s.population||0)));s.displaced=Math.max(0,Math.round(Number(s.displaced||0)));
      for(const key of ['food','housing','health','security','prosperity','morale','infrastructure'])s[key]=clamp(s[key]??60,0,100);
      s.playerOpinion=clamp(s.playerOpinion||0,-100,100);s.factionOpinion=s.factionOpinion&&typeof s.factionOpinion==='object'?s.factionOpinion:{};s.history=Array.isArray(s.history)?s.history.slice(-50):[];s.lastTick=Math.max(0,Number(s.lastTick||0));s.status=this.status(s);return s;
    }

    locationLabel(value){return String(value||'Crossroads').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
    settlement(state,id){return state.v22?.settlements?.[String(id||'')]||null;}
    currentTerritory(state){
      const territories=Object.values(state.v21?.territories||{}),world=worldName(state),key=normalize(world),current=state.v17?.currentLocation?.[key]||state.v17?.currentLocation?.[world];
      return territories.find(t=>String(t.universe)===world&&current&&String(t.locationId)===String(current))||territories.find(t=>String(t.universe)===world)||territories[0]||null;
    }
    currentSettlement(state){const t=this.currentTerritory(state);return t?this.settlement(state,t.id):null;}
    territoryPressure(state,territory){
      if(!territory)return 0;const world=Object.values(state.v16?.universes||{}).find(w=>String(w.name||w.id)===String(territory.universe))||{},front=Object.values(state.v21?.fronts||{}).find(f=>f.territoryId===territory.id&&f.status==='active'),hold=Object.values(state.v21?.strongholds||{}).find(s=>s.territoryId===territory.id&&s.underSiege);
      return clamp((territory.contested?18:0)+(100-Number(territory.stability||60))*.22+(100-Number(territory.supply||60))*.12+Number(world.threat||0)*.22+Number(world.corruption||0)*.18+(front?Math.max(0,Number(front.pressure||50)-45)*.35:0)+(hold?18:0),0,100);
    }
    status(s){const critical=Math.min(s.food,s.housing,s.health,s.security,s.infrastructure),ratio=s.population?Math.min(1,s.displaced/Math.max(1,s.population)):0;if(s.population===0)return'evacuated';if(critical<25||ratio>.28)return'crisis';if(critical<45||ratio>.14)return'strained';if(s.prosperity>70&&s.morale>70&&critical>60)return'thriving';return'recovering';}
    need(s){
      const candidates=[['refugees',s.population?100*s.displaced/Math.max(1,s.population):0],['food',100-s.food],['housing',100-s.housing],['health',100-s.health],['security',100-s.security],['infrastructure',100-s.infrastructure],['prosperity',100-s.prosperity]].sort((a,b)=>b[1]-a[1]);
      const [id,severity]=candidates[0];return{id,label:NEED_DEFS[id].label,severity:clamp(Math.round(severity),0,100)};
    }
    settlementHistory(state,s,type,detail){s.history.push({tick:tick(state),spin:Number(state.spin||0),type,detail:String(detail||'').slice(0,220)});s.history=s.history.slice(-50);}

    ensureRequest(state,settlementId){
      const s=this.settlement(state,settlementId);if(!s)return null;const active=Object.values(state.v22.requests).find(r=>r.settlementId===s.id&&r.status==='active');if(active)return active;const need=this.need(s),def=NEED_DEFS[need.id],index=Object.keys(state.v22.requests).length,id=`civ-${hash32(`${state.seed}|${s.id}|${need.id}|${index}`).toString(36)}`;
      const request=state.v22.requests[id]={id,settlementId:s.id,needId:need.id,label:def.label,events:def.events.slice(),requiredOutcome:def.requiredOutcome||'',target:def.target,progress:0,status:'active',createdTick:tick(state),completedTick:0};return request;
    }
    request(state,id){return state.v22?.requests?.[String(id||'')]||null;}
    activeRequest(state,settlementId){return Object.values(state.v22?.requests||{}).find(r=>r.settlementId===settlementId&&r.status==='active')||null;}
    progressRequests(state,context={}){
      const results=[];for(const r of Object.values(state.v22.requests||{})){if(r.status!=='active')continue;if(context.settlementId&&r.settlementId!==context.settlementId)continue;if(!r.events.includes(String(context.type||'')))continue;if(r.requiredOutcome&&context.outcome!==r.requiredOutcome)continue;if(['loss','failed'].includes(String(context.outcome||'')))continue;r.progress=clamp(r.progress+Math.max(1,Number(context.amount||1)),0,r.target);let completed=false;if(r.progress>=r.target){r.status='completed';r.completedTick=tick(state);state.v22.stats.requestsCompleted++;completed=true;const s=this.settlement(state,r.settlementId);if(s){s.playerOpinion=clamp(s.playerOpinion+8,-100,100);s.morale=clamp(s.morale+7,0,100);s.prosperity=clamp(s.prosperity+4,0,100);this.settlementHistory(state,s,'request-complete',`${r.label} resolved through normal Wheel play.`);}}
        results.push({request:clone(r),completed});
      }return results;
    }

    processEvent(state,context={},roster=[]){
      this.ensure(state,[],roster);const id=String(context.id||`${state.spin}:${context.type}:${context.outcome}`);if(state.v22.processedEvents.includes(id))return null;state.v22.processedEvents.push(id);state.v22.processedEvents=state.v22.processedEvents.slice(-260);const s=this.currentSettlement(state);if(!s)return{settlement:null,requests:[]};
      const type=String(context.type||''),outcome=String(context.outcome||'success'),good=!['loss','failed'].includes(outcome);
      if(['battle','boss'].includes(type)){s.security=clamp(s.security+(good?3:-5),0,100);s.morale=clamp(s.morale+(good?2:-4),0,100);if(!good)this.createDisplacement(state,s,Math.max(4,Math.round(s.population*.008)),'Combat spilled into civilian districts.');}
      else if(type==='hazard'){s.infrastructure=clamp(s.infrastructure+(good?2:-7),0,100);s.health=clamp(s.health+(good?1:-4),0,100);if(!good)this.createDisplacement(state,s,Math.max(3,Math.round(s.population*.006)),'A hazard displaced residents.');}
      else if(type==='recovery'){s.health=clamp(s.health+5,0,100);s.food=clamp(s.food+4,0,100);s.morale=clamp(s.morale+2,0,100);}
      else if(type==='training'){s.infrastructure=clamp(s.infrastructure+3,0,100);s.security=clamp(s.security+2,0,100);}
      else if(type==='travel'){s.food=clamp(s.food+2,0,100);s.prosperity=clamp(s.prosperity+2,0,100);}
      else if(type==='rare'||type==='artifact'){s.prosperity=clamp(s.prosperity+3,0,100);s.morale=clamp(s.morale+1,0,100);}
      else if(type==='recruit'){s.morale=clamp(s.morale+3,0,100);s.playerOpinion=clamp(s.playerOpinion+1,-100,100);}
      else if(type==='faction-quest'){s.security=clamp(s.security+2,0,100);s.playerOpinion=clamp(s.playerOpinion+2,-100,100);}
      const requests=this.progressRequests(state,{...context,settlementId:s.id});this.normalizeSettlement(state,s);if(!this.activeRequest(state,s.id)&&requests.some(r=>r.completed))this.ensureRequest(state,s.id);return{settlement:clone(s),requests};
    }

    createDisplacement(state,s,count,reason='Civilian displacement'){const n=Math.min(Math.max(0,Math.round(count||0)),Math.max(0,s.population-50));if(!n)return 0;s.population-=n;s.displaced+=n;state.v22.stats.displacedCreated+=n;this.settlementHistory(state,s,'displacement',`${n} displaced. ${reason}`);return n;}
    advanceTick(state,atTick=tick(state)){
      const results=[];for(const s of Object.values(state.v22.settlements||{})){if(s.lastTick>=atTick)continue;const territory=state.v21?.territories?.[s.territoryId],pressure=this.territoryPressure(state,territory),rng=rngFrom(`${state.seed}|v22|tick|${s.id}|${atTick}`);if(pressure>55){const moved=this.createDisplacement(state,s,Math.round(s.population*((pressure-45)/1000)*(0.7+rng()*.6)),`Strategic pressure reached ${Math.round(pressure)}.`);s.security=clamp(s.security-(pressure>75?3:1),0,100);s.infrastructure=clamp(s.infrastructure-(pressure>75?2:1),0,100);s.food=clamp(s.food-(pressure>70?2:1),0,100);s.morale=clamp(s.morale-(moved?2:1),0,100);}else{s.security=clamp(s.security+1,0,100);s.infrastructure=clamp(s.infrastructure+1,0,100);s.food=clamp(s.food+1,0,100);s.health=clamp(s.health+1,0,100);s.morale=clamp(s.morale+1,0,100);s.prosperity=clamp(s.prosperity+(pressure<30?1:0),0,100);}s.lastTick=atTick;this.normalizeSettlement(state,s);this.transferToSanctuaries(state,s);if(!this.activeRequest(state,s.id))this.ensureRequest(state,s.id);results.push(clone(s));}state.v22.lastWorldTick=Math.max(state.v22.lastWorldTick,atTick);return results;
    }
    catchUp(state,maxTicks=6){this.ensure(state);const current=tick(state),start=Math.max(0,Number(state.v22.lastWorldTick||0)),count=Math.min(Math.max(0,current-start),Math.max(0,Number(maxTicks||0)));const results=[];for(let i=1;i<=count;i++)results.push(...this.advanceTick(state,start+i));state.v22.lastWorldTick=current;return{ticks:count,settlements:results};}

    pay(state,cost){try{return new root.MultiverseDomain.EconomyCraftingEngine().pay(state,cost);}catch{const wallet={credits:Number(state.credits||0),...(state.v18?.wallet||{})};for(const[k,v]of Object.entries(cost||{}))if(Number(wallet[k]||0)<Number(v||0))return false;for(const[k,v]of Object.entries(cost||{})){if(k==='credits')state.credits=Math.max(0,Number(state.credits||0)-Number(v||0));else if(state.v18?.wallet)state.v18.wallet[k]=Math.max(0,Number(state.v18.wallet[k]||0)-Number(v||0));}return true;}}
    action(state,settlementId,actionId,roster=[]){
      this.ensure(state,[],roster);const s=this.settlement(state,settlementId),def=ACTIONS[actionId];if(!s||!def)return{ok:false,error:'Invalid settlement or civilian action.'};if(def.requiresDisplaced&&!s.displaced)return{ok:false,error:'This settlement has no displaced residents to resettle.'};if(!this.pay(state,def.cost))return{ok:false,error:'Insufficient V18 relief resources.'};for(const[k,v]of Object.entries(def.effects||{})){if(k==='opinion')s.playerOpinion=clamp(s.playerOpinion+v,-100,100);else s[k]=clamp(Number(s[k]||0)+v,0,100);}let resettled=0;if(actionId==='resettle'){resettled=Math.min(s.displaced,Math.max(20,Math.round(s.population*.08)));s.displaced-=resettled;s.population+=resettled;state.v22.stats.resettled+=resettled;state.v22.stats.civiliansHelped+=resettled;}else state.v22.stats.civiliansHelped+=Math.max(10,Math.round(s.population*.01));if(actionId==='aid')state.v22.stats.aidActions++;if(actionId==='rebuild')state.v22.stats.rebuilds++;if(actionId==='medical')state.v22.stats.medicalRelief++;if(actionId==='relief-route')state.v22.stats.reliefRoutes++;this.settlementHistory(state,s,'relief',`${def.label}${resettled?` resettled ${resettled}`:''}.`);this.normalizeSettlement(state,s);this.partyReaction(state,actionId,roster);this.remember(state,'civilian',`${s.name}: ${def.label}`,`Civilian conditions improved in ${s.universe}.`,state.v21?.primaryFactionId||'');return{ok:true,settlement:clone(s),cost:clone(def.cost),resettled};
    }

    buildSanctuary(state,strongholdId){
      this.ensure(state);const hold=state.v21?.strongholds?.[String(strongholdId||'')];if(!hold||!hold.playerAligned||['occupied','destroyed'].includes(hold.status))return{ok:false,error:'A safe player-aligned stronghold is required.'};if(Object.values(state.v22.sanctuaries).some(x=>x.strongholdId===hold.id))return{ok:false,error:'This stronghold already hosts a sanctuary.'};const cost={credits:320,salvage:36,cosmicFragments:4};if(!this.pay(state,cost))return{ok:false,error:'Insufficient V18 sanctuary resources.'};const id=`sanct-${hash32(`${state.seed}|${hold.id}|${Object.keys(state.v22.sanctuaries).length}`).toString(36)}`,sanctuary=state.v22.sanctuaries[id]={id,strongholdId:hold.id,settlementId:hold.territoryId,universe:hold.universe,name:`${hold.name} Sanctuary`,capacity:Math.round(420+Number(hold.level||1)*140),residents:0,safety:clamp(62+Number(hold.defense||0)*.35,0,100),stockpile:55,morale:72,status:'open',history:[{tick:tick(state),type:'opened'}]};state.v22.stats.sanctuariesBuilt++;const s=this.settlement(state,hold.territoryId);if(s){s.playerOpinion=clamp(s.playerOpinion+12,-100,100);s.morale=clamp(s.morale+6,0,100);}this.remember(state,'civilian',`${sanctuary.name} opened`,'A player stronghold became a civilian refuge without becoming a separate base economy.',state.v21?.primaryFactionId||'');return{ok:true,sanctuary:clone(sanctuary),cost};
    }
    supplySanctuary(state,id){const x=state.v22?.sanctuaries?.[String(id||'')];if(!x)return{ok:false,error:'Sanctuary not found.'};const cost={credits:100,salvage:8};if(!this.pay(state,cost))return{ok:false,error:'Insufficient relief supplies.'};x.stockpile=clamp(x.stockpile+28,0,100);x.morale=clamp(x.morale+5,0,100);x.history.push({tick:tick(state),type:'resupply'});x.history=x.history.slice(-40);return{ok:true,sanctuary:clone(x),cost};}
    transferToSanctuaries(state,s){if(!state.v22.settings.autoRefugeeTransfer||!s.displaced)return 0;let moved=0;for(const x of Object.values(state.v22.sanctuaries)){if(x.status!=='open'||x.universe!==s.universe||x.stockpile<=0)continue;const room=Math.max(0,x.capacity-x.residents),take=Math.min(s.displaced,room,Math.max(8,Math.round(12+x.safety*.12)));if(!take)continue;s.displaced-=take;x.residents+=take;x.stockpile=clamp(x.stockpile-Math.max(1,Math.ceil(take/30)),0,100);x.morale=clamp(x.morale+1,0,100);moved+=take;state.v22.stats.resettled+=take;state.v22.stats.civiliansHelped+=take;}return moved;}

    marketModifier(state){const s=this.currentSettlement(state);if(!s)return 0;return clamp((50-s.prosperity)/500+(50-s.security)/800-s.playerOpinion/2000,-.06,.08);}
    partyReaction(state,actionId,roster=[]){try{const engine=new root.MultiverseDomain.PartyConsequencesEngine(),ids=[...(state.party||[])],results=[];for(const id of ids){const rec=state.v19?.records?.[id];if(!rec)continue;engine.adjust(state,id,{trust:1,respect:actionId==='rebuild'?2:1,friendship:1,resentment:-1},`Civilian relief: ${actionId}`);results.push(id);}return results;}catch{return[];}}
    remember(state,type,title,detail,factionId=''){try{return new root.MultiverseDomain.LivingMultiverseEngine().recordMemory(state,{type,title,detail,factionId,weight:4});}catch{return null;}}
    ending(state){const settlements=Object.values(state.v22?.settlements||{}),sanctuaries=Object.values(state.v22?.sanctuaries||{}),avg=key=>settlements.length?settlements.reduce((sum,s)=>sum+Number(s[key]||0),0)/settlements.length:0,displaced=settlements.reduce((n,s)=>n+s.displaced,0);if(sanctuaries.length>=2&&state.v22.stats.resettled>=400)return{id:'open-doors',title:'The Doors Stayed Open',text:'Strongholds became sanctuaries, and the people displaced by faction wars found places that remembered their names.'};if(avg('prosperity')>=72&&avg('morale')>=72&&avg('health')>=70)return{id:'worlds-worth-saving',title:'Worlds Worth Saving',text:'The campaign stopped being only about powers and banners; civilian worlds recovered enough to imagine futures of their own.'};if(displaced>=800)return{id:'caravans-between-stars',title:'Caravans Between Stars',text:'The wars ended unevenly, and long refugee routes became part of the multiverse the hero left behind.'};return{id:'people-in-the-margins',title:'People in the Margins',text:'Every battle had civilians beyond the frame, and their survival became part of the Chronicle.'};}
    summary(state){this.ensure(state);const settlements=Object.values(state.v22.settlements),sanctuaries=Object.values(state.v22.sanctuaries),requests=Object.values(state.v22.requests),current=this.currentSettlement(state),avg=key=>settlements.length?Math.round(settlements.reduce((n,s)=>n+Number(s[key]||0),0)/settlements.length):0;return{current:clone(current),settlements:settlements.map(clone),sanctuaries:sanctuaries.map(clone),requests:requests.map(clone),activeRequests:requests.filter(r=>r.status==='active').map(clone),population:settlements.reduce((n,s)=>n+s.population,0),displaced:settlements.reduce((n,s)=>n+s.displaced,0),averages:{food:avg('food'),health:avg('health'),security:avg('security'),prosperity:avg('prosperity'),morale:avg('morale'),infrastructure:avg('infrastructure')},marketModifier:this.marketModifier(state),stats:clone(state.v22.stats),ending:this.ending(state)};}
  }

  function migrateV22(state={},artifacts=[],roster=[]){return new SettlementEngine().ensure(state,artifacts,roster);}
  const api={V22_SCHEMA_VERSION,NEED_DEFS_V22:NEED_DEFS,CIVILIAN_ACTIONS_V22:ACTIONS,SettlementEngine,migrateV22};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
