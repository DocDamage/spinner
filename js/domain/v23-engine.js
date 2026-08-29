'use strict';

(function attachV23Engine(root){
  const V23_SCHEMA_VERSION=23;
  const STAGE_NAMES=['Intel','Approach','Complication','Objective','Extraction'];
  const APPROACHES={
    adaptive:{label:'Adaptive',odds:.012,damage:.012,stress:0,summary:'Keep options open and pivot when the Wheel changes the field.'},
    direct:{label:'Direct',odds:.008,damage:.04,stress:.02,summary:'Commit force early for stronger damage at slightly higher stress.'},
    stealth:{label:'Stealth',odds:.028,damage:0,stress:-.02,summary:'Trade raw force for cleaner odds and lower mission stress.'},
    diplomatic:{label:'Diplomatic',odds:.018,damage:-.01,stress:-.03,summary:'Use leverage and restraint to reduce collateral pressure.'}
  };
  const SUPPLY_TIERS={
    0:{label:'Lean',cost:{},odds:0,damage:0},
    1:{label:'Supported',cost:{credits:70,salvage:4},odds:.008,damage:.008},
    2:{label:'Reinforced',cost:{credits:130,salvage:8},odds:.016,damage:.016},
    3:{label:'Full Support',cost:{credits:210,salvage:14},odds:.024,damage:.024}
  };
  const OPERATION_FAMILIES={
    extraction:{label:'Extraction',summary:'Locate a trapped target, break contact, and bring them home.',events:[['rare','travel'],['travel','hazard'],['hazard','battle'],['battle','recruit'],['travel','recovery']]},
    rescue:{label:'Rescue',summary:'Reach people under pressure and pull them out before the situation closes.',events:[['rare','travel'],['travel'],['hazard','battle'],['battle','recovery','recruit'],['travel','recovery']]},
    escort:{label:'Escort',summary:'Protect a vulnerable route while normal Wheel events determine the pressure.',events:[['travel','rare'],['travel'],['hazard','battle'],['travel','battle'],['travel','recovery']]},
    sabotage:{label:'Sabotage',summary:'Gather access, penetrate the target, and damage hostile capability without a separate minigame.',events:[['rare','travel'],['travel','hazard'],['hazard','battle'],['battle','artifact'],['travel']]},
    reconnaissance:{label:'Reconnaissance',summary:'Build reliable intelligence on a contested front and return with the route intact.',events:[['rare','travel'],['travel'],['hazard','rare'],['travel','faction-quest'],['travel','recovery']]},
    interception:{label:'Interception',summary:'Find and stop a hostile movement before it reaches the strategic layer.',events:[['rare','travel'],['travel'],['battle','hazard'],['battle','boss'],['travel','recovery']]},
    'artifact-recovery':{label:'Artifact Recovery',summary:'Track a disputed relic, survive the complication, and recover it through ordinary play.',events:[['rare','artifact'],['travel','hazard'],['battle','hazard'],['artifact','boss'],['travel','recovery']]},
    'stronghold-defense':{label:'Stronghold Defense',summary:'Prepare a V21 base, absorb the assault, and stabilize it without creating a second base game.',events:[['rare','faction-quest'],['training','travel'],['battle','hazard'],['battle','boss'],['recovery','faction-quest']]},
    'civilian-evacuation':{label:'Civilian Evacuation',summary:'Move threatened civilians through the Wheel before strategic pressure becomes catastrophe.',events:[['rare','travel'],['travel'],['hazard','battle'],['travel','recovery'],['travel','recovery']]},
    'counter-infiltration':{label:'Counter-Infiltration',summary:'Identify a hostile cell, expose the breach, and close it before it spreads.',events:[['rare','faction-quest'],['travel','rare'],['hazard','battle'],['battle','faction-quest'],['travel','recovery']]},
    'warfront-breakthrough':{label:'Warfront Breakthrough',summary:'Create a bounded opening on an active V21 front without instantly conquering it.',events:[['rare','travel'],['training','travel'],['battle','hazard'],['battle','boss'],['travel','faction-quest']]},
    'leadership-capture':{label:'Leadership Capture',summary:'Locate a hostile leader, isolate their protection, and extract them alive if possible.',events:[['rare','travel'],['travel'],['battle','hazard'],['boss','battle'],['travel','recovery']]},
    'route-stabilization':{label:'Route Stabilization',summary:'Secure a failing route and reconnect the strategic and civilian layers.',events:[['rare','travel'],['travel','hazard'],['hazard','training'],['artifact','faction-quest'],['travel','recovery']]}
  };

  const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const hash32=value=>{if(root.MultiverseDomain?.hash32)return root.MultiverseDomain.hash32(String(value));let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const tick=state=>Number(state.v16?.clock?.tick||0);
  const worldName=state=>String(state.v16?.currentUniverse||state.customCharacter?.homeworld||'Earth-Prime');
  const uniq=list=>[...new Set((list||[]).map(String).filter(Boolean))];
  const goodOutcome=outcome=>!['loss','failed','failure'].includes(String(outcome||'success').toLowerCase());

  class TacticalOperationsEngine{
    ensure(state={},artifacts=[],roster=[]){
      const needsBaseMigration=Number(state.v23?.schemaVersion||0)<V23_SCHEMA_VERSION;
      if(needsBaseMigration&&root.MultiverseDomain?.migrateV22)root.MultiverseDomain.migrateV22(state,artifacts,roster);
      state.v23||={};const v=state.v23;
      v.schemaVersion=V23_SCHEMA_VERSION;state.v23Version=V23_SCHEMA_VERSION;state.schemaVersion=Math.max(Number(state.schemaVersion||0),V23_SCHEMA_VERSION);
      v.operations=v.operations&&typeof v.operations==='object'?v.operations:{};
      v.operationHistory=Array.isArray(v.operationHistory)?v.operationHistory.slice(-120):[];
      v.processedEvents=Array.isArray(v.processedEvents)?v.processedEvents.slice(-320):[];
      v.activeOperationId=String(v.activeOperationId||'');
      v.lastWorldTick=Math.max(0,Number(v.lastWorldTick??tick(state)));
      v.settings={operationHints:true,autoDiscover:true,...(v.settings||{})};
      v.stats={discovered:0,started:0,completed:0,failed:0,aborted:0,flawless:0,civiliansRescued:0,strongholdsDefended:0,frontsShifted:0,relicSupport:0,...(v.stats||{})};
      for(const op of Object.values(v.operations))this.normalizeOperation(state,op);
      if(v.activeOperationId&&!v.operations[v.activeOperationId])v.activeOperationId='';
      if(needsBaseMigration){
        if(v.settings.autoDiscover)this.discoverOperations(state,12);
        v.lastWorldTick=tick(state);
      }
      return state;
    }

    normalizeOperation(state,op={}){
      const family=OPERATION_FAMILIES[op.family]?op.family:'reconnaissance',def=OPERATION_FAMILIES[family];
      op.id=String(op.id||`op-${hash32(`${state.seed}|${family}|${op.sourceKey||'manual'}`).toString(36)}`);
      op.sourceKey=String(op.sourceKey||`manual:${op.id}`);
      op.sourceType=String(op.sourceType||'manual');op.sourceId=String(op.sourceId||'');
      op.family=family;op.label=String(op.label||def.label).slice(0,88);op.summary=String(op.summary||def.summary).slice(0,260);
      op.universe=String(op.universe||worldName(state));op.territoryId=String(op.territoryId||'');op.settlementId=String(op.settlementId||'');op.factionId=String(op.factionId||'');op.frontId=String(op.frontId||'');op.strongholdId=String(op.strongholdId||'');op.relicId=String(op.relicId||'');op.nemesisId=String(op.nemesisId||'');
      op.status=['available','active','completed','failed'].includes(op.status)?op.status:'available';
      op.stageIndex=clamp(op.stageIndex||0,0,STAGE_NAMES.length-1);op.urgency=clamp(op.urgency??45,0,100);op.stress=clamp(op.stress||0,0,100);op.failures=Math.max(0,Number(op.failures||0));
      op.stages=Array.isArray(op.stages)&&op.stages.length===STAGE_NAMES.length?op.stages:this.makeStages(op.id,family);
      op.stages.forEach((stage,i)=>{stage.id=String(stage.id||`${op.id}-stage-${i}`);stage.label=STAGE_NAMES[i];stage.events=uniq(stage.events?.length?stage.events:def.events[i]);stage.target=clamp(stage.target||this.stageTarget(op.urgency,i),1,3);stage.progress=clamp(stage.progress||0,0,stage.target);stage.status=['locked','active','completed'].includes(stage.status)?stage.status:'locked';stage.requiredOutcome=String(stage.requiredOutcome||((i>=2&&stage.events.some(x=>['battle','boss'].includes(x)))?'win':''));});
      if(op.status==='available')op.stages.forEach(stage=>{if(stage.status!=='completed')stage.status='locked';});
      if(op.status==='active'&&!op.stages.some(stage=>stage.status==='active'))op.stages[op.stageIndex].status='active';
      op.planning={approach:'adaptive',allyIds:[],specialistId:'',factionSupport:false,relicId:'',supplyCommitment:0,priority:'balanced',locked:false,...(op.planning||{})};
      op.planning.approach=APPROACHES[op.planning.approach]?op.planning.approach:'adaptive';op.planning.allyIds=uniq(op.planning.allyIds).slice(0,3);op.planning.supplyCommitment=clamp(op.planning.supplyCommitment||0,0,3);op.planning.priority=['balanced','civilians','objective','team'].includes(op.planning.priority)?op.planning.priority:'balanced';op.planning.locked=Boolean(op.planning.locked);
      op.modifiers={odds:0,damage:0,stress:0,...(op.modifiers||{})};op.modifiers.odds=clamp(op.modifiers.odds,-.06,.06);op.modifiers.damage=clamp(op.modifiers.damage,-.08,.08);op.modifiers.stress=clamp(op.modifiers.stress,-.05,.05);
      op.rewards={credits:160,salvage:8,rankXp:18,authority:3,...(op.rewards||{})};
      op.attempts=Math.max(0,Number(op.attempts||0));op.createdTick=Math.max(0,Number(op.createdTick||tick(state)));op.lastTick=Math.max(0,Number(op.lastTick||op.createdTick));op.completedTick=Math.max(0,Number(op.completedTick||0));op.history=Array.isArray(op.history)?op.history.slice(-60):[];
      return op;
    }

    stageTarget(urgency,index){return urgency>=75&&index>=2?2:1;}
    makeStages(id,family){const def=OPERATION_FAMILIES[family]||OPERATION_FAMILIES.reconnaissance;return STAGE_NAMES.map((label,i)=>({id:`${id}-stage-${i}`,label,events:def.events[i].slice(),target:1,progress:0,status:'locked',requiredOutcome:(i>=2&&def.events[i].some(x=>['battle','boss'].includes(x)))?'win':''}));}
    operation(state,id){return state.v23?.operations?.[String(id||'')]||null;}
    activeOperation(state){return this.operation(state,state.v23?.activeOperationId)||Object.values(state.v23?.operations||{}).find(op=>op.status==='active')||null;}
    sourceExists(state,key){return Object.values(state.v23.operations).some(op=>op.sourceKey===key)||state.v23.operationHistory.some(op=>op.sourceKey===key);}

    familyForCampaign(campaign={}){
      return({'border-war':'warfront-breakthrough',liberation:'rescue','relic-crusade':'artifact-recovery',succession:'leadership-capture',stabilization:'route-stabilization',schism:'counter-infiltration'})[campaign.type]||'reconnaissance';
    }

    discoverOperations(state,limit=12){
      const v=state.v23;if(!v)return[];
      const existing=Object.values(v.operations).filter(op=>['available','active'].includes(op.status)).length,room=Math.max(0,Math.min(20,Number(limit||12))-existing);if(!room)return[];
      const candidates=[];
      const push=(candidate)=>{if(candidate?.sourceKey&&!this.sourceExists(state,candidate.sourceKey))candidates.push(candidate);};
      for(const c of Object.values(state.v21?.campaigns||{}))if(c.status==='active')push({sourceKey:`campaign:${c.id}`,sourceType:'campaign',sourceId:c.id,family:this.familyForCampaign(c),factionId:c.factionId,territoryId:c.territoryId,universe:c.universe,urgency:62+Math.abs(Number(c.momentum||0))*.3,label:`${c.label} Operation`});
      for(const f of Object.values(state.v21?.fronts||{}))if(!f.status||f.status==='active')push({sourceKey:`front:${f.id}`,sourceType:'front',sourceId:f.id,frontId:f.id,family:Number(f.pressure||50)>=62?'warfront-breakthrough':'interception',factionId:state.v21?.primaryFactionId||'',territoryId:f.territoryId,universe:f.universe,urgency:clamp(45+Math.abs(Number(f.pressure||50)-50),35,88),label:`${Number(f.pressure||50)>=62?'Breakthrough':'Interception'} — ${f.objective||'Active Front'}`});
      for(const s of Object.values(state.v22?.settlements||{})){const ratio=s.population?Number(s.displaced||0)/Math.max(1,Number(s.population||0)):0;if(s.status==='crisis'||ratio>=.14)push({sourceKey:`settlement:${s.id}:${s.status}`,sourceType:'settlement',sourceId:s.id,settlementId:s.id,territoryId:s.territoryId,universe:s.universe,family:ratio>=.14?'civilian-evacuation':'rescue',factionId:state.v21?.primaryFactionId||'',urgency:clamp(55+ratio*100+(s.status==='crisis'?15:0),55,95),label:`${s.name} ${ratio>=.14?'Evacuation':'Rescue'}`});}
      for(const h of Object.values(state.v21?.strongholds||{}))if(h.underSiege||['threatened','under-siege','damaged','compromised'].includes(h.status))push({sourceKey:`stronghold:${h.id}:defense`,sourceType:'stronghold',sourceId:h.id,strongholdId:h.id,territoryId:h.territoryId,universe:h.universe,factionId:h.ownerFactionId,family:'stronghold-defense',urgency:h.underSiege?92:72,label:`Defend ${h.name}`});
      for(const inf of Object.values(state.v21?.infiltration||{}))if(inf.discovered||Number(inf.suspicion||0)>=55)push({sourceKey:`infiltration:${inf.factionId}:counter`,sourceType:'infiltration',sourceId:inf.factionId,factionId:state.v21?.primaryFactionId||'',family:'counter-infiltration',universe:worldName(state),urgency:clamp(50+Number(inf.suspicion||0)*.4,55,90),label:'Counter-Infiltration Sweep'});
      for(const relic of Object.values(state.v20?.relics||{}))if(relic.status==='stolen')push({sourceKey:`relic:${relic.id}:stolen`,sourceType:'relic',sourceId:relic.id,relicId:relic.id,nemesisId:relic.stolenBy||'',family:'artifact-recovery',universe:relic.stolenWorld||worldName(state),factionId:state.v21?.primaryFactionId||'',urgency:78,label:`Recover ${relic.name||'Stolen Relic'}`});
      const nemeses=Object.values(state.v16?.nemeses||{}).filter(n=>!['defeated','dead','retired'].includes(String(n.status||''))).slice(0,2);
      for(const n of nemeses)push({sourceKey:`nemesis:${n.id}:intercept`,sourceType:'nemesis',sourceId:n.id,nemesisId:n.id,family:'interception',universe:n.universe||worldName(state),factionId:state.v21?.primaryFactionId||'',urgency:clamp(48+Number(n.level||n.power||0)*.4,48,82),label:`Intercept ${n.name||'Nemesis'}`});
      candidates.sort((a,b)=>Number(b.urgency||0)-Number(a.urgency||0)||a.sourceKey.localeCompare(b.sourceKey));
      const created=[];for(const c of candidates.slice(0,room)){const op=this.createOperation(state,c);if(op.ok)created.push(op.operation);}return created;
    }

    createOperation(state,options={}){
      const family=OPERATION_FAMILIES[options.family]?options.family:'reconnaissance',sourceKey=String(options.sourceKey||`manual:${options.sourceId||family}:${Object.keys(state.v23.operations).length}`);
      if(this.sourceExists(state,sourceKey))return{ok:false,error:'An operation already exists for that source.'};
      const id=`op-${hash32(`${state.seed}|v23|${sourceKey}`).toString(36)}`,urgency=clamp(options.urgency??50,10,100),def=OPERATION_FAMILIES[family];
      const op={id,sourceKey,sourceType:String(options.sourceType||'manual'),sourceId:String(options.sourceId||''),family,label:String(options.label||def.label),summary:String(options.summary||def.summary),universe:String(options.universe||worldName(state)),territoryId:String(options.territoryId||''),settlementId:String(options.settlementId||''),factionId:String(options.factionId||state.v21?.primaryFactionId||''),frontId:String(options.frontId||''),strongholdId:String(options.strongholdId||''),relicId:String(options.relicId||''),nemesisId:String(options.nemesisId||''),status:'available',stageIndex:0,urgency,stress:0,failures:0,stages:this.makeStages(id,family),planning:{approach:'adaptive',allyIds:[],specialistId:'',factionSupport:false,relicId:'',supplyCommitment:0,priority:'balanced',locked:false},modifiers:{odds:0,damage:0,stress:0},rewards:{credits:Math.round(120+urgency*1.25),salvage:Math.max(5,Math.round(urgency/9)),rankXp:14+Math.round(urgency/12),authority:2+Math.round(urgency/35)},attempts:0,createdTick:tick(state),lastTick:tick(state),completedTick:0,history:[{tick:tick(state),type:'discovered',detail:`${def.label} sourced from ${options.sourceType||'the strategic layer'}.`}]};
      state.v23.operations[id]=this.normalizeOperation(state,op);state.v23.stats.discovered++;return{ok:true,operation:clone(state.v23.operations[id])};
    }

    allyAvailability(state,id){
      id=String(id||'');if(!(state.party||[]).map(String).includes(id))return{allowed:false,reason:'Only active party members can deploy.'};
      const rec=state.v19?.records?.[id];if(rec&&['dead','departed','defected','bench'].includes(rec.status))return{allowed:false,reason:'This ally is unavailable.'};
      const axes=rec?.axes||{};if(Number(axes.resentment||0)>=70||Number(axes.trust??50)<24||Number(axes.loyalty??50)<22)return{allowed:false,reason:`${rec?.name||id} refuses this operation.`};
      return{allowed:true,reason:'Ready'};
    }

    planOperation(state,id,plan={}){
      const op=this.operation(state,id);if(!op||op.status!=='available')return{ok:false,error:'Only available operations can be planned.'};
      const approach=APPROACHES[plan.approach||op.planning.approach]?String(plan.approach||op.planning.approach):'adaptive',allyIds=uniq(plan.allyIds??op.planning.allyIds).slice(0,3);
      for(const allyId of allyIds){const available=this.allyAvailability(state,allyId);if(!available.allowed)return{ok:false,error:available.reason,refused:allyId};}
      const specialistId=String((plan.specialistId??op.planning.specialistId)||'');if(specialistId&&!state.v21?.assignments?.[specialistId]&&!state.v21?.specialists?.[specialistId])return{ok:false,error:'Selected specialist is not assigned through V21.'};
      const relicId=String((plan.relicId??op.planning.relicId)||'');if(relicId&&(!(state.artifacts||[]).includes(relicId)||state.v20?.relics?.[relicId]?.status==='stolen'))return{ok:false,error:'Selected V20 relic is not available to support this mission.'};
      const factionSupport=Boolean(plan.factionSupport??op.planning.factionSupport);if(factionSupport&&!state.v21?.primaryFactionId)return{ok:false,error:'Faction support requires a primary V21 faction.'};
      const supplyCommitment=clamp(plan.supplyCommitment??op.planning.supplyCommitment,0,3),priority=['balanced','civilians','objective','team'].includes(plan.priority)?plan.priority:(op.planning.priority||'balanced');
      op.planning={approach,allyIds,specialistId,factionSupport,relicId,supplyCommitment,priority,locked:false};op.modifiers=this.planningModifier(state,op);op.lastTick=tick(state);return{ok:true,planning:clone(op.planning),modifiers:clone(op.modifiers),cost:clone(SUPPLY_TIERS[supplyCommitment].cost)};
    }

    planningModifier(state,op){
      const p=op.planning||{},approach=APPROACHES[p.approach]||APPROACHES.adaptive,supply=SUPPLY_TIERS[p.supplyCommitment]||SUPPLY_TIERS[0];let odds=approach.odds+supply.odds,damage=approach.damage+supply.damage,stress=approach.stress;
      let relationship=0;for(const id of p.allyIds||[]){const axes=state.v19?.records?.[id]?.axes||{},quality=(Number(axes.trust??50)+Number(axes.respect??50)+Number(axes.friendship??50)-Number(axes.resentment||0))/3;relationship+=clamp((quality-45)/2500,-.008,.012);}
      odds+=clamp(relationship,-.012,.024);damage+=clamp(relationship*.8,-.008,.018);
      if(p.specialistId){odds+=.008;stress-=.008;}
      if(p.factionSupport){const authority=Number(state.v21?.memberships?.[state.v21?.primaryFactionId]?.authority||0);odds+=authority>=50?.012:.006;damage+=.006;}
      if(p.relicId){odds+=.01;damage+=.012;}
      if(p.priority==='civilians'){odds-=.004;stress-=.008;}else if(p.priority==='objective')damage+=.008;else if(p.priority==='team')stress-=.012;
      return{odds:clamp(odds,-.06,.06),damage:clamp(damage,-.08,.08),stress:clamp(stress,-.05,.05)};
    }

    pay(state,cost){try{return new root.MultiverseDomain.EconomyCraftingEngine().pay(state,cost);}catch{const wallet={credits:Number(state.credits||0),...(state.v18?.wallet||{})};for(const[k,v]of Object.entries(cost||{}))if(Number(wallet[k]||0)<Number(v||0))return false;for(const[k,v]of Object.entries(cost||{})){if(k==='credits')state.credits=Math.max(0,Number(state.credits||0)-Number(v||0));else if(state.v18?.wallet)state.v18.wallet[k]=Math.max(0,Number(state.v18.wallet[k]||0)-Number(v||0));}return true;}}

    beginOperation(state,id,plan={}){
      this.ensure(state);const op=this.operation(state,id);if(!op||op.status!=='available')return{ok:false,error:'Operation is not available.'};const active=this.activeOperation(state);if(active&&active.id!==op.id)return{ok:false,error:'Finish or abort the active operation before deploying another.'};
      const planned=this.planOperation(state,id,Object.keys(plan).length?plan:op.planning);if(!planned.ok)return planned;
      const cost=SUPPLY_TIERS[op.planning.supplyCommitment].cost;if(!this.pay(state,cost))return{ok:false,error:'Insufficient V18 resources for the selected supply commitment.'};
      op.status='active';op.attempts++;op.stageIndex=0;op.stages.forEach((stage,i)=>{stage.status=i===0?'active':'locked';stage.progress=0;});op.planning.locked=true;op.modifiers=this.planningModifier(state,op);op.lastTick=tick(state);op.history.push({tick:tick(state),type:'deployed',detail:`${APPROACHES[op.planning.approach].label} approach with ${SUPPLY_TIERS[op.planning.supplyCommitment].label} supply.`});state.v23.activeOperationId=op.id;state.v23.stats.started++;this.partyReaction(state,op,'deploy');return{ok:true,operation:clone(op),cost:clone(cost)};
    }

    combatModifier(state){const op=this.activeOperation(state);if(!op)return{odds:0,damage:0,operationId:''};const mod=this.planningModifier(state,op);return{odds:clamp(mod.odds,-.06,.06),damage:clamp(mod.damage,-.08,.08),operationId:op.id,label:op.label};}

    processEvent(state,context={},roster=[]){
      this.ensure(state,[],roster);if(state.v23.settings.autoDiscover)this.discoverOperations(state,12);
      const op=this.activeOperation(state);if(!op)return{operation:null,progressed:false};
      const eventId=String(context.id||`v23:${state.spin}:${context.type}:${context.outcome}:${op.id}`);if(state.v23.processedEvents.includes(eventId))return null;state.v23.processedEvents.push(eventId);state.v23.processedEvents=state.v23.processedEvents.slice(-320);
      const stage=op.stages[op.stageIndex],type=String(context.type||''),outcome=String(context.outcome||'success');if(!stage||stage.status!=='active'||!stage.events.includes(type))return{operation:clone(op),progressed:false};
      const good=goodOutcome(outcome);op.lastTick=tick(state);
      if(!good){op.failures++;op.stress=clamp(op.stress+Math.max(5,Math.round(12+(op.modifiers.stress||0)*100)),0,100);op.history.push({tick:tick(state),type:'setback',detail:`${stage.label}: ${type} ended in ${outcome}.`});this.partyReaction(state,op,'setback',roster,eventId);if(op.stress>=95)return this.finishOperation(state,op,false,roster,'Operational stress exceeded the safe recovery threshold.');return{operation:clone(op),progressed:false,setback:true};}
      if(stage.requiredOutcome&&['battle','boss'].includes(type)&&outcome!==stage.requiredOutcome)return{operation:clone(op),progressed:false};
      stage.progress=clamp(stage.progress+Math.max(1,Number(context.amount||1)),0,stage.target);op.stress=clamp(op.stress-Math.max(1,Math.round(2-(op.modifiers.stress||0)*20)),0,100);let stageComplete=false,operationComplete=false;
      if(stage.progress>=stage.target){stage.status='completed';stageComplete=true;op.history.push({tick:tick(state),type:'stage-complete',detail:`${stage.label} completed through ${type}.`});this.partyReaction(state,op,'stage');if(op.stageIndex<op.stages.length-1){op.stageIndex++;op.stages[op.stageIndex].status='active';}else{const result=this.finishOperation(state,op,true,roster,'Extraction completed.');operationComplete=true;return{...result,progressed:true,stageComplete,operationComplete};}}
      return{operation:clone(op),progressed:true,stageComplete,operationComplete};
    }

    finishOperation(state,op,success,roster=[],reason='Operation resolved'){
      if(!op||!['active','available'].includes(op.status))return{ok:false,error:'Operation is already resolved.'};
      op.status=success?'completed':'failed';op.completedTick=tick(state);op.lastTick=tick(state);op.history.push({tick:tick(state),type:success?'success':'failure',detail:reason});for(const stage of op.stages)if(success)stage.status='completed';state.v23.activeOperationId=state.v23.activeOperationId===op.id?'':state.v23.activeOperationId;
      if(success){state.v23.stats.completed++;if(op.failures===0){state.v23.stats.flawless++;}this.addRewards(state,op);this.applyStrategicAftermath(state,op,true,roster);this.partyReaction(state,op,'success',roster);}
      else{state.v23.stats.failed++;this.applyStrategicAftermath(state,op,false,roster);this.partyReaction(state,op,'failure',roster);}
      state.v23.operationHistory.push(clone(op));state.v23.operationHistory=state.v23.operationHistory.slice(-120);this.remember(state,op,success);return{ok:true,success,operation:clone(op)};
    }

    abortOperation(state,id=state.v23?.activeOperationId,roster=[]){const op=this.operation(state,id);if(!op||op.status!=='active')return{ok:false,error:'No active operation to abort.'};state.v23.stats.aborted++;return this.finishOperation(state,op,false,roster,'The player ordered a recoverable withdrawal.');}

    retryOperation(state,id){const op=this.operation(state,id);if(!op||op.status!=='failed')return{ok:false,error:'Only failed operations can be reopened.'};if(this.activeOperation(state))return{ok:false,error:'Finish the active operation before reopening another.'};op.status='available';op.stageIndex=0;op.stress=clamp(Math.min(op.stress,30),0,30);op.completedTick=0;op.planning.locked=false;op.stages.forEach((stage,i)=>{stage.progress=0;stage.status='locked';if(i===0)stage.status='locked';});op.history.push({tick:tick(state),type:'reopened',detail:'The failed operation was reopened as a recoverable mission attempt.'});op.history=op.history.slice(-60);return{ok:true,operation:clone(op)};}

    addRewards(state,op){
      state.credits=Math.max(0,Number(state.credits||0)+Number(op.rewards.credits||0));if(state.v18?.wallet)state.v18.wallet.salvage=Math.max(0,Number(state.v18.wallet.salvage||0)+Number(op.rewards.salvage||0));
      try{const factions=new root.MultiverseDomain.FactionCampaignEngine();const factionId=op.factionId||state.v21?.primaryFactionId;if(factionId&&state.v21?.memberships?.[factionId]){factions.addRankXp(state,factionId,op.rewards.rankXp,`V23 operation: ${op.label}`);factions.adjustAuthority(state,factionId,op.rewards.authority,'Tactical operation success');const campaign=state.v21?.campaigns?.[op.sourceType==='campaign'?op.sourceId:''];if(campaign&&campaign.status==='active')campaign.momentum=clamp(Number(campaign.momentum||0)+3,-40,40);}}catch{}
      const relicId=op.planning?.relicId;if(relicId&&state.v20?.relics?.[relicId]){const relic=state.v20.relics[relicId];relic.bond=clamp(Number(relic.bond||0)+2,0,100);relic.history=Array.isArray(relic.history)?relic.history:[];relic.history.push({spin:Number(state.spin||0),type:'operation-support',operationId:op.id});relic.history=relic.history.slice(-28);state.v23.stats.relicSupport++;}
    }

    applyStrategicAftermath(state,op,success,roster=[]){
      const sign=success?1:-1,front=state.v21?.fronts?.[op.frontId]||Object.values(state.v21?.fronts||{}).find(f=>f.territoryId&&f.territoryId===op.territoryId&&(!f.status||f.status==='active'));
      if(front){const allied=op.factionId&&front.attackerId===op.factionId?1:op.factionId&&front.defenderId===op.factionId?-1:0,pressureDelta=clamp(sign*(allied>=0?4:-4),-4,4);front.pressure=clamp(Number(front.pressure||50)+pressureDelta,0,100);front.supply=clamp(Number(front.supply||50)+sign*3,0,100);front.morale=clamp(Number(front.morale||50)+sign*3,0,100);state.v23.stats.frontsShifted++;}
      const territory=state.v21?.territories?.[op.territoryId];if(territory){territory.stability=clamp(Number(territory.stability||50)+sign*3,0,100);territory.supply=clamp(Number(territory.supply||50)+sign*3,0,100);if(success&&op.family==='warfront-breakthrough')territory.contested=true;}
      const hold=state.v21?.strongholds?.[op.strongholdId];if(hold){if(success){hold.integrity=clamp(Number(hold.integrity||0)+7,0,100);hold.supply=clamp(Number(hold.supply||0)+5,0,100);hold.morale=clamp(Number(hold.morale||0)+6,0,100);if(op.family==='stronghold-defense'&&hold.integrity>=30){hold.underSiege=false;hold.status='safe';state.v23.stats.strongholdsDefended++;}}else{hold.integrity=clamp(Number(hold.integrity||0)-8,20,100);hold.supply=clamp(Number(hold.supply||0)-5,0,100);hold.morale=clamp(Number(hold.morale||0)-6,0,100);hold.status='threatened';}}
      const settlement=state.v22?.settlements?.[op.settlementId]||(op.territoryId?state.v22?.settlements?.[op.territoryId]:null);if(settlement){if(success){const civilianFocus=['rescue','civilian-evacuation','escort','route-stabilization'].includes(op.family)||op.planning?.priority==='civilians',rescued=civilianFocus?Math.min(Number(settlement.displaced||0),Math.max(8,Math.round(Number(settlement.population||0)*.025))):0;if(rescued){settlement.displaced=Math.max(0,Number(settlement.displaced||0)-rescued);settlement.population=Math.max(0,Number(settlement.population||0)+rescued);state.v22.stats.resettled=Number(state.v22.stats.resettled||0)+rescued;state.v22.stats.civiliansHelped=Number(state.v22.stats.civiliansHelped||0)+rescued;state.v23.stats.civiliansRescued+=rescued;}settlement.security=clamp(Number(settlement.security||0)+4,0,100);settlement.morale=clamp(Number(settlement.morale||0)+5,0,100);settlement.playerOpinion=clamp(Number(settlement.playerOpinion||0)+6,-100,100);}else{try{new root.MultiverseDomain.SettlementEngine().createDisplacement(state,settlement,Math.max(3,Math.round(Number(settlement.population||0)*.004)),`Failed ${op.label}.`);}catch{}settlement.security=clamp(Number(settlement.security||0)-3,0,100);settlement.morale=clamp(Number(settlement.morale||0)-3,0,100);}}
    }

    partyReaction(state,op,kind,roster=[],eventId=''){
      try{const party=new root.MultiverseDomain.PartyConsequencesEngine();for(const id of op.planning?.allyIds||[]){const rec=state.v19?.records?.[id];if(!rec)continue;if(kind==='deploy')party.adjust(state,id,{trust:1,respect:1},`Deployed on ${op.label}`);else if(kind==='stage')party.adjust(state,id,{trust:1,respect:1},`Advanced ${op.label}`);else if(kind==='setback'){party.adjust(state,id,{trust:-1,fear:2,rivalry:1},`${op.label} setback`);const roll=(hash32(`${eventId}|${id}|wound`)%100)/100;if(roll<.14+op.urgency/1000)party.wound(state,id,'minor',`${op.label} setback`);}else if(kind==='success')party.adjust(state,id,{loyalty:2,trust:3,respect:3,friendship:2,resentment:-1},`${op.label} completed`);else if(kind==='failure')party.adjust(state,id,{trust:-2,fear:3,resentment:2},`${op.label} failed`);}}catch{}
    }

    remember(state,op,success){try{return new root.MultiverseDomain.LivingMultiverseEngine().recordMemory(state,{type:'operation',title:`${success?'Operation complete':'Operation failed'}: ${op.label}`,detail:`${OPERATION_FAMILIES[op.family]?.label||op.family} resolved at ${op.universe}.`,factionId:op.factionId||'',weight:success?5:4});}catch{return null;}}

    advanceTick(state,atTick=tick(state)){
      this.ensure(state);if(state.v23.settings.autoDiscover)this.discoverOperations(state,12);const active=this.activeOperation(state),available=Object.values(state.v23.operations).filter(op=>op.status==='available');
      for(const op of available){if(op.lastTick>=atTick)continue;op.urgency=clamp(op.urgency+(op.sourceType==='settlement'||op.sourceType==='stronghold'?2:1),0,100);op.lastTick=atTick;}
      if(active&&active.lastTick<atTick){active.stress=clamp(active.stress+1,0,90);active.lastTick=atTick;}
      state.v23.lastWorldTick=Math.max(state.v23.lastWorldTick,atTick);return{active:clone(active),available:available.map(clone)};
    }
    catchUp(state,maxTicks=6){this.ensure(state);const current=tick(state),start=Math.max(0,Number(state.v23.lastWorldTick||0)),count=Math.min(Math.max(0,current-start),Math.max(0,Number(maxTicks||0)));for(let i=1;i<=count;i++)this.advanceTick(state,start+i);state.v23.lastWorldTick=current;return{ticks:count};}

    ending(state){const stats=state.v23?.stats||{};if(Number(stats.completed||0)>=12&&Number(stats.failed||0)<=2)return{id:'field-commander',title:'The Field Commander',text:'Strategic wars became human-scale decisions, and the Wheel carried those decisions all the way back to the people living under them.'};if(Number(stats.civiliansRescued||0)>=300)return{id:'no-one-left-behind',title:'No One Left Behind',text:'The strongest victories were measured in people who made it through the extraction corridor.'};if(Number(stats.failed||0)>Number(stats.completed||0))return{id:'cost-of-command',title:'The Cost of Command',text:'Not every operation came home clean, and command became another kind of scar in the Chronicle.'};return{id:'operations-log',title:'The Operations Log',text:'The warfront stopped being an abstraction; every objective carried names, routes, and consequences.'};}
    summary(state){this.ensure(state);const ops=Object.values(state.v23.operations),active=this.activeOperation(state);return{active:clone(active),available:ops.filter(op=>op.status==='available').sort((a,b)=>b.urgency-a.urgency).map(clone),resolved:state.v23.operationHistory.slice(-12).reverse().map(clone),stats:clone(state.v23.stats),combat:this.combatModifier(state),ending:this.ending(state)};}
  }

  function migrateV23(state={},artifacts=[],roster=[]){return new TacticalOperationsEngine().ensure(state,artifacts,roster);}
  const api={V23_SCHEMA_VERSION,OPERATION_FAMILIES_V23:OPERATION_FAMILIES,APPROACHES_V23:APPROACHES,SUPPLY_TIERS_V23:SUPPLY_TIERS,TacticalOperationsEngine,migrateV23};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
