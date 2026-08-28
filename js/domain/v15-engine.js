'use strict';

(function attachV15Engine(root){
  const V15_SCHEMA_VERSION=15;
  const HERO_FILE_SCHEMA='multiverse-wheel-hero';
  const HERO_FILE_VERSION=1;
  const MAX_HERO_LEVEL=20;
  const EXTRA_SKILLS={
    medicine:{label:'Medicine',ability:'insight'},engineering:{label:'Engineering',ability:'intellect'},history:{label:'History',ability:'intellect'},
    intimidation:{label:'Intimidation',ability:'presence'},performance:{label:'Performance',ability:'presence'},piloting:{label:'Piloting',ability:'agility'}
  };
  const EXTRA_LINEAGES={
    metahuman:{label:'Metahuman Legacy',summary:'Power is part inheritance, part responsibility.',bonuses:{power:1,presence:1},trait:'Living Legacy — the first heroic risk each chapter gains +1.'},
    elemental:{label:'Elemental Vessel',summary:'A mortal life bound to a force of nature.',bonuses:{endurance:1,insight:1},trait:'Living Element — choose the visual form of your element whenever it manifests.'},
    spirit:{label:'Spirit-Touched',summary:'One foot remains in a hidden world of names and promises.',bonuses:{insight:2},trait:'Veil Sense — supernatural motives are never completely concealed.'},
    cosmic:{label:'Cosmic Foundling',summary:'A small piece of a much larger universe learned to be a person.',bonuses:{endurance:1,presence:1},trait:'Starlit Core — recover extra Energy after a selfless choice.'},
    bonded:{label:'Bonded Host',summary:'Two minds or organisms share one heroic identity.',bonuses:{power:1,intellect:1},trait:'Second Voice — once per chapter ask the table for a second reading of a clue.'},
    hybrid:{label:'Hybrid Heir',summary:'Two incompatible worlds meet in one lineage.',bonuses:{agility:1,presence:1},trait:'Between Worlds — choose which culture recognizes you first in a new reality.'}
  };
  const EXTRA_CALLINGS={
    striker:{label:'Striker',summary:'Focused offense, pressure, and decisive finishes.',saves:['power','agility'],skills:['athletics','acrobatics','intimidation','perception'],tags:['martial','speed','strength'],legacyArchetype:'athlete',statBias:{might:4,speed:3,skill:2}},
    guardian:{label:'Guardian',summary:'Interception, protection, and sacrifice.',saves:['endurance','presence'],skills:['resilience','medicine','insight','persuasion'],tags:['defense','support','leadership'],legacyArchetype:'medic',statBias:{defense:5,energy:3}},
    trickster:{label:'Trickster',summary:'Misdirection, control, and lateral solutions.',saves:['agility','presence'],skills:['stealth','deception','performance','arcana'],tags:['illusion','strategy','hax'],legacyArchetype:'performer',statBias:{skill:4,hax:4}},
    explorer:{label:'Explorer',summary:'Travel, survival, piloting, and first contact.',saves:['agility','insight'],skills:['survival','piloting','perception','technology'],tags:['survival','vehicle','adaptation'],legacyArchetype:'explorer',statBias:{speed:3,mind:3,energy:2}}
  };
  const EXTRA_BACKGROUNDS={
    academy:{label:'Hero Academy Graduate',skills:['athletics','history'],feature:'Team Drill — the first party assist each stage charges faster.'},
    wanderer:{label:'Reality Wanderer',skills:['survival','piloting'],feature:'Road Memory — name one useful detail about any new world.'},
    medic:{label:'Field Medic',skills:['medicine','insight'],feature:'Triage — recovery choices clear one additional minor condition.'},
    performer:{label:'Arena Performer',skills:['performance','acrobatics'],feature:'Read the Crowd — public challenges reveal who can be persuaded.'},
    agent:{label:'Former Agency Operative',skills:['stealth','engineering'],feature:'Old Access — once per stage identify a secure route or protocol.'},
    exile:{label:'Displaced Heir',skills:['history','intimidation'],feature:'Claim of Ashes — hostile rulers must acknowledge your challenge.'}
  };
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const normalizeId=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const hash32=value=>{let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;};
  const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
  const checksum=value=>hash32(JSON.stringify(stable(value))).toString(36).padStart(7,'0');

  // V14 deliberately exposes these dictionaries. Extending the same objects
  // keeps its validator, sheet builder, story skill checks, and UI in one model.
  Object.assign(root.MultiverseDomain?.SKILLS||{},EXTRA_SKILLS);
  Object.assign(root.MultiverseDomain?.LINEAGES||{},EXTRA_LINEAGES);
  Object.assign(root.MultiverseDomain?.CALLINGS||{},EXTRA_CALLINGS);
  Object.assign(root.MultiverseDomain?.BACKGROUNDS||{},EXTRA_BACKGROUNDS);

  class HeroProgressionEngine{
    xpForLevel(level){const target=clamp(Math.round(level),1,MAX_HERO_LEVEL);return target<=1?0:50*(target-1)*target;}
    levelForXP(xp){let level=1;while(level<MAX_HERO_LEVEL&&Number(xp)>=this.xpForLevel(level+1))level++;return level;}
    activePowerSetLimit(level){return Number(level)>=10?3:Number(level)>=5?2:1;}
    techniqueSlotLimit(level){return Number(level)>=15?6:Number(level)>=10?5:Number(level)>=6?4:Number(level)>=3?3:2;}
    unlockedTechniqueCount(level,mastery=1){return clamp(1+Math.max(1,Math.round(mastery))+Math.floor((Math.max(1,level)-1)/4),2,8);}
    formLevel(index=0,kind='source'){return kind==='global'?3:4+Math.max(0,Number(index)||0)*2;}
    ensure(state={}){
      state.v15||={};const v15=state.v15;v15.schemaVersion=V15_SCHEMA_VERSION;
      const old=v15.progression||{};
      const xp=Math.max(0,Math.round(Number(old.xp)||0)),level=this.levelForXP(xp);
      const allocations=Object.fromEntries((root.MultiverseDomain?.ABILITY_KEYS||[]).map(key=>[key,Math.max(0,Math.round(Number(old.allocations?.[key])||0))]));
      const spent=Object.values(allocations).reduce((sum,value)=>sum+value,0),earned=Math.max(0,level-1);
      v15.progression={level,xp,unspentAbilityPoints:Math.max(0,Math.min(earned-spent,Number.isFinite(old.unspentAbilityPoints)?Number(old.unspentAbilityPoints):earned-spent)),allocations,awardedIds:Array.isArray(old.awardedIds)?old.awardedIds.slice(-300):[],history:Array.isArray(old.history)?old.history.slice(-100):[]};
      v15.network={role:'offline',sessionId:'',localPlayerId:'player-1',revision:0,connected:[],...(v15.network||{})};
      return state;
    }
    summary(state){const p=this.ensure(state).v15.progression,next=p.level<MAX_HERO_LEVEL?this.xpForLevel(p.level+1):p.xp;return{...clone(p),nextLevelXP:next,currentLevelXP:this.xpForLevel(p.level),activePowerSets:this.activePowerSetLimit(p.level),techniqueSlots:this.techniqueSlotLimit(p.level)};}
    award(state,amount,reason='Encounter',awardId=''){
      const p=this.ensure(state).v15.progression,id=String(awardId||'').slice(0,120);if(id&&p.awardedIds.includes(id))return{ok:false,duplicate:true,level:p.level,xp:p.xp,levels:0};
      const before=p.level,gain=Math.max(0,Math.round(Number(amount)||0));p.xp=Math.max(0,p.xp+gain);p.level=this.levelForXP(p.xp);const levels=p.level-before;if(id){p.awardedIds.push(id);p.awardedIds=p.awardedIds.slice(-300);}if(levels)p.unspentAbilityPoints+=levels;
      p.history.unshift({type:'xp',amount:gain,reason:String(reason).slice(0,80),level:p.level,at:Date.now()});p.history=p.history.slice(0,100);return{ok:true,gain,level:p.level,levels,unspent:p.unspentAbilityPoints};
    }
    allocate(state,ability){const p=this.ensure(state).v15.progression,key=normalizeId(ability),valid=(root.MultiverseDomain?.ABILITY_KEYS||[]).includes(key);if(!valid)return{ok:false,error:'Unknown attribute.'};if(p.unspentAbilityPoints<1)return{ok:false,error:'Earn another level to gain an attribute point.'};const base=Number(state?.customCharacter?.v14?.abilities?.[key]||10),current=base+p.allocations[key];if(current>=20)return{ok:false,error:'Attributes cannot exceed 20.'};p.allocations[key]++;p.unspentAbilityPoints--;p.history.unshift({type:'attribute',ability:key,value:current+1,level:p.level,at:Date.now()});return{ok:true,ability:key,value:current+1,remaining:p.unspentAbilityPoints};}
    effectiveSheet(state){const sheet=clone(state?.customCharacter?.v14);if(!sheet)return null;const p=this.ensure(state).v15.progression,keys=root.MultiverseDomain?.ABILITY_KEYS||[];sheet.level=p.level;sheet.proficiencyBonus=2+Math.floor((p.level-1)/4);sheet.abilities={...sheet.abilities};sheet.modifiers={...sheet.modifiers};for(const key of keys){sheet.abilities[key]=Number(sheet.abilities[key]||10)+Number(p.allocations[key]||0);sheet.modifiers[key]=Math.floor((sheet.abilities[key]-10)/2);}const a=p.allocations;
      const delta={might:a.power*1.35+a.endurance*.35,defense:a.endurance*1.25+a.agility*.45,speed:a.agility*1.45+a.insight*.25,skill:a.agility*.8+a.intellect*.65,mind:a.intellect*.9+a.insight*.6,energy:a.endurance*.55+a.presence*.45+a.intellect*.35,hax:a.intellect*.45+a.insight*.4+a.presence*.25};
      sheet.derived=Object.fromEntries(Object.entries(sheet.derived||{}).map(([key,value])=>[key,Math.round(Number(value)+Number(delta[key]||0))]));sheet.initiative=sheet.modifiers.agility;sheet.armor=10+sheet.modifiers.agility+Math.max(0,sheet.modifiers.endurance);sheet.resolve=10+sheet.modifiers.insight+sheet.modifiers.presence;sheet.passivePerception=10+Number(sheet.skills?.perception?.bonus||0)+Math.floor((p.level-1)/4);return sheet;
    }
    reset(state){this.ensure(state);state.v15.progression={level:1,xp:0,unspentAbilityPoints:0,allocations:Object.fromEntries((root.MultiverseDomain?.ABILITY_KEYS||[]).map(key=>[key,0])),awardedIds:[],history:[]};return state.v15.progression;}
  }

  const HERO_FIELDS=['name','codename','homeworld','accent','lineage','calling','background','ideal','bond','flaw','story','pronouns','ageEra','identity','appearance','homeCulture','personality','drive','complication','rivalHook','signatureStyle'];
  class HeroArchiveEngine{
    sanitize(config={}){const out={};for(const field of HERO_FIELDS)out[field]=String(config[field]||'').trim().slice(0,field==='story'?3000:field==='accent'?16:240);out.abilities=Object.fromEntries((root.MultiverseDomain?.ABILITY_KEYS||[]).map(key=>[key,Math.round(Number(config.abilities?.[key]||10))]));out.proficiencies=[...new Set((config.proficiencies||[]).map(normalizeId))].slice(0,4);return out;}
    validate(config={}){const clean=this.sanitize(config),creator=new root.MultiverseDomain.CharacterCreationEngine(),verdict=creator.validate(clean);if(!clean.name||!clean.codename)verdict.errors.push('A real name and codename are required.');return{...verdict,ok:verdict.errors.length===0,config:clean};}
    safeAvatar(value){const data=String(value||'');return data.length<=750000&&/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(data)?data:'';}
    create(config={},avatarData=''){const verdict=this.validate(config);if(!verdict.ok)return verdict;const hero={...verdict.config,avatarData:this.safeAvatar(avatarData)},payload={schema:HERO_FILE_SCHEMA,version:HERO_FILE_VERSION,rules:{startingLevel:1,importsProgression:false,pointBuy:27},hero};return{ok:true,file:{...payload,checksum:checksum(payload)}};}
    parse(input){let value;try{value=typeof input==='string'?JSON.parse(input):clone(input);}catch{return{ok:false,errors:['The hero file is not valid JSON.']};}if(value?.schema!==HERO_FILE_SCHEMA||Number(value?.version)!==HERO_FILE_VERSION)return{ok:false,errors:['This is not a supported Multiverse Wheel hero file.']};const expected=value.checksum,base=clone(value);delete base.checksum;if(expected!==checksum(base))return{ok:false,errors:['The hero file checksum does not match its contents.']};const verdict=this.validate(value.hero||{});if(!verdict.ok)return verdict;return{ok:true,config:verdict.config,avatarData:this.safeAvatar(value.hero?.avatarData),startingLevel:1};}
  }

  class NetworkProtocolEngine{
    constructor(){this.protocol='mw-table-v1';}
    encode(value){const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
    decode(code){try{const raw=String(code||'').trim().replace(/-/g,'+').replace(/_/g,'/'),pad=raw+'='.repeat((4-raw.length%4)%4),binary=atob(pad),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0)),value=JSON.parse(new TextDecoder().decode(bytes));if(value?.protocol!==this.protocol)return{ok:false,error:'This code belongs to a different table protocol.'};return{ok:true,value};}catch{return{ok:false,error:'The table code is incomplete or invalid.'};}}
    envelope(type,payload={}){return{protocol:this.protocol,type:String(type),id:`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`,sentAt:Date.now(),payload:clone(payload)};}
    sessionId(){return`table-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}
    validMessage(value){return!!(value&&value.protocol===this.protocol&&typeof value.type==='string'&&value.payload&&typeof value.payload==='object');}
  }

  function migrateV15(state={}){return new HeroProgressionEngine().ensure(state);}
  const api={V15_SCHEMA_VERSION,HERO_FILE_SCHEMA,HERO_FILE_VERSION,MAX_HERO_LEVEL,EXTRA_SKILLS,EXTRA_LINEAGES,EXTRA_CALLINGS,EXTRA_BACKGROUNDS,HeroProgressionEngine,HeroArchiveEngine,NetworkProtocolEngine,migrateV15,checksum};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
