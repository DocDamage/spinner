'use strict';

const CHARACTER_IMAGE_MANIFEST = Array.isArray(window.CHARACTER_IMAGE_MANIFEST) ? window.CHARACTER_IMAGE_MANIFEST : [];
const SPINNER_REPO_CDN = window.__SPINNER_REPO_CDN__ || 'https://cdn.jsdelivr.net/gh/DocDamage/spinner@main/';
const normalizeCharacterName = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/\bfifth\b/g,'5').replace(/\bfirst\b/g,'1').replace(/\bsecond\b/g,'2').replace(/\bthird\b/g,'3').replace(/\bfourth\b/g,'4').replace(/[^a-z0-9]+/g,'');
const imagePath = path => {
  const raw=String(path||''); if(!raw)return''; if(/^(?:https?:|data:|blob:)/i.test(raw))return raw;
  const encoded=raw.split('/').map(x=>encodeURIComponent(x)).join('/');
  return SPINNER_REPO_CDN + encoded;
};
const imageUniverseScore=(folder,universe)=>{const a=normalizeCharacterName(folder),b=normalizeCharacterName(universe);if(!a||!b)return 0;if(a===b)return 4;if(a.includes(b)||b.includes(a))return 3;const aliases=[['dccomics','dc'],['marvelcomics','marvel'],['narutoboruto','naruto'],['onepunchman','onepunchman'],['thelegendofzelda','zelda'],['devilmaycry','devilmaycry'],['kingdomhearts','kingdomhearts'],['sonicthehedgehog','sonic'],['lordoftherings','thelordoftherings'],['pokemon','pokmon']];for(const[x,y]of aliases)if((a===x&&b===y)||(a===y&&b===x))return 3;return 0;};

const TOTAL_SPINS = 30;
const SAVE_KEY = 'multiverse-wheel-v6-custom-hero';
const STAT_KEYS = ['might','defense','speed','skill','mind','energy','hax'];
const STAT_META = {
  might:{label:'Might',abbr:'MGT',icon:'✦'}, defense:{label:'Defense',abbr:'DEF',icon:'◆'}, speed:{label:'Speed',abbr:'SPD',icon:'➤'},
  skill:{label:'Skill',abbr:'SKL',icon:'⚔'}, mind:{label:'Mind',abbr:'MND',icon:'◈'}, energy:{label:'Energy',abbr:'NRG',icon:'⚡'}, hax:{label:'Hax',abbr:'HAX',icon:'∞'}
};
const TYPE_META = {
  origin:{label:'Origin',abbr:'ORIGIN',color:'#00e5ff'}, battle:{label:'Battle',abbr:'VS',color:'#ff4d6d'}, boss:{label:'Boss',abbr:'BOSS',color:'#ff2f92'},
  power:{label:'Full Power Set',abbr:'POWER',color:'#35e6a3'}, transform:{label:'Transformation',abbr:'FORM',color:'#9d4edd'}, training:{label:'Training',abbr:'TRAIN',color:'#60a5fa'},
  recruit:{label:'Recruit',abbr:'ALLY',color:'#ff78b7'}, artifact:{label:'Artifact',abbr:'ITEM',color:'#ffd54a'}, rare:{label:'Rare Event',abbr:'RARE',color:'#f59e0b'},
  recovery:{label:'Recovery',abbr:'HEAL',color:'#22c55e'}, hazard:{label:'Hazard',abbr:'RISK',color:'#f97316'}
};
const STRATEGIES = {
  clash:{name:'Power Clash',short:'CLASH',weights:{might:.30,defense:.25,energy:.20,skill:.10,speed:.05,mind:.05,hax:.05},tags:['strength','invulnerability','energy','weapon','lightning']},
  blitz:{name:'Speed Blitz',short:'BLITZ',weights:{speed:.35,skill:.25,energy:.15,might:.10,mind:.10,defense:.05,hax:0},tags:['speed','teleport','phasing','precognition','flight']},
  tactics:{name:'Tactical Counter',short:'TACTIC',weights:{mind:.35,skill:.25,hax:.15,speed:.10,energy:.10,defense:.05,might:0},tags:['genius','prep','tech','strategy','detective','stealth']},
  mystic:{name:'Mystic / Hax',short:'MYSTIC',weights:{hax:.35,energy:.25,mind:.20,skill:.10,defense:.05,speed:.05,might:0},tags:['magic','reality','psychic','time','space','soul','cosmic']},
  outlast:{name:'Outlast',short:'OUTLAST',weights:{defense:.35,might:.20,mind:.15,energy:.15,hax:.10,skill:.05,speed:0},tags:['healing','regeneration','immortality','absorption','adaptation','willpower']}
};
const STATUS_EFFECTS = {
  INJURED:{mods:{might:-5,defense:-10,speed:-5},good:false}, CURSED:{mods:{mind:-8,hax:-12},good:false}, SHAKEN:{mods:{skill:-8,mind:-5},good:false},
  EXHAUSTED:{mods:{might:-8,speed:-8,energy:-12},good:false}, CORRUPTED:{mods:{mind:-7,hax:-7},good:false}, CONFUSED:{mods:{skill:-10,mind:-6},good:false},
  SEALED:{mods:{energy:-8,hax:-12},good:false}, SUPPRESSED:{mods:{might:-5,defense:-5,speed:-5,skill:-5,mind:-5,energy:-5,hax:-5},good:false},
  IRRADIATED:{mods:{defense:-8,energy:-5},good:false}, UNSTABLE:{mods:{might:-4,defense:-4,speed:-4,skill:-4,mind:-4,energy:-4,hax:-8},good:false},
  BLESSED:{mods:{might:5,defense:5,speed:5,skill:5,mind:5,energy:5,hax:5},good:true}, FOCUSED:{mods:{skill:8,mind:8},good:true}
};
const TIERS = [
  {name:'T1 — Street',color:'#00e5ff',max:55}, {name:'T2 — City',color:'#35e6a3',max:75}, {name:'T3 — Planetary',color:'#60a5fa',max:95},
  {name:'T4 — Cosmic',color:'#9d4edd',max:115}, {name:'T5 — Universal',color:'#ff2f92',max:140}, {name:'T6 — Multiversal',color:'#ffd54a',max:Infinity}
];
const CHAR = new Map(DATA.characters.map(c => [c.id,c]));
const ART = new Map(DATA.artifacts.map(a => [a.id,a]));
const FORM = new Map(DATA.transformations.map(f => [f.id,f]));
const MENTOR = new Map(DATA.mentors.map(m => [m.id,m]));
const HAZARD = new Map(DATA.hazards.map(h => [h.id,h]));
const RECOVERY = new Map(DATA.recoveries.map(r => [r.id,r]));
const RARE = new Map(DATA.rareEvents.map(r => [r.id,r]));
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const esc = (v='') => String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const titleCase = s => String(s).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

class AudioEngine {
  constructor(){ this.ctx=null; this.enabled=true; }
  init(){ if(!this.ctx) this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }
  tone(freq,duration=.08,type='sine',volume=.04,delay=0){ if(!this.enabled) return; try{ this.init(); const now=this.ctx.currentTime+delay; const o=this.ctx.createOscillator(); const g=this.ctx.createGain(); o.type=type; o.frequency.setValueAtTime(freq,now); g.gain.setValueAtTime(volume,now); g.gain.exponentialRampToValueAtTime(.001,now+duration); o.connect(g);g.connect(this.ctx.destination);o.start(now);o.stop(now+duration);}catch{} }
  tick(){ this.tone(420+Math.random()*180,.045,'triangle',.025); }
  win(){ [523,659,784,1047].forEach((f,i)=>this.tone(f,.24,'sine',.055,i*.07)); }
  loss(){ [330,270,210,160].forEach((f,i)=>this.tone(f,.22,'sawtooth',.035,i*.09)); }
  rare(){ [440,660,990,1480].forEach((f,i)=>this.tone(f,.30,'sine',.04,i*.055)); }
}

class MultiverseWheel {
  constructor(){
    this.audio = new AudioEngine();
    this.canvas = document.getElementById('wheel');
    this.ctx = this.canvas.getContext('2d');
    this.shell = document.getElementById('wheel-shell');
    this.eventPanel = document.getElementById('event-panel');
    this.toastEl = document.getElementById('toast');
    this.isSpinning = false;
    this.selectedStrategy = 'clash';
    this.toastTimer = null;
    this.state = this.loadState() || this.newState();
    if(!Array.isArray(this.state.slices) || !this.state.slices.length) this.generateWheel();
    this.bind();
    this.resizeObserver = new ResizeObserver(()=>this.resizeCanvas());
    this.resizeObserver.observe(this.shell);
    this.resizeCanvas();
    this.renderAll();
  }

  newState(seed=this.makeSeed()){
    return {
      version:3, seed, rngState:seed>>>0, spin:0, rotation:0, slices:[], baseId:null, kits:[], forms:[], artifacts:[], party:[], mentors:[],
      bonuses:Object.fromEntries(STAT_KEYS.map(k=>[k,0])), statuses:[], pending:null, ended:false, finalWin:false, hazardCooldown:0, forceHazard:false,
      flags:{gauntletUsed:false,phoenixUsed:false,dragonBallsUsed:false,nullifierUsed:false,rerolls:0},
      record:{wins:0,losses:0,bossWins:0,hazards:0,powers:0,recruits:0}, log:[], recent:[], removedKits:[], lastReward:null, partyBuffBattles:0, sound:true
    };
  }
  makeSeed(){ const a=new Uint32Array(1); if(crypto?.getRandomValues) crypto.getRandomValues(a); else a[0]=Date.now(); return (a[0]^Date.now())>>>0; }
  rand(){ this.state.rngState = (Math.imul(1664525,this.state.rngState)+1013904223)>>>0; return this.state.rngState/4294967296; }
  int(min,max){ return Math.floor(this.rand()*(max-min+1))+min; }
  pick(list){ return list[Math.floor(this.rand()*list.length)]; }
  shuffle(list){ const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(this.rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  sample(list,n){ return this.shuffle(list).slice(0,n); }
  makeId(prefix='e'){ return `${prefix}-${Date.now().toString(36)}-${this.int(1000,9999)}`; }

  loadState(){
    try{
      const raw=localStorage.getItem(SAVE_KEY); if(!raw) return null; const s=JSON.parse(raw); if(s?.version!==3) return null;
      s.sound = s.sound !== false; s.rotation = Number(s.rotation||0); s.recent ||= []; s.removedKits ||= []; s.lastReward ||= null; s.partyBuffBattles ||=0;
      return s;
    }catch{return null;}
  }
  save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(this.state)); }catch{} }
  log(message,type='info'){
    const spin=Math.max(1,this.state.spin||1); this.state.log.unshift({message:`[SPIN ${spin}] ${message}`,type,time:Date.now()});
    this.state.log=this.state.log.slice(0,120); this.save(); this.renderLog();
  }
  toast(message){ clearTimeout(this.toastTimer); this.toastEl.textContent=message; this.toastEl.classList.add('show'); this.toastTimer=setTimeout(()=>this.toastEl.classList.remove('show'),2200); }

  bind(){
    document.getElementById('spin-btn').addEventListener('click',()=>this.spin());
    document.getElementById('sound-btn').addEventListener('click',()=>{this.state.sound=!this.state.sound;this.audio.enabled=this.state.sound;this.save();this.renderHeader();});
    document.getElementById('help-btn').addEventListener('click',()=>document.getElementById('help-modal').classList.add('open'));
    document.getElementById('help-close').addEventListener('click',()=>document.getElementById('help-modal').classList.remove('open'));
    document.getElementById('help-modal').addEventListener('click',e=>{if(e.target.id==='help-modal')e.currentTarget.classList.remove('open');});
    document.getElementById('new-btn').addEventListener('click',()=>this.newRun());
    document.getElementById('copy-btn').addEventListener('click',()=>this.copySummary());
    document.getElementById('scroll-top-btn').addEventListener('click',()=>this.shell.scrollIntoView({behavior:'smooth',block:'center'}));
    this.eventPanel.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;this.handleAction(b.dataset.action,b.dataset.value);});
    window.addEventListener('keydown',e=>{
      if(e.key==='Escape') document.getElementById('help-modal').classList.remove('open');
      if((e.key===' '||e.key==='Enter') && document.activeElement===document.body){e.preventDefault();this.spin();}
    });
    this.canvas.addEventListener('click',()=>this.spin());
  }
  newRun(){ if(!confirm('Erase the autosaved timeline and start a new run?'))return; localStorage.removeItem(SAVE_KEY); this.state=this.newState(); this.selectedStrategy='clash'; this.generateWheel(); this.log('NEW TIMELINE: Real-roster multiverse initialized.','rare'); this.renderAll(); }

  resizeCanvas(){
    const rect=this.shell.getBoundingClientRect(); const size=Math.max(260,Math.floor(rect.width)); const dpr=Math.min(2,window.devicePixelRatio||1);
    this.canvas.width=Math.floor(size*dpr); this.canvas.height=Math.floor(size*dpr); this.canvas.style.width=`${size}px`; this.canvas.style.height=`${size}px`;
    this.ctx.setTransform(dpr,0,0,dpr,0,0); this.size=size; this.radius=size/2-7; this.drawWheel();
  }

  generateWheel(){
    const next=this.state.spin+1;
    let slices=[];
    if(next===1){
      const pool=this.sample(DATA.characters,12);
      slices=pool.map(c=>this.slice('origin',c.id,c.name,c.universe));
    }else if([10,20,30].includes(next)){
      const variants=DATA.bossVariants[String(next)];
      const repeated=[]; while(repeated.length<12) repeated.push(...this.shuffle(variants));
      slices=repeated.slice(0,12).map((v,i)=>({id:this.makeId('boss'),type:'boss',ref:`${next}:${variants.indexOf(v)}`,label:v.name,sub:v.version,color:TYPE_META.boss.color,bossSpin:next,bossIndex:variants.indexOf(v)}));
    }else{
      const types=['battle','battle','battle','battle','power','power','power','transform','training','recruit','artifact','rare','recovery'];
      if(this.state.forceHazard || this.state.hazardCooldown<=0) types.push('hazard'); else types.push('power');
      slices=this.shuffle(types.map(t=>this.buildSlice(t)));
    }
    this.state.slices=slices; this.save(); this.drawWheel();
  }
  slice(type,ref,label,sub=''){ return {id:this.makeId(type),type,ref,label,sub,color:TYPE_META[type].color}; }
  avoidRecent(items,keyFn){ const recent=new Set(this.state.recent.slice(0,18)); const fresh=items.filter(x=>!recent.has(keyFn(x))); return fresh.length?fresh:items; }
  remember(key){ this.state.recent.unshift(key); this.state.recent=this.state.recent.slice(0,30); }
  buildSlice(type){
    if(type==='battle'){
      const p=this.pickOpponent(); this.remember(`c:${p.id}`); return this.slice(type,p.id,p.name,p.universe);
    }
    if(type==='power'){
      const owned=new Set([this.state.baseId,...this.state.kits.map(k=>k.id)]); let pool=DATA.characters.filter(c=>!owned.has(c.id)); if(!pool.length) pool=DATA.characters; pool=this.avoidRecent(pool,c=>`p:${c.id}`); const p=this.pick(pool); this.remember(`p:${p.id}`); return this.slice(type,p.id,p.name,`${p.universe} full kit`);
    }
    if(type==='transform'){
      let pool=DATA.transformations.filter(f=>!this.state.forms.includes(f.id)); if(!pool.length) return this.buildSlice('power'); pool=this.avoidRecent(pool,f=>`f:${f.id}`); const f=this.pick(pool); this.remember(`f:${f.id}`); return this.slice(type,f.id,f.name,f.source);
    }
    if(type==='training'){
      const m=this.pick(this.avoidRecent(DATA.mentors,m=>`m:${m.id}`)); this.remember(`m:${m.id}`); return this.slice(type,m.id,m.name,m.lesson);
    }
    if(type==='recruit'){
      const used=new Set([this.state.baseId,...this.state.party]); let pool=DATA.characters.filter(c=>!used.has(c.id)); pool=this.avoidRecent(pool,c=>`r:${c.id}`); const p=this.pick(pool); this.remember(`r:${p.id}`); return this.slice(type,p.id,p.name,p.universe);
    }
    if(type==='artifact'){
      let pool=DATA.artifacts.filter(a=>!this.state.artifacts.includes(a.id)); if(!pool.length) pool=DATA.artifacts; pool=this.avoidRecent(pool,a=>`a:${a.id}`); const a=this.pick(pool); this.remember(`a:${a.id}`); return this.slice(type,a.id,a.name,a.universe);
    }
    if(type==='rare'){
      const r=this.pick(this.avoidRecent(DATA.rareEvents,r=>`x:${r.id}`)); this.remember(`x:${r.id}`); return this.slice(type,r.id,r.title,'Crossover anomaly');
    }
    if(type==='recovery'){
      const r=this.pick(this.avoidRecent(DATA.recoveries,r=>`h:${r.id}`)); this.remember(`h:${r.id}`); return this.slice(type,r.id,r.name,r.universe);
    }
    const h=this.pick(this.avoidRecent(DATA.hazards,h=>`z:${h.id}`)); this.remember(`z:${h.id}`); return this.slice('hazard',h.id,h.title,h.universe);
  }

  pickOpponent(){
    const current=this.overall(this.effectiveStats()); const act=Math.ceil((this.state.spin+1)/10); const used=new Set([this.state.baseId,...this.state.party]);
    let pool=DATA.characters.filter(c=>!used.has(c.id)); pool=this.avoidRecent(pool,c=>`c:${c.id}`);
    const target=current-(act===1?4:act===2?-2:-8); pool.sort((a,b)=>Math.abs(this.overall(a.stats)-target)-Math.abs(this.overall(b.stats)-target));
    const band=pool.slice(0,Math.min(18,pool.length)); return this.pick(band);
  }

  drawWheel(){
    if(!this.ctx||!this.size||!this.state.slices?.length)return;
    const ctx=this.ctx,n=this.state.slices.length,c=this.size/2,r=this.radius,step=Math.PI*2/n,rot=(this.state.rotation||0)*Math.PI/180;
    ctx.clearRect(0,0,this.size,this.size); ctx.save(); ctx.translate(c,c); ctx.rotate(rot);
    for(let i=0;i<n;i++){
      const s=this.state.slices[i],a=i*step,mid=a+step/2;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a,a+step);ctx.closePath();
      const g=ctx.createRadialGradient(0,0,r*.25,0,0,r);g.addColorStop(0,'#070b1c');g.addColorStop(.64,this.hexAlpha(s.color,'88'));g.addColorStop(1,s.color);ctx.fillStyle=g;ctx.fill();
      ctx.lineWidth=1.4;ctx.strokeStyle='rgba(3,8,24,.82)';ctx.stroke();
      ctx.save();ctx.rotate(mid);ctx.textBaseline='middle';ctx.textAlign='right';
      const mobile=this.size<430; const text=this.truncate(s.label,mobile?13:18).toUpperCase();
      ctx.font=`900 ${mobile?8:10}px system-ui, sans-serif`;ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=3;ctx.fillText(text,r-18,2);
      ctx.font=`900 ${mobile?6:7}px system-ui, sans-serif`;ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillText(TYPE_META[s.type].abbr,r-18,mobile?-8:-10);
      ctx.beginPath();ctx.arc(r-8,0,mobile?2:2.7,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.restore();
    }
    ctx.restore();
    ctx.beginPath();ctx.arc(c,c,r*.985,0,Math.PI*2);ctx.strokeStyle='rgba(0,229,255,.55)';ctx.lineWidth=2;ctx.stroke();
  }
  truncate(s,n){s=String(s);return s.length>n?s.slice(0,n-1)+'…':s;}
  hexAlpha(hex,alpha){ return /^#[0-9a-f]{6}$/i.test(hex)?hex+alpha:hex; }

  async spin(){
    if(this.isSpinning||this.state.pending||this.state.ended)return;
    if(!this.state.slices.length)this.generateWheel(); this.audio.enabled=this.state.sound; this.audio.init();
    this.isSpinning=true; this.renderHeader();
    const n=this.state.slices.length,index=this.int(0,n-1),sliceDeg=360/n,targetCenter=index*sliceDeg+sliceDeg/2;
    const current=((this.state.rotation%360)+360)%360; const desired=((270-targetCenter)%360+360)%360; const delta=((desired-current)%360+360)%360;
    const turns=this.int(5,8); const start=this.state.rotation,end=start+turns*360+delta,duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?80:2500+this.int(0,500); const t0=performance.now(); let lastTick=-1;
    const ease=t=>1-Math.pow(1-t,4);
    await new Promise(resolve=>{
      const frame=now=>{const p=clamp((now-t0)/duration,0,1);this.state.rotation=start+(end-start)*ease(p);const tick=Math.floor(this.state.rotation/sliceDeg);if(tick!==lastTick){lastTick=tick;this.audio.tick();const ptr=document.getElementById('pointer');ptr.classList.add('tick');setTimeout(()=>ptr.classList.remove('tick'),45);}this.drawWheel();if(p<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);
    });
    this.state.rotation=((end%360)+360)%360; this.isSpinning=false; this.land(this.state.slices[index]);
  }

  land(slice){
    this.advanceStatuses(); this.state.spin=Math.min(TOTAL_SPINS,this.state.spin+1);
    if(this.state.hazardCooldown>0 && slice.type!=='hazard') this.state.hazardCooldown--;
    if(slice.type==='hazard'){this.state.hazardCooldown=this.hasForm('speed_force')?5:3;this.state.forceHazard=false;this.state.record.hazards++;}
    const pending={...slice,stage:'offer'};
    if(slice.type==='boss'){
      const variant=DATA.bossVariants[String(slice.bossSpin)][slice.bossIndex]; pending.variant=variant; pending.profileId=variant.profile;
    }
    this.state.pending=pending; this.save(); this.renderAll(); this.audio.rare();
    if(slice.type==='origin') this.log(`ORIGIN LANDED: ${CHAR.get(slice.ref).name}. Inspect the complete power set, then lock it in.`,'rare');
    else this.log(`WHEEL RESULT: ${TYPE_META[slice.type].label} — ${slice.label}.`,slice.type==='hazard'?'loss':slice.type==='rare'?'rare':'info');
  }

  handleAction(action,value){
    const p=this.state.pending;
    if(action==='continue'){this.completeEvent();return;}
    if(action==='lock-origin'){this.lockOrigin(p.ref);return;}
    if(action==='take-power'){this.acquireKit(p.ref);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='take-form'){this.acquireForm(p.ref);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='train'){this.applyTraining(p.ref);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='recruit'){this.recruit(p.ref,false);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='replace-recruit'){this.recruit(p.ref,true);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='train-recruit'){this.trainWithCharacter(p.ref);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='take-artifact'){this.acquireArtifact(p.ref);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='dismantle-artifact'){this.dismantleArtifact(p.ref);this.state.pending.stage='result';this.renderAll();return;}
    if(action==='recovery-heal'){this.applyRecovery(p.ref,'heal');this.state.pending.stage='result';this.renderAll();return;}
    if(action==='recovery-overcharge'){this.applyRecovery(p.ref,'overcharge');this.state.pending.stage='result';this.renderAll();return;}
    if(action==='strategy'){this.selectedStrategy=value;this.renderEvent();return;}
    if(action==='resolve-battle'){this.resolveBattle(value||this.selectedStrategy);return;}
    if(action==='battle-copy'){this.acquireKit(p.profileId);this.finishBattleReward(`Copied ${CHAR.get(p.profileId).name}'s complete power set.`);return;}
    if(action==='battle-recruit'){this.recruit(p.profileId,this.state.party.length>=this.partyCapacity());this.finishBattleReward(`${CHAR.get(p.profileId).name} joined or trained the party.`);return;}
    if(action==='battle-surge'){this.battleSurge(p.profileId);this.finishBattleReward('Converted victory into raw stat growth.');return;}
    if(action==='hazard-resist'){this.resolveHazard('resist');return;}
    if(action==='hazard-contain'){this.resolveHazard('contain');return;}
    if(action==='nullify'){this.useNullifier();return;}
    if(action==='rare-choice'){this.resolveRare(Number(value));return;}
    if(action==='ending-new'){this.newRun();return;}
    if(action==='copy-summary'){this.copySummary();return;}
  }

  lockOrigin(id){
    const c=CHAR.get(id); this.state.baseId=id; this.state.pending.stage='result'; this.state.record.powers=1; this.state.lastReward={kind:'kit',id};
    this.log(`ORIGIN LOCKED: ${c.name} (${c.version}). All ${c.powers.length} listed powers are active.`,'rare'); this.audio.win(); this.save(); this.renderAll();
  }
  acquireKit(id,quiet=false){
    const c=CHAR.get(id); if(!c)return;
    const existing=this.state.kits.find(k=>k.id===id); const cube=this.state.artifacts.includes('cosmic_cube')?1:0;
    if(this.state.baseId===id){ this.addBonuses(Object.fromEntries(STAT_KEYS.map(k=>[k,3+cube]))); if(!quiet)this.log(`${c.name}'s base kit deepened: +${3+cube} all stats.`,'win'); }
    else if(existing){ existing.mastery=Math.min(5,(existing.mastery||1)+1+cube); if(!quiet)this.log(`${c.name} power-set mastery increased to ${existing.mastery}.`,'win'); }
    else { this.state.kits.push({id,mastery:1+cube}); if(!quiet)this.log(`COMPLETE POWER SET ACQUIRED: ${c.name} — ${c.powers.length} powers added.`,'win'); }
    this.state.record.powers++; this.state.lastReward={kind:'kit',id}; this.audio.win(); this.save();
  }
  acquireForm(id,quiet=false){
    const f=FORM.get(id);if(!f)return;if(this.state.forms.includes(id)){this.addBonuses(Object.fromEntries(STAT_KEYS.map(k=>[k,2])));if(!quiet)this.log(`${f.name} reinforced: +2 all stats.`,'win');}
    else{this.state.forms.push(id);if(!quiet)this.log(`TRANSFORMATION UNLOCKED: ${f.name}. All listed form powers are active.`,'rare');}
    this.state.lastReward={kind:'form',id};this.audio.rare();this.save();
  }
  applyTraining(id,quiet=false){
    const m=MENTOR.get(id);if(!m)return;this.addBonuses(m.bonuses);if(!this.state.mentors.includes(id))this.state.mentors.push(id);
    this.state.lastReward={kind:'training',id};if(!quiet)this.log(`TRAINING COMPLETE: ${m.name} — ${m.lesson}.`,'win');this.audio.win();this.save();
  }
  recruit(id,replace=false,quiet=false){
    const c=CHAR.get(id);if(!c)return;if(this.state.party.includes(id)){this.trainWithCharacter(id,quiet);return;}
    if(this.state.party.length<this.partyCapacity()) this.state.party.push(id);
    else if(replace){ const weakest=[...this.state.party].sort((a,b)=>this.overall(CHAR.get(a).stats)-this.overall(CHAR.get(b).stats))[0]; this.state.party=this.state.party.filter(x=>x!==weakest);this.state.party.push(id);if(!quiet)this.log(`${CHAR.get(weakest).name} left; ${c.name} joined the party.`,'rare'); }
    else {this.trainWithCharacter(id,quiet);return;}
    this.state.record.recruits++;this.state.lastReward={kind:'recruit',id};if(!quiet)this.log(`PARTY RECRUITED: ${c.name}. Their full power profile now supports battles.`,'win');this.audio.win();this.save();
  }
  trainWithCharacter(id,quiet=false){ const c=CHAR.get(id);const top=[...STAT_KEYS].sort((a,b)=>c.stats[b]-c.stats[a]).slice(0,3);top.forEach(k=>this.state.bonuses[k]+=4);if(!quiet)this.log(`${c.name} trained you: +4 ${top.map(k=>STAT_META[k].abbr).join('/')} .`,'win');this.state.lastReward={kind:'surge',id};this.audio.win();this.save(); }
  acquireArtifact(id,quiet=false){
    const a=ART.get(id);if(!a)return;if(this.state.artifacts.includes(id)){this.addBonuses(Object.fromEntries(Object.keys(a.bonuses).map(k=>[k,Math.max(2,Math.round(a.bonuses[k]*.25))])));if(!quiet)this.log(`${a.name} duplicate converted into resonance bonuses.`,'win');}
    else{if(this.state.artifacts.length>=6){const removed=this.state.artifacts.shift();if(!quiet)this.log(`${ART.get(removed).name} was displaced to make room.`,'info');}this.state.artifacts.push(id);if(!quiet)this.log(`ARTIFACT ACQUIRED: ${a.name}. ${a.powers.length} item powers active.`,'rare');}
    if(id==='omnitrix'){const pool=DATA.characters.filter(c=>c.id!==this.state.baseId&&!this.state.kits.some(k=>k.id===c.id));if(pool.length)this.acquireKit(this.pick(pool).id,true);}
    this.state.lastReward={kind:'artifact',id};this.audio.rare();this.save();
  }
  dismantleArtifact(id){const a=ART.get(id);const keys=Object.keys(a.bonuses).sort((x,y)=>a.bonuses[y]-a.bonuses[x]).slice(0,3);keys.forEach(k=>this.state.bonuses[k]+=5);this.log(`${a.name} dismantled: +5 ${keys.map(k=>STAT_META[k].abbr).join('/')} .`,'win');this.state.lastReward={kind:'surge',id};this.audio.win();this.save();}
  applyRecovery(id,mode='heal',quiet=false){
    const r=RECOVERY.get(id);if(!r)return;if(mode==='heal'){this.state.statuses=[];this.addBonuses(r.bonuses);if(r.risk&&this.rand()<.25)this.addStatus(r.risk,2);if(!quiet)this.log(`RECOVERY: ${r.name} cleared all conditions and reinforced the build.`,'win');}
    else{const doubled=Object.fromEntries(Object.entries(r.bonuses).map(([k,v])=>[k,v*2]));this.addBonuses(doubled);this.addStatus('EXHAUSTED',1);if(!quiet)this.log(`OVERCHARGE: ${r.name} doubled its stat gain but caused Exhausted.`,'rare');}
    this.state.lastReward={kind:'recovery',id,mode};this.audio.win();this.save();
  }
  addBonuses(obj){for(const [k,v] of Object.entries(obj||{}))if(STAT_KEYS.includes(k))this.state.bonuses[k]=(this.state.bonuses[k]||0)+Number(v||0);}

  battleProfile(p){
    const base=CHAR.get(p.profileId||p.ref); if(!base)return null; const c=JSON.parse(JSON.stringify(base));
    if(p.variant){for(const [k,v] of Object.entries(p.variant.boost||{}))c.stats[k]+=v;c.name=p.variant.name;c.version=p.variant.version;c.powers=[...c.powers,...(p.variant.extra||[])];c.tags=[...new Set([...c.tags,'boss','cosmic'])];}
    else{const act=Math.ceil(this.state.spin/10);for(const k of STAT_KEYS)c.stats[k]+=Math.max(0,(act-1)*4);}
    return c;
  }
  strategyScore(stats,tags,strategy,signature='',isPlayer=false){
    const cfg=STRATEGIES[strategy];let score=0;for(const k of STAT_KEYS)score+=(stats[k]||0)*(cfg.weights[k]||0);
    const set=new Set(tags);score+=cfg.tags.filter(t=>set.has(t)).length*1.9;score+=this.overall(stats)*.045;
    if(signature)score+=2;
    if(isPlayer)score+=this.strategyBonuses(strategy);
    return score;
  }
  strategyBonuses(strategy){
    let b=0;const arts=new Set(this.state.artifacts),forms=new Set(this.state.forms),mentors=new Set(this.state.mentors);
    if(arts.has('mjolnir')&&(strategy==='clash'||strategy==='mystic'))b+=6;if(arts.has('helmet_fate')&&strategy==='mystic')b+=10;if(arts.has('lasso_truth')&&strategy==='tactics')b+=8;
    if(arts.has('ten_rings'))b+=4;if(arts.has('captain_shield')&&strategy==='outlast')b+=8;if(arts.has('eye_agamotto')&&strategy===this.bestStrategyForPending())b+=3;
    if(forms.has('ultra_instinct')&&strategy==='blitz')b+=8;if(forms.has('rinnegan')&&strategy==='mystic')b+=8;if(forms.has('bankai')&&(strategy==='clash'||strategy==='blitz'))b+=5;
    if(forms.has('speed_force')&&strategy==='blitz')b+=10;if(forms.has('doctor_fate_host')&&strategy==='mystic')b+=10;
    if(mentors.has('mentor_batman')&&strategy==='tactics')b+=5;if(mentors.has('mentor_wonder_woman')&&strategy==='clash')b+=4;if(mentors.has('mentor_whis')&&strategy==='blitz')b+=6;
    if(mentors.has('mentor_strange')&&strategy==='mystic')b+=6;if(mentors.has('mentor_allmight')&&this.hasStatus('INJURED'))b+=6;if(mentors.has('mentor_panther')&&strategy==='tactics')b+=4;
    return b;
  }
  partySupport(strategy){
    if(!this.state.party.length)return 0;const cfg=STRATEGIES[strategy];let total=0,best=0;
    for(const id of this.state.party){const c=CHAR.get(id);const s=this.strategyScore(c.stats,c.tags,strategy,c.signature,false)*.075;total+=s;best=Math.max(best,s);}
    if(this.state.artifacts.includes('potara'))total+=best;if(this.state.partyBuffBattles>0)total*=2;return total;
  }
  battleOdds(p,strategy){
    const enemy=this.battleProfile(p);const ps=this.effectiveStats(),pt=this.ownedTags();let player=this.strategyScore(ps,pt,strategy,this.baseCharacter()?.signature,true)+this.partySupport(strategy);
    let enemyScore=this.strategyScore(enemy.stats,enemy.tags,strategy,enemy.signature,false);
    if(this.state.artifacts.includes('death_note')&&enemy.stats.hax<70&&enemy.stats.defense<85)enemyScore*=.82;
    const diff=(player-enemyScore)/10;let odds=1/(1+Math.exp(-diff));return clamp(odds,.08,.95);
  }
  bestStrategyForPending(){const p=this.state.pending;if(!p||!['battle','boss'].includes(p.type))return'clash';return Object.keys(STRATEGIES).sort((a,b)=>this.battleOdds(p,b)-this.battleOdds(p,a))[0];}
  resolveBattle(strategy){
    const p=this.state.pending;if(!p)return;this.selectedStrategy=strategy;const enemy=this.battleProfile(p);let odds=this.battleOdds(p,strategy);const roll=this.rand();let win=roll<=odds;
    if(!win&&this.hasForm('toon_force')&&this.rand()<.25){win=true;this.log('TOON FORCE: The losing frame was redrawn into a victory.','rare');}
    if(!win&&this.state.artifacts.includes('infinity_gauntlet')&&!this.state.flags.gauntletUsed){this.state.flags.gauntletUsed=true;const reroll=this.rand();win=reroll<=clamp(odds+.12,.08,.97);this.log(`INFINITY GAUNTLET: The failed outcome was rewritten (${Math.round((odds+.12)*100)}% reroll).`,win?'rare':'loss');}
    if(win){
      this.state.record.wins++;if(p.type==='boss')this.state.record.bossWins++;
      this.log(`VICTORY over ${enemy.name} using ${STRATEGIES[strategy].name} (${Math.round(odds*100)}% chance).`,'win');this.audio.win();
      if(p.type==='boss'){this.addBonuses(Object.fromEntries(STAT_KEYS.map(k=>[k,4])));}
      if(this.state.spin===30){this.endRun(true);return;}
      p.stage='battle_reward';p.profileId=p.profileId||p.ref;p.lastOdds=odds;this.save();this.renderAll();return;
    }
    this.state.record.losses++;this.log(`DEFEAT against ${enemy.name} using ${STRATEGIES[strategy].name} (${Math.round(odds*100)}% chance).`,'loss');this.audio.loss();
    const lead=Object.entries(STRATEGIES[strategy].weights).sort((a,b)=>b[1]-a[1])[0][0];const reduction=this.penaltyReduction();this.state.bonuses[lead]-=Math.max(1,5-reduction);this.addStatus(this.pick(['INJURED','SHAKEN','EXHAUSTED']),2);
    if(this.state.artifacts.includes('hogyoku')){this.state.bonuses[lead]+=3;this.log('HOGYOKU: Defeat triggered adaptive evolution (+3 lead stat).','rare');}
    if(this.hasForm('ultra_ego')){this.state.bonuses.might+=5;this.state.bonuses.energy+=5;this.log('ULTRA EGO: Damage converted into +5 Might and Energy.','rare');}
    if(this.state.spin===30){if(this.tryResurrection()){p.stage='offer';this.log('RESURRECTION: The final battle can be attempted again.','rare');this.renderAll();return;}this.endRun(false);return;}
    p.stage='result';p.resultText=`Defeated by ${enemy.name}. The run continues with a manageable penalty.`;this.save();this.renderAll();
  }
  finishBattleReward(message){this.log(message,'win');this.state.pending.stage='result';this.save();this.renderAll();}
  battleSurge(id){const c=CHAR.get(id);const top=[...STAT_KEYS].sort((a,b)=>c.stats[b]-c.stats[a]).slice(0,3);top.forEach(k=>this.state.bonuses[k]+=6);this.state.lastReward={kind:'surge',id};this.log(`VICTORY SURGE: +6 ${top.map(k=>STAT_META[k].abbr).join('/')} from studying ${c.name}.`,'win');this.audio.win();}

  hazardOdds(h){const tags=this.ownedTags();const matches=h.counters.filter(t=>tags.has(t));const o=this.overall(this.effectiveStats());let odds=.34+matches.length*.13+(o-65)*.0025;if(this.state.artifacts.includes('mother_box'))odds+=.10;return {odds:clamp(odds,.18,.92),matches};}
  resolveHazard(mode){
    const p=this.state.pending,h=HAZARD.get(p.ref),calc=this.hazardOdds(h);
    if(mode==='resist'){
      if(this.rand()<=calc.odds){const k=this.pick(STAT_KEYS);this.state.bonuses[k]+=3;this.log(`HAZARD RESISTED: ${h.title}. Counter-powers converted it into +3 ${STAT_META[k].label}.`,'win');this.audio.win();p.stage='result';p.resultText='The hazard was completely resisted.';}
      else{this.applyHazard(h,1);this.log(`HAZARD HIT: ${h.title} broke through (${Math.round(calc.odds*100)}% resistance chance).`,'loss');this.audio.loss();p.stage='result';p.resultText='Resistance failed, but hazard cooldown now prevents repeated hazard spam.';}
    }else{this.applyHazard(h,.5);this.log(`HAZARD CONTAINED: ${h.title} was reduced to a smaller guaranteed cost.`,'info');this.audio.tick();p.stage='result';p.resultText='Contained at half strength.';}
    this.save();this.renderAll();
  }
  applyHazard(h,mult=1){
    const reduce=this.penaltyReduction();
    if(h.effect==='drain'){for(const k of h.stats){this.state.bonuses[k]-=Math.max(1,Math.ceil(h.amount*mult)-reduce);}}
    else if(h.effect==='status'){this.addStatus(h.status,Math.max(1,Math.ceil((h.duration||2)*mult)));}
    else if(h.effect==='swap'){const eff=this.effectiveStats(),[a,b]=h.stats,d=eff[b]-eff[a];this.state.bonuses[a]+=d;this.state.bonuses[b]-=d;}
    else if(h.effect==='remove_kit'){if(this.state.kits.length&&mult>=.75){const i=this.int(0,this.state.kits.length-1),[lost]=this.state.kits.splice(i,1);this.state.removedKits.push(lost);this.log(`${CHAR.get(lost.id).name}'s copied set was displaced.`,'loss');}else this.state.bonuses.mind-=Math.max(2,5-reduce);}
    else if(h.effect==='remove_form'){if(this.state.forms.length&&mult>=.75){const i=this.int(0,this.state.forms.length-1),lost=this.state.forms.splice(i,1)[0];this.log(`${FORM.get(lost).name} was temporarily lost to continuity damage.`,'loss');}else this.state.bonuses.energy-=Math.max(2,5-reduce);}
    else if(h.effect==='remove_party'){if(this.state.party.length&&mult>=.75){const i=this.int(0,this.state.party.length-1),lost=this.state.party.splice(i,1)[0];this.log(`${CHAR.get(lost).name} was separated from the party.`,'loss');}else this.state.bonuses.skill-=Math.max(2,4-reduce);}
    else if(h.effect==='remove_artifact'){if(this.state.artifacts.length&&mult>=.75){const i=this.int(0,this.state.artifacts.length-1),lost=this.state.artifacts.splice(i,1)[0];this.log(`${ART.get(lost).name} was scattered into another universe.`,'loss');}else this.state.bonuses.hax-=Math.max(2,5-reduce);}
    else if(h.effect==='kitlock'){this.addStatus('SUPPRESSED',Math.max(1,Math.ceil((h.duration||2)*mult)));}
    else if(h.effect==='tierdown'){for(const k of STAT_KEYS)this.state.bonuses[k]-=Math.max(1,Math.ceil(4*mult)-reduce);}
  }
  useNullifier(){const i=this.state.artifacts.indexOf('ultimate_nullifier');if(i<0)return;this.state.artifacts.splice(i,1);this.state.flags.nullifierUsed=true;const p=this.state.pending;this.log(`ULTIMATE NULLIFIER: ${p.label} was erased before resolution.`,'rare');p.stage='result';p.resultText='Threat erased. The Ultimate Nullifier was consumed.';this.audio.rare();this.save();this.renderAll();}
  penaltyReduction(){let n=0;if(this.state.artifacts.includes('vibranium_suit'))n+=2;if(this.state.mentors.includes('mentor_piccolo'))n+=1;if(this.state.mentors.includes('mentor_panther'))n+=1;return n;}
  tryResurrection(){
    if(this.hasForm('phoenix_force')&&!this.state.flags.phoenixUsed){this.state.flags.phoenixUsed=true;this.state.statuses=[];return true;}
    if(this.state.artifacts.includes('dragon_balls')&&!this.state.flags.dragonBallsUsed){this.state.flags.dragonBallsUsed=true;this.state.artifacts=this.state.artifacts.filter(x=>x!=='dragon_balls');this.state.statuses=[];return true;}
    return false;
  }

  resolveRare(index){const p=this.state.pending,r=RARE.get(p.ref),choice=r.choices[index];if(!choice)return;this.applyRareEffect(choice.effect);p.stage='result';p.resultText=`${choice.label}: ${choice.hint}`;this.log(`RARE EVENT: ${r.title} — ${choice.label}.`,'rare');this.audio.rare();this.save();this.renderAll();}
  applyRareEffect(effect){
    const plus=(obj)=>this.addBonuses(obj); const randomKit=()=>{const pool=DATA.characters.filter(c=>c.id!==this.state.baseId&&!this.state.kits.some(k=>k.id===c.id));if(pool.length)this.acquireKit(this.pick(pool).id,true);};
    if(effect==='safe_future'){this.state.statuses=[];plus({mind:5});}
    else if(effect==='power_future'){let pool=DATA.transformations.filter(x=>!this.state.forms.includes(x.id));if(!pool.length)pool=DATA.transformations;const f=this.pick(pool);this.acquireForm(f.id,true);this.addStatus('EXHAUSTED',2);}
    else if(effect==='contingencies')plus({mind:8,skill:6});
    else if(effect==='hellbat'){plus({might:14,defense:14});if(this.rand()<.35)this.addStatus('INJURED',2);}
    else if(effect==='wish_power')plus(Object.fromEntries(STAT_KEYS.map(k=>[k,6])));
    else if(effect==='wish_allies'){for(let i=0;i<2;i++){const pool=DATA.characters.filter(c=>c.id!==this.state.baseId&&!this.state.party.includes(c.id));if(pool.length)this.recruit(this.pick(pool).id,this.state.party.length>=this.partyCapacity(),true);}}
    else if(effect==='wish_kit'){if(this.state.removedKits.length){const k=this.state.removedKits.pop();this.state.kits.push(k);}else randomKit();}
    else if(effect==='watcher_avoid'){this.state.hazardCooldown=5;this.state.forceHazard=false;}
    else if(effect==='watcher_steal'){const cosmic=DATA.characters.filter(c=>c.tags.includes('cosmic'));this.acquireKit(this.pick(cosmic).id,true);this.state.forceHazard=true;}
    else if(effect==='stabilize_kits'){this.state.kits.forEach(k=>k.mastery=Math.min(5,(k.mastery||1)+1));}
    else if(effect==='force_evolution'){const pool=DATA.transformations.filter(f=>!this.state.forms.includes(f.id));if(pool.length)this.acquireForm(this.pick(pool).id,true);if(this.rand()<.25)this.addStatus('CURSED',2);}
    else if(effect==='outsmart_loki'){const odds=clamp((this.effectiveStats().mind-50)/100+.55,.25,.9);if(this.rand()<odds)this.acquireArtifact(this.pick(DATA.artifacts).id,true);}
    else if(effect==='loki_deal'){randomKit();randomKit();this.addStatus('CURSED',3);}
    else if(effect==='master_weakness'){const k=this.lowestStat();this.state.bonuses[k]+=14;}
    else if(effect==='ally_memories')this.state.partyBuffBattles=3;
    else if(effect==='observation')plus({speed:12,mind:10});
    else if(effect==='conqueror')plus({might:14,hax:8});
    else if(effect==='hero_world'){const pool=DATA.characters.filter(c=>c.alignment==='Hero');this.recruit(this.pick(pool).id,this.state.party.length>=this.partyCapacity(),true);this.addStatus('BLESSED',3);}
    else if(effect==='villain_world'){const pool=DATA.characters.filter(c=>c.alignment==='Villain');this.acquireKit(this.pick(pool).id,true);plus({hax:6});}
    else if(effect==='collapse_portals')this.acquireArtifact(this.pick(DATA.artifacts).id,true);
    else if(effect==='become_phoenix')this.acquireForm('phoenix_force',true);
    else if(effect==='phoenix_spark'){this.state.statuses=[];plus({energy:10,hax:4});this.state.flags.phoenixUsed=false;}
    else if(effect==='alienx_stats'){const eff=this.effectiveStats(),avg=Math.round(this.overall(eff));const low=[...STAT_KEYS].sort((a,b)=>eff[a]-eff[b]).slice(0,3);low.forEach(k=>this.state.bonuses[k]+=Math.max(0,avg-eff[k]));}
    else if(effect==='alienx_inventory'){this.acquireArtifact(this.pick(DATA.artifacts).id,true);this.acquireArtifact(this.pick(DATA.artifacts).id,true);if(this.state.kits.length){const i=this.int(0,this.state.kits.length-1);this.state.removedKits.push(this.state.kits.splice(i,1)[0]);}}
    else if(effect==='speed_train')plus({speed:18,skill:8});
    else if(effect==='steal_time')this.repeatLastReward();
  }
  repeatLastReward(){const r=this.state.lastReward;if(!r){this.acquireKit(this.pick(DATA.characters).id,true);return;}if(r.kind==='kit')this.acquireKit(r.id,true);else if(r.kind==='form')this.acquireForm(r.id,true);else if(r.kind==='artifact')this.acquireArtifact(r.id,true);else if(r.kind==='training')this.applyTraining(r.id,true);else if(r.kind==='recovery')this.applyRecovery(r.id,r.mode,true);else this.addBonuses(Object.fromEntries(STAT_KEYS.map(k=>[k,3])));}

  completeEvent(){
    if(this.state.ended)return;
    this.state.pending=null;
    if(this.state.partyBuffBattles>0&&this.state.log[0]?.message.includes('VICTORY'))this.state.partyBuffBattles--;
    if(this.state.spin>=TOTAL_SPINS){this.endRun(this.state.finalWin);return;}
    this.generateWheel();this.save();this.renderAll();this.shell.scrollIntoView({behavior:'smooth',block:'center'});
  }

  addStatus(id,duration=2){const existing=this.state.statuses.find(s=>s.id===id);if(existing)existing.duration=Math.max(existing.duration,duration);else this.state.statuses.push({id,duration});}
  hasStatus(id){return this.state.statuses.some(s=>s.id===id);}
  advanceStatuses(){for(const s of this.state.statuses)s.duration--;this.state.statuses=this.state.statuses.filter(s=>s.duration>0);}
  hasForm(id){return this.state.forms.includes(id);}
  baseCharacter(){return this.state.baseId?CHAR.get(this.state.baseId):null;}
  partyCapacity(){return 3+(this.state.artifacts.includes('green_ring')?1:0);}
  lowestStat(){const e=this.effectiveStats();return [...STAT_KEYS].sort((a,b)=>e[a]-e[b])[0];}
  ownedTags(){
    const tags=new Set();const add=x=>(x||[]).forEach(t=>tags.add(t));const base=this.baseCharacter();if(base)add(base.tags);
    if(!this.hasStatus('SUPPRESSED'))for(const k of this.state.kits)add(CHAR.get(k.id)?.tags);
    if(!this.hasStatus('SEALED'))for(const id of this.state.forms)add(FORM.get(id)?.tags);
    for(const id of this.state.artifacts)add(ART.get(id)?.tags);for(const id of this.state.mentors)add(MENTOR.get(id)?.tags);return tags;
  }
  effectiveStats(){
    const base=this.baseCharacter();let out=Object.fromEntries(STAT_KEYS.map(k=>[k,base?.stats[k]||10]));
    for(const k of STAT_KEYS)out[k]+=this.state.bonuses[k]||0;
    if(!this.hasStatus('SUPPRESSED'))for(const kit of this.state.kits){const c=CHAR.get(kit.id);if(!c)continue;const mastery=kit.mastery||1;for(const k of STAT_KEYS){out[k]=Math.max(out[k],Math.round(c.stats[k]*.74));out[k]+=Math.round(c.stats[k]*(.025*mastery));}}
    if(!this.hasStatus('SEALED'))for(const id of this.state.forms){const f=FORM.get(id);for(const [k,v] of Object.entries(f?.bonuses||{}))out[k]+=v;}
    for(const id of this.state.artifacts){const a=ART.get(id);const mult=this.state.mentors.includes('mentor_ironman')?1.2:1;for(const [k,v] of Object.entries(a?.bonuses||{}))out[k]+=Math.round(v*mult);}
    for(const s of this.state.statuses){const mods=STATUS_EFFECTS[s.id]?.mods||{};for(const [k,v] of Object.entries(mods))out[k]+=v;}
    for(const k of STAT_KEYS)out[k]=clamp(Math.round(out[k]),1,250);return out;
  }
  overall(stats){return STAT_KEYS.reduce((n,k)=>n+(stats[k]||0),0)/STAT_KEYS.length;}
  tier(){const o=this.overall(this.effectiveStats());return TIERS.find(t=>o<t.max)||TIERS.at(-1);}
  abilityCount(){const set=new Set();const base=this.baseCharacter();base?.powers.forEach(x=>set.add(x));for(const k of this.state.kits)CHAR.get(k.id)?.powers.forEach(x=>set.add(x));for(const id of this.state.forms)FORM.get(id)?.powers.forEach(x=>set.add(x));for(const id of this.state.artifacts)ART.get(id)?.powers.forEach(x=>set.add(x));return set.size;}

  endRun(win){this.state.ended=true;this.state.finalWin=win;this.state.pending={type:'ending',stage:'ending',label:win?'MULTIVERSE CONQUERED':'TIMELINE ERASED'};this.log(win?'FINAL VICTORY: The real-roster multiverse has been conquered.':'FINAL DEFEAT: The final crisis erased this timeline.',win?'rare':'loss');this.audio[win?'rare':'loss']();this.save();this.renderAll();}
  score(){const o=Math.round(this.overall(this.effectiveStats()));return o*25+this.state.record.wins*120+this.state.record.bossWins*500+this.state.kits.length*90+this.state.forms.length*130+this.state.artifacts.length*100+this.state.party.length*80-this.state.record.losses*75-this.state.record.hazards*25;}
  rank(){const s=this.score();if(this.state.finalWin&&s>=7000)return'BOUNDLESS ARCHITECT';if(this.state.finalWin)return'MULTIVERSE CHAMPION';if(s>=5200)return'CRISIS SURVIVOR';if(s>=3600)return'COSMIC CONTENDER';return'FALLEN LEGEND';}
  summary(){const b=this.baseCharacter(),e=this.effectiveStats();return [`MULTIVERSE WHEEL V5 — MULTIVERSE SIMULATOR`,this.state.ended?(this.state.finalWin?'MULTIVERSE CONQUERED':'TIMELINE ERASED'):`SPIN ${this.state.spin}/${TOTAL_SPINS}`,`Origin: ${b?.name||'None'} — ${b?.version||''}`,`Tier: ${this.tier().name}`,`Stats: ${STAT_KEYS.map(k=>`${STAT_META[k].abbr} ${e[k]}`).join(' / ')}`,`Power sets: ${[b?.name,...this.state.kits.map(k=>CHAR.get(k.id)?.name)].filter(Boolean).join(', ')||'None'}`,`Forms: ${this.state.forms.map(id=>FORM.get(id)?.name).join(', ')||'None'}`,`Party: ${this.state.party.map(id=>CHAR.get(id)?.name).join(', ')||'None'}`,`Artifacts: ${this.state.artifacts.map(id=>ART.get(id)?.name).join(', ')||'None'}`,`Record: ${this.state.record.wins}W / ${this.state.record.losses}L / ${this.state.record.bossWins} boss wins`, `Score: ${this.score()} — ${this.rank()}`,`Seed: ${String(this.state.seed>>>0).padStart(10,'0')}`].join('\n');}
  async copySummary(){try{await navigator.clipboard.writeText(this.summary());this.toast('Run summary copied.');}catch{const t=document.createElement('textarea');t.value=this.summary();t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();document.execCommand('copy');t.remove();this.toast('Run summary copied.');}}

  renderAll(){this.audio.enabled=this.state.sound;this.renderHeader();this.renderHub();this.renderHero();this.renderParty();this.renderLoadout();this.renderConditions();this.renderPowerLibrary();this.renderEvent();this.renderLog();this.drawWheel();}
  renderHeader(){
    const tier=this.tier(),next=this.state.pending?this.state.spin:Math.min(TOTAL_SPINS,this.state.spin+1),act=next<=10?1:next<=20?2:3;
    const tn=document.getElementById('tier-name');tn.textContent=tier.name;tn.style.color=tier.color;
    document.getElementById('spin-counter').textContent=`${Math.max(1,next)} / ${TOTAL_SPINS}`;
    document.getElementById('act-title').textContent=next===30?'FINAL CRISIS':next===20?'ACT II BOSS':next===10?'ACT I BOSS':`ACT ${['I','II','III'][act-1]} — ${['AWAKENING','CONVERGENCE','COLLAPSE'][act-1]}`;
    const statuses=this.state.statuses.map(s=>s.id);const status=statuses.length?statuses.join(' + '):'PRISTINE';const se=document.getElementById('status-name');se.textContent=status;se.style.color=statuses.some(x=>!STATUS_EFFECTS[x]?.good)?'var(--red)':'var(--green)';
    document.getElementById('status-orb').textContent=statuses.length?String(statuses.length):'◆';
    document.getElementById('sound-btn').innerHTML=this.state.sound?'<span aria-hidden="true">🔊</span> Sound':'<span aria-hidden="true">🔇</span> Muted';
  }
  renderHub(){
    const b=this.baseCharacter(),e=this.effectiveStats(),btn=document.getElementById('spin-btn');
    document.getElementById('hub-name').textContent=b?.name||'AWAITING ORIGIN';document.getElementById('hub-kicker').textContent=b?`${b.alignment.toUpperCase()} • ${b.universe.toUpperCase()}`:'REAL HERO OR VILLAIN';
    document.getElementById('hub-meta').textContent=b?b.version:`${DATA.characters.length} named character profiles`;
    document.getElementById('hub-overall').textContent=b?`OVR ${Math.round(this.overall(e))} • ${this.abilityCount()} ABILITIES`:'OVR —';
    const next=this.state.spin+1;btn.disabled=this.isSpinning||!!this.state.pending||this.state.ended;btn.textContent=this.isSpinning?'SPINNING…':this.state.ended?'RUN COMPLETE':next===1?'SPIN ORIGIN WHEEL':[10,20,30].includes(next)?'SPIN BOSS WHEEL':'SPIN MULTIVERSE';
  }
  renderHero(){
    const root=document.getElementById('hero-dossier'),b=this.baseCharacter(),e=this.effectiveStats();document.getElementById('ability-count').textContent=`${this.abilityCount()} abilities`;
    if(!b){root.innerHTML='<div class="event-empty">Spin the origin wheel to become a real hero or villain. Their full listed power set will become your base kit.</div>';return;}
    const max=Math.max(100,...Object.values(e));root.innerHTML=`<div class="identity-card"><div class="identity-name">${esc(b.name)}</div><div class="identity-meta">${esc(b.alignment)} • ${esc(b.universe)}</div><div class="identity-version">${esc(b.version)}</div><div class="identity-signature">Signature: ${esc(b.signature)}</div><div class="tags">${b.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div><div class="stat-grid">${STAT_KEYS.map(k=>`<div class="stat-row"><div class="stat-label"><span>${STAT_META[k].icon}</span>${STAT_META[k].label}</div><div class="stat-track"><div class="stat-fill" style="width:${Math.min(100,e[k]/max*100)}%"></div></div><div class="stat-num">${e[k]}</div></div>`).join('')}</div><details class="power-card" open><summary><span>Base powers (${b.powers.length})</span><span>${esc(b.name)}</span></summary><div class="power-body"><ul class="power-list">${b.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${b.forms.length?`<div class="item-special">Known forms: ${b.forms.map(esc).join(' • ')}</div>`:''}<div class="weakness"><strong>Weaknesses:</strong> ${esc(b.weakness)}</div></div></details>`;
  }
  renderParty(){
    const root=document.getElementById('party-list');document.getElementById('party-count').textContent=`${this.state.party.length} / ${this.partyCapacity()}`;
    if(!this.state.party.length){root.innerHTML='<div class="event-empty" style="min-height:80px">No allies yet. Recruit slices use real characters and their complete profiles.</div>';return;}
    root.innerHTML=this.state.party.map(id=>{const c=CHAR.get(id);return `<details class="power-card"><summary><span>${esc(c.name)}</span><span>OVR ${Math.round(this.overall(c.stats))}</span></summary><div class="power-body"><div class="item-meta">${esc(c.universe)} • ${esc(c.version)}</div><ul class="power-list">${c.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></details>`;}).join('');
  }
  renderLoadout(){
    const root=document.getElementById('loadout-list'),items=[];
    for(const id of this.state.forms){const f=FORM.get(id);items.push(`<details class="power-card"><summary><span>${esc(f.name)}</span><span>FORM</span></summary><div class="power-body"><div class="item-meta">Source: ${esc(f.source)}</div><ul class="power-list">${f.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="item-special">${esc(f.special)}</div></div></details>`);}
    for(const id of this.state.artifacts){const a=ART.get(id);items.push(`<details class="power-card"><summary><span>${esc(a.name)}</span><span>ITEM</span></summary><div class="power-body"><div class="item-meta">${esc(a.universe)}</div><ul class="power-list">${a.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="item-special">${esc(a.special)}</div></div></details>`);}
    document.getElementById('loadout-count').textContent=String(items.length);root.innerHTML=items.join('')||'<div class="event-empty" style="min-height:80px">No transformations or artifacts yet.</div>';
  }
  renderConditions(){
    const root=document.getElementById('conditions-list');const chips=this.state.statuses.map(s=>`<span class="status-chip ${STATUS_EFFECTS[s.id]?.good?'good':''}">${esc(s.id)} • ${s.duration}</span>`).join('');
    root.innerHTML=`<div class="status-list">${chips||'<span class="status-chip good">PRISTINE</span>'}</div><div class="dossier-item" style="margin-top:9px"><div class="item-name">Hazard protection</div><div class="item-meta">Cooldown: ${this.state.hazardCooldown} wheel${this.state.hazardCooldown===1?'':'s'} • Landed hazards: ${this.state.record.hazards}</div><div class="item-special">Normal wheels contain at most one hazard among 14 slices. A landed hazard removes hazards from several following wheels.</div></div>`;
  }
  renderPowerLibrary(){
    const root=document.getElementById('power-library'),sets=[];const b=this.baseCharacter();if(b)sets.push({c:b,label:'BASE',mastery:1});for(const k of this.state.kits){const c=CHAR.get(k.id);if(c)sets.push({c,label:'COPIED',mastery:k.mastery||1});}
    document.getElementById('power-set-count').textContent=`${sets.length} set${sets.length===1?'':'s'}`;
    root.innerHTML=sets.map(({c,label,mastery})=>`<details class="power-card" ${label==='BASE'?'open':''}><summary><span>${esc(c.name)} <small style="color:var(--muted)">• ${label}${mastery>1?` M${mastery}`:''}</small></span><span>${c.powers.length} POWERS</span></summary><div class="power-body"><div class="item-meta">${esc(c.universe)} • ${esc(c.version)}</div><div class="tags">${c.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><ul class="power-list">${c.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${c.forms.length?`<div class="item-special">Forms in profile: ${c.forms.map(esc).join(' • ')}</div>`:''}<div class="weakness"><strong>Weaknesses:</strong> ${esc(c.weakness)}</div></div></details>`).join('')||'<div class="event-empty">No active power sets.</div>';
  }
  profileMini(c){return `<div class="mini-stats">${STAT_KEYS.map(k=>`<div class="mini-stat"><b>${c.stats[k]}</b><span>${STAT_META[k].abbr}</span></div>`).join('')}</div>`;}
  eventHeader(type,title,sub,rating=''){return `<div class="event-head"><div><div class="event-type" style="color:${TYPE_META[type]?.color||'var(--cyan)'}">${TYPE_META[type]?.label||title}</div><h2 class="event-title">${esc(title)}</h2><div class="event-sub">${esc(sub)}</div></div>${rating!==''?`<div class="event-rating"><strong>${rating}</strong><span>OVERALL</span></div>`:''}</div>`;}
  renderEvent(){
    const p=this.state.pending;
    if(!p){
      this.eventPanel.innerHTML='<div class="event-empty"><div><strong style="display:block;color:var(--cyan);font-size:14px;margin-bottom:5px">THE WHEEL IS READY</strong>Power sets outnumber hazards by a wide margin. Spin to meet, copy, recruit, train with, or fight a real character.</div></div>';
      return;
    }
    if(p.type==='ending'){this.renderEnding();return;}
    if(p.type==='origin'){
      const c=CHAR.get(p.ref);
      const action=p.stage==='offer'?'lock-origin':'continue';
      const label=p.stage==='offer'?'LOCK THIS ORIGIN':'CONTINUE';
      this.eventPanel.innerHTML=this.eventHeader('origin',c.name,`${c.alignment} • ${c.universe} • ${c.version}`,Math.round(this.overall(c.stats)))
        +this.profileMini(c)
        +`<details class="power-card" open><summary><span>Complete origin power set</span><span>${c.powers.length} powers</span></summary><div class="power-body"><ul class="power-list">${c.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="weakness"><strong>Weaknesses:</strong> ${esc(c.weakness)}</div></div></details>`
        +`<div class="resolve-row"><button class="primary-btn" data-action="${action}">${label}</button></div>`;
      return;
    }
    if(['battle','boss'].includes(p.type)){this.renderBattle(p);return;}
    if(p.type==='power'){
      const c=CHAR.get(p.ref);
      const action=p.stage==='offer'?'take-power':'continue';
      const label=p.stage==='offer'?'ABSORB COMPLETE POWER SET':'CONTINUE';
      this.eventPanel.innerHTML=this.eventHeader('power',`${c.name} Power Set`,`${c.universe} • ${c.version}`,Math.round(this.overall(c.stats)))
        +this.profileMini(c)
        +`<details class="power-card" open><summary><span>Every power gained</span><span>${c.powers.length}</span></summary><div class="power-body"><ul class="power-list">${c.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></details>`
        +`<div class="resolve-row"><button class="primary-btn" data-action="${action}">${label}</button></div>`;
      return;
    }
    if(p.type==='transform'){
      const f=FORM.get(p.ref);
      const action=p.stage==='offer'?'take-form':'continue';
      const label=p.stage==='offer'?'UNLOCK TRANSFORMATION':'CONTINUE';
      this.eventPanel.innerHTML=this.eventHeader('transform',f.name,`Source: ${f.source}`)
        +`<ul class="power-list">${f.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
        +`<div class="item-special">${esc(f.special)}</div>`
        +`<div class="resolve-row"><button class="primary-btn" data-action="${action}">${label}</button></div>`;
      return;
    }
    if(p.type==='training'){
      const m=MENTOR.get(p.ref);
      const action=p.stage==='offer'?'train':'continue';
      const label=p.stage==='offer'?'BEGIN TRAINING':'CONTINUE';
      this.eventPanel.innerHTML=this.eventHeader('training',m.name,m.lesson)
        +`<div class="dossier-item"><div class="item-name">Training gains</div><div class="item-meta">${Object.entries(m.bonuses).map(([k,v])=>`+${v} ${STAT_META[k].label}`).join(' • ')}</div><div class="item-special">${esc(m.special)}</div></div>`
        +`<div class="resolve-row"><button class="primary-btn" data-action="${action}">${label}</button></div>`;
      return;
    }
    if(p.type==='recruit'){
      const c=CHAR.get(p.ref);
      const full=this.state.party.length>=this.partyCapacity();
      const actions=p.stage==='offer'
        ?`<div class="choice-grid"><button class="choice-btn good" data-action="${full?'replace-recruit':'recruit'}"><strong>${full?'REPLACE WEAKEST ALLY':'RECRUIT FULL PROFILE'}</strong><small>All listed powers contribute party support.</small></button><button class="choice-btn" data-action="train-recruit"><strong>TRAIN TOGETHER</strong><small>Gain +4 to this character's three strongest stats.</small></button></div>`
        :'<div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>';
      this.eventPanel.innerHTML=this.eventHeader('recruit',c.name,`${c.alignment} • ${c.universe} • ${c.version}`,Math.round(this.overall(c.stats)))
        +this.profileMini(c)
        +`<details class="power-card"><summary><span>Party power profile</span><span>${c.powers.length} powers</span></summary><div class="power-body"><ul class="power-list">${c.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></details>`
        +actions;
      return;
    }
    if(p.type==='artifact'){
      const a=ART.get(p.ref);
      const actions=p.stage==='offer'
        ?'<div class="choice-grid"><button class="choice-btn gold" data-action="take-artifact"><strong>TAKE ARTIFACT</strong><small>Activate all listed item powers and stat bonuses.</small></button><button class="choice-btn" data-action="dismantle-artifact"><strong>DISMANTLE FOR STATS</strong><small>Convert it into +5 on its three strongest attributes.</small></button></div>'
        :'<div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>';
      this.eventPanel.innerHTML=this.eventHeader('artifact',a.name,a.universe)
        +`<ul class="power-list">${a.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
        +`<div class="item-special">${esc(a.special)}</div>`
        +actions;
      return;
    }
    if(p.type==='recovery'){
      const r=RECOVERY.get(p.ref);
      const actions=p.stage==='offer'
        ?'<div class="choice-grid"><button class="choice-btn good" data-action="recovery-heal"><strong>FULL RECOVERY</strong><small>Clear all conditions and take the listed bonuses.</small></button><button class="choice-btn gold" data-action="recovery-overcharge"><strong>OVERCHARGE</strong><small>Double the stat gain, then become Exhausted briefly.</small></button></div>'
        :'<div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>';
      this.eventPanel.innerHTML=this.eventHeader('recovery',r.name,`${r.universe} • ${r.desc}`)+actions;
      return;
    }
    if(p.type==='hazard'){this.renderHazard(p);return;}
    if(p.type==='rare'){
      const r=RARE.get(p.ref);
      const actions=p.stage==='offer'
        ?`<div class="choice-grid ${r.choices.length===3?'three':''}">${r.choices.map((c,i)=>`<button class="choice-btn gold" data-action="rare-choice" data-value="${i}"><strong>${esc(c.label)}</strong><small>${esc(c.hint)}</small></button>`).join('')}</div>`
        :`<div class="dossier-item"><div class="item-special">${esc(p.resultText||'Rare event resolved.')}</div></div><div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>`;
      this.eventPanel.innerHTML=this.eventHeader('rare',r.title,r.desc)+actions;
      return;
    }
  }
  renderBattle(p){
    const c=this.battleProfile(p);if(p.stage==='battle_reward'){this.eventPanel.innerHTML=this.eventHeader(p.type,c.name,'Victory reward — choose how to claim this character.',Math.round(this.overall(c.stats)))+`<div class="choice-grid three"><button class="choice-btn good" data-action="battle-copy"><strong>COPY COMPLETE POWER SET</strong><small>Add all ${c.powers.length} listed powers to your active build.</small></button><button class="choice-btn" data-action="battle-recruit"><strong>RECRUIT / TRAIN</strong><small>Add the full profile to party support or replace the weakest ally.</small></button><button class="choice-btn gold" data-action="battle-surge"><strong>ABSORB VICTORY SURGE</strong><small>+6 to this opponent's three strongest stats.</small></button></div>`;return;}
    if(p.stage==='result'){this.eventPanel.innerHTML=this.eventHeader(p.type,c.name,p.resultText||'Battle resolved.',Math.round(this.overall(c.stats)))+`<div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>`;return;}
    const best=this.bestStrategyForPending();if(!this.selectedStrategy||!STRATEGIES[this.selectedStrategy])this.selectedStrategy=best;
    this.eventPanel.innerHTML=this.eventHeader(p.type,c.name,`${c.alignment} • ${c.universe} • ${c.version}`,Math.round(this.overall(c.stats)))+this.profileMini(c)+`<details class="power-card"><summary><span>Opponent's complete power set</span><span>${c.powers.length} powers</span></summary><div class="power-body"><ul class="power-list">${c.powers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="weakness"><strong>Weaknesses:</strong> ${esc(c.weakness)}</div></div></details><div class="strategy-grid">${Object.entries(STRATEGIES).map(([id,s])=>`<button class="strategy-btn ${this.selectedStrategy===id?'selected':''}" data-action="strategy" data-value="${id}"><strong>${s.short}</strong><span>${Math.round(this.battleOdds(p,id)*100)}%</span></button>`).join('')}</div>${this.state.artifacts.includes('eye_agamotto')?`<div class="counter-line">Eye of Agamotto recommendation: ${STRATEGIES[best].name}</div>`:''}<div class="resolve-row"><button class="primary-btn" data-action="resolve-battle" data-value="${this.selectedStrategy}">RESOLVE ${STRATEGIES[this.selectedStrategy].name}</button>${this.state.artifacts.includes('ultimate_nullifier')?'<button class="secondary-btn" data-action="nullify">USE NULLIFIER</button>':''}</div>`;
  }
  renderHazard(p){const h=HAZARD.get(p.ref);if(p.stage==='result'){this.eventPanel.innerHTML=this.eventHeader('hazard',h.title,p.resultText||'Hazard resolved.')+`<div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>`;return;}const calc=this.hazardOdds(h);this.eventPanel.innerHTML=this.eventHeader('hazard',h.title,`${h.universe} • ${h.desc}`)+`<div class="counter-line">Counter tags detected: ${calc.matches.length?calc.matches.map(titleCase).join(', '):'none'} • Full resistance chance ${Math.round(calc.odds*100)}%</div><div class="choice-grid"><button class="choice-btn good" data-action="hazard-resist"><strong>RESIST WITH FULL BUILD — ${Math.round(calc.odds*100)}%</strong><small>Success avoids all damage and grants a small stat boost. Failure applies the full hazard.</small></button><button class="choice-btn" data-action="hazard-contain"><strong>CONTAIN THE DAMAGE</strong><small>Guaranteed half-strength consequence. No roll.</small></button></div>${this.state.artifacts.includes('ultimate_nullifier')?'<div class="resolve-row"><button class="secondary-btn" data-action="nullify">ERASE WITH ULTIMATE NULLIFIER</button></div>':''}`;}
  renderEnding(){const win=this.state.finalWin;this.eventPanel.innerHTML=this.eventHeader('rare',win?'Multiverse Conquered':'Timeline Erased',`${this.rank()} • Final score ${this.score()}`)+`<div class="mini-stats">${STAT_KEYS.map(k=>`<div class="mini-stat"><b>${this.effectiveStats()[k]}</b><span>${STAT_META[k].abbr}</span></div>`).join('')}</div><div class="dossier-item" style="margin-top:10px"><div class="item-name">Run record</div><div class="item-meta">${this.state.record.wins} wins • ${this.state.record.losses} losses • ${this.state.record.bossWins}/3 boss wins • ${this.abilityCount()} active abilities</div></div><div class="choice-grid"><button class="choice-btn good" data-action="copy-summary"><strong>COPY RUN SUMMARY</strong><small>Copy origin, powers, forms, party, artifacts, stats, score, and seed.</small></button><button class="choice-btn gold" data-action="ending-new"><strong>START NEW TIMELINE</strong><small>Erase the autosave and spin a new origin roster.</small></button></div>`;}
  renderLog(){const root=document.getElementById('log-list');document.getElementById('seed-label').textContent=`SEED ${String(this.state.seed>>>0).padStart(10,'0')}`;root.innerHTML=(this.state.log.length?this.state.log:[{message:`[INIT] Real-roster matrix ready. ${DATA.characters.length} character profiles, ${DATA.hazards.length} hazards, and a power-heavy wheel are loaded.`,type:'info'}]).map(x=>`<div class="log-entry ${esc(x.type)}">${esc(x.message)}</div>`).join('');}
}

// ===== EXPANSION MECHANICS — wires every new special into the actual math =====
(() => {  const P = MultiverseWheel.prototype;
  const _strategyBonuses = P.strategyBonuses;  P.strategyBonuses = function(strategy){    let b = _strategyBonuses.call(this, strategy);    const arts = new Set(this.state.artifacts), forms = new Set(this.state.forms), mentors = new Set(this.state.mentors);    if (arts.has('master_sword') && strategy === 'clash') b += 5;    if (arts.has('book_vishanti') && strategy === 'mystic') b += 8;    if (arts.has('blades_of_chaos')) { if (strategy === 'clash') b += 4; if (strategy === 'blitz') b += 3; }    if (arts.has('necrosword') && strategy === 'clash') b += 6;    if (forms.has('super_saiyan_4') && (strategy === 'clash' || strategy === 'blitz')) b += 5;    if (forms.has('sin_devil_trigger') && strategy === 'clash') b += 6;    if (forms.has('berserker_armor') && strategy === 'outlast') b += 6;    if (forms.has('fierce_deity') && (strategy === 'clash' || strategy === 'blitz')) b += 4;    if (forms.has('quantum_ascension') && strategy === 'mystic') b += 10;    if (forms.has('stand_awakening') && strategy === 'blitz') b += 6;    if (forms.has('the_one') && strategy === 'clash') b += 8;    if (forms.has('level_zero') && strategy === 'outlast') b += 8;    if (mentors.has('mentor_bang') && strategy === 'blitz') b += 5;    if (mentors.has('mentor_ancient_one') && strategy === 'mystic') b += 5;    if (mentors.has('mentor_obi_wan') && strategy === 'outlast') b += 5;    if (mentors.has('mentor_gojo')) { if (strategy === 'mystic') b += 4; if (strategy === 'blitz') b += 3; }    if (mentors.has('mentor_netero') && strategy === 'clash') b += 4;    if (mentors.has('mentor_iroh') && strategy === 'outlast') b += 4;    return b;  };
  const _battleOdds = P.battleOdds;  P.battleOdds = function(p, strategy){    let odds = _battleOdds.call(this, p, strategy);    if (this.state.artifacts.includes('kryptonite_ring')) {      const enemy = this.battleProfile(p);      if (enemy?.tags.includes('kryptonian')) odds = clamp(odds + .15, .08, .95);    }    return odds;  };
  const _penaltyReduction = P.penaltyReduction;  P.penaltyReduction = function(){    let n = _penaltyReduction.call(this);    if (this.state.artifacts.includes('philosopher_stone')) n += 1;    return n;  };
  const _hazardOdds = P.hazardOdds;  P.hazardOdds = function(h){    const r = _hazardOdds.call(this, h);    if (this.state.artifacts.includes('fenton_thermos')) r.odds = clamp(r.odds + .08, .18, .95);    return r;  };
  const _acquireArtifact = P.acquireArtifact;  P.acquireArtifact = function(id, quiet = false){    const isNew = !this.state.artifacts.includes(id);    _acquireArtifact.call(this, id, quiet);    if (id === 'stand_arrow' && isNew) {      const pool = DATA.transformations.filter(f => !this.state.forms.includes(f.id));      if (pool.length) this.acquireForm(this.pick(pool).id, true);    }  };
  // Hotkeys 1–5 select a battle strategy
  window.addEventListener('keydown', e => {    const g = window.game; if (!g || g.isSpinning) return;    const map = {'1':'clash','2':'blitz','3':'tactics','4':'mystic','5':'outlast'};    const p = g.state.pending;    if (map[e.key] && p && ['battle','boss'].includes(p.type) && p.stage !== 'result' && p.stage !== 'battle_reward') {      g.selectedStrategy = map[e.key]; g.renderEvent();    }  });})();
