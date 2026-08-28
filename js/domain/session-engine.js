'use strict';

(function attachSessionEngine(root) {
  const BACKUP_FORMAT='multiverse-wheel-backup';
  const BACKUP_VERSION=1;
  const MAX_BACKUP_BYTES=5*1024*1024;

  const finite=value=>Number.isFinite(Number(value));
  const safeArray=value=>Array.isArray(value);

  class SessionEngine {
    objective(state={}) {
      const pending=state.pending;
      if (!state.characterReady) return {id:'origin',eyebrow:'START HERE',title:'Choose your hero identity',description:'Pick a quick-start style or build a custom origin.',command:'origin',cta:'CHOOSE ORIGIN',shortcut:'S'};
      if (state.ended || pending?.type==='ending') return {id:'ending',eyebrow:'TIMELINE COMPLETE',title:state.finalWin?'Review your victory':'Review the fallen timeline',description:'Inspect the final score, record, and build before starting again.',command:'inspect',cta:'VIEW SUMMARY',shortcut:'S'};
      if (!pending) {
        const next=Math.max(1,Number(state.spin||0)+1),boss=next%10===0;
        const first=Number(state.spin||0)===0;
        return {id:'spin',eyebrow:boss?'BOSS READY':'NEXT OBJECTIVE',title:boss?`Enter the Stage ${Math.ceil(next/10)} boss fight`:first?'Find your first power source':`Discover event ${next}`,description:boss?'Your route choices now modify the crisis encounter.':first?'The opening wheel is a guaranteed, consequence-free power discovery.':'Spin the wheel to advance the route and reveal the next decision.',command:'spin',cta:boss?'SPIN BOSS WHEEL':first?'SPIN FIRST POWER':'SPIN THE WHEEL',shortcut:'S'};
      }
      if (pending.stage==='battle_reward') return {id:'reward',eyebrow:'VICTORY DECISION',title:'Choose your permanent reward',description:'Compare the power, party, stat, study, and reputation outcomes.',command:'inspect',cta:'REVIEW REWARDS',shortcut:'S'};
      if (pending.stage==='result') return {id:'continue',eyebrow:'EVENT RESOLVED',title:'Advance to the next route beat',description:'The outcome is saved. Continue when you are ready.',command:'continue',cta:'CONTINUE ROUTE',shortcut:'C'};
      if (['battle','boss'].includes(pending.type)) {
        const round=Math.max(1,Number(pending.combat?.round||1));
        return {id:'combat',eyebrow:pending.type==='boss'?'BOSS COMBAT':'TACTICAL COMBAT',title:`Choose the best action for round ${round}`,description:'Inspect the recommendation, enemy intent, technique cost, and hit chance.',command:'inspect',cta:'RETURN TO COMBAT',shortcut:'A'};
      }
      return {id:'decision',eyebrow:'DECISION REQUIRED',title:`Resolve ${pending.label||'the current event'}`,description:'Review the displayed consequences before committing.',command:'inspect',cta:'VIEW DECISION',shortcut:'S'};
    }

    pulse(state={},options={}) {
      const entries=(state.log||[]).map(entry=>String(entry?.message||''));
      const outcomes=entries.filter(message=>/\b(?:VICTORY|DEFEAT)\b/.test(message));
      const leading=outcomes[0]?.includes('VICTORY')?'W':outcomes[0]?.includes('DEFEAT')?'L':'—';
      let streak=0;
      if (leading!=='—') for (const message of outcomes) {
        if ((leading==='W'&&message.includes('VICTORY'))||(leading==='L'&&message.includes('DEFEAT'))) streak++;
        else break;
      }
      const maxHP=Math.max(1,Number(options.maxHP||state.hp||1));
      const hpRatio=Math.max(0,Math.min(1,Number(state.hp??maxHP)/maxHP));
      const threat=Math.round((1-hpRatio)*50+(state.statuses?.length||0)*12+(state.pending?.type==='boss'?22:0)+(leading==='L'?Math.min(16,streak*5):0));
      const threatLabel=threat>55?'CRITICAL':threat>25?'PRESSURED':'STABLE';
      const current=state.pending?Math.max(1,Number(state.spin||1)):Math.max(1,Number(state.spin||0)+1);
      const local=((current-1)%10)+1;
      return {
        streak:streak?`${streak}${leading}`:'—',
        threat,
        threatLabel,
        score:Math.round(Number(options.score||0)),
        bossIn:local===10?0:10-local,
        stage:Math.ceil(current/10),
        local
      };
    }

    createBackup(state,meta={}) {
      if (!state || typeof state!=='object') throw new TypeError('A valid run state is required.');
      return JSON.parse(JSON.stringify({format:BACKUP_FORMAT,backupVersion:BACKUP_VERSION,exportedAt:new Date().toISOString(),meta:{appVersion:String(meta.appVersion||''),hero:String(meta.hero||''),score:Math.round(Number(meta.score||0))},state}));
    }

    validateBackup(input) {
      let value=input;
      try {
        if (typeof input==='string') {
          if (input.length>MAX_BACKUP_BYTES) return {ok:false,error:'Backup exceeds the 5 MB safety limit.'};
          value=JSON.parse(input);
        }
      } catch { return {ok:false,error:'The selected file is not valid JSON.'}; }
      if (!value || typeof value!=='object' || value.format!==BACKUP_FORMAT || value.backupVersion!==BACKUP_VERSION) return {ok:false,error:'This is not a supported Multiverse Wheel backup.'};
      const state=value.state;
      if (!state || typeof state!=='object' || state.version!==3) return {ok:false,error:'The backup contains an incompatible run state.'};
      if (!finite(state.seed) || !finite(state.spin) || Number(state.spin)<0) return {ok:false,error:'The backup has invalid timeline counters.'};
      if (!safeArray(state.kits) || !safeArray(state.party) || !safeArray(state.log) || !safeArray(state.slices)) return {ok:false,error:'The backup is missing required run collections.'};
      const backup=JSON.parse(JSON.stringify(value));
      return {ok:true,backup,summary:{hero:backup.meta?.hero||backup.state.customCharacter?.codename||'Unnamed hero',spin:Number(backup.state.spin||0),score:Number(backup.meta?.score||0),exportedAt:backup.exportedAt}};
    }
  }

  const api={SessionEngine,BACKUP_FORMAT,BACKUP_VERSION,MAX_BACKUP_BYTES};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if (typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
