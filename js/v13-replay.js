'use strict';

// V13 replay loop: selectable New Game+ inheritances and mutators, local daily
// personal bests, install affordance, offline status, and service-worker updates.
(() => {
  const {LegacyExperienceEngine,DailyRecordRepository,localDateKey}=MultiverseDomain;
  const P=MultiverseWheel.prototype,legacyEngine=new LegacyExperienceEngine();
  const dailyRecords=()=>new DailyRecordRepository(window.localStorage);
  const clone=value=>JSON.parse(JSON.stringify(value));

  P.injectReplayV13=function() {
    if(!document.getElementById('v13-legacy-modal')){
      const modal=document.createElement('div');modal.id='v13-legacy-modal';modal.className='v13-legacy-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','v13-legacy-title');modal.innerHTML='<div class="v13-legacy-card"><header><div><span>NEW GAME+ • INHERITED TIMELINE</span><h2 id="v13-legacy-title">Choose what survives</h2></div><button data-v13-legacy-close>CLOSE</button></header><div id="v13-legacy-body"></div></div>';document.body.appendChild(modal);
    }
    if(!document.getElementById('v13-update-banner')){
      const banner=document.createElement('aside');banner.id='v13-update-banner';banner.className='v13-update-banner';banner.hidden=true;banner.setAttribute('role','status');banner.innerHTML='<span><b>UPDATE READY</b> A new offline build is available.</span><button data-v13-update>RELOAD UPDATE</button>';document.body.appendChild(banner);
    }
    const foot=document.querySelector('.v13-title-foot');
    if(foot&&!document.querySelector('[data-v13-install]'))foot.insertAdjacentHTML('beforeend','<button type="button" data-v13-install hidden>INSTALL OFFLINE APP</button><span data-v13-network>CHECKING OFFLINE STATUS</span>');
  };

  P.openLegacyV13=function() {
    this.injectReplayV13();const modal=document.getElementById('v13-legacy-modal'),body=document.getElementById('v13-legacy-body'),options=legacyEngine.options();
    body.innerHTML=`<p class="v13-legacy-intro">Carry one meaningful advantage. Accept one rule that makes the inherited route different rather than simply easier.</p><h3>1 • LEGACY BENEFIT</h3><div class="v13-legacy-options">${options.benefits.map((item,index)=>`<label><input type="radio" name="v13-legacy-benefit" value="${item.id}" ${index===0?'checked':''}><span><b>${esc(item.label)}</b><small>${esc(item.description)}</small></span></label>`).join('')}</div><h3>2 • TIMELINE MUTATOR</h3><div class="v13-legacy-options">${options.mutators.map((item,index)=>`<label><input type="radio" name="v13-legacy-mutator" value="${item.id}" ${index===0?'checked':''}><span><b>${esc(item.label)}</b><small>${esc(item.description)}</small></span></label>`).join('')}</div><label class="v13-legacy-slot">SAVE NEW TIMELINE TO<select data-v13-legacy-slot>${[1,2,3].map(slot=>`<option value="${slot}" ${slot===this.activeSlotV13()?'selected':''}>Slot ${slot}${slot===this.activeSlotV13()?' • current ending will be replaced':''}</option>`).join('')}</select></label><div class="v13-view-actions"><button data-v13-legacy-close>CANCEL</button><button class="v13-primary" data-v13-legacy-launch>BEGIN INHERITED TIMELINE</button></div>`;
    modal.classList.add('open');setTimeout(()=>body.querySelector('input')?.focus(),0);
  };

  P.launchLegacyV13=function(benefitId,mutatorId,slot=this.activeSlotV13()) {
    const old=this.state,plan=legacyEngine.createPlan(old,benefitId,mutatorId,id=>CHAR.get(id));if(!plan.ok)return this.toast(plan.error);
    const prefs=clone(old.v13.preferences),access=clone(old.v11Experience.accessibility),previousMeta=clone(old.metaSnapshot||{}),seed=this.makeSeed();
    try{localStorage.removeItem(SAVE_KEY);}catch{}
    this.setActiveSlotV13(slot);this.clearSlotV13(slot);this.state=this.newState(seed);this.state.customCharacter=plan.carry.hero;this.state.characterReady=true;this.state.campaignLimit=plan.carry.campaignLimit;this.state.difficulty=plan.carry.difficulty;this.state.balanceMode=plan.carry.balance;this.state.v13.preferences=prefs;this.state.v11Experience.accessibility=access;
    this.state.v13.runContext={kind:'ng+',id:`${benefitId}:${mutatorId}`,slot:Number(slot),challengeCode:''};this.state.v13.legacy={generation:Number(previousMeta.ngPlus||0)+1,benefit:benefitId,mutator:mutatorId,previousEnding:old.v13.ending?.id||'',previousHero:old.customCharacter?.codename||''};this.state.runModifiers=[...new Set([...(this.state.runModifiers||[]),mutatorId])];
    this.state.metaSnapshot={...this.state.metaSnapshot,...previousMeta,ngPlus:Number(previousMeta.ngPlus||0)+1};try{localStorage.setItem('multiverse-wheel-v8-meta',JSON.stringify(this.state.metaSnapshot));}catch{}
    if(benefitId==='signature-source'&&plan.carry.sourceId){this.acquireKit(plan.carry.sourceId,true);const kit=this.state.kits.find(item=>item.id===plan.carry.sourceId);if(kit)kit.mastery=Math.max(2,Number(kit.mastery||1));this.state.activePowerSets=[plan.carry.sourceId];}
    if(benefitId==='trusted-ally'&&plan.carry.allyId)this.recruit(plan.carry.allyId,false,true);
    if(benefitId==='relic-cache'){this.state.credits=Number(this.state.credits||0)+900;this.state.evolutionPoints=Number(this.state.evolutionPoints||0)+2;}
    if(benefitId==='fate-bond'){this.state.v13.fate.max=7;this.state.v13.fate.current=5;}
    if(mutatorId==='mirrored-rival'&&plan.carry.previousRivalId)this.state.rivalArc={id:plan.carry.previousRivalId,level:3,encounters:0,wins:0,losses:0,learnedTags:[...(old.rivalArc?.learnedTags||[])],respect:0,inherited:true};
    if(mutatorId==='volatile-fate'){this.state.v13.fate.max=7;this.state.v13.fate.current=Math.max(4,this.state.v13.fate.current);}
    if(mutatorId==='boss-marathon')this.state.challengeMode='crisis';
    this.syncVitals(true);this.generateWheel();this.log(`NEW GAME+ ${this.state.v13.legacy.generation}: ${plan.benefit.label} • ${plan.mutator.label}.`,'rare');this.save();document.getElementById('v13-legacy-modal')?.classList.remove('open');this.closeTitleV13(true);this.renderAll();
  };

  P.ngplus=function(){this.openLegacyV13();};

  const restoreEnergyReplay=P.restoreEnergy;
  P.restoreEnergy=function(amount){const scale=(this.state?.runModifiers||[]).includes('scarce-energy') ? .72 : 1;return restoreEnergyReplay.call(this,Math.round(Number(amount||0)*scale));};

  const fateControlReplay=P.applyFateControlV13;
  P.applyFateControlV13=function(...args){const spent=Number(this.state.v13.fate.spent||0),result=fateControlReplay.apply(this,args);if((this.state.runModifiers||[]).includes('volatile-fate')&&this.state.v13.fate.spent>spent){this.state.director.heat+=2;this.log('VOLATILE FATE: altering the wheel raised Director heat by 2.','loss');this.save();}return result;};
  const fateResultReplay=P.alterLandedResultV13;
  P.alterLandedResultV13=function(...args){const spent=Number(this.state.v13.fate.spent||0),result=fateResultReplay.apply(this,args);if((this.state.runModifiers||[]).includes('volatile-fate')&&this.state.v13.fate.spent>spent){this.state.director.heat+=2;this.log('VOLATILE FATE: rewriting a result raised Director heat by 2.','loss');this.save();}return result;};

  const endRunReplay=P.endRun;
  P.endRun=function(win) {
    const context=clone(this.state.v13.runContext||{}),result=endRunReplay.call(this,win);
    if(context.kind==='daily'){
      const dateKey=String(context.id||'').replace(/^daily-/,'')||localDateKey(),ending=this.state.v13.ending;
      this.state.v13.dailyRecords[dateKey]=dailyRecords().submit(dateKey,{score:ending?.score?.total||this.score(),win,ending:ending?.title,hero:this.state.customCharacter?.codename,seed:this.state.seed});this.save();this.renderAll();
    }
    return result;
  };

  const completeRunLengthReplay=P.completeEvent;
  P.completeEvent=function() {
    if(!this.state.ended&&this.state.pending?.stage==='result'&&Number(this.state.spin)>=Number(this.state.campaignLimit||30)){
      this.state.pending=null;return this.endRun(Boolean(this.state.finalWin));
    }
    return completeRunLengthReplay.call(this);
  };

  const renderDailyReplay=P.renderTitleDailyV13;
  P.renderTitleDailyV13=function() {
    const daily=this.dailyChallengeV13(),best=dailyRecords().get(daily.dateKey),html=renderDailyReplay.call(this);
    const record=best?`<aside class="v13-daily-best"><span>PERSONAL BEST • ${best.attempts} ATTEMPT${best.attempts===1?'':'S'}</span><b>${Number(best.score).toLocaleString()} • ${esc(best.hero)}</b><small>${best.win?'Victory':'Legacy'} • ${esc(best.ending||'Unrecorded ending')}</small></aside>`:'<aside class="v13-daily-best empty"><span>PERSONAL BEST</span><b>No completed attempt today</b><small>Your best score remains on this device.</small></aside>';
    return html.replace('<section class="v13-daily">',`<section class="v13-daily">${record}`);
  };

  const renderEndingReplay=P.renderEnding;
  P.renderEnding=function() {const result=renderEndingReplay.call(this),context=this.state.v13.runContext;if(context?.kind==='daily'){const record=this.state.v13.dailyRecords?.[String(context.id||'').replace(/^daily-/,'')];this.eventPanel.querySelector('.v13-ending>header')?.insertAdjacentHTML('afterend',`<div class="v13-daily-ending"><span>DAILY RESULT</span><b>${Number(record?.score||this.state.v13.ending?.score?.total||0).toLocaleString()} points • Attempt ${record?.attempts||1}</b></div>`);}return result;};

  P.registerPwaV13=function() {
    this.injectReplayV13();const network=document.querySelector('[data-v13-network]'),updateNetwork=()=>{if(network)network.textContent=navigator.onLine?'ONLINE • OFFLINE CACHE ENABLED':'OFFLINE • LOCAL TIMELINE AVAILABLE';};updateNetwork();window.addEventListener('online',updateNetwork);window.addEventListener('offline',updateNetwork);
    window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();this._v13InstallPrompt=event;const button=document.querySelector('[data-v13-install]');if(button)button.hidden=false;});
    if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return;
    navigator.serviceWorker.register('./sw.js').then(registration=>{
      this._v13ServiceWorker=registration;const showUpdate=()=>{if(registration.waiting)document.getElementById('v13-update-banner').hidden=false;};showUpdate();registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate();});});
    }).catch(()=>{if(network)network.textContent='ONLINE • OFFLINE CACHE UNAVAILABLE';});
    let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload();});
  };

  const bindReplay=P.bind;
  P.bind=function() {
    bindReplay.call(this);this.injectReplayV13();if(this._v13ReplayBound)return;this._v13ReplayBound=true;
    document.addEventListener('click',async event=>{
      if(event.target.closest('[data-v13-ng-plus]'))return this.openLegacyV13();
      if(event.target.closest('[data-v13-legacy-close]'))return document.getElementById('v13-legacy-modal')?.classList.remove('open');
      if(event.target.closest('[data-v13-legacy-launch]')){const benefit=document.querySelector('input[name="v13-legacy-benefit"]:checked')?.value,mutator=document.querySelector('input[name="v13-legacy-mutator"]:checked')?.value,slot=Number(document.querySelector('[data-v13-legacy-slot]')?.value||this.activeSlotV13());return this.launchLegacyV13(benefit,mutator,slot);}
      if(event.target.closest('[data-v13-install]')&&this._v13InstallPrompt){this._v13InstallPrompt.prompt();await this._v13InstallPrompt.userChoice;this._v13InstallPrompt=null;event.target.hidden=true;return;}
      if(event.target.closest('[data-v13-update]')){this._v13ServiceWorker?.waiting?.postMessage({type:'SKIP_WAITING'});}
    });
    this.registerPwaV13();
  };
})();
