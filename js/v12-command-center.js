'use strict';

// Session command center: contextual guidance, pace controls, keyboard access,
// haptic feedback, and portable save backups without changing game balance.
(() => {
  const {SessionEngine,MAX_BACKUP_BYTES}=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const session=new SessionEngine();

  P.ensureV12=function(state=this.state) {
    if (!state) return state;
    this.ensureV9?.(state);
    this.ensureV11?.(state);
    state.v12Experience||={};
    state.v12Experience.fastTurns=!!state.v12Experience.fastTurns;
    state.v12Experience.haptics=!!state.v12Experience.haptics;
    return state;
  };

  const newStateV12=P.newState;
  P.newState=function(seed){return this.ensureV12(newStateV12.call(this,seed));};
  const loadStateV12=P.loadState;
  P.loadState=function(){const state=loadStateV12.call(this);return state?this.ensureV12(state):state;};

  const spinDurationV12=P.spinDuration;
  P.spinDuration=function(defaultDuration) {
    if (this.state?.v11Experience?.accessibility?.reducedMotion) return 80;
    if (this.state?.v12Experience?.fastTurns) return Math.min(420,defaultDuration);
    return spinDurationV12.call(this,defaultDuration);
  };

  P.injectCommandCenterV12=function() {
    const topbar=document.querySelector('.topbar');
    if (topbar&&!document.getElementById('v12-command-center')) topbar.insertAdjacentHTML('afterend','<section id="v12-command-center" class="v12-command-center" aria-label="Current objective and run status"></section>');
    this.eventPanel?.setAttribute('tabindex','-1');
    const help=document.querySelector('#help-modal .modal-card');
    if (!help||help.querySelector('.v12-session-tools')) return;
    help.insertAdjacentHTML('beforeend',`<section class="v12-session-tools"><h3>Game pace & feedback</h3><p>Fast wheel shortens wheel animation without changing its result. Haptics use brief device vibration when supported.</p><div class="v12-setting-row"><button type="button" data-v12-setting="fastTurns">FAST WHEEL</button><button type="button" data-v12-setting="haptics">HAPTIC FEEDBACK</button></div><h3>Save vault</h3><p>Download a portable snapshot of the entire current timeline, or restore one from this version.</p><div class="v12-setting-row"><button type="button" data-v12-export>EXPORT BACKUP</button><button type="button" data-v12-import>IMPORT BACKUP</button><input type="file" data-v12-import-file accept="application/json,.json" hidden></div><p class="v12-backup-status" data-v12-backup-status role="status" aria-live="polite">Autosave remains active after every decision.</p><h3>Keyboard controls</h3><div class="v12-shortcuts"><span><kbd>S</kbd> Spin / inspect</span><span><kbd>C</kbd> Continue</span><span><kbd>A</kbd> Attack</span><span><kbd>G</kbd> Guard</span><span><kbd>F</kbd> Focus combat</span><span><kbd>H</kbd> Help</span><span><kbd>1–5</kbd> Strategy</span><span><kbd>Esc</kbd> Close</span></div></section>`);
  };

  P.renderCommandCenterV12=function() {
    const root=document.getElementById('v12-command-center');
    if (!root) return;
    const objective=session.objective(this.state);
    const pulse=session.pulse(this.state,{score:this.score(),maxHP:this.maxHP?.()||this.state.hp});
    const score=this.state.characterReady?pulse.score.toLocaleString():'—';
    root.dataset.objective=objective.id;
    root.innerHTML=`<div class="v12-objective"><span>${esc(objective.eyebrow)}</span><b>${esc(objective.title)}</b><small>${esc(objective.description)}</small></div><div class="v12-pulse"><span><i>STREAK</i><b>${esc(pulse.streak)}</b></span><span class="threat-${pulse.threatLabel.toLowerCase()}"><i>THREAT</i><b>${esc(pulse.threatLabel)}</b></span><span><i>SCORE</i><b>${score}</b></span><span><i>BOSS</i><b>${pulse.bossIn?`${pulse.bossIn} BEATS`:'NOW'}</b></span></div><button type="button" data-v12-command="${objective.command}" aria-keyshortcuts="${objective.shortcut}"><span>${esc(objective.cta)}</span><kbd>${esc(objective.shortcut)}</kbd></button>`;
    const prefs=this.state.v12Experience;
    document.body.classList.toggle('v12-fast-turns',prefs.fastTurns);
    document.querySelectorAll('[data-v12-setting]').forEach(button=>{
      const active=!!prefs[button.dataset.v12Setting];
      button.classList.toggle('on',active);
      button.setAttribute('aria-pressed',String(active));
    });
  };

  P.focusEventV12=function() {
    this.eventPanel?.scrollIntoView({behavior:this.state.v11Experience?.accessibility?.reducedMotion?'auto':'smooth',block:'start'});
    this.eventPanel?.focus({preventScroll:true});
  };

  P.executeCommandV12=function(command) {
    if (command==='origin') return this.openV6Modal('character');
    if (command==='spin') return this.spin();
    if (command==='continue') return this.handleAction('continue');
    this.focusEventV12();
  };

  P.pulseHapticV12=function(pattern=12) {
    if (!this.state.v12Experience?.haptics||typeof navigator.vibrate!=='function') return false;
    return navigator.vibrate(pattern);
  };

  const landV12=P.land;
  P.land=function(slice) {const result=landV12.call(this,slice);this.pulseHapticV12(slice?.type==='boss'?[20,45,28]:14);return result;};
  const impactV12=P.showCombatImpactV11;
  P.showCombatImpactV11=function(primary,secondary='') {const result=impactV12.call(this,primary,secondary);this.pulseHapticV12(secondary?[18,30,12]:10);return result;};

  P.setBackupStatusV12=function(message,error=false) {
    const status=document.querySelector('[data-v12-backup-status]');
    if (status) {status.textContent=message;status.classList.toggle('error',error);}
  };

  P.exportBackupV12=function() {
    const hero=this.state.customCharacter?.codename||this.baseCharacter()?.name||'hero';
    const backup=session.createBackup(this.state,{appVersion:'10.1.0',hero,score:this.score()});
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;
    anchor.download=`multiverse-wheel-${String(hero).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'timeline'}-spin-${this.state.spin}.json`;
    document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
    this.setBackupStatusV12(`Backup exported for ${hero} at spin ${this.state.spin}.`);
    this.toast('Portable timeline backup downloaded.');
  };

  P.importBackupV12=async function(file) {
    if (!file) return;
    if (file.size>MAX_BACKUP_BYTES) return this.setBackupStatusV12('Backup exceeds the 5 MB safety limit.',true);
    const validation=session.validateBackup(await file.text());
    if (!validation.ok) return this.setBackupStatusV12(validation.error,true);
    const summary=validation.summary;
    if (!confirm(`Restore ${summary.hero} at spin ${summary.spin}? This replaces the current autosave.`)) return this.setBackupStatusV12('Import cancelled; current timeline was not changed.');
    this.state=this.ensureV12(validation.backup.state);
    this.selectedStrategy='clash';
    if (!Array.isArray(this.state.slices)||!this.state.slices.length) this.generateWheel();
    this.save();
    document.getElementById('help-modal')?.classList.remove('open');
    this.renderAll();
    this.toast(`Restored ${summary.hero} at spin ${summary.spin}.`);
  };

  const renderAllV12=P.renderAll;
  P.renderAll=function() {this.ensureV12();const result=renderAllV12.call(this);this.renderCommandCenterV12();return result;};

  const bindV12=P.bind;
  P.bind=function() {
    bindV12.call(this);
    this.ensureV12();
    this.injectCommandCenterV12();
    if (this._v12Bound) return;
    this._v12Bound=true;
    document.addEventListener('click',event=>{
      const command=event.target.closest('[data-v12-command]');
      if (command) return this.executeCommandV12(command.dataset.v12Command);
      const setting=event.target.closest('[data-v12-setting]');
      if (setting) {
        const key=setting.dataset.v12Setting;
        this.state.v12Experience[key]=!this.state.v12Experience[key];
        this.save();this.renderAll();
        return this.toast(`${key==='fastTurns'?'Fast wheel':'Haptic feedback'} ${this.state.v12Experience[key]?'enabled':'disabled'}.`);
      }
      if (event.target.closest('[data-v12-export]')) return this.exportBackupV12();
      if (event.target.closest('[data-v12-import]')) return document.querySelector('[data-v12-import-file]')?.click();
    });
    document.addEventListener('change',event=>{if(event.target.matches('[data-v12-import-file]')){this.importBackupV12(event.target.files?.[0]);event.target.value='';}});
    window.addEventListener('keydown',event=>{
      if (event.defaultPrevented||event.repeat||event.ctrlKey||event.metaKey||event.altKey) return;
      const tag=document.activeElement?.tagName;
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)||document.activeElement?.isContentEditable) return;
      const key=event.key.toLowerCase(),pending=this.state.pending,combat=pending&&['battle','boss'].includes(pending.type)&&!['result','battle_reward'].includes(pending.stage);
      if (key==='h'||event.key==='?') {event.preventDefault();return document.getElementById('help-btn')?.click();}
      if (key==='f'&&combat) {event.preventDefault();return document.querySelector('[data-v11-combat-focus]')?.click();}
      if (key==='a'&&combat) {event.preventDefault();return this.handleAction('v6-attack',this.selectedStrategy);}
      if (key==='g'&&combat) {event.preventDefault();return this.handleAction('v6-guard');}
      if (key==='c'&&pending?.stage==='result') {event.preventDefault();return this.handleAction('continue');}
      if (key==='s') {event.preventDefault();return this.executeCommandV12(session.objective(this.state).command);}
    });
  };
})();
