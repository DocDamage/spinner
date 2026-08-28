'use strict';

// V13 foundation adapter: save-compatible state migration, canonical roster
// identity, local run slots, deterministic daily runs, and challenge codes.
(() => {
  const {
    V13StateEngine,RunSlotRepository,ExperienceEngine,
    canonicalUniverse,identityFor,dailyChallenge,
    encodeChallengeCode,decodeChallengeCode
  }=MultiverseDomain;
  const P=MultiverseWheel.prototype;
  const stateEngine=new V13StateEngine();
  const experience=new ExperienceEngine();
  const ACTIVE_SLOT_KEY='multiverse-wheel-v13-active-slot';
  const SLOT_PREFIX='multiverse-wheel-v13-slot';

  const slotNumber=value=>Math.max(1,Math.min(3,Math.round(Number(value)||1)));
  const storage=()=>window.localStorage;
  const slots=()=>new RunSlotRepository(storage(),SLOT_PREFIX,3);

  P.ensureV13=function(state=this.state) {
    if (!state) return state;
    return stateEngine.migrate(state);
  };

  P.activeSlotV13=function() {
    try{return slotNumber(storage().getItem(ACTIVE_SLOT_KEY));}catch{return 1;}
  };

  P.setActiveSlotV13=function(slot) {
    const value=slotNumber(slot);
    try{storage().setItem(ACTIVE_SLOT_KEY,String(value));}catch{}
    return value;
  };

  P.runSlotsV13=function() {return slots().list();};
  P.characterIdentityV13=function(idOrCharacter) {
    const character=typeof idOrCharacter==='string'?CHAR.get(idOrCharacter):idOrCharacter;
    return character?identityFor(character):null;
  };
  P.canonicalUniverseV13=function(value) {return canonicalUniverse(value);};

  const newStateV13=P.newState;
  P.newState=function(seed){return this.ensureV13(newStateV13.call(this,seed));};
  const loadStateV13=P.loadState;
  P.loadState=function(){const state=loadStateV13.call(this);return state?this.ensureV13(state):state;};
  const saveV13=P.save;
  P.save=function() {
    if (this.state) this.ensureV13();
    const result=saveV13.call(this);
    if (!this.state||(!this.state.characterReady&&!this.state.spin)) return result;
    try {
      const hero=this.state.customCharacter?.codename||this.baseCharacter?.()?.name||'Unnamed hero';
      const score=typeof this.score==='function'?this.score():0;
      slots().save(this.activeSlotV13(),this.state,{hero,score});
    } catch {}
    return result;
  };

  P.loadSlotV13=function(slot) {
    const snapshot=slots().load(slot);
    if (!snapshot) return false;
    this.setActiveSlotV13(slot);
    this.state=this.ensureV13(snapshot.state);
    this.selectedStrategy='clash';
    if (!Array.isArray(this.state.slices)||!this.state.slices.length) this.generateWheel();
    saveV13.call(this);
    this.renderAll();
    return true;
  };

  P.clearSlotV13=function(slot) {
    slots().clear(slot);
    return this.runSlotsV13();
  };

  P.applyPresetV13=function(presetId,campaignLimit=30) {
    const preset=experience.preset(presetId);
    if (!preset) return false;
    const set=(id,value)=>{const element=document.getElementById(id);if(element)element.value=value;};
    set('v6-cc-name',preset.name);set('v6-cc-codename',preset.codename);set('v6-cc-homeworld',preset.homeworld);
    set('v6-cc-archetype',preset.archetype);set('v6-cc-accent',preset.accent);set('v6-origin-tone',preset.tone);
    set('v6-origin-flaw',preset.flaw);set('v6-origin-story',preset.story);set('v6-campaign-limit',String(campaignLimit));
    this.state.v11Experience.quickStartPreset=presetId;
    this.state.v11Experience.firstRunStep='spin';
    this.saveCharacterCreator();
    this.state.onboarding.step=Math.max(1,this.state.onboarding.step);
    this.save();
    this.renderAll();
    return true;
  };

  P.startTimelineV13=function(config={}) {
    const seed=Number.isFinite(Number(config.seed))?Number(config.seed)>>>0:this.makeSeed();
    const slot=this.setActiveSlotV13(config.slot||this.activeSlotV13());
    try{slots().clear(slot);}catch{}
    const previousPrefs=this.state?.v13?.preferences?JSON.parse(JSON.stringify(this.state.v13.preferences)):null;
    const previousAccess=this.state?.v11Experience?.accessibility?JSON.parse(JSON.stringify(this.state.v11Experience.accessibility)):null;
    try{storage().removeItem(SAVE_KEY);}catch{}
    this.state=this.newState(seed);
    this.state.slices=[];
    this.state.challengeMode=String(config.challenge||'standard');
    this.state.balanceMode=String(config.balance||'chaos');
    this.state.difficulty=String(config.difficulty||'normal');
    this.state.campaignLimit=Math.max(10,Math.min(100,Math.round(Number(config.campaignLimit||30)/10)*10));
    this.state.runModifiers=[...new Set((config.modifiers||[]).map(String))];
    this.state.v13.runContext={kind:String(config.kind||'normal'),id:String(config.id||''),slot,challengeCode:''};
    if (previousPrefs) this.state.v13.preferences={...this.state.v13.preferences,...previousPrefs};
    if (previousAccess) this.state.v11Experience.accessibility={...this.state.v11Experience.accessibility,...previousAccess};
    this.selectedStrategy='clash';
    const runConfig={seed,preset:String(config.preset||''),challenge:this.state.challengeMode,balance:this.state.balanceMode,modifiers:this.state.runModifiers};
    this.state.v13.runContext.challengeCode=encodeChallengeCode(runConfig);
    this.save();
    if (config.custom) {
      const campaign=document.getElementById('v6-campaign-limit');if(campaign)campaign.value=String(this.state.campaignLimit);
      this._customCreatorV11=true;
      this.openV6Modal('character');
      this.updateCreatorModeV11?.();
      return {slot,custom:true,config:runConfig};
    }
    this.applyPresetV13(config.preset||'vanguard',this.state.campaignLimit);
    return {slot,custom:false,config:runConfig};
  };

  P.dailyChallengeV13=function(date=new Date()) {return dailyChallenge(date);};
  P.startDailyChallengeV13=function(date=new Date(),slot=this.activeSlotV13()) {
    const daily=dailyChallenge(date);
    return this.startTimelineV13({...daily,slot,kind:'daily',campaignLimit:30,difficulty:'heroic'});
  };

  P.challengeCodeV13=function() {
    const context=this.state?.v13?.runContext;
    if (context?.challengeCode) return context.challengeCode;
    return encodeChallengeCode({seed:this.state?.seed,preset:this.state?.v11Experience?.quickStartPreset,challenge:this.state?.challengeMode,balance:this.state?.balanceMode,modifiers:this.state?.runModifiers});
  };

  P.startChallengeCodeV13=function(code,slot=this.activeSlotV13()) {
    const decoded=decodeChallengeCode(code);
    if (!decoded.ok) return decoded;
    return {ok:true,result:this.startTimelineV13({...decoded.config,slot,kind:'challenge',id:code,campaignLimit:30})};
  };

  const renderAllV13=P.renderAll;
  P.renderAll=function() {
    this.ensureV13();
    const result=renderAllV13.call(this);
    document.documentElement.dataset.v13='director-cut';
    document.documentElement.dataset.v13Slot=String(this.activeSlotV13());
    document.documentElement.dataset.v13UniverseCount=String(new Set(DATA.characters.map(character=>canonicalUniverse(character.universe))).size);
    return result;
  };
})();
