'use strict';

// V13 start-to-play shell. It progressively reveals the existing simulator
// instead of placing every subsystem in the first viewport.
(() => {
  const {ExperienceEngine,decodeChallengeCode}=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const experience=new ExperienceEngine();

  const option=(value,label,current)=>`<option value="${esc(value)}" ${current===value?'selected':''}>${esc(label)}</option>`;
  const buttonLabel=value=>String(value||'').replace(/_/g,' ').replace(/\b\w/g,char=>char.toUpperCase());

  P.injectShellV13=function() {
    if (!document.getElementById('v13-title-screen')) {
      const title=document.createElement('section');
      title.id='v13-title-screen';title.className='v13-title-screen';title.setAttribute('role','dialog');title.setAttribute('aria-modal','true');title.setAttribute('aria-labelledby','v13-title-heading');title.hidden=true;
      title.innerHTML='<div class="v13-title-stars" aria-hidden="true"></div><div class="v13-title-frame"><header class="v13-title-head"><div class="v13-brand-mark" aria-hidden="true">MW</div><div><span>V13 • DIRECTOR\'S CUT</span><h1 id="v13-title-heading">Multiverse Wheel</h1><p>Build a hero. Bend fate. Survive thirty connected encounters.</p></div></header><main id="v13-title-body"></main><footer class="v13-title-foot"><span>LOCAL-FIRST • AUTOSAVED • OFFLINE-READY SHELL</span><span>1,326 CHARACTER PROFILES</span></footer></div>';
      document.body.appendChild(title);
    }
    if (!document.getElementById('v13-playbar')) {
      const nav=document.getElementById('v8-nav');
      nav?.insertAdjacentHTML('afterend',`<nav id="v13-playbar" class="v13-playbar" aria-label="Play details"><button type="button" data-v13-panel="play" class="active">PLAY</button><button type="button" data-v13-panel="hero">HERO</button><button type="button" data-v13-panel="team">PARTY</button><button type="button" data-v13-panel="build">BUILD</button><button type="button" data-v13-panel="journey">JOURNEY</button><button type="button" data-v13-panel="collection">COLLECTION</button><button type="button" data-v13-panel="more" aria-pressed="false">FULL DASHBOARD</button></nav>`);
    }
    if (!document.getElementById('v13-build-rail')) {
      const route=document.getElementById('v11-stage-map')||document.getElementById('v9-stage-strip');
      route?.insertAdjacentHTML('afterend','<section id="v13-build-rail" class="v13-build-rail" aria-label="Current build summary"></section>');
    }
    if (!document.getElementById('v13-wheel-manifest')) {
      document.querySelector('.wheel-shell')?.insertAdjacentHTML('afterend','<details id="v13-wheel-manifest" class="v13-wheel-manifest"><summary>Current wheel manifest</summary><div></div></details>');
    }
  };

  P.titleDraftV13=function(overrides={}) {
    this._v13Draft={slot:this.activeSlotV13(),preset:'vanguard',custom:false,challenge:'standard',balance:'roguelite',difficulty:'normal',campaignLimit:30,kind:'normal',...this._v13Draft,...overrides};
    return this._v13Draft;
  };

  P.openTitleV13=function(view='home') {
    this.injectShellV13();
    const title=document.getElementById('v13-title-screen');
    document.querySelectorAll('.v6-modal.open,.v9-modal.open,.v5-modal.open').forEach(modal=>modal.classList.remove('open'));
    title.hidden=false;title.classList.add('open');
    this._v13TitleView=view;
    document.body.classList.add('v13-title-open');
    document.body.classList.remove('v13-condensed');
    const app=document.querySelector('.app');if(app){app.inert=true;app.setAttribute('aria-hidden','true');}
    this.renderTitleV13(view);
    setTimeout(()=>title.querySelector('button:not(:disabled),input,select')?.focus(),0);
  };

  P.closeTitleV13=function(force=false) {
    if (!force&&!this.state.characterReady) return false;
    const title=document.getElementById('v13-title-screen');
    if(title){title.classList.remove('open');title.hidden=true;}
    document.body.classList.remove('v13-title-open');
    document.body.classList.add('v13-condensed');
    const app=document.querySelector('.app');if(app){app.inert=false;app.removeAttribute('aria-hidden');}
    this.renderAll();
    setTimeout(()=>document.querySelector('#v12-command-center > button,#spin-btn')?.focus(),0);
    return true;
  };

  P.titleHeaderV13=function(eyebrow,title,description,back=true) {
    return `<div class="v13-view-head">${back?'<button type="button" data-v13-title-view="home" class="v13-back">← COMMAND DECK</button>':'<span></span>'}<div><span>${esc(eyebrow)}</span><h2>${esc(title)}</h2><p>${esc(description)}</p></div></div>`;
  };

  P.renderTitleHomeV13=function() {
    const ready=!!this.state.characterReady,slots=this.runSlotsV13(),active=this.activeSlotV13();
    const cards=slots.map(slot=>`<article class="v13-slot ${slot.slot===active?'active':''} ${slot.empty?'empty':''}"><div><span>SLOT ${slot.slot}${slot.slot===active?' • ACTIVE':''}</span><b>${slot.empty?'Empty Timeline':esc(slot.hero)}</b><small>${slot.empty?'Ready for a new hero':`Spin ${slot.spin} • Score ${Number(slot.score||0).toLocaleString()}`}</small></div><div>${slot.empty?'':`<button type="button" data-v13-slot-load="${slot.slot}">LOAD</button>`}<button type="button" data-v13-slot-new="${slot.slot}">NEW</button>${slot.empty?'':`<button type="button" data-v13-slot-clear="${slot.slot}" class="danger">CLEAR</button>`}</div></article>`).join('');
    return `${this.titleHeaderV13('TIMELINE COMMAND','Choose where the story begins','Continue the active autosave, open another local slot, or launch a shared deterministic challenge.',false)}<section class="v13-home-actions"><button type="button" class="v13-primary" data-v13-continue ${ready?'':'disabled'}><span>CONTINUE TIMELINE</span><b>${ready?esc(this.state.customCharacter?.codename||'Current hero'):'No active hero'}</b></button><button type="button" data-v13-title-view="hero"><span>NEW TIMELINE</span><b>Create a run in three steps</b></button><button type="button" data-v13-title-view="daily"><span>DAILY CHALLENGE</span><b>One shared seed and ruleset</b></button></section><section class="v13-slots"><div class="v13-section-label"><span>LOCAL SAVE VAULT</span><small>Three isolated autosave slots</small></div>${cards}</section><section class="v13-code-row"><label><span>CHALLENGE CODE</span><input type="text" data-v13-code-input placeholder="MW13-…" autocomplete="off" spellcheck="false"></label><button type="button" data-v13-code-start>INSPECT CODE</button><button type="button" data-v13-title-view="archive">ARCHIVE</button><button type="button" data-v13-title-view="settings">SETTINGS</button></section><p class="v13-title-status" data-v13-title-status role="status" aria-live="polite"></p>`;
  };

  P.renderTitleHeroV13=function() {
    const draft=this.titleDraftV13({kind:'normal'}),presets=experience.presets();
    return `${this.titleHeaderV13('NEW TIMELINE • STEP 1 OF 3','Choose a hero foundation','This selects a trained human baseline. Acquired characters still provide the superhuman power sets.')}<div class="v13-preset-grid">${presets.map(preset=>`<button type="button" data-v13-hero="${preset.id}"><span>${esc(preset.label)}</span><b>${esc(preset.codename)}</b><small>${esc(preset.summary)}</small><i>${draft.preset===preset.id&&!draft.custom?'SELECTED':'CHOOSE'}</i></button>`).join('')}<button type="button" data-v13-hero="custom" class="custom"><span>FULL CREATOR</span><b>Custom Origin</b><small>Choose identity, background, catalyst, complication, motivation, flaw, tone, art, and campaign details.</small><i>${draft.custom?'SELECTED':'CUSTOMIZE'}</i></button></div>`;
  };

  P.renderTitleRulesV13=function() {
    const draft=this.titleDraftV13();
    return `${this.titleHeaderV13('NEW TIMELINE • STEP 2 OF 3','Set the rules','Plain-language defaults keep the first run fair; every advanced mode remains available.')}<section class="v13-rules"><label><span>CHALLENGE</span><select data-v13-rule="challenge">${option('standard','Standard • Resurrections and normal bosses',draft.challenge)}${option('iron','Iron Timeline • No resurrection safety',draft.challenge)}${option('nemesis','Nemesis Hunt • Rivals return stronger',draft.challenge)}${option('crisis','Crisis Rush • Extra boss phases',draft.challenge)}</select></label><label><span>BALANCE</span><select data-v13-rule="balance">${option('roguelite','Roguelite • Compressed odds, recommended',draft.balance)}${option('chaos','Chaos • Wild combinations and synergies',draft.balance)}${option('canon','Canon • Power gaps matter heavily',draft.balance)}</select></label><label><span>DIFFICULTY</span><select data-v13-rule="difficulty">${option('story','Story • Forgiving enemy plans',draft.difficulty)}${option('normal','Normal • Full tactical rules',draft.difficulty)}${option('heroic','Heroic • Smarter hostile plans',draft.difficulty)}${option('cosmic','Cosmic • Aggressive counters',draft.difficulty)}${option('impossible','Impossible • Maximum pressure',draft.difficulty)}</select></label><label><span>CAMPAIGN</span><select data-v13-rule="campaignLimit">${[10,20,30,40,50,60,70,80,90,100].map(value=>option(String(value),`${value} spins • ${value/10} stage${value===10?'':'s'}`,String(draft.campaignLimit))).join('')}</select></label></section><div class="v13-rule-explain"><article><b>ONE CLEAR ROUTE</b><p>Every ten-spin stage contains discoveries, connected decisions, a rival, camp, and a boss.</p></article><article><b>LOCAL-FIRST SAVE</b><p>This run autosaves to Slot ${draft.slot}. Portable backups remain available from Settings.</p></article><article><b>SEE EVERY CONSEQUENCE</b><p>Rewards, weaknesses, capacity, and enemy intent are previewed before commitment.</p></article></div><div class="v13-view-actions"><button type="button" data-v13-title-view="hero">BACK</button><button type="button" class="v13-primary" data-v13-rules-next>REVIEW TIMELINE</button></div>`;
  };

  P.renderTitleConfirmV13=function() {
    const draft=this.titleDraftV13(),preset=draft.custom?null:experience.preset(draft.preset);
    const code=draft.challengeCode||'';
    return `${this.titleHeaderV13('NEW TIMELINE • STEP 3 OF 3','Confirm launch','The seed and selected rules become part of the reproducible run record.')}<section class="v13-confirm"><div class="v13-confirm-hero"><span>HERO</span><b>${draft.custom?'Custom Origin':esc(preset?.codename||buttonLabel(draft.preset))}</b><small>${draft.custom?'The full identity editor opens next.':esc(preset?.summary||'Quick-start foundation')}</small></div><dl><div><dt>Save slot</dt><dd>${draft.slot}</dd></div><div><dt>Challenge</dt><dd>${esc(buttonLabel(draft.challenge))}</dd></div><div><dt>Balance</dt><dd>${esc(buttonLabel(draft.balance))}</dd></div><div><dt>Difficulty</dt><dd>${esc(buttonLabel(draft.difficulty))}</dd></div><div><dt>Length</dt><dd>${draft.campaignLimit} spins</dd></div>${code?`<div><dt>Shared code</dt><dd>Verified V13</dd></div>`:''}</dl></section><div class="v13-view-actions"><button type="button" data-v13-title-view="rules">BACK</button><button type="button" class="v13-primary" data-v13-launch>${draft.custom?'OPEN ORIGIN CREATOR':'BEGIN TIMELINE'}</button></div>`;
  };

  P.renderTitleDailyV13=function() {
    const daily=this.dailyChallengeV13(),slot=this.activeSlotV13();
    return `${this.titleHeaderV13('DAILY CHALLENGE',daily.dateKey,'Every player receives the same seed, preset, rules, and modifiers for the local calendar date.')}<section class="v13-daily"><span>DAILY SIGNAL</span><h3>${daily.seed.toString().padStart(10,'0')}</h3><div><article><b>${esc(buttonLabel(daily.preset))}</b><small>Starting style</small></article><article><b>${esc(buttonLabel(daily.challenge))}</b><small>Challenge</small></article><article><b>${esc(buttonLabel(daily.balance))}</b><small>Balance</small></article><article><b>HEROIC</b><small>Difficulty</small></article></div><label>Save to slot<select data-v13-daily-slot>${[1,2,3].map(value=>option(String(value),`Slot ${value}`,String(slot))).join('')}</select></label></section><div class="v13-view-actions"><button type="button" data-v13-title-view="home">BACK</button><button type="button" class="v13-primary" data-v13-daily-start>START DAILY</button></div>`;
  };

  P.renderTitleArchiveV13=function() {
    const slots=this.runSlotsV13();
    return `${this.titleHeaderV13('LOCAL ARCHIVE','Timeline records','Review local slot records here or open the full codex, achievements, and Hall of Fame.')}<div class="v13-archive-grid">${slots.map(slot=>`<article><span>SLOT ${slot.slot}</span><b>${slot.empty?'Empty':esc(slot.hero)}</b><small>${slot.empty?'No recorded run':`Spin ${slot.spin} • ${Number(slot.score||0).toLocaleString()} points`}</small></article>`).join('')}</div><div class="v13-view-actions"><button type="button" data-v13-title-view="home">BACK</button><button type="button" class="v13-primary" data-v13-open-archive ${this.state.characterReady?'':'disabled'}>OPEN FULL ARCHIVE</button></div>`;
  };

  P.renderTitleSettingsV13=function() {
    const prefs=this.state.v13.preferences,access=this.state.v11Experience.accessibility,pace=this.state.v12Experience;
    const toggle=(key,label,on,group)=>`<button type="button" data-v13-setting="${group}|${key}" aria-pressed="${on?'true':'false'}" class="${on?'on':''}">${label}<small>${on?'ON':'OFF'}</small></button>`;
    return `${this.titleHeaderV13('ACCESSIBILITY & FEEDBACK','Settings','Display, motion, sound, and input preferences follow the active local timeline.')}<section class="v13-settings-grid"><div><h3>DISPLAY</h3>${toggle('largeText','Larger text',access.largeText,'access')}${toggle('highContrast','High contrast',access.highContrast,'access')}${toggle('reducedMotion','Reduce motion',access.reducedMotion,'access')}<label><span>COLOR VISION</span><select data-v13-pref="colorVision">${option('default','Default palette',prefs.colorVision)}${option('deuteranopia','Deuteranopia-safe',prefs.colorVision)}${option('protanopia','Protanopia-safe',prefs.colorVision)}${option('tritanopia','Tritanopia-safe',prefs.colorVision)}</select></label></div><div><h3>PACE & INPUT</h3>${toggle('fastTurns','Fast wheel',pace.fastTurns,'pace')}${toggle('haptics','Haptic feedback',pace.haptics,'pace')}${toggle('screenReaderWheel','Wheel manifest',prefs.screenReaderWheel,'pref')}</div><div><h3>AUDIO</h3><label><span>SOUND EFFECTS • ${Math.round(prefs.soundVolume*100)}%</span><input type="range" min="0" max="1" step="0.05" value="${prefs.soundVolume}" data-v13-pref="soundVolume"></label><label><span>MUSIC • ${Math.round(prefs.musicVolume*100)}%</span><input type="range" min="0" max="1" step="0.05" value="${prefs.musicVolume}" data-v13-pref="musicVolume"></label></div></section><div class="v13-view-actions"><button type="button" data-v13-title-view="home">DONE</button></div>`;
  };

  P.renderTitleV13=function(view=this._v13TitleView||'home') {
    const body=document.getElementById('v13-title-body');if(!body)return;
    this._v13TitleView=view;
    if(view==='hero')body.innerHTML=this.renderTitleHeroV13();
    else if(view==='rules')body.innerHTML=this.renderTitleRulesV13();
    else if(view==='confirm')body.innerHTML=this.renderTitleConfirmV13();
    else if(view==='daily')body.innerHTML=this.renderTitleDailyV13();
    else if(view==='archive')body.innerHTML=this.renderTitleArchiveV13();
    else if(view==='settings')body.innerHTML=this.renderTitleSettingsV13();
    else body.innerHTML=this.renderTitleHomeV13();
  };

  P.launchDraftV13=function() {
    const draft=this.titleDraftV13();
    this.closeTitleV13(true);
    const result=this.startTimelineV13(draft.challengeCode?{...draft,...draft.decoded,slot:draft.slot,kind:'challenge',id:draft.challengeCode}:{...draft,slot:draft.slot});
    if(!draft.custom)this.closeTitleV13(true);
    return result;
  };

  P.renderBuildRailV13=function() {
    const root=document.getElementById('v13-build-rail');if(!root)return;
    const loadout=this.powerLoadout?.()||{active:[],spent:0,budget:0},active=loadout.active.map(id=>CHAR.get(id)?.name).filter(Boolean);
    const synergy=this.buildSynergyV9?.()||{score:0};
    const statuses=(this.state.statuses||[]).map(status=>status.id||status).slice(0,2);
    root.innerHTML=`<button type="button" data-v13-panel="hero"><span>HERO</span><b>${esc(this.state.customCharacter?.codename||'Unformed')}</b><small>${esc(this.state.customCharacter?.archetype||'Choose origin')}</small></button><button type="button" data-v13-panel="build"><span>ACTIVE POWERS</span><b>${active.length} / 3 • ${loadout.spent}/${loadout.budget}</b><small>${esc(active.join(' + ')||'No source equipped')}</small></button><button type="button" data-v13-panel="team"><span>PARTY</span><b>${this.state.party.length} / ${this.partyCapacity?.()||3}</b><small>${this.state.party.map(id=>CHAR.get(id)?.name).filter(Boolean).slice(0,2).map(esc).join(' + ')||'No active allies'}</small></button><button type="button" data-v13-panel="build"><span>SYNERGY</span><b>${synergy.score>=0?'+':''}${synergy.score}</b><small>${statuses.length?statuses.map(esc).join(' • '):'Pristine condition'}</small></button><button type="button" data-v13-fate-open><span>FATE</span><b>${this.state.v13.fate.current} / ${this.state.v13.fate.max}</b><small>Bend the next eligible wheel</small></button>`;
  };

  P.renderWheelManifestV13=function() {
    const root=document.getElementById('v13-wheel-manifest');if(!root)return;
    root.hidden=!this.state.v13.preferences.screenReaderWheel;
    const pending=this.state.pending;
    root.querySelector('summary').textContent=pending?`Landed: ${pending.label||pending.type}`:`Current wheel manifest • ${(this.state.slices||[]).length} slices`;
    root.querySelector('div').innerHTML=`<p role="status">${pending?`The wheel landed on ${esc(pending.label||pending.type)}.`:'No result has landed yet.'}</p><ol>${(this.state.slices||[]).map(slice=>`<li ${pending?.id===slice.id?'aria-current="true"':''}><b>${esc(TYPE_META[slice.type]?.label||slice.type)}</b><span>${esc(slice.label)}</span></li>`).join('')}</ol>`;
  };

  P.applyShellPreferencesV13=function() {
    const prefs=this.state.v13.preferences;
    for(const mode of ['default','deuteranopia','protanopia','tritanopia'])document.body.classList.toggle(`v13-color-${mode}`,prefs.colorVision===mode);
    if(this.audio)this.audio.volume=prefs.soundVolume;
  };

  const renderAllShellV13=P.renderAll;
  P.renderAll=function() {
    const result=renderAllShellV13.call(this);
    this.injectShellV13();this.renderBuildRailV13();this.renderWheelManifestV13();this.applyShellPreferencesV13();
    return result;
  };

  const newRunShellV13=P.newRun;
  P.newRun=function(){this.titleDraftV13({slot:this.activeSlotV13(),preset:'vanguard',custom:false,kind:'normal'});this.openTitleV13('hero');};

  const bindShellV13=P.bind;
  P.bind=function() {
    bindShellV13.call(this);
    this.injectShellV13();
    if(this._v13ShellBound)return;this._v13ShellBound=true;
    document.addEventListener('click',event=>{
      const view=event.target.closest('[data-v13-title-view]');if(view)return this.renderTitleV13(view.dataset.v13TitleView);
      if(event.target.closest('[data-v13-continue]'))return this.closeTitleV13(true);
      const hero=event.target.closest('[data-v13-hero]');if(hero){const custom=hero.dataset.v13Hero==='custom';this.titleDraftV13({preset:custom?'':hero.dataset.v13Hero,custom});return this.renderTitleV13('rules');}
      if(event.target.closest('[data-v13-rules-next]')){
        document.querySelectorAll('[data-v13-rule]').forEach(input=>{this.titleDraftV13()[input.dataset.v13Rule]=input.dataset.v13Rule==='campaignLimit'?Number(input.value):input.value;});
        return this.renderTitleV13('confirm');
      }
      if(event.target.closest('[data-v13-launch]'))return this.launchDraftV13();
      if(event.target.closest('[data-v13-daily-start]')){const slot=Number(document.querySelector('[data-v13-daily-slot]')?.value||this.activeSlotV13());this.closeTitleV13(true);this.startDailyChallengeV13(new Date(),slot);return this.closeTitleV13(true);}
      const load=event.target.closest('[data-v13-slot-load]');if(load){if(this.loadSlotV13(Number(load.dataset.v13SlotLoad)))return this.closeTitleV13(true);}
      const create=event.target.closest('[data-v13-slot-new]');if(create){this.setActiveSlotV13(Number(create.dataset.v13SlotNew));this._v13Draft=null;this.titleDraftV13({slot:Number(create.dataset.v13SlotNew)});return this.renderTitleV13('hero');}
      const clear=event.target.closest('[data-v13-slot-clear]');if(clear&&confirm(`Clear local Slot ${clear.dataset.v13SlotClear}? Portable backups are not affected.`)){this.clearSlotV13(Number(clear.dataset.v13SlotClear));return this.renderTitleV13('home');}
      if(event.target.closest('[data-v13-code-start]')){
        const input=document.querySelector('[data-v13-code-input]'),decoded=decodeChallengeCode(input?.value||''),status=document.querySelector('[data-v13-title-status]');
        if(!decoded.ok){if(status)status.textContent=decoded.error;return;}
        this._v13Draft={...this.titleDraftV13(),...decoded.config,custom:false,kind:'challenge',challengeCode:input.value.trim(),decoded:decoded.config};
        return this.renderTitleV13('confirm');
      }
      if(event.target.closest('[data-v13-open-archive]')){this.closeTitleV13(true);return this.shellUI?.('archive','hall');}
      const setting=event.target.closest('[data-v13-setting]');if(setting){const [group,key]=setting.dataset.v13Setting.split('|');const target=group==='access'?this.state.v11Experience.accessibility:group==='pace'?this.state.v12Experience:this.state.v13.preferences;target[key]=!target[key];this.save();this.renderAll();return this.renderTitleV13('settings');}
      const panel=event.target.closest('[data-v13-panel]');if(panel){const id=panel.dataset.v13Panel;if(id==='play'){document.body.classList.remove('v13-expanded');return this.shell?.scrollIntoView({behavior:'smooth',block:'start'});}if(id==='more'){const expanded=document.body.classList.toggle('v13-expanded');panel.setAttribute('aria-pressed',String(expanded));panel.textContent=expanded?'CONDENSE DASHBOARD':'FULL DASHBOARD';return;}if(id==='hero')return this.shellUI?.('hero','overview');if(id==='team')return this.shellUI?.('team','roster');if(id==='build')return this.openV9?.('build');if(id==='journey')return this.openV9?.('journey');if(id==='collection')return this.shellUI?.('archive','codex');}
      if(event.target.closest('[data-v13-fate-open]'))this.toast('Fate controls unlock on eligible wheels.');
    });
    document.addEventListener('change',event=>{
      const input=event.target.closest('[data-v13-pref]');if(!input)return;
      this.state.v13.preferences[input.dataset.v13Pref]=input.type==='range'?Number(input.value):input.value;this.save();this.renderAll();this.renderTitleV13('settings');
    });
    setTimeout(()=>this.openTitleV13('home'),130);
  };
})();
