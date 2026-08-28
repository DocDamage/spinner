'use strict';

// V13 run agency and build progression: deterministic Fate controls, loadout
// presets, mastery branches, pins, build identity, comparisons, and undo.
(() => {
  const {V13StateEngine,BuildProgressionEngine,FATE_COSTS}=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const stateEngine=new V13StateEngine(),progression=new BuildProgressionEngine();
  const copy=value=>JSON.parse(JSON.stringify(value));
  const protectedTypes=new Set(['origin','boss','v9-story','v9-camp','ending']);

  P.buildIdentityV13=function(extra=[]) {
    const active=this.activePowerCharacters?.()||[];
    return progression.buildIdentity([...active,...extra].filter(Boolean));
  };
  P.masteryEffectsV13=function() {return progression.branchEffects(this.state,this.state.activePowerSets||[]);};

  P.fateContextV13=function() {
    const next=Math.max(1,Number(this.state.spin||0)+(this.state.pending?0:1)),pending=this.state.pending;
    return {spin:pending?Number(this.state.spin||next):next,firstPower:next===1,boss:next%10===0||pending?.type==='boss',scripted:protectedTypes.has(pending?.type),daily:this.state.v13.runContext?.kind==='daily',hasPending:!!pending};
  };

  P.injectAgencyV13=function() {
    if(document.getElementById('v13-agency-modal'))return;
    const modal=document.createElement('div');modal.id='v13-agency-modal';modal.className='v13-agency-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','v13-agency-title');
    modal.innerHTML='<div class="v13-agency-card"><header><div><span>BOUNDED WHEEL CONTROL</span><h2 id="v13-agency-title">Bend Fate</h2></div><button type="button" data-v13-fate-close>CLOSE</button></header><div id="v13-agency-body"></div></div>';
    document.body.appendChild(modal);
  };

  P.openFateV13=function() {this.injectAgencyV13();this.renderFateV13();const modal=document.getElementById('v13-agency-modal');modal.classList.add('open');setTimeout(()=>modal.querySelector('button')?.focus(),0);};
  P.closeFateV13=function(){document.getElementById('v13-agency-modal')?.classList.remove('open');};

  P.renderFateV13=function() {
    const root=document.getElementById('v13-agency-body');if(!root)return;
    const fate=this.state.v13.fate,context=this.fateContextV13(),eligible=(this.state.slices||[]).filter(slice=>!protectedTypes.has(slice.type));
    const uniqueTypes=[...new Set(eligible.map(slice=>slice.type))];
    const protectedBeat=context.firstPower||context.boss||context.scripted||context.daily;
    const history=fate.history.slice(0,5);
    root.innerHTML=`<section class="v13-fate-balance"><div><span>AVAILABLE</span><b>${fate.current} / ${fate.max}</b></div><p>Fate is earned from bosses, hazards, rare anomalies, and consequential story resolutions. Protected route beats cannot be bypassed.</p></section>${protectedBeat?`<div class="v13-fate-protected"><b>PROTECTED ROUTE BEAT</b><span>${context.daily?'Daily Challenge wheels use an unaltered shared seed.':context.firstPower?'The guaranteed first discovery cannot be altered.':context.boss?'Boss wheels preserve stage integrity.':'This scripted consequence must resolve as written.'}</span></div>`:this.state.pending?`<section><h3>Alter the landed result</h3><div class="v13-fate-actions"><button data-v13-fate-result="nudge|-1" ${fate.current<FATE_COSTS.nudge||!this._v13PreSpinSnapshot?'disabled':''}><b>NUDGE LEFT • ${FATE_COSTS.nudge}</b><small>Resolve the adjacent slice instead.</small></button><button data-v13-fate-result="reroll|0" ${fate.current<FATE_COSTS.reroll||!this._v13PreSpinSnapshot?'disabled':''}><b>REROLL • ${FATE_COSTS.reroll}</b><small>Restore the pre-spin state and land elsewhere.</small></button><button data-v13-fate-result="nudge|1" ${fate.current<FATE_COSTS.nudge||!this._v13PreSpinSnapshot?'disabled':''}><b>NUDGE RIGHT • ${FATE_COSTS.nudge}</b><small>Resolve the adjacent slice instead.</small></button></div></section>`:`<section><h3>Lock a desirable slice • ${FATE_COSTS.lock} Fate</h3><div class="v13-fate-slices">${eligible.map(slice=>`<button type="button" data-v13-fate-lock="${esc(slice.id)}" ${fate.current<FATE_COSTS.lock?'disabled':''}><span>${esc(TYPE_META[slice.type]?.label||slice.type)}</span><b>${esc(slice.label)}</b></button>`).join('')}</div><h3>Change the event mix</h3><div class="v13-fate-types">${uniqueTypes.map(type=>`<article><b>${esc(TYPE_META[type]?.label||titleCase(type))}</b><button type="button" data-v13-fate-favor="${esc(type)}" ${fate.current<FATE_COSTS.favor?'disabled':''}>FAVOR • ${FATE_COSTS.favor}</button><button type="button" data-v13-fate-ban="${esc(type)}" ${fate.current<FATE_COSTS.ban?'disabled':''}>BAN • ${FATE_COSTS.ban}</button></article>`).join('')}</div></section>`}<section class="v13-fate-history"><h3>Fate chronicle</h3>${history.map(item=>`<p><b>${esc(titleCase(item.action))}</b><span>Spin ${item.spin||'—'}${item.reason?` • ${esc(item.reason)}`:''}</span></p>`).join('')||'<p><span>No Fate has been spent or earned.</span></p>'}</section>`;
  };

  P.applyFateControlV13=function(action,payload) {
    const context=this.fateContextV13(),verdict=stateEngine.spendFate(this.state,action,payload,context);
    if(!verdict.ok)return this.toast(verdict.reason);
    const slices=this.state.slices||[],eligible=index=>slices[index]&&!protectedTypes.has(slices[index].type);
    if(action==='lock') {
      const source=slices.find(slice=>slice.id===payload.sliceId),sourceIndex=slices.indexOf(source);
      if(source) {
        let replacement=-1;
        for(let offset=Math.floor(slices.length/2);offset<slices.length;offset++){const index=(sourceIndex+offset)%slices.length;if(eligible(index)&&slices[index].id!==source.id){replacement=index;break;}}
        if(replacement>=0)slices[replacement]={...copy(source),id:this.makeId('fate-lock'),fateLocked:true,label:`LOCKED: ${source.label}`};
      }
    }
    if(action==='ban') {
      const fallback=payload.type==='power'?'training':'power';
      for(let index=0;index<slices.length;index++)if(eligible(index)&&slices[index].type===payload.type)slices[index]=this.buildSlice(index%2?fallback:'recovery');
    }
    if(action==='favor') {
      const targets=slices.map((slice,index)=>({slice,index})).filter(item=>eligible(item.index)&&item.slice.type!==payload.type).slice(0,2);
      for(const target of targets)target.slice&&slices.splice(target.index,1,this.buildSlice(payload.type));
    }
    this.state.v13.highlights.unshift({spin:this.state.spin,type:'fate',title:`Fate: ${action}`,detail:payload.sliceId||payload.type||''});
    this.log(`FATE ${action.toUpperCase()}: the current wheel was deliberately altered.`,'rare');
    this.save();this.drawWheel();this.renderAll();this.renderFateV13();
  };

  P.restorePreSpinV13=function(fate) {
    if(!this._v13PreSpinSnapshot)return false;
    this.state=this.ensureV13(copy(this._v13PreSpinSnapshot));
    this.state.v13.fate=copy(fate);
    this.selectedStrategy='clash';
    return true;
  };

  P.alterLandedResultV13=function(action,direction=0) {
    const pending=this.state.pending,snapshot=this._v13PreSpinSnapshot,context=this.fateContextV13();
    if(!pending||!snapshot)return this.toast('No restorable pre-spin state is available.');
    const verdict=stateEngine.spendFate(this.state,action,{direction},context);if(!verdict.ok)return this.toast(verdict.reason);
    const spentFate=copy(this.state.v13.fate),oldId=pending.id,oldLabel=pending.label,landedSpin=this.state.spin;
    this.restorePreSpinV13(spentFate);
    const slices=this.state.slices||[];let target=null;
    if(action==='nudge') {
      const index=Math.max(0,slices.findIndex(slice=>slice.id===oldId));
      target=slices[(index+(direction<0?-1:1)+slices.length)%slices.length];
    } else {
      const candidates=slices.filter(slice=>slice.id!==oldId&&!protectedTypes.has(slice.type));
      target=candidates.length?this.pick(candidates):null;
    }
    if(!target){this.state.v13.fate.current+=verdict.cost;return this.toast('No eligible alternate result exists.');}
    this.land(target);
    this.state.v13.fate.alteredSpin=landedSpin;
    this.state.v13.highlights.unshift({spin:landedSpin,type:'fate',title:action==='nudge'?'Fate Nudge':'Fate Reroll',detail:`${oldLabel} → ${target.label}`});
    this.log(`FATE ${action.toUpperCase()}: ${oldLabel} changed to ${target.label}.`,'rare');
    this._v13PreSpinSnapshot=null;
    this.save();this.renderAll();this.closeFateV13();
  };

  const spinAgencyV13=P.spin;
  P.spin=function() {
    if(!this.isSpinning&&!this.state.pending&&!this.state.ended)this._v13PreSpinSnapshot=copy(this.state);
    return spinAgencyV13.call(this);
  };
  const landAgencyV13=P.land;
  P.land=function(slice) {
    const result=landAgencyV13.call(this,slice);
    this._v13LastLandedId=slice?.id||null;
    stateEngine.clearWheelControls(this.state);
    this.save();
    return result;
  };

  const completeAgencyV13=P.completeEvent;
  P.completeEvent=function() {
    const pending=this.state.pending,eligible=pending?.stage==='result'&&['hazard','rare','v9-story'].includes(pending.type);
    const result=completeAgencyV13.call(this);
    if(eligible){const earned=stateEngine.earnFate(this.state,1,pending.type,this.state.spin);if(earned)this.log(`FATE EARNED: +${earned} for resolving ${pending.label||pending.type}.`,'rare');this.save();this.renderAll();}
    return result;
  };

  const victoryAgencyV13=P.finishCombatVictory;
  P.finishCombatVictory=function(p,enemy) {
    const boss=p?.type==='boss',result=victoryAgencyV13.call(this,p,enemy);
    if(boss){const earned=stateEngine.earnFate(this.state,2,'boss victory',this.state.spin);if(earned)this.log(`FATE EARNED: +${earned} from the stage boss.`,'rare');this.save();this.renderAll();}
    return result;
  };

  P.captureLoadoutUndoV13=function(label='Loadout change') {
    this.state.v13.pendingUndo={label,expiresAt:Date.now()+30000,activePowerSets:[...(this.state.activePowerSets||[])],abilityLoadout:[...(this.state.abilityLoadout||[])],activeForm:this.state.activeForm||null,equipment:copy(this.state.equipment||{})};
  };
  P.undoLoadoutV13=function() {
    const undo=this.state.v13.pendingUndo;if(!undo||Date.now()>undo.expiresAt){this.state.v13.pendingUndo=null;this.save();return this.toast('The loadout undo window has expired.');}
    this.state.activePowerSets=[...undo.activePowerSets];this.state.abilityLoadout=[...undo.abilityLoadout];this.state.activeForm=undo.activeForm;this.state.equipment=copy(undo.equipment);this.state.v13.pendingUndo=null;this.refreshPowerLoadout();this.save();this.renderAll();this.renderV9Dashboard('build');this.toast('Loadout restored.');
  };
  P.saveLoadoutPresetV13=function(name) {
    const presets=this.state.v13.loadoutPresets;if(presets.length>=5)return this.toast('Loadout preset capacity is 5.');
    presets.push(progression.createPreset(this.state,name));this.save();this.renderV9Dashboard('build');this.toast('Loadout preset saved.');
  };
  P.applyLoadoutPresetV13=function(id) {
    const preset=this.state.v13.loadoutPresets.find(item=>item.id===id);if(!preset)return;
    this.captureLoadoutUndoV13(`Applied ${preset.name}`);
    const owned=new Set(this.state.kits.map(kit=>kit.id));this.state.activePowerSets=preset.activePowerSets.filter(source=>owned.has(source));this.refreshPowerLoadout();
    const abilities=new Set(this.techniqueCatalog().map(technique=>this.techKey(technique)));this.state.abilityLoadout=preset.abilityLoadout.filter(key=>abilities.has(key)).slice(0,this.maxAbilitySlots());
    if(!preset.activeForm||this.formByKey(preset.activeForm))this.state.activeForm=preset.activeForm;this.state.equipment=copy(preset.equipment||this.state.equipment||{});
    this.save();this.renderAll();this.renderV9Dashboard('build');this.toast(`${preset.name} equipped.`);
  };
  P.deleteLoadoutPresetV13=function(id){this.state.v13.loadoutPresets=this.state.v13.loadoutPresets.filter(item=>item.id!==id);this.save();this.renderV9Dashboard('build');};

  const toggleAgencyV13=P.togglePowerSetV9;
  P.togglePowerSetV9=function(id){this.captureLoadoutUndoV13('Power-set change');const result=toggleAgencyV13.call(this,id);this.toast('Build changed • Undo available for 30 seconds.');return result;};
  const equipAgencyV13=P.equip;
  P.equip=function(id){this.captureLoadoutUndoV13('Equipment change');const result=equipAgencyV13.call(this,id);this.toast('Equipment changed • Undo available for 30 seconds.');return result;};

  const buildRailAgencyV13=P.renderBuildRailV13;
  P.renderBuildRailV13=function(){const result=buildRailAgencyV13.call(this),button=document.querySelector('#v13-build-rail [data-v13-panel="build"]'),pinned=(this.state.v13.pinnedSources||[]).map(id=>CHAR.get(id)).filter(Boolean),quest=pinned.map(character=>this.state.questChains?.[character.id]?`${character.name}: ${this.state.questChains[character.id].stages?.[this.state.questChains[character.id].stageIndex]?.label||'quest active'}`:`${character.name}: pin active`).slice(0,2);if(button&&quest.length)button.querySelector('small').textContent=quest.join(' • ');return result;};

  const maxHPAgencyV13=P.maxHP;
  P.maxHP=function(){const value=maxHPAgencyV13.call(this),effects=this.state?.v13?this.masteryEffectsV13():{health:0};return Math.round(value*(1+effects.health));};
  const maxEnergyAgencyV13=P.maxEnergyPool;
  P.maxEnergyPool=function(){const value=maxEnergyAgencyV13.call(this),effects=this.state?.v13?this.masteryEffectsV13():{energy:0};return Math.round(value*(1+effects.energy));};
  const oddsAgencyV13=P.battleOdds;
  P.battleOdds=function(p,strategy){const value=oddsAgencyV13.call(this,p,strategy),effects=this.state?.v13?this.masteryEffectsV13():{odds:0};return clamp(value+effects.odds,.02,.985);};
  const damageAgencyV13=P.hitDamage;
  P.hitDamage=function(...args){const result=damageAgencyV13.apply(this,args),effects=this.state?.v13?this.masteryEffectsV13():{damage:0};if(result&&Number.isFinite(result.dmg))result.dmg=Math.max(1,Math.round(result.dmg*(1+effects.damage)));return result;};

  P.renderBuildToolsV13=function() {
    const root=document.getElementById('v9-body');if(!root||root.querySelector('.v13-build-tools'))return;
    const identity=this.buildIdentityV13(),presets=this.state.v13.loadoutPresets,undo=this.state.v13.pendingUndo,branches=[];
    for(const kit of this.state.kits){const character=CHAR.get(kit.id);if(!character)continue;for(const level of [2,4])if(Number(kit.mastery||1)>=level&&!this.state.v13.masteryBranches[kit.id]?.[level])branches.push({character,level,options:progression.masteryOptions(character,level)});}
    const sources=this.state.kits.map(kit=>{const character=CHAR.get(kit.id),model=this.characterIdentityV13(character),pinned=this.state.v13.pinnedSources.includes(kit.id),choices=this.state.v13.masteryBranches[kit.id]||{};return `<article class="v13-identity-card"><header><div><span>${esc(model.roleLabel)} • ${esc(model.canonicalUniverse)}</span><b>${esc(character.name)}</b></div><button data-v13-pin="${esc(kit.id)}" aria-pressed="${pinned}">${pinned?'★ PINNED':'☆ PIN'}</button></header><p><strong>${esc(model.passive.name)}</strong> — ${esc(model.passive.description)}</p><small>Weak to ${model.weaknessTags.map(titleCase).map(esc).join(', ')} • M2 ${choices[2]?titleCase(choices[2]):'unselected'} • M4 ${choices[4]?titleCase(choices[4]):'unselected'}</small></article>`}).join('');
    root.insertAdjacentHTML('afterbegin',`<section class="v13-build-tools"><div class="v13-build-identity"><span>CURRENT BUILD IDENTITY</span><h3>${esc(identity.label)}</h3><p>${esc(identity.description)}</p><div>${identity.topTags.map(tag=>`<b>${esc(titleCase(tag))}</b>`).join('')}</div></div><div class="v13-preset-tools"><div><button data-v13-preset-save>SAVE CURRENT PRESET</button>${undo?'<button data-v13-undo>UNDO LAST CHANGE</button>':''}</div>${presets.map(preset=>`<article><b>${esc(preset.name)}</b><small>${preset.activePowerSets.length} sources • ${preset.abilityLoadout.length} techniques</small><span><button data-v13-preset-apply="${preset.id}">EQUIP</button><button data-v13-preset-delete="${preset.id}">DELETE</button></span></article>`).join('')||'<p>No saved presets. Capture the current powers, techniques, form, and equipment.</p>'}</div>${branches.length?`<h3 class="v9-section-title">Mastery decisions</h3><div class="v13-mastery-grid">${branches.map(branch=>`<article><span>${esc(branch.character.name)} • M${branch.level}</span><b>Choose one permanent path</b>${branch.options.map(option=>`<button data-v13-mastery="${branch.character.id}|${branch.level}|${option.id}"><strong>${esc(option.label)}</strong><small>${esc(option.description)}</small></button>`).join('')}</article>`).join('')}</div>`:''}<h3 class="v9-section-title">Source identities, passives, and weaknesses</h3><div class="v13-identity-grid">${sources||'<p>Acquire a power source to reveal its mechanical identity.</p>'}</div></section>`);
  };

  const dashboardAgencyV13=P.renderV9Dashboard;
  P.renderV9Dashboard=function(tab='build'){const result=dashboardAgencyV13.call(this,tab);if(tab==='build')this.renderBuildToolsV13();return result;};

  P.renderSourceComparisonV13=function() {
    const pending=this.state.pending;if(!pending||!['power','battle'].includes(pending.type))return;
    if(pending.type==='battle'&&pending.stage!=='battle_reward')return;
    const panel=this.eventPanel;if(!panel||panel.querySelector('.v13-source-compare'))return;
    const character=this.battleProfile?.(pending)||CHAR.get(pending.ref);if(!character)return;
    const model=this.characterIdentityV13(character),current=this.buildIdentityV13(),next=this.buildIdentityV13([character]);
    const anchor=panel.querySelector('.v11-reward-compare,.choice-grid,.resolve-row');if(!anchor)return;
    anchor.insertAdjacentHTML('beforebegin',`<section class="v13-source-compare"><div><span>BUILD SHIFT</span><b>${esc(current.label)} → ${esc(next.label)}</b><small>${this.state.kits.some(kit=>kit.id===character.id)?'Duplicate improves mastery.':'New source can enter the active build if capacity permits.'}</small></div><div><span>PASSIVE</span><b>${esc(model.passive.name)}</b><small>${esc(model.passive.description)}</small></div><div><span>STRUCTURED WEAKNESS</span><b>${model.weaknessTags.map(titleCase).map(esc).join(' / ')}</b><small>Enemies and hazards can create exploit windows from these counters.</small></div></section>`);
  };
  const eventAgencyV13=P.renderEvent;
  P.renderEvent=function(){const result=eventAgencyV13.call(this);this.renderSourceComparisonV13();return result;};

  const bindAgencyV13=P.bind;
  P.bind=function() {
    bindAgencyV13.call(this);this.injectAgencyV13();if(this._v13AgencyBound)return;this._v13AgencyBound=true;
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-v13-fate-open]'))return this.openFateV13();
      if(event.target.closest('[data-v13-fate-close]'))return this.closeFateV13();
      const lock=event.target.closest('[data-v13-fate-lock]');if(lock)return this.applyFateControlV13('lock',{sliceId:lock.dataset.v13FateLock});
      const favor=event.target.closest('[data-v13-fate-favor]');if(favor)return this.applyFateControlV13('favor',{type:favor.dataset.v13FateFavor});
      const ban=event.target.closest('[data-v13-fate-ban]');if(ban)return this.applyFateControlV13('ban',{type:ban.dataset.v13FateBan});
      const result=event.target.closest('[data-v13-fate-result]');if(result){const [action,direction]=result.dataset.v13FateResult.split('|');return this.alterLandedResultV13(action,Number(direction));}
      const pin=event.target.closest('[data-v13-pin]');if(pin){const set=new Set(this.state.v13.pinnedSources);set.has(pin.dataset.v13Pin)?set.delete(pin.dataset.v13Pin):set.add(pin.dataset.v13Pin);this.state.v13.pinnedSources=[...set];this.save();return this.renderV9Dashboard('build');}
      const mastery=event.target.closest('[data-v13-mastery]');if(mastery){const [id,level,choice]=mastery.dataset.v13Mastery.split('|'),outcome=progression.chooseMastery(this.state,CHAR.get(id),Number(level),choice);if(!outcome.ok)return this.toast(outcome.error);this.log(`MASTERY PATH: ${CHAR.get(id)?.name} chose ${outcome.choice.label} at M${level}.`,'rare');this.save();this.renderAll();return this.renderV9Dashboard('build');}
      if(event.target.closest('[data-v13-preset-save]')){const name=prompt('Name this loadout preset.',`Build ${this.state.v13.loadoutPresets.length+1}`);if(name!==null)return this.saveLoadoutPresetV13(name);}
      const apply=event.target.closest('[data-v13-preset-apply]');if(apply)return this.applyLoadoutPresetV13(apply.dataset.v13PresetApply);
      const remove=event.target.closest('[data-v13-preset-delete]');if(remove)return this.deleteLoadoutPresetV13(remove.dataset.v13PresetDelete);
      if(event.target.closest('[data-v13-undo]'))return this.undoLoadoutV13();
    });
    document.getElementById('v13-agency-modal')?.addEventListener('click',event=>{if(event.target.id==='v13-agency-modal')this.closeFateV13();});
  };
})();
