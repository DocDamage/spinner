'use strict';

// V13 narrative experience: universe-specific story packs, loyalty thresholds,
// delayed callbacks, decisive rival outcomes, and ending/recap generation.
(() => {
  const {NarrativeExperienceEngine,BuildProgressionEngine,V13StateEngine,canonicalUniverse}=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const narrative=new NarrativeExperienceEngine(),builds=new BuildProgressionEngine(),stateEngine=new V13StateEngine();
  const copy=value=>JSON.parse(JSON.stringify(value));

  P.ensureNarrativeV13=function() {
    stateEngine.migrate(this.state);
    for(const id of this.state.party||[]){
      const record=this.state.partyRoster?.[id],arc=narrative.relationship(this.state,id,record?.loyalty??50);
      if(record)record.loyalty=arc.loyalty;
    }
    return this.state.v13;
  };

  P.loyaltyV13=function(id) {
    this.ensureNarrativeV13();
    const record=this.state.partyRoster?.[id],arc=narrative.relationship(this.state,id,record?.loyalty??50),tier=narrative.loyaltyTier(arc.loyalty);
    return{...arc,tier};
  };

  P.adjustPartyLoyaltyV13=function(delta,reason) {
    const departures=[];
    for(const id of [...(this.state.party||[])]){
      const arc=narrative.adjustLoyalty(this.state,id,delta,reason,this.state.spin),record=this.state.partyRoster?.[id];
      if(record)record.loyalty=arc.loyalty;
      const decision=narrative.allyDecision(this.state,id,Number(delta)<0?'coerce':'support');
      if(decision.departed){departures.push(id);this.state.party=this.state.party.filter(item=>item!==id);this.log(`${CHAR.get(id)?.name||'An ally'} left the timeline after the relationship fractured.`,'loss');}
    }
    return departures;
  };

  P.applyNarrativeEffectV13=function(effect={},source='Story consequence') {
    const arc=this.ensureStageArcV9?.(this.stageNumber());
    if(effect.energy){const amount=Math.round(this.maxEnergyPool()*Math.abs(effect.energy));effect.energy>0?this.restoreEnergy(amount):this.state.energyPool=Math.max(0,this.state.energyPool-amount);}
    if(effect.health){const amount=Math.round(this.maxHP()*Math.abs(effect.health));effect.health>0?this.heal(amount):this.applyShieldedDamage(amount);}
    if(effect.credits)this.state.credits=Math.max(0,Number(this.state.credits||0)+Number(effect.credits));
    if(effect.heat)this.state.director.heat=Math.max(0,Number(this.state.director.heat||0)+Number(effect.heat));
    if(effect.hero)this.state.director.hero=Number(this.state.director.hero||0)+Number(effect.hero);
    if(effect.villain)this.state.director.villain=Number(this.state.director.villain||0)+Number(effect.villain);
    if(effect.stats)this.addBonuses(Object.fromEntries(STAT_KEYS.map(key=>[key,Number(effect.stats)])));
    if(effect.bossPower&&arc)arc.bossPower=Math.max(.65,Number(arc.bossPower||1)+Number(effect.bossPower));
    if(effect.intel&&arc)arc.bossIntel=Number(arc.bossIntel||0)+Number(effect.intel);
    if(effect.rescues)this.stageProgressV9?.('rescues',Number(effect.rescues));
    if(effect.missions)this.stageProgressV9?.('missions',Number(effect.missions));
    if(effect.teamwork)this.stageProgressV9?.('teamwork',Number(effect.teamwork));
    if(effect.fate)stateEngine.earnFate(this.state,Number(effect.fate),source,this.state.spin);
    if(effect.loyalty)this.adjustPartyLoyaltyV13(Number(effect.loyalty),source);
    return effect;
  };

  const v8PartyNarrative=P.v8Party;
  P.v8Party=function(id,state=this.state) {
    const record=v8PartyNarrative.call(this,id,state);
    if(record&&state===this.state&&state?.v13){const arc=narrative.relationship(state,id,record.loyalty);record.loyalty=arc.loyalty;}
    return record;
  };

  const recruitNarrative=P.recruit;
  P.recruit=function(id,...args) {
    const had=this.state.party.includes(id),result=recruitNarrative.call(this,id,...args);
    if(!had&&this.state.party.includes(id)){
      const record=this.state.partyRoster?.[id],arc=narrative.relationship(this.state,id,record?.loyalty??50);
      if(record)record.loyalty=arc.loyalty;
      narrative.highlight(this.state,{type:'ally',spin:this.state.spin,title:`${CHAR.get(id)?.name||'An ally'} joined`,detail:'A new relationship arc began.',weight:3});
    }
    return result;
  };

  const afterWinNarrative=P.afterWin;
  P.afterWin=function(enemy) {
    const result=afterWinNarrative.call(this,enemy),bonus=this.state.pending?.type==='boss'?3:1;
    this.adjustPartyLoyaltyV13(bonus,`${this.state.pending?.type==='boss'?'Boss':'Battle'} victory`);
    narrative.highlight(this.state,{type:this.state.pending?.type==='boss'?'boss':'battle',spin:this.state.spin,title:`Victory over ${enemy?.name||'an opponent'}`,detail:this.state.pending?.v13Report?`${this.state.pending.v13Report.rounds||1} rounds`:'The team survived the encounter.',weight:this.state.pending?.type==='boss'?6:2});
    return result;
  };

  const assistOptionsNarrative=P.assistOptionsV13;
  P.assistOptionsV13=function() {
    return assistOptionsNarrative.call(this).filter(option=>{
      const loyalty=this.loyaltyV13(option.characterId);return !loyalty.departed&&loyalty.tier.assist;
    }).map(option=>{const tier=this.loyaltyV13(option.characterId).tier;return{...option,cost:tier.id==='devoted'?40:tier.id==='trusted'?45:option.cost,loyaltyTier:tier.label};});
  };

  const useAssistNarrative=P.useAssistV13;
  P.useAssistV13=function(id) {
    const decision=narrative.allyDecision(this.state,id,'assist');
    if(!decision.allowed){this.save();this.renderAll();return this.toast(decision.reason);}
    return useAssistNarrative.call(this,id);
  };

  const storyInterludeNarrative=P.storyInterludeV9;
  P.storyInterludeV9=function() {
    const arc=this.ensureStageArcV9(this.stageNumber()),event=narrative.eventFor(arc.featuredUniverse,arc.branchIndex),historyId=`${event.id}:${arc.stageNumber}`;
    if(!event||this.state.v13.eventHistory.some(entry=>entry.id===historyId))return storyInterludeNarrative.call(this);
    this.state.pending={id:this.makeId('universe'),type:'v13-universe',stage:'offer',label:event.title,sub:event.prompt,event,branchId:event.id};
    this.save();this.renderAll();return true;
  };

  P.applyUniverseChoiceV13=function(eventId,choiceId) {
    const p=this.state.pending,event=p?.type==='v13-universe'&&p.event;
    if(!event||event.id!==eventId)return;
    const arc=this.ensureStageArcV9(this.stageNumber()),result=narrative.recordChoice(this.state,event,choiceId,{spin:this.state.spin,stage:arc.stageNumber,allyIds:[]});
    if(!result.ok)return this.toast(result.error);
    this.applyNarrativeEffectV13(result.effect,`${event.title}: ${result.choice.label}`);
    if(result.effect.respect&&this.state.rivalArc)this.state.rivalArc.respect=Number(this.state.rivalArc.respect||0)+Number(result.effect.respect);
    arc.decisions.push({branchId:event.id,choiceId,at:Date.now(),universe:event.universe});arc.branchIndex=Math.min(3,Number(arc.branchIndex||0)+1);
    this.state.choiceHistory.push({stage:arc.stageNumber,branchId:event.id,choiceId,effect:copy(result.effect),universe:event.universe,time:Date.now()});
    p.stage='result';p.v9InterludeComplete=true;p.resultText=`${result.choice.label}. Cost: ${result.choice.cost}. Consequence: ${result.choice.gain}.`;
    this.save();this.renderAll();
  };

  P.renderUniverseEventV13=function(p) {
    const event=p.event;
    if(p.stage==='result'){
      this.eventPanel.innerHTML=this.eventHeader('rare',event.title,p.resultText)+`<div class="v13-consequence-return"><span>THIS WILL RETURN</span><b>${event.choices.find(choice=>choice.id===this.state.v13.eventHistory.at(-1)?.choiceId)?.effect?.callback?'A delayed callback is now part of the route.':'The ending will remember this decision.'}</b></div><div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>`;return;
    }
    const rival=CHAR.get(this.state.rivalArc?.id);
    this.eventPanel.innerHTML=`<section class="v13-universe-event"><header><span>${esc(canonicalUniverse(event.universe))} EVENT PACK • ${esc(event.kind.toUpperCase())}</span><h2>${esc(event.title)}</h2><p>${esc(event.prompt)}</p></header><div class="v13-event-context"><article><span>LOCATION</span><b>${esc(event.location)}</b></article><article><span>FACTION</span><b>${esc(event.faction)}</b></article><article><span>ACTIVE HAZARD</span><b>${esc(event.hazard)}</b></article>${rival?`<article><span>RIVAL WITNESS</span><b>${esc(rival.name)}</b></article>`:''}</div><div class="choice-grid">${event.choices.map(choice=>`<button class="choice-btn ${choice.effect.hero?'good':choice.effect.villain?'gold':''}" data-v13-universe="${event.id}|${choice.id}"><strong>${esc(choice.label)}</strong><small>${esc(choice.prompt)}</small><div class="v9-choice-consequence"><span>COST • ${esc(choice.cost)}</span><span>GAIN • ${esc(choice.gain)}</span></div></button>`).join('')}</div></section>`;
  };

  P.deliverCallbackV13=function(callback) {
    const outcome=narrative.resolveCallback(this.state,callback.id);if(!outcome)return false;
    this.applyNarrativeEffectV13(outcome.effect,outcome.title);
    this.state.pending={id:this.makeId('callback'),type:'v13-callback',stage:'offer',label:outcome.title,sub:outcome.description,callback:outcome.callback,outcome};
    this.save();this.renderAll();return true;
  };

  P.renderCallbackV13=function(p) {
    const outcome=p.outcome;
    this.eventPanel.innerHTML=this.eventHeader('rare',outcome.title,outcome.description)+`<section class="v13-callback"><span>CHOICE CALLBACK • ${esc(canonicalUniverse(outcome.callback.universe))}</span><b>${esc(titleCase(outcome.callback.sourceChoice))} returned on Spin ${this.state.spin}.</b><p>${Object.entries(outcome.effect).map(([key,value])=>`${Number(value)>0?'+':''}${Math.round(Number(value)*(/energy|health|bossPower/.test(key)?100:1))} ${titleCase(key)}`).join(' • ')||'Narrative consequence resolved.'}</p></section><div class="resolve-row"><button class="primary-btn" data-v13-callback-ack>${p.stage==='result'?'CONTINUE':'ACCEPT CONSEQUENCE'}</button></div>`;
  };

  const completeEventNarrative=P.completeEvent;
  P.completeEvent=function() {
    const p=this.state.pending;
    if(p?.type!=='v13-callback'&&p?.stage==='result'){
      const callback=narrative.nextCallback(this.state,this.state.spin);if(callback&&this.deliverCallbackV13(callback))return;
    }
    return completeEventNarrative.call(this);
  };

  P.resolveRivalV13=function(choice) {
    const p=this.state.pending,rival=this.state.rivalArc,character=rival&&CHAR.get(rival.id);if(!p?.v9Rival||!rival||!character)return;
    const outcome=narrative.rivalOutcome({respect:rival.respect,wins:rival.wins,losses:rival.losses,hero:this.state.v13.storyStats.hero,villain:this.state.v13.storyStats.villain,finalWin:false,choice});
    this.state.v13.rivalResolution={...outcome,characterId:character.id,name:character.name,spin:this.state.spin};rival.resolution=outcome.id;
    if(outcome.id==='recruit')this.recruit(character.id,this.state.party.length>=this.partyCapacity(),true);
    else if(outcome.id==='redemption'){this.state.credits+=250;stateEngine.earnFate(this.state,1,'rival redemption',this.state.spin);}
    else if(outcome.id==='permanent-nemesis'){rival.level=Math.min(15,Number(rival.level||1)+2);this.addBonuses({might:3,defense:3,skill:3});}
    narrative.highlight(this.state,{type:'rival',spin:this.state.spin,title:outcome.label,detail:outcome.description,weight:7});
    p.v13RivalResolved=true;this.finishBattleReward(`${outcome.label}: ${outcome.description}`);
  };

  const renderEventNarrative=P.renderEvent;
  P.renderEvent=function() {
    const p=this.state.pending;
    if(p?.type==='v13-universe')return this.renderUniverseEventV13(p);
    if(p?.type==='v13-callback')return this.renderCallbackV13(p);
    return renderEventNarrative.call(this);
  };

  const renderCombatNarrative=P.renderCombat;
  P.renderCombat=function(p) {
    const result=renderCombatNarrative.call(this,p);
    if(p?.v9Rival&&p.stage==='battle_reward'&&!p.v13RivalResolved&&!this.eventPanel.querySelector('.v13-rival-resolution')){
      const rival=this.state.rivalArc||{},canInvite=Number(rival.wins||0)>=2&&Number(rival.respect||0)>=18;
      const anchor=this.eventPanel.querySelector('.choice-grid');anchor?.insertAdjacentHTML('beforebegin',`<section class="v13-rival-resolution"><span>RIVAL ARC DECISION</span><h3>This victory can end the rivalry differently.</h3><div><button data-v13-rival="invite" ${canInvite?'':'disabled'}><b>INVITE</b><small>${canInvite?'Convert respect into recruitment.':`Requires 2 wins and 18 respect • ${rival.wins||0} wins / ${rival.respect||0} respect`}</small></button><button data-v13-rival="redeem"><b>OFFER REDEMPTION</b><small>High respect and heroic choices may turn the rival toward the finale.</small></button><button data-v13-rival="bind"><b>BIND THE RIVALRY</b><small>Gain power now, but create a permanent nemesis.</small></button></div></section>`);
    }
    return result;
  };

  const renderShellNarrative=P.renderShell;
  P.renderShell=function(section,tab) {
    const result=renderShellNarrative.call(this,section,tab);
    if(section!=='team')return result;
    const body=document.getElementById('v8-body'),tabs=body?.querySelector('.v8-tabs');if(!body||!tabs)return result;
    const allies=(this.state.party||[]).map(id=>{const character=CHAR.get(id),arc=this.loyaltyV13(id);return{character,arc};}).filter(item=>item.character);
    tabs.insertAdjacentHTML('afterend',`<section class="v13-loyalty-summary"><header><span>RELATIONSHIP CONSEQUENCES</span><b>40 Loyalty unlocks assists • 65 lowers assist cost • 80 unlocks the strongest bond bonus</b></header><div>${allies.map(({character,arc})=>`<article class="${arc.tier.id}"><img src="${this.characterPortrait(character)}" alt=""><span>${esc(arc.tier.label.toUpperCase())}</span><b>${esc(character.name)} • ${Math.round(arc.loyalty)}</b><small>${arc.tier.willDepart?'May leave after another ruthless choice.':arc.tier.willRefuse?'Will refuse risky assists.':arc.tier.id==='devoted'?'Assist cost 40 • strongest combo scaling':arc.tier.id==='trusted'?'Assist cost 45':'Assist cost 50'}</small></article>`).join('')||'<p>Recruit allies to begin relationship arcs.</p>'}</div></section>`);
    return result;
  };

  P.createEndingV13=function(finalWin=this.state.finalWin) {
    this.ensureNarrativeV13();
    const rival=this.state.rivalArc||{},existing=this.state.v13.rivalResolution;
    const rivalOutcome=existing||narrative.rivalOutcome({respect:rival.respect,wins:rival.wins,losses:rival.losses,hero:this.state.v13.storyStats.hero,villain:this.state.v13.storyStats.villain,finalWin});
    this.state.v13.rivalResolution={...rivalOutcome,characterId:rival.id||null,name:CHAR.get(rival.id)?.name||'The rival'};
    const uniqueUniverses=new Set([this.baseCharacter?.(),...(this.state.kits||[]).map(kit=>CHAR.get(kit.id))].filter(Boolean).map(character=>canonicalUniverse(character.universe))).size;
    const ending=narrative.deriveEnding(this.state,{finalWin,baseScore:this.score(),difficulty:this.state.difficulty,uniqueUniverses,rivalOutcome:this.state.v13.rivalResolution});
    this.state.v13.ending=ending;
    const active=(this.state.activePowerSets||[]).map(id=>CHAR.get(id)).filter(Boolean),build=builds.buildIdentity(active);
    this.state.v13.recap=narrative.recap(this.state,{hero:this.state.customCharacter?.codename||'Unknown hero',ending,record:this.state.record,build:build.label,party:(this.state.party||[]).map(id=>({id,name:CHAR.get(id)?.name,loyalty:this.loyaltyV13(id).loyalty}))});
    const arcs=[...(this.state.stageHistory||[]),this.state.stageArc].filter(Boolean);this.state.v13.recap.objectives=arcs.map(arc=>({stage:arc.stageNumber,name:arc.name||`Stage ${arc.stageNumber}`,progress:Number(arc.progress||0),target:Number(arc.target||0),completed:Boolean(arc.completed)}));
    this.state.v13.recap.unlocks=[...new Set([...(this.state.metaSnapshot?.unlocks||[]),...Object.keys(this.state.achievements||{}),ending.id,ending.win?'new-game-plus':'legacy-record'])].slice(0,12);
    return ending;
  };

  const endRunNarrative=P.endRun;
  P.endRun=function(win) {this.createEndingV13(Boolean(win));return endRunNarrative.call(this,win);};

  P.recapTextV13=function() {
    const recap=this.state.v13.recap||this.createEndingV13(this.state.finalWin),ending=recap.ending,score=ending.score;
    return [`MULTIVERSE WHEEL V13 — ${ending.title}`,ending.epilogue,`${recap.hero} • ${recap.build}`,`${recap.record.wins||0} wins / ${recap.record.losses||0} losses / ${recap.record.bossWins||0} bosses`,`Score ${score.total.toLocaleString()} • Core ${score.sections.core} • Bonds ${score.sections.bonds} • Story ${score.sections.story}`,`Rival: ${ending.rivalOutcome?.label||'Unresolved'}`,...recap.highlights.map(item=>`Spin ${item.spin}: ${item.title} — ${item.detail}`),`Seed ${String(recap.seed>>>0).padStart(10,'0')}`,recap.challengeCode?`Challenge ${recap.challengeCode}`:''].filter(Boolean).join('\n');
  };

  P.copyRecapV13=async function(){const text=this.recapTextV13();try{await navigator.clipboard.writeText(text);}catch{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove();}this.toast('V13 run recap copied.');};

  P.downloadRecapCardV13=function() {
    const recap=this.state.v13.recap||this.createEndingV13(this.state.finalWin),ending=recap.ending,canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,1200,630);gradient.addColorStop(0,'#050b19');gradient.addColorStop(.55,'#111d3c');gradient.addColorStop(1,ending.win?'#123f4a':'#4b1729');ctx.fillStyle=gradient;ctx.fillRect(0,0,1200,630);ctx.fillStyle='#68e7ff';ctx.fillRect(64,62,10,506);ctx.fillStyle='#9fb0d0';ctx.font='600 24px system-ui';ctx.fillText('MULTIVERSE WHEEL • V13 TIMELINE RECORD',104,105);ctx.fillStyle='#ffffff';ctx.font='800 56px system-ui';ctx.fillText(ending.title.slice(0,34),104,185);ctx.font='700 34px system-ui';ctx.fillStyle='#ffd36a';ctx.fillText(recap.hero,104,240);ctx.font='500 25px system-ui';ctx.fillStyle='#d8e3f8';ctx.fillText(recap.build,104,282);ctx.fillStyle='#0a1225';ctx.fillRect(104,326,992,130);const metrics=[['SCORE',ending.score.total.toLocaleString()],['WINS',String(recap.record.wins||0)],['BOSSES',String(recap.record.bossWins||0)],['ENDING',ending.win?'VICTORY':'LEGACY']];metrics.forEach(([label,value],index)=>{const x=134+index*238;ctx.fillStyle='#94a7cc';ctx.font='600 17px system-ui';ctx.fillText(label,x,362);ctx.fillStyle='#ffffff';ctx.font='800 32px system-ui';ctx.fillText(value,x,410);});ctx.fillStyle='#aab9d5';ctx.font='500 18px system-ui';ctx.fillText(`SEED ${String(recap.seed>>>0).padStart(10,'0')} • ${ending.rivalOutcome?.label||'Rival unresolved'}`,104,512);ctx.fillStyle='#ffffff';ctx.font='600 20px system-ui';ctx.fillText((recap.highlights[0]?.title||ending.epilogue).slice(0,82),104,555);const link=document.createElement('a');link.download=`multiverse-wheel-${String(recap.hero).toLowerCase().replace(/[^a-z0-9]+/g,'-')||'timeline'}.png`;link.href=canvas.toDataURL('image/png');link.click();
  };

  const copySummaryNarrative=P.copySummary;
  P.copySummary=function(){if(this.state?.ended)return this.copyRecapV13();return copySummaryNarrative.call(this);};

  const renderEndingNarrative=P.renderEnding;
  P.renderEnding=function() {
    const ending=this.state.v13.ending||this.createEndingV13(this.state.finalWin),recap=this.state.v13.recap,score=ending.score;
    if(!ending)return renderEndingNarrative.call(this);
    this.eventPanel.innerHTML=`<section class="v13-ending ${ending.win?'victory':'legacy'}"><header><span>${ending.win?'TIMELINE SECURED':'TIMELINE LEGACY'}</span><h2>${esc(ending.title)}</h2><p>${esc(ending.epilogue)}</p></header><div class="v13-ending-score"><article><span>FINAL SCORE</span><b>${score.total.toLocaleString()}</b></article>${Object.entries(score.sections).map(([key,value])=>`<article><span>${esc(titleCase(key))}</span><b>${Number(value).toLocaleString()}</b></article>`).join('')}</div><section class="v13-rival-epilogue"><span>RIVAL OUTCOME</span><b>${esc(ending.rivalOutcome?.label||'Unresolved')}</b><p>${esc(ending.rivalOutcome?.description||'The rival vanished beyond the recorded route.')}</p></section>${recap.mvp?`<section class="v13-ending-mvp"><span>MVP ALLY</span><b>${esc(recap.mvp.name)} • Loyalty ${Math.round(recap.mvp.loyalty)}</b></section>`:''}<section class="v13-ending-record"><div><span>OBJECTIVE RECORD</span>${(recap.objectives||[]).map(item=>`<b>${item.completed?'✓':'○'} Stage ${item.stage} • ${esc(item.name)} • ${item.progress}/${item.target}</b>`).join('')||'<b>No stage objectives recorded.</b>'}</div><div><span>UNLOCKS & LEGACY</span>${(recap.unlocks||[]).map(item=>`<b>${esc(titleCase(item))}</b>`).join('')||'<b>Timeline record archived</b>'}</div></section><section class="v13-run-highlights"><span>RUN HIGHLIGHTS • CHRONOLOGICAL</span>${recap.highlights.map(item=>`<article><b>SPIN ${item.spin} • ${esc(item.title)}</b><p>${esc(item.detail)}</p></article>`).join('')||'<p>The timeline record contains no marked highlights.</p>'}</section><div class="choice-grid three"><button class="choice-btn good" data-v13-recap-copy><strong>COPY FULL RECAP</strong><small>Ending, build, score breakdown, choices, seed, and challenge code.</small></button><button class="choice-btn" data-v13-recap-card><strong>DOWNLOAD SHARE CARD</strong><small>Create a local 1200×630 PNG. Nothing is uploaded.</small></button><button class="choice-btn gold" data-v13-ng-plus><strong>NEW GAME+</strong><small>Choose a legacy benefit and a timeline mutator.</small></button></div></section>`;
  };

  const bindNarrative=P.bind;
  P.bind=function() {
    bindNarrative.call(this);this.ensureNarrativeV13();if(this._v13NarrativeBound)return;this._v13NarrativeBound=true;
    document.addEventListener('click',event=>{
      const story=event.target.closest('[data-v13-universe]');if(story){const [eventId,choiceId]=story.dataset.v13Universe.split('|');return this.applyUniverseChoiceV13(eventId,choiceId);}
      if(event.target.closest('[data-v13-callback-ack]')){if(this.state.pending?.stage==='offer'){this.state.pending.stage='result';this.state.pending.resultText='The callback has permanently changed this route.';this.save();return this.renderAll();}return this.completeEvent();}
      const rival=event.target.closest('[data-v13-rival]');if(rival)return this.resolveRivalV13(rival.dataset.v13Rival);
      if(event.target.closest('[data-v13-recap-copy]'))return this.copyRecapV13();
      if(event.target.closest('[data-v13-recap-card]'))return this.downloadRecapCardV13();
    });
  };
})();
