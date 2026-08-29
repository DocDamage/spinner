'use strict';

// Small post-integration guards for legacy interoperability. V13 remains the
// authoritative source of Loyalty deltas, while V19 owns the added axes.
(()=>{
  const Engine=MultiverseDomain.PartyConsequencesEngine;if(!Engine)return;const E=Engine.prototype,clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));

  E.assistDecision=function(state,id,commit=false){
    const r=this.record(state,id);let reason='';if(r.status!=='active')reason='This ally is not in the active party.';else if((r.wounds.length>=2&&r.axes.trust<55)||r.axes.resentment>=65||r.axes.trust<25||r.axes.loyalty<22)reason='The relationship is too strained for this assist.';
    if(reason&&commit){r.refusals++;state.v19.stats.refusals++;this.syncLegacy(state);}return reason?{allowed:false,reason}:{allowed:true,costDelta:r.axes.friendship>=75?-5:0};
  };

  E.storyEffect=function(state,effect={},reason='Story choice'){
    this.ensure(state);const changes={};if(Number(effect.hero||0)>0)Object.assign(changes,{trust:3,friendship:2,resentment:-2});if(Number(effect.villain||0)>0)Object.assign(changes,{fear:3,resentment:4,trust:-3});for(const id of state.party||[])this.adjust(state,id,changes,reason);return changes;
  };

  E.progressPersonalQuests=function(state,context={}){
    const completed=[],combat=new Set(['battle','boss']);for(const q of Object.values(state.v19.personalQuests)){if(q.status!=='active'||!q.events.includes(String(context.type||'')))continue;if(q.requiredOutcome&&combat.has(String(context.type||''))&&q.requiredOutcome!==context.outcome)continue;q.progress=Math.min(q.target,q.progress+1);if(q.progress>=q.target){q.status='completed';q.completedSpin=Number(state.spin||0);this.adjust(state,q.characterId,{loyalty:8,trust:8,respect:8,friendship:6,resentment:-5},`Personal quest complete: ${q.label}`);state.v19.stats.personalQuests++;completed.push(JSON.parse(JSON.stringify(q)));}}return completed;
  };

  const applyOutcome=E.applyOutcome;
  E.applyOutcome=function(state,context={},roster=[]){
    const preserve=String(context.outcome)==='win'&&['battle','boss'].includes(String(context.type)),before={};if(preserve)for(const id of state.party||[])before[id]=this.record(state,id).axes.loyalty;const result=applyOutcome.call(this,state,context,roster);
    if(preserve){for(const [id,value] of Object.entries(before)){const r=this.record(state,id);r.axes.loyalty=value;if(r.moments[0]?.delta?.loyalty)delete r.moments[0].delta.loyalty;}this.syncLegacy(state);}return result;
  };

  const P=MultiverseWheel.prototype,useAssist=P.useAssistV13,probe=new Engine();
  if(typeof useAssist==='function')P.useAssistV13=function(id){this.ensureV19?.();const decision=probe.assistDecision(this.state,id,true);if(!decision.allowed){this.save();this.renderAll();return this.toast(decision.reason);}return useAssist.call(this,id);};
})();
