'use strict';

// Small post-integration guards for legacy interoperability. V13 remains the
// authoritative source of Loyalty deltas, while V19 owns the added axes.
(()=>{
  const Engine=globalThis.MultiverseDomain?.PartyConsequencesEngine;if(!Engine)return;const E=Engine.prototype;

  const syncLegacy=E.syncLegacy;
  E.syncLegacy=function(state){
    state.v13||={};state.v13.relationshipArcs=state.v13.relationshipArcs&&typeof state.v13.relationshipArcs==='object'?state.v13.relationshipArcs:{};
    for(const [id,r] of Object.entries(state.v19?.records||{}))state.v13.relationshipArcs[id]||={characterId:id,loyalty:r.axes?.loyalty??50,status:'steady',assistUnlocked:false,departed:false,refusals:0,moments:[]};
    return syncLegacy.call(this,state);
  };

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

  if(typeof globalThis.MultiverseWheel!=='function')return;
  const P=globalThis.MultiverseWheel.prototype,useAssist=P.useAssistV13,probe=new Engine();
  if(typeof useAssist==='function')P.useAssistV13=function(id){this.ensureV19?.();const decision=probe.assistDecision(this.state,id,true);if(!decision.allowed){this.save();this.renderAll();return this.toast(decision.reason);}return useAssist.call(this,id);};

  // First service-worker control is part of installation, not an app update.
  // A reload is allowed only after the player explicitly chooses RELOAD UPDATE.
  // This prevents clients.claim() from interrupting live input or first-run play.
  P.registerPwaV13=function(){
    if(this._v19PwaSafeRegistered)return;this._v19PwaSafeRegistered=true;this.injectReplayV13?.();
    const network=document.querySelector('[data-v13-network]'),updateNetwork=()=>{if(network)network.textContent=navigator.onLine?'ONLINE • OFFLINE CACHE ENABLED':'OFFLINE • LOCAL TIMELINE AVAILABLE';};updateNetwork();window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);
    window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();this._v13InstallPrompt=event;const button=document.querySelector('[data-v13-install]');if(button)button.hidden=false;});
    if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return;
    let refreshing=false;this._v13ExplicitUpdateReload=false;
    document.addEventListener('click',event=>{if(event.target.closest('[data-v13-update]'))this._v13ExplicitUpdateReload=true;},true);
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!this._v13ExplicitUpdateReload||refreshing)return;refreshing=true;location.reload();});
    navigator.serviceWorker.register('./sw.js').then(registration=>{
      this._v13ServiceWorker=registration;const showUpdate=()=>{if(registration.waiting)document.getElementById('v13-update-banner').hidden=false;};showUpdate();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate();});});
    }).catch(()=>{if(network)network.textContent='ONLINE • OFFLINE CACHE UNAVAILABLE';});
  };
})();
