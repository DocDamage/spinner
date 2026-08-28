'use strict';

// V13 combat experience: quick resolution for stable encounters, party assist
// economy, exploit windows, boss phase rules, adaptive difficulty behavior,
// and persistent after-action reporting.
(() => {
  const {CombatExperienceEngine}=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const combatExperience=new CombatExperienceEngine();

  P.combatExperienceV13=function(p=this.state.pending) {
    if(!p||!['battle','boss'].includes(p.type))return null;
    const state=this.combat8(p);combatExperience.ensure(state);return state;
  };

  P.quickResolvePreviewV13=function(p=this.state.pending) {
    if(!p||!['battle','boss'].includes(p.type))return {eligible:false,reason:'No combat is active.'};
    const enemy=this.battleProfile(p),best=Math.max(...Object.keys(STRATEGIES).map(strategy=>this.battleOdds(p,strategy))),hero=this.overall(this.effectiveStats()),enemyRating=this.overall(enemy.stats);
    return combatExperience.quickResolvePreview({type:p.type,winChance:best,heroRating:hero,enemyRating,difficulty:this.state.difficulty});
  };

  P.performQuickResolveV13=function() {
    const p=this.state.pending,preview=this.quickResolvePreviewV13(p);if(!preview.eligible)return this.toast(preview.reason);
    const enemy=this.battleProfile(p),state=this.combatExperienceV13(p),fighter=this.fighter(state),roll=this.rand(),damage=this.int(preview.damageMin,preview.damageMax);
    this.setFighter(state,Math.max(1,fighter.hp-damage),fighter.energy);
    if(roll<=preview.chance) {
      state.enemyHP=0;
      combatExperience.record(state,{round:1,label:'Quick Resolve',damageDealt:state.enemyMaxHP,damageTaken:damage,pivotal:`Simulated victory at ${Math.round(preview.chance*100)}% confidence.`});
      p.v13Report=combatExperience.summarize(state,this.state.party.map(id=>({id,name:CHAR.get(id)?.name,loyalty:this.v8Party(id)?.loyalty||0})));
      this.log(`QUICK RESOLVE: ${enemy.name} defeated; ${damage} HP attrition taken.`,'win');
      this.afterWin(enemy);return this.finishCombatVictory(p,enemy);
    }
    state.enemyHP=Math.max(1,Math.round(state.enemyMaxHP*.62));
    combatExperience.record(state,{round:1,label:'Quick Resolve failed',damageTaken:damage,pivotal:'The simulation broke down and combat resumed manually.'});
    this.log(`QUICK RESOLVE FAILED: ${enemy.name} forced manual combat after ${damage} HP attrition.`,'loss');
    this.save();this.renderAll();
  };

  P.assistOptionsV13=function() {
    return this.state.party.map(id=>{const character=CHAR.get(id),record=this.v8Party(id);return character?combatExperience.assistFor(character,record?.loyalty||50):null;}).filter(Boolean);
  };

  P.useAssistV13=function(id) {
    const p=this.state.pending,state=this.combatExperienceV13(p),enemy=p&&this.battleProfile(p);if(!state||!enemy)return;
    const option=this.assistOptionsV13().find(item=>item.characterId===id);if(!option)return;
    const spent=combatExperience.spendAssist(state,option.cost,state.round);if(!spent.ok)return this.toast(spent.error);
    const fighter=this.fighter(state);let detail='';
    if(option.kind==='heal'){const amount=Math.round(fighter.maxHP*option.amount);this.setFighter(state,fighter.hp+amount,fighter.energy);state.v13.report.healing+=amount;detail=`restored ${amount} HP`;}
    else if(option.kind==='damage'){const amount=Math.max(8,Math.round(state.enemyMaxHP*option.amount));state.enemyHP=Math.max(0,state.enemyHP-amount);state.v13.report.damageDealt+=amount;detail=`dealt ${amount} damage`;}
    else if(option.kind==='expose'){state.v13.exploit={matched:['party setup'],active:true,damageBonus:option.amount,duration:2};detail='opened a two-round exploit window';}
    else if(option.kind==='intel'){state.v9IntelRounds=Math.max(state.v9IntelRounds||0,Number(option.amount));this.statusAdd(state.playerStatuses,'barrier',1);detail='revealed intent and raised Barrier';}
    else if(option.kind==='seal'){this.statusAdd(state.enemyStatuses,'stunned',Number(option.amount));detail='briefly bound the enemy';}
    else if(option.kind==='shield'){this.statusAdd(state.playerStatuses,'barrier',Number(option.amount));detail='provided Vanguard cover';}
    else {const amount=Math.round(fighter.maxEnergy*option.amount);this.setFighter(state,fighter.hp,fighter.energy+amount);detail=`restored ${amount} Energy`;}
    combatExperience.record(state,{round:state.round,label:`${option.name}: ${option.label}`,detail,pivotal:state.enemyHP<=0?'An ally delivered the finishing action.':''});
    this.stageProgressV9?.('teamwork');this.log(`PARTY ASSIST: ${option.name} ${detail}.`,'win');
    if(state.enemyHP<=0){this.afterWin(enemy);return this.finishCombatVictory(p,enemy);}
    this.save();this.renderAll();
  };

  P.useComboV13=function() {
    const p=this.state.pending,state=this.combatExperienceV13(p),enemy=p&&this.battleProfile(p),options=this.assistOptionsV13();if(!state||!enemy||options.length<2)return this.toast('Two allies are required for a team combo.');
    const spent=combatExperience.spendAssist(state,100,state.round);if(!spent.ok)return this.toast(spent.error);
    const damage=Math.max(15,Math.round(state.enemyMaxHP*.2));state.enemyHP=Math.max(0,state.enemyHP-damage);this.statusAdd(state.playerStatuses,'barrier',1);state.v13.report.damageDealt+=damage;
    const names=options.slice(0,2).map(option=>option.name).join(' + ');combatExperience.record(state,{round:state.round,label:`Team Combo: ${names}`,damageDealt:0,detail:`${damage} damage and Barrier`,pivotal:'The party spent a full assist meter.'});
    this.stageProgressV9?.('teamwork');this.log(`TEAM COMBO: ${names} dealt ${damage} damage.`,'rare');
    if(state.enemyHP<=0){this.afterWin(enemy);return this.finishCombatVictory(p,enemy);}
    this.save();this.renderAll();
  };

  const hitDamageCombatV13=P.hitDamage;
  P.hitDamage=function(...args){const result=hitDamageCombatV13.apply(this,args);if(result&&this._v13ExploitBonus)result.dmg=Math.max(1,Math.round(result.dmg*(1+this._v13ExploitBonus)));return result;};

  const intentCombatV13=P.enemyIntentV9;
  P.enemyIntentV9=function(p,enemy,state) {
    const plan=intentCombatV13.call(this,p,enemy,state),fighter=this.fighter(state),adaptive=combatExperience.adaptivePlan({difficulty:this.state.difficulty,round:state.round,playerHistory:state.playerHistory,fighterHpRatio:fighter.hp/Math.max(1,fighter.maxHP),fighterEnergyRatio:fighter.energy/Math.max(1,fighter.maxEnergy)});
    combatExperience.ensure(state).adaptivePlan=adaptive;
    if(adaptive.id!=='standard')plan.intent={...plan.intent,label:adaptive.label,telegraph:adaptive.description,v13Adaptive:true};
    return plan;
  };

  const enemyTurnCombatV13=P.enemyTurn;
  P.enemyTurn=function(p,enemy,state,guard=false) {
    const combatState=combatExperience.ensure(state),adaptive=combatState.adaptivePlan||combatExperience.adaptivePlan({difficulty:this.state.difficulty,round:state.round,playerHistory:state.playerHistory});
    if(adaptive.effect==='barrier')this.statusAdd(state.enemyStatuses,'barrier',1);
    const before=this.fighter(state).hp;enemyTurnCombatV13.call(this,p,enemy,state,guard);const damage=Math.max(0,before-this.fighter(state).hp);
    if(adaptive.effect==='seal'&&damage)this.statusAdd(state.playerStatuses,'power_sealed',1);
    if(adaptive.effect==='execute'&&damage)this.statusAdd(state.playerStatuses,'stunned',1);
    combatExperience.charge(state,'taken',{damage});combatExperience.record(state,{round:state.round,label:`Enemy: ${adaptive.label}`,damageTaken:damage,detail:damage?`${damage} damage received`:'No damage received'});
  };

  const attackCombatV13=P.combatAttack;
  P.combatAttack=function(strategy) {
    const p=this.state.pending,state=p&&this.combatExperienceV13(p),enemy=state&&this.battleProfile(p),beforeEnemy=state?.enemyHP||0,beforeEnergy=state?this.fighter(state).energy:0,criticals=this.state.runStats?.crits||0;
    let exploit=null,technique=null;
    if(state&&enemy){technique=this.fighterTech(enemy,state).find(item=>item.id===p.technique||this.techKey(item)===p.technique);exploit=combatExperience.exploit(enemy,technique?.tags||[]);if(exploit.active)state.v13.exploit=exploit;this._v13ExploitBonus=state.v13.exploit?.damageBonus||0;}
    try{return attackCombatV13.call(this,strategy);}finally{
      this._v13ExploitBonus=0;
      if(state&&technique){const dealt=Math.max(0,beforeEnemy-Number(state.enemyHP||0)),landed=dealt>0,energySpent=Math.max(0,beforeEnergy-this.fighter(state).energy);combatExperience.charge(state,'attack',{landed});combatExperience.record(state,{round:state.round,label:technique.name,damageDealt:dealt,energySpent,criticals:Math.max(0,(this.state.runStats?.crits||0)-criticals),detail:exploit?.active?`Exploited ${exploit.matched.join(', ')}`:landed?'Technique landed':'Technique missed'});if(state.v13.exploit){state.v13.exploit.duration--;if(state.v13.exploit.duration<=0)state.v13.exploit=null;}this.save();}
    }
  };

  const counterCombatV13=P.combatCounterV9;
  P.combatCounterV9=function() {
    const p=this.state.pending,state=p&&this.combatExperienceV13(p),before=state?.enemyHP||0,beforeEnergy=state?this.fighter(state).energy:0,result=counterCombatV13.call(this);
    if(state){const succeeded=state.enemyHP<before;combatExperience.charge(state,'counter',{succeeded});combatExperience.record(state,{round:state.round,label:'Counter Intent',damageDealt:Math.max(0,before-state.enemyHP),energySpent:Math.max(0,beforeEnergy-this.fighter(state).energy),counter:succeeded,detail:succeeded?'Intent reversed':'Counter did not reverse the attack'});this.save();}
    return result;
  };
  const supportCombatV13=P.combatSupportV9;
  P.combatSupportV9=function(){const p=this.state.pending,state=p&&this.combatExperienceV13(p),before=state?this.fighter(state).hp:0,result=supportCombatV13.call(this);if(state){combatExperience.charge(state,'support');combatExperience.record(state,{round:state.round,label:'Party Support',healing:Math.max(0,this.fighter(state).hp-before),detail:'An ally consumed the turn to support the active fighter.'});this.save();}return result;};
  const guardCombatV13=P.combatGuard;
  P.combatGuard=function(){const p=this.state.pending,state=p&&this.combatExperienceV13(p),result=guardCombatV13.call(this);if(state){combatExperience.charge(state,'guard');combatExperience.record(state,{round:state.round,label:'Guard + Recharge',detail:'Raised Barrier and restored Energy.'});this.save();}return result;};

  const initCombatV13=P.combat8;
  P.combat8=function(p) {
    const state=initCombatV13.call(this,p),v13=combatExperience.ensure(state);
    if(p?.type==='boss'&&(!v13.bossRule||v13.bossRule.phase!==p.phase))v13.bossRule=combatExperience.bossRule(this.battleProfile(p),p.phase,this.state.seed);
    return state;
  };

  const victoryCombatV13=P.finishCombatVictory;
  P.finishCombatVictory=function(p,enemy){if(p?.combat){const state=this.combatExperienceV13(p);p.v13Report=combatExperience.summarize(state,this.state.party.map(id=>({id,name:CHAR.get(id)?.name,loyalty:this.v8Party(id)?.loyalty||0})));}return victoryCombatV13.call(this,p,enemy);};
  const knockoutCombatV13=P.fighterKO;
  P.fighterKO=function(p,enemy,state){if(p&&state)p.v13Report=combatExperience.summarize(state,this.state.party.map(id=>({id,name:CHAR.get(id)?.name,loyalty:this.v8Party(id)?.loyalty||0})));return knockoutCombatV13.call(this,p,enemy,state);};

  P.renderAfterActionV13=function(p) {
    const report=p?.v13Report;if(!report||this.eventPanel.querySelector('.v13-after-action'))return;
    const anchor=this.eventPanel.querySelector('.v11-reward-compare,.choice-grid,.resolve-row');if(!anchor)return;
    anchor.insertAdjacentHTML('beforebegin',`<section class="v13-after-action"><header><span>AFTER-ACTION REPORT</span><b>${report.rounds||1} rounds • ${report.damageDealt} dealt • ${report.damageTaken} taken</b></header><div><article><b>${report.criticals}</b><small>Criticals</small></article><article><b>${report.counters}</b><small>Counters</small></article><article><b>${report.assists}</b><small>Assists</small></article><article><b>${report.healing}</b><small>Healing</small></article><article><b>${report.energySpent||0}</b><small>Energy spent</small></article></div>${report.mvp?`<p>MVP ally: <strong>${esc(report.mvp.name)}</strong> • Loyalty ${report.mvp.loyalty}</p>`:''}${report.pivotal?.length?`<ul>${report.pivotal.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:''}</section>`);
  };

  P.renderCombatLayerV13=function(p) {
    if(!p||!['battle','boss'].includes(p.type))return;
    this.renderAfterActionV13(p);
    if(['battle_reward','result'].includes(p.stage))return;
    const state=this.combatExperienceV13(p),enemy=this.battleProfile(p),fighter=this.fighter(state),quick=this.quickResolvePreviewV13(p),options=this.assistOptionsV13(),rule=state.v13.bossRule,adaptive=state.v13.adaptivePlan,selected=this.fighterTech(enemy,state).find(item=>item.id===p.technique||this.techKey(item)===p.technique),projected=combatExperience.exploit(enemy,selected?.tags||[]);
    const top=this.eventPanel.querySelector('.v11-combat-toolbar,.v6-combat-top');
    top?.insertAdjacentHTML('beforebegin',`${rule?`<section class="v13-boss-rule"><div><span>BOSS PHASE ${p.phase} RULE</span><b>${esc(rule.name)}</b><small>${esc(rule.description)}</small></div><p><strong>COUNTERPLAY</strong>${esc(rule.counter)}</p></section>`:''}<section class="v13-combat-command"><div class="v13-assist-meter"><span>PARTY ASSIST</span><b>${Math.round(state.v13.assist)} / ${state.v13.assistMax}</b><i><em style="width:${state.v13.assist/state.v13.assistMax*100}%"></em></i></div><div class="v13-combat-plan"><span>ENEMY BEHAVIOR</span><b>${esc(adaptive?.label||'Visible intent')}</b><small>${esc(adaptive?.description||'Inspect the telegraph below.')}</small></div>${projected.active?`<div class="v13-exploit-window"><span>EXPLOIT READY</span><b>+${Math.round(projected.damageBonus*100)}% DAMAGE</b><small>${projected.matched.map(titleCase).map(esc).join(' • ')}</small></div>`:'<div class="v13-exploit-window dormant"><span>NO EXPLOIT</span><b>Match weakness tags</b><small>Inspect the structured weakness in the build-shift panel.</small></div>'}</section>${state.round===1&&quick.eligible?`<button type="button" class="v13-quick-resolve" data-v13-quick><span>QUICK RESOLVE • ${Math.round(quick.chance*100)}%</span><small>Risk ${quick.damageMin}–${quick.damageMax} HP attrition • ${esc(quick.reward)}</small></button>`:''}`);
    const actions=this.eventPanel.querySelector('.resolve-row');
    actions?.insertAdjacentHTML('afterend',`<section class="v13-assist-actions"><div><span>OFF-TURN ASSISTS • ONE PER ROUND</span><b>Build charge by attacking, countering, guarding, taking hits, and using support.</b></div>${options.map(option=>`<button type="button" data-v13-assist="${option.characterId}" ${state.v13.assist<option.cost||state.v13.assistRound===state.round?'disabled':''}><strong>${esc(option.name)} • ${esc(option.label)}</strong><small>${esc(titleCase(option.kind))} • Loyalty ${option.loyalty} • ${option.cost} charge</small></button>`).join('')}${options.length>=2?`<button type="button" data-v13-combo ${state.v13.assist<100||state.v13.assistRound===state.round?'disabled':''} class="combo"><strong>TEAM COMBO • 100</strong><small>Two allies strike for 20% enemy HP and grant Barrier.</small></button>`:''}</section>`);
  };

  const renderCombatV13=P.renderCombat;
  P.renderCombat=function(p){const result=renderCombatV13.call(this,p);this.renderCombatLayerV13(p);return result;};

  const bindCombatV13=P.bind;
  P.bind=function(){bindCombatV13.call(this);if(this._v13CombatBound)return;this._v13CombatBound=true;document.addEventListener('click',event=>{if(event.target.closest('[data-v13-quick]'))return this.performQuickResolveV13();const assist=event.target.closest('[data-v13-assist]');if(assist)return this.useAssistV13(assist.dataset.v13Assist);if(event.target.closest('[data-v13-combo]'))return this.useComboV13();});};
})();
