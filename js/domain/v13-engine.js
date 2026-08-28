'use strict';

(function attachV13Engine(root) {
  const V13_SCHEMA_VERSION=13;
  const CHALLENGE_CODE_PREFIX='MW13';
  const DEFAULT_SLOT_COUNT=3;
  const FATE_COSTS=Object.freeze({lock:1,favor:1,ban:2,reroll:2,nudge:2});
  const CONTROL_ACTIONS=new Set(['lock','favor','ban']);
  const STAT_KEYS=['might','defense','speed','skill','mind','energy','hax'];

  const normalize=value=>String(value||'')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’‘]/g,"'")
    .replace(/&/g,' and ')
    .replace(/[^a-zA-Z0-9]+/g,' ')
    .trim()
    .toLowerCase();

  const UNIVERSE_ALIAS_ENTRIES=[
    ['Marvel',['Marvel Comics']],
    ['DC',['DC Comics','Watchmen / DC']],
    ['Naruto / Boruto',['Naruto','Naruto & Boruto','Naruto__Boruto','Naruto___Boruto']],
    ['Sonic the Hedgehog',['Sonic']],
    ['Avatar: The Last Airbender / Korra',['Avatar']],
    ['Fate / Nasuverse',['Fate']],
    ["JoJo's Bizarre Adventure",['JoJo’s Bizarre Adventure']],
    ['Mega Man',['Mega Man X']],
    ['TMNT',['Teenage Mutant Ninja Turtles']],
    ['The Lord of the Rings / Tolkien',['The Lord of the Rings']],
    ['Image / Indie Comics',['Image Comics']],
    ['inFAMOUS / Prototype / Control',['inFAMOUS','Prototype']],
    ['She-Ra and the Princesses of Power',['Princesses of Power','She-Ra']],
    ['Final Fantasy',['Final Fantasy VII','Final Fantasy XIII','Final Fantasy XV']],
    ['Metal Gear',['Metal Gear Rising']]
  ];
  const UNIVERSE_ALIASES=new Map();
  for (const [canonical,aliases] of UNIVERSE_ALIAS_ENTRIES) {
    UNIVERSE_ALIASES.set(normalize(canonical),canonical);
    for (const alias of aliases) UNIVERSE_ALIASES.set(normalize(alias),canonical);
  }

  const ROLE_DEFINITIONS={
    support:{label:'Guardian',passive:{name:'Guardian Link',description:'Assists and recovery generate additional combo charge.',effect:'assist_charge'},fallbackWeakness:'isolation'},
    controller:{label:'Reality Controller',passive:{name:'Control Window',description:'Control effects create longer exploit windows.',effect:'exploit_duration'},fallbackWeakness:'nullification'},
    speedster:{label:'Speed Striker',passive:{name:'First Motion',description:'The first technique each battle gains accuracy and combo charge.',effect:'opening_accuracy'},fallbackWeakness:'prediction'},
    tactician:{label:'Tactician',passive:{name:'Prepared Counter',description:'Revealed intents improve counter accuracy.',effect:'counter_accuracy'},fallbackWeakness:'overwhelm'},
    mystic:{label:'Mystic',passive:{name:'Arcane Resonance',description:'Status and hax techniques spend less Energy after a successful counter.',effect:'mystic_efficiency'},fallbackWeakness:'nullification'},
    weaponmaster:{label:'Weapon Master',passive:{name:'Precision Chain',description:'Alternating weapon techniques increases critical chance.',effect:'precision_chain'},fallbackWeakness:'disarm'},
    bruiser:{label:'Vanguard',passive:{name:'Unbroken Advance',description:'Taking damage builds combo charge and resistance.',effect:'damage_charge'},fallbackWeakness:'control'},
    balanced:{label:'Adaptive',passive:{name:'Adaptive Rhythm',description:'Using different technique tags improves the next action.',effect:'tag_variety'},fallbackWeakness:'specialization'}
  };
  const MASTERY_BRANCHES={
    2:[
      {id:'amplify',label:'Amplify',description:'Increase this source’s tactical impact and exploit pressure.',effect:{odds:.018}},
      {id:'discipline',label:'Discipline',description:'Reduce strain by expanding the hero’s usable Energy reserve.',effect:{energy:.05}}
    ],
    4:[
      {id:'signature',label:'Signature',description:'Commit to peak output and increase technique damage.',effect:{damage:.08}},
      {id:'resilience',label:'Resilience',description:'Integrate the source safely and expand maximum Health.',effect:{health:.05}}
    ]
  };

  const WEAKNESS_TERMS={
    nullification:['nullif','anti-magic','power removal','power loss','severance'],
    sealing:['seal','contain','binding','imprison'],
    soul:['soul','spirit','source destruction'],
    fire:['heat','fire','burn'],
    cold:['cold','ice','freez'],
    water:['water','immersion'],
    electricity:['electric','electromagnetic','emp'],
    control:['mind control','psychic','emotion'],
    exhaustion:['exhaust','depletion','stamina','mana supply','energy timer'],
    disarm:['disarm','weapon loss','artifact separation','driver disruption'],
    prediction:['precognition','prediction','faster than'],
    overwhelm:['overwhelm','superior','stronger','higher-order'],
    isolation:['isolation','alone','separation'],
    specialization:['specialized counter','specific counter']
  };

  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const idPart=value=>normalize(value).replace(/\s+/g,'-').slice(0,48)||'ability';
  const hash32=value=>{
    let hash=2166136261;
    for (const char of String(value)) {hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return hash>>>0;
  };
  const checksum=value=>hash32(value).toString(36).padStart(7,'0').slice(-7);
  const encodeBase64=value=>{
    if (typeof Buffer!=='undefined') return Buffer.from(value,'utf8').toString('base64url');
    const bytes=new TextEncoder().encode(value);
    let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  const decodeBase64=value=>{
    if (typeof Buffer!=='undefined') return Buffer.from(value,'base64url').toString('utf8');
    const padded=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');
    const binary=atob(padded),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  function canonicalUniverse(value) {
    const source=String(value||'Unknown').trim()||'Unknown';
    return UNIVERSE_ALIASES.get(normalize(source))||source;
  }

  function canonicalUniverseGroups(characters=[]) {
    const groups=new Map();
    for (const character of characters) {
      const canonical=canonicalUniverse(character?.universe);
      const group=groups.get(canonical)||{universe:canonical,total:0,ids:[],sourceLabels:new Set()};
      group.total++;
      if (character?.id) group.ids.push(character.id);
      if (character?.universe) group.sourceLabels.add(character.universe);
      groups.set(canonical,group);
    }
    return [...groups.values()].map(group=>({...group,sourceLabels:[...group.sourceLabels].sort()})).sort((a,b)=>b.total-a.total||a.universe.localeCompare(b.universe));
  }

  function inferRole(character={}) {
    if (ROLE_DEFINITIONS[character.role]) return character.role;
    const tags=new Set((character.tags||[]).map(normalize));
    if (['healing','resurrection','shield','support'].some(tag=>tags.has(tag))) return 'support';
    if (['reality','time','psychic','control','sealing'].some(tag=>tags.has(tag))) return 'controller';
    if (tags.has('speed')||tags.has('teleport')) return 'speedster';
    if (['genius','strategy','tech','detective'].some(tag=>tags.has(tag))) return 'tactician';
    if (['magic','hax','soul','cosmic'].some(tag=>tags.has(tag))) return 'mystic';
    if (['weapon','martial','skill'].some(tag=>tags.has(tag))) return 'weaponmaster';
    if (['strength','invulnerability','regeneration'].some(tag=>tags.has(tag))) return 'bruiser';
    return 'balanced';
  }

  function structuredWeaknesses(character={},role=inferRole(character)) {
    const text=normalize(character.weakness);
    const tags=[];
    for (const [tag,terms] of Object.entries(WEAKNESS_TERMS)) if (terms.some(term=>text.includes(term))) tags.push(tag);
    if (!tags.length) tags.push(ROLE_DEFINITIONS[role]?.fallbackWeakness||'specialization');
    return [...new Set(tags)].slice(0,4);
  }

  function identityFor(character={}) {
    const role=inferRole(character),definition=ROLE_DEFINITIONS[role]||ROLE_DEFINITIONS.balanced;
    const powers=(character.powers||[]).filter(Boolean);
    const signature=String(character.signature||powers.at?.(-1)||`${character.name||'Unknown'} Signature`);
    const candidates=[powers[0],powers[Math.floor(powers.length/2)],signature,powers.at?.(-1)].filter(Boolean);
    const moves=[...new Set(candidates)].slice(0,4).map((name,index)=>({
      id:`${character.id||idPart(character.name)}-${idPart(name)}-${index+1}`,
      name:String(name),
      type:index===2||name===signature?'signature':'technique',
      energy:8+index*4,
      cooldown:index>=2?2:index===1?1:0,
      tags:[...(character.tags||[])].slice(index,index+3)
    }));
    while (moves.length<3) {
      const index=moves.length;
      moves.push({id:`${character.id||idPart(character.name)}-adaptive-${index+1}`,name:`${definition.label} Technique ${index+1}`,type:'technique',energy:8+index*4,cooldown:index?1:0,tags:[...(character.tags||[])].slice(0,2)});
    }
    const authoredMoves=Array.isArray(character.moves)&&character.moves.length?character.moves.map((move,index)=>typeof move==='string'?{id:`${character.id||idPart(character.name)}-${idPart(move)}-${index+1}`,name:move,type:'technique',energy:8+index*4,cooldown:index>=2?2:0,tags:[...(character.tags||[])].slice(0,3)}:{...move}):null;
    return {
      characterId:String(character.id||''),
      canonicalUniverse:canonicalUniverse(character.universe),
      sourceUniverse:String(character.universe||'Unknown'),
      role,
      roleLabel:definition.label,
      passive:character.passive&&typeof character.passive==='object'?clone(character.passive):{...definition.passive},
      ultimate:character.ultimate&&typeof character.ultimate==='object'?clone(character.ultimate):{name:signature,description:`${character.name||'This character'} commits their complete signature power.`,effect:'signature_burst',energy:30,cooldown:4},
      weaknessTags:Array.isArray(character.weaknessTags)&&character.weaknessTags.length?[...new Set(character.weaknessTags.map(normalize))].slice(0,4):structuredWeaknesses(character,role),
      moves:authoredMoves||moves,
      generated:{role:!ROLE_DEFINITIONS[character.role],passive:!character.passive,ultimate:!character.ultimate,moves:!authoredMoves,weaknessTags:!Array.isArray(character.weaknessTags)||!character.weaknessTags.length}
    };
  }

  function localDateKey(date=new Date()) {
    const pad=value=>String(value).padStart(2,'0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  }

  function dailyChallenge(dateOrKey=new Date()) {
    const dateKey=typeof dateOrKey==='string'?dateOrKey:localDateKey(dateOrKey);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new TypeError('Daily challenges require YYYY-MM-DD.');
    const seed=hash32(`multiverse-wheel-daily:${dateKey}`);
    const presets=['vanguard','striker','tactician','support'];
    const challenges=['standard','iron','nemesis','crisis'];
    const balances=['roguelite','chaos','canon'];
    return {id:`daily-${dateKey}`,dateKey,seed,preset:presets[seed%presets.length],challenge:challenges[(seed>>>4)%challenges.length],balance:balances[(seed>>>8)%balances.length],modifiers:['daily','fixed-seed']};
  }

  function encodeChallengeCode(config={}) {
    const payload={
      v:V13_SCHEMA_VERSION,
      s:Number(config.seed)>>>0,
      p:String(config.preset||''),
      c:String(config.challenge||'standard'),
      b:String(config.balance||'chaos'),
      m:[...new Set((config.modifiers||[]).map(String))].sort()
    };
    const json=JSON.stringify(payload),body=encodeBase64(json);
    return `${CHALLENGE_CODE_PREFIX}-${body}-${checksum(json)}`;
  }

  function decodeChallengeCode(code='') {
    const match=String(code).trim().match(/^MW13-([A-Za-z0-9_-]+)-([a-z0-9]{7})$/i);
    if (!match) return {ok:false,error:'Challenge code format is invalid.'};
    try {
      const json=decodeBase64(match[1]);
      if (checksum(json)!==match[2].toLowerCase()) return {ok:false,error:'Challenge code checksum does not match.'};
      const payload=JSON.parse(json);
      if (payload.v!==V13_SCHEMA_VERSION||!Number.isFinite(Number(payload.s))||!Array.isArray(payload.m)) return {ok:false,error:'Challenge code payload is unsupported.'};
      return {ok:true,config:{seed:Number(payload.s)>>>0,preset:String(payload.p||''),challenge:String(payload.c||'standard'),balance:String(payload.b||'chaos'),modifiers:payload.m.map(String)}};
    } catch {return {ok:false,error:'Challenge code could not be decoded.'};}
  }

  class V13StateEngine {
    migrate(state={}) {
      if (!state||typeof state!=='object') throw new TypeError('A state object is required.');
      state.v13Version=V13_SCHEMA_VERSION;
      state.schemaVersion=V13_SCHEMA_VERSION;
      state.v13||={};
      const v13=state.v13;
      v13.fate||={};
      v13.fate.max=clamp(v13.fate.max||5,1,9);
      v13.fate.current=clamp(v13.fate.current??3,0,v13.fate.max);
      v13.fate.spent=Math.max(0,Number(v13.fate.spent||0));
      v13.fate.earned=Math.max(0,Number(v13.fate.earned||0));
      v13.fate.controls={lockedSliceId:null,bannedType:null,favoredType:null,...(v13.fate.controls||{})};
      v13.fate.rerolledSpin=v13.fate.rerolledSpin===null||v13.fate.rerolledSpin===undefined?null:Number.isFinite(Number(v13.fate.rerolledSpin))?Number(v13.fate.rerolledSpin):null;
      v13.fate.alteredSpin=v13.fate.alteredSpin===null||v13.fate.alteredSpin===undefined?null:Number.isFinite(Number(v13.fate.alteredSpin))?Number(v13.fate.alteredSpin):null;
      v13.fate.history=Array.isArray(v13.fate.history)?v13.fate.history:[];
      v13.loadoutPresets=Array.isArray(v13.loadoutPresets)?v13.loadoutPresets:[];
      v13.pinnedSources=Array.isArray(v13.pinnedSources)?[...new Set(v13.pinnedSources.map(String))]:[];
      v13.masteryBranches=v13.masteryBranches&&typeof v13.masteryBranches==='object'?v13.masteryBranches:{};
      v13.relationshipArcs=v13.relationshipArcs&&typeof v13.relationshipArcs==='object'?v13.relationshipArcs:{};
      v13.callbacks=Array.isArray(v13.callbacks)?v13.callbacks:[];
      v13.highlights=Array.isArray(v13.highlights)?v13.highlights:[];
      v13.eventHistory=Array.isArray(v13.eventHistory)?v13.eventHistory:[];
      v13.storyStats={hero:0,villain:0,rescues:0,worldsProtected:0,callbacksResolved:0,loyaltyEarned:0,...(v13.storyStats||{})};
      v13.rivalResolution=v13.rivalResolution&&typeof v13.rivalResolution==='object'?v13.rivalResolution:null;
      v13.dailyRecords=v13.dailyRecords&&typeof v13.dailyRecords==='object'?v13.dailyRecords:{};
      v13.legacy=v13.legacy&&typeof v13.legacy==='object'?v13.legacy:null;
      v13.runContext={kind:'normal',id:'',...v13.runContext};
      v13.pendingUndo=v13.pendingUndo&&typeof v13.pendingUndo==='object'?v13.pendingUndo:null;
      v13.ending=v13.ending&&typeof v13.ending==='object'?v13.ending:null;
      v13.preferences={colorVision:'default',screenReaderWheel:true,soundVolume:1,musicVolume:.7,...(v13.preferences||{})};
      v13.preferences.soundVolume=clamp(v13.preferences.soundVolume,0,1);
      v13.preferences.musicVolume=clamp(v13.preferences.musicVolume,0,1);
      return state;
    }

    fateCost(action) {return FATE_COSTS[action]??Infinity;}

    canUseFate(state,action,context={}) {
      const migrated=this.migrate(state),fate=migrated.v13.fate,cost=this.fateCost(action);
      if (!Number.isFinite(cost)) return {ok:false,reason:'Unknown Fate action.'};
      if (fate.current<cost) return {ok:false,reason:`Need ${cost} Fate.`};
      if (context.firstPower||context.boss||context.scripted||context.daily) return {ok:false,reason:context.daily?'Daily Challenge wheels are fixed and cannot be altered by Fate.':'Fate cannot alter protected route beats.'};
      if (['reroll','nudge'].includes(action)&&fate.alteredSpin===Number(context.spin)) return {ok:false,reason:'Fate already altered this result.'};
      if (action==='nudge'&&!context.hasPending) return {ok:false,reason:'Nudge requires a landed result.'};
      if (CONTROL_ACTIONS.has(action)&&context.hasPending) return {ok:false,reason:'Set wheel controls before spinning.'};
      return {ok:true,cost};
    }

    spendFate(state,action,payload={},context={}) {
      const verdict=this.canUseFate(state,action,context);
      if (!verdict.ok) return verdict;
      const fate=state.v13.fate;
      fate.current-=verdict.cost;fate.spent+=verdict.cost;
      if (action==='lock') fate.controls.lockedSliceId=String(payload.sliceId||'')||null;
      if (action==='ban') fate.controls.bannedType=String(payload.type||'')||null;
      if (action==='favor') fate.controls.favoredType=String(payload.type||'')||null;
      if (action==='reroll') fate.rerolledSpin=Number(context.spin);
      if (action==='reroll'||action==='nudge') fate.alteredSpin=Number(context.spin);
      fate.history.unshift({action,cost:verdict.cost,spin:Number(context.spin||0),payload:clone(payload)});
      fate.history=fate.history.slice(0,60);
      return {ok:true,cost:verdict.cost,current:fate.current};
    }

    earnFate(state,amount=1,reason='route',spin=0) {
      const fate=this.migrate(state).v13.fate,gain=Math.max(0,Math.floor(Number(amount)||0)),before=fate.current;
      fate.current=Math.min(fate.max,fate.current+gain);
      const earned=fate.current-before;
      fate.earned+=earned;
      if (earned) {fate.history.unshift({action:'earn',amount:earned,reason:String(reason),spin:Number(spin||0)});fate.history=fate.history.slice(0,60);}
      return earned;
    }

    clearWheelControls(state) {
      const controls=this.migrate(state).v13.fate.controls;
      controls.lockedSliceId=null;controls.bannedType=null;controls.favoredType=null;
      return controls;
    }
  }

  class BuildProgressionEngine {
    buildIdentity(characters=[]) {
      if (!characters.length) return {id:'unformed',label:'Unformed Build',role:'balanced',roleLabel:'Adaptive',topTags:[],description:'Acquire and equip a power source to form a build identity.'};
      const identities=characters.map(identityFor),roleCounts=new Map(),tagCounts=new Map();
      for (const identity of identities) roleCounts.set(identity.role,(roleCounts.get(identity.role)||0)+1);
      for (const character of characters) for (const tag of new Set(character.tags||[])) tagCounts.set(tag,(tagCounts.get(tag)||0)+1);
      const role=[...roleCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||'balanced';
      const topTags=[...tagCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,2).map(entry=>entry[0]);
      const prefix=topTags[0]?String(topTags[0]).replace(/\b\w/g,char=>char.toUpperCase()):'Adaptive';
      const roleLabel=ROLE_DEFINITIONS[role]?.label||'Adaptive';
      return {id:`${idPart(prefix)}-${role}`,label:`${prefix} ${roleLabel}`,role,roleLabel,topTags,description:`${characters.length} active source${characters.length===1?'':'s'} centered on ${topTags.map(tag=>String(tag).replace(/_/g,' ')).join(' and ')||'adaptation'}.`};
    }

    masteryOptions(character,level) {
      return (MASTERY_BRANCHES[Number(level)]||[]).map(option=>({...option,effect:{...option.effect},characterId:character?.id||''}));
    }

    chooseMastery(state,character,level,optionId) {
      if (!state?.v13) throw new TypeError('V13 state is required.');
      const required=Number(level),kit=(state.kits||[]).find(item=>item.id===character?.id);
      if (!kit||Number(kit.mastery||1)<required) return {ok:false,error:`Mastery ${required} is required.`};
      const options=this.masteryOptions(character,required),choice=options.find(option=>option.id===optionId);
      if (!choice) return {ok:false,error:'Mastery branch is invalid.'};
      state.v13.masteryBranches[character.id]||={};
      if (state.v13.masteryBranches[character.id][required]) return {ok:false,error:'That mastery branch is already chosen.'};
      state.v13.masteryBranches[character.id][required]=choice.id;
      return {ok:true,choice};
    }

    branchEffects(state,activeIds=[]) {
      const active=new Set(activeIds),effects={odds:0,energy:0,damage:0,health:0};
      for (const [characterId,levels] of Object.entries(state?.v13?.masteryBranches||{})) {
        if (!active.has(characterId)) continue;
        for (const [level,choiceId] of Object.entries(levels||{})) {
          const choice=(MASTERY_BRANCHES[Number(level)]||[]).find(option=>option.id===choiceId);
          if (choice) for (const [key,value] of Object.entries(choice.effect)) effects[key]+=Number(value||0);
        }
      }
      return effects;
    }

    createPreset(state,name,id=`preset-${Date.now().toString(36)}`) {
      return {id,name:String(name||'Loadout').trim().slice(0,32)||'Loadout',activePowerSets:[...(state.activePowerSets||[])],abilityLoadout:[...(state.abilityLoadout||[])],activeForm:state.activeForm||null,equipment:clone(state.equipment||{}),createdAt:Date.now()};
    }
  }

  class CombatExperienceEngine {
    ensure(combat={}) {
      combat.v13||={};
      const state=combat.v13;
      state.assistMax=Math.max(50,Number(state.assistMax||100));
      state.assist=clamp(state.assist||0,0,state.assistMax);
      state.assistRound=Number(state.assistRound||0);
      state.exploit=state.exploit&&typeof state.exploit==='object'?state.exploit:null;
      state.bossRule=state.bossRule&&typeof state.bossRule==='object'?state.bossRule:null;
      state.report=state.report&&typeof state.report==='object'?state.report:{rounds:0,actions:[],damageDealt:0,damageTaken:0,healing:0,energySpent:0,assists:0,counters:0,criticals:0,pivotal:[]};
      state.report.energySpent=Math.max(0,Number(state.report.energySpent||0));
      state.report.actions=Array.isArray(state.report.actions)?state.report.actions:[];
      state.report.pivotal=Array.isArray(state.report.pivotal)?state.report.pivotal:[];
      return state;
    }

    quickResolvePreview({type='battle',winChance=0,heroRating=0,enemyRating=0,difficulty='normal'}={}) {
      const chance=clamp(winChance,0,1),gap=Number(heroRating)-Number(enemyRating),allowedDifficulty=['story','normal','heroic'].includes(difficulty);
      const eligible=type==='battle'&&allowedDifficulty&&chance>=.76&&gap>=-4;
      const pressure=clamp((1-chance)*.65+Math.max(0,-gap)*.006,.05,.42);
      return {eligible,chance,damageMin:Math.max(1,Math.round(pressure*30)),damageMax:Math.max(4,Math.round(pressure*75)),reward:'Full victory choice',reason:eligible?'The matchup is stable enough to simulate instantly.':type!=='battle'?'Boss and special battles require manual play.':!allowedDifficulty?'This difficulty requires manual combat.':'Raise the best strategy chance to 76% or improve the build matchup.'};
    }

    charge(combat,action,details={}) {
      const state=this.ensure(combat),values={attack:details.landed?14:6,counter:details.succeeded?28:12,guard:10,support:24,tag:16,taken:Math.min(18,Math.round(Number(details.damage||0)*.18))};
      const amount=Math.max(0,Number(values[action]||0));state.assist=clamp(state.assist+amount,0,state.assistMax);return amount;
    }

    assistFor(character={},loyalty=50) {
      const identity=identityFor(character),scale=.8+clamp(loyalty,0,100)/250;
      const effects={
        support:{kind:'heal',amount:.16*scale,label:'Recovery Link'},controller:{kind:'expose',amount:.12*scale,label:'Exploit Opening'},speedster:{kind:'damage',amount:.11*scale,label:'Blitz Assist'},tactician:{kind:'intel',amount:2,label:'Tactical Read'},mystic:{kind:'seal',amount:1,label:'Arcane Bind'},weaponmaster:{kind:'damage',amount:.13*scale,label:'Precision Assist'},bruiser:{kind:'shield',amount:2,label:'Vanguard Cover'},balanced:{kind:'energy',amount:.18*scale,label:'Adaptive Relay'}
      };
      return {characterId:character.id,name:character.name,role:identity.role,cost:50,loyalty:clamp(loyalty,0,100),...effects[identity.role]};
    }

    spendAssist(combat,cost=50,round=1) {
      const state=this.ensure(combat);
      if (state.assist<cost) return {ok:false,error:`Need ${cost} assist charge.`};
      if (state.assistRound===Number(round)) return {ok:false,error:'An assist already acted this round.'};
      state.assist-=cost;state.assistRound=Number(round);state.report.assists++;return {ok:true,remaining:state.assist};
    }

    exploit(character={},techniqueTags=[]) {
      const weaknesses=new Set(identityFor(character).weaknessTags),tags=new Set((techniqueTags||[]).map(normalize));
      const bridges={nullification:['nullification','tech','magic'],sealing:['sealing','magic','soul'],soul:['soul','psychic','magic'],fire:['fire','energy'],cold:['ice','cold'],water:['water','ice'],electricity:['electricity','tech'],control:['psychic','control','willpower'],exhaustion:['absorption','drain','outlast'],disarm:['weapon','tech','strategy'],prediction:['precognition','time','strategy'],overwhelm:['strength','energy','cosmic'],isolation:['summon','teamwork','psychic'],specialization:['adaptation','strategy','reality']};
      const matched=[];
      for (const weakness of weaknesses) if ((bridges[weakness]||[weakness]).some(tag=>tags.has(tag))) matched.push(weakness);
      return {matched,active:matched.length>0,damageBonus:Math.min(.3,matched.length*.12),duration:matched.length?2:0};
    }

    bossRule(character={},phase=1,seed=0) {
      const tags=new Set(character.tags||[]),rules=[];
      if (['reality','time','hax','magic'].some(tag=>tags.has(tag))) rules.push({id:'reality-lock',name:'Reality Lock',description:'Every third round attempts to seal the currently selected power.',counter:'Use Counter or a nullification/strategy technique.',counterTags:['nullification','strategy','time']});
      if (['adaptation','genius','strategy','precognition'].some(tag=>tags.has(tag))) rules.push({id:'adaptive-mirror',name:'Adaptive Mirror',description:'Repeating the same technique grants the boss a Barrier.',counter:'Alternate techniques and strategy tags.',counterTags:['chaos','adaptation','speed']});
      if (['regeneration','healing','immortality','absorption'].some(tag=>tags.has(tag))) rules.push({id:'attrition-core',name:'Attrition Core',description:'The boss fortifies while no exploit window is active.',counter:'Create an exploit with sealing, soul, fire, or nullification.',counterTags:['sealing','soul','fire','nullification']});
      rules.push({id:'duel-protocol',name:'Duel Protocol',description:'Direct attacks build the party meter faster, but the boss pressure rises each round.',counter:'Spend assists before the meter caps.',counterTags:['teamwork','support','strategy']});
      const rule=rules[(hash32(`${character.id||character.name}:${phase}:${seed}`))%rules.length];
      return {...rule,phase};
    }

    adaptivePlan({difficulty='normal',round=1,playerHistory=[],fighterHpRatio=1,fighterEnergyRatio=1}={}) {
      const repeated=playerHistory.length>=2&&playerHistory[0]===playerHistory[1];
      if (['heroic','cosmic','impossible'].includes(difficulty)&&repeated) return {id:'punish-repeat',label:'Pattern Punishment',description:'The enemy recognized the repeated technique and will raise a counter barrier.',effect:'barrier'};
      if (['cosmic','impossible'].includes(difficulty)&&fighterEnergyRatio<.3) return {id:'seal-reserves',label:'Reserve Lock',description:'The enemy is targeting depleted Energy with a power seal.',effect:'seal'};
      if (difficulty==='impossible'&&fighterHpRatio<.35) return {id:'execute',label:'Execution Sequence',description:'The enemy is committing to a finisher against low Health.',effect:'execute'};
      return {id:'standard',label:`Round ${round} Plan`,description:'The enemy follows its visible character intent.',effect:'none'};
    }

    record(combat,entry={}) {
      const report=this.ensure(combat).report;
      report.rounds=Math.max(report.rounds,Number(entry.round||0));
      report.damageDealt+=Math.max(0,Number(entry.damageDealt||0));report.damageTaken+=Math.max(0,Number(entry.damageTaken||0));report.healing+=Math.max(0,Number(entry.healing||0));report.energySpent+=Math.max(0,Number(entry.energySpent||0));
      report.counters+=entry.counter?1:0;report.criticals+=Number(entry.criticals||0);
      report.actions.unshift({round:Number(entry.round||0),label:String(entry.label||'Action'),detail:String(entry.detail||'')});report.actions=report.actions.slice(0,16);
      if(entry.pivotal){report.pivotal.unshift(String(entry.pivotal));report.pivotal=report.pivotal.slice(0,5);}
      return report;
    }

    summarize(combat,party=[]) {
      const state=this.ensure(combat),report=clone(state.report),mvp=(party||[]).sort((a,b)=>Number(b.loyalty||0)-Number(a.loyalty||0))[0]||null;
      return {...report,assists:state.report.assists,mvp:mvp?{id:mvp.id,name:mvp.name,loyalty:Number(mvp.loyalty||0)}:null};
    }
  }

  const UNIVERSE_PACK_BLUEPRINTS=[
    {universe:'Marvel',locations:['Manhattan','Wakanda','the Negative Zone'],factions:['the Avengers','the X-Men','the Wakandan guard'],pressure:'an Incursion is forcing two Earths into the same orbit',relic:'a fractured Cosmic Cube'},
    {universe:'DC',locations:['Metropolis','Themyscira','the Bleed'],factions:['the Justice League','the Lantern Corps','the Titans'],pressure:'a Crisis wave is rewriting heroic identities',relic:'a damaged Mother Box'},
    {universe:'Dragon Ball',locations:['West City','Planet Namek','the World of Void'],factions:['the Z Fighters','the Galactic Patrol','the Kaioshin'],pressure:'unstable ki is opening a tournament arena across inhabited worlds',relic:'a wish-charged Dragon Ball'},
    {universe:'Naruto / Boruto',locations:['the Hidden Leaf','the Valley of the End','an Otsutsuki dimension'],factions:['the Allied Shinobi Forces','the Five Kage','the scientific ninja corps'],pressure:'a chakra tree is draining every connected timeline',relic:'a splintered space-time seal'},
    {universe:'One Piece',locations:['Water 7','Marineford','the Red Line'],factions:['the Straw Hat fleet','the Revolutionary Army','the Marines'],pressure:'a world-current is pulling every sea toward one impossible island',relic:'a poneglyph etched with a future route'},
    {universe:'Bleach',locations:['Karakura Town','Soul Society','Hueco Mundo'],factions:['the Gotei 13','the Visored','the Arrancar resistance'],pressure:'the boundary between souls and the living has collapsed',relic:'a Hogyoku echo'},
    {universe:'Star Wars',locations:['Coruscant','Mandalore','the World Between Worlds'],factions:['the Rebel network','the Jedi survivors','the Mandalorian clans'],pressure:'a hyperspace wound is making alternate wars occur at once',relic:'a vergence crystal'},
    {universe:'Sonic the Hedgehog',locations:['Green Hill','Angel Island','the Null Space'],factions:['the Restoration','the Chaotix','the island guardians'],pressure:'a Phantom Ruby storm is overwriting the planet at super speed',relic:'a fractured Chaos Emerald'},
    {universe:'Pokémon',locations:['Lumiose City','Mt. Coronet','the Distortion World'],factions:['the regional Champions','the ranger network','the research guilds'],pressure:'legendary energy is forcing habitats into a single unstable biome',relic:'an overloaded keystone'},
    {universe:'My Hero Academia',locations:['Musutafu','U.A. High','the floating evacuation grid'],factions:['the pro heroes','Class 1-A','the rescue agencies'],pressure:'a quirk-amplifying field is turning a citywide evacuation into a siege',relic:'a quirk-factor stabilizer'},
    {universe:'Avatar: The Last Airbender / Korra',locations:['Republic City','the Spirit Wilds','the Northern Water Tribe'],factions:['the new Air Nation','the White Lotus','the spirit mediators'],pressure:'spirit portals are merging eras and bending disciplines',relic:'a fragment of harmonic convergence'},
    {universe:'The Lord of the Rings / Tolkien',locations:['Minas Tirith','Moria','the edge of Valinor'],factions:['the Free Peoples','the Istari','the Dúnedain'],pressure:'a shadow without a master is gathering discarded histories',relic:'an unclaimed ring of memory'}
  ];

  function buildUniversePack(blueprint) {
    const key=idPart(blueprint.universe);
    return {id:key,universe:blueprint.universe,locations:[...blueprint.locations],factions:[...blueprint.factions],events:[
      {id:`${key}-front`,kind:'rescue',title:`Siege of ${blueprint.locations[0]}`,location:blueprint.locations[0],faction:blueprint.factions[0],prompt:`${blueprint.pressure}. ${blueprint.factions[0]} can hold the line only if you choose what matters first.`,hazard:'Cascading civilian and dimensional losses',choices:[
        {id:'evacuate',label:'Protect the evacuation',prompt:'Spend reserves to save people and stabilize the route.',cost:'8% Energy',gain:'Loyalty, rescues, and a returning civilian network',effect:{energy:-.08,hero:2,rescues:1,worldsProtected:1,loyalty:5,callback:{type:'civilian-network',delay:2}}},
        {id:'decapitate',label:'Strike the command point',prompt:'End the immediate siege while the evacuation absorbs risk.',cost:'Party loyalty -3',gain:'Weaken the stage boss and gain credits',effect:{bossPower:-.08,villain:1,loyalty:-3,credits:140,callback:{type:'faction-scrutiny',delay:3}}}
      ]},
      {id:`${key}-accord`,kind:'alliance',title:`The ${blueprint.factions[1]} Accord`,location:blueprint.locations[1],faction:blueprint.factions[1],prompt:`${blueprint.factions[1]} and ${blueprint.factions[2]} both claim authority over ${blueprint.locations[1]}. Your team must define the alliance.`,hazard:'A fractured coalition may reinforce the enemy',choices:[
        {id:'mediate',label:'Build a real coalition',prompt:'Share intelligence and let both factions retain agency.',cost:'No immediate loot',gain:'Team loyalty, mission progress, and allied reinforcements',effect:{hero:2,missions:1,teamwork:1,loyalty:4,respect:5,callback:{type:'allied-reinforcements',delay:2}}},
        {id:'leverage',label:'Leverage the conflict',prompt:'Force both factions to serve the timeline under your command.',cost:'Director heat +3 and loyalty -5',gain:'Permanent stat growth and boss intelligence',effect:{heat:3,villain:2,stats:2,intel:1,loyalty:-5,callback:{type:'fractured-alliance',delay:3}}}
      ]},
      {id:`${key}-crux`,kind:'crux',title:`The ${blueprint.relic}`,location:blueprint.locations[2],faction:blueprint.factions[2],prompt:`At ${blueprint.locations[2]}, ${blueprint.relic} can close the fracture or become part of your build. The rival demands a final answer.`,hazard:'The relic remembers every selfish choice',choices:[
        {id:'seal',label:'Seal it for this universe',prompt:'Refuse permanent power and return the relic to its world.',cost:'Forfeit the relic',gain:'Fate, loyalty, and a weakened boss',effect:{bossPower:-.12,hero:3,rescues:1,worldsProtected:1,loyalty:6,fate:1,callback:{type:'sealed-world',delay:2}}},
        {id:'claim',label:'Claim its power',prompt:'Integrate the relic despite the rival’s warning.',cost:'Empower the boss and loyalty -8',gain:'Major permanent growth',effect:{bossPower:.1,villain:3,stats:4,loyalty:-8,callback:{type:'corrupted-relic',delay:2}}}
      ]}
    ]};
  }

  const UNIVERSE_EVENT_PACKS=Object.freeze(UNIVERSE_PACK_BLUEPRINTS.map(buildUniversePack));
  const FALLBACK_EVENT_PACK=buildUniversePack({universe:'The Crossroads',locations:['the Refuge Concourse','the Accord Chamber','the Last Junction'],factions:['the displaced worlds','the routekeepers','the timeline witnesses'],pressure:'an unnamed reality is collapsing through the Crossroads',relic:'a seed of unwritten reality'});

  class NarrativeExperienceEngine {
    packFor(universe) {
      const canonical=canonicalUniverse(universe);
      return UNIVERSE_EVENT_PACKS.find(pack=>pack.universe===canonical)||{...FALLBACK_EVENT_PACK,sourceUniverse:canonical};
    }

    eventFor(universe,branchIndex=0) {
      const pack=this.packFor(universe),index=Math.max(0,Number(branchIndex)||0)%pack.events.length;
      return clone({...pack.events[index],packId:pack.id,universe:pack.sourceUniverse||pack.universe});
    }

    relationship(state,characterId,initialLoyalty=50) {
      if(!state?.v13)throw new TypeError('V13 state is required.');
      const id=String(characterId||'');if(!id)throw new TypeError('A character id is required.');
      const existing=state.v13.relationshipArcs[id]||{};
      const arc=state.v13.relationshipArcs[id]={characterId:id,loyalty:clamp(existing.loyalty??initialLoyalty,0,100),status:existing.status||'steady',assistUnlocked:Boolean(existing.assistUnlocked),departed:Boolean(existing.departed),refusals:Number(existing.refusals||0),moments:Array.isArray(existing.moments)?existing.moments:[]};
      const tier=this.loyaltyTier(arc.loyalty);arc.status=tier.id;arc.assistUnlocked=tier.assist;return arc;
    }

    loyaltyTier(value) {
      const loyalty=clamp(value,0,100);
      if(loyalty>=80)return{id:'devoted',label:'Devoted',assist:true,comboBonus:.16,willRefuse:false,willDepart:false};
      if(loyalty>=65)return{id:'trusted',label:'Trusted',assist:true,comboBonus:.08,willRefuse:false,willDepart:false};
      if(loyalty>=40)return{id:'steady',label:'Steady',assist:true,comboBonus:0,willRefuse:false,willDepart:false};
      if(loyalty>=20)return{id:'strained',label:'Strained',assist:false,comboBonus:-.08,willRefuse:true,willDepart:false};
      return{id:'fractured',label:'Fractured',assist:false,comboBonus:-.16,willRefuse:true,willDepart:true};
    }

    adjustLoyalty(state,characterId,delta,reason='choice',spin=0) {
      const arc=this.relationship(state,characterId),before=arc.loyalty;
      arc.loyalty=clamp(arc.loyalty+Number(delta||0),0,100);
      const tier=this.loyaltyTier(arc.loyalty);arc.status=tier.id;arc.assistUnlocked=tier.assist;
      arc.moments.unshift({spin:Number(spin||0),delta:arc.loyalty-before,reason:String(reason),loyalty:arc.loyalty});arc.moments=arc.moments.slice(0,16);
      state.v13.storyStats.loyaltyEarned+=Math.max(0,arc.loyalty-before);
      return {...arc,tier};
    }

    allyDecision(state,characterId,kind='assist') {
      const arc=this.relationship(state,characterId),tier=this.loyaltyTier(arc.loyalty);
      if(tier.willDepart&&['exploit','sacrifice','coerce'].includes(kind)){arc.departed=true;return{allowed:false,departed:true,reason:'The relationship fractured and the ally left the timeline.'};}
      if(tier.willRefuse&&['assist','sacrifice','coerce'].includes(kind)){arc.refusals++;return{allowed:false,departed:false,reason:'Low loyalty caused the ally to refuse.'};}
      return{allowed:true,departed:false,bonus:tier.comboBonus};
    }

    recordChoice(state,event,choiceId,{spin=0,stage=1,allyIds=[]}={}) {
      const choice=event?.choices?.find(item=>item.id===choiceId);if(!choice)return{ok:false,error:'Story choice is invalid.'};
      const effect=clone(choice.effect||{}),entry={id:`${event.id}:${stage}`,eventId:event.id,choiceId,universe:event.universe,stage:Number(stage),spin:Number(spin),effect};
      state.v13.eventHistory.push(entry);state.v13.eventHistory=state.v13.eventHistory.slice(-60);
      for(const key of ['hero','villain','rescues','worldsProtected'])state.v13.storyStats[key]+=Number(effect[key]||0);
      for(const id of allyIds)this.adjustLoyalty(state,id,effect.loyalty||0,`${event.title}: ${choice.label}`,spin);
      if(effect.callback)this.scheduleCallback(state,{...effect.callback,sourceEvent:event.id,sourceChoice:choiceId,universe:event.universe,dueSpin:Number(spin)+Number(effect.callback.delay||2)});
      this.highlight(state,{type:'story',spin,title:event.title,detail:choice.label,weight:2+Math.abs(Number(effect.hero||0))+Math.abs(Number(effect.villain||0))});
      return{ok:true,choice:clone(choice),effect,entry};
    }

    scheduleCallback(state,callback={}) {
      const id=String(callback.id||`callback-${idPart(callback.sourceEvent)}-${idPart(callback.sourceChoice)}-${Number(callback.dueSpin||0)}`);
      const existing=state.v13.callbacks.find(item=>item.id===id);if(existing)return existing;
      const entry={id,status:'scheduled',type:String(callback.type||'echo'),universe:String(callback.universe||'The Crossroads'),sourceEvent:String(callback.sourceEvent||''),sourceChoice:String(callback.sourceChoice||''),dueSpin:Math.max(0,Number(callback.dueSpin||0))};
      state.v13.callbacks.push(entry);return entry;
    }

    nextCallback(state,spin=0) {return state.v13.callbacks.find(item=>item.status==='scheduled'&&Number(item.dueSpin)<=Number(spin))||null;}

    resolveCallback(state,id) {
      const entry=state.v13.callbacks.find(item=>item.id===id);if(!entry||entry.status!=='scheduled')return null;
      entry.status='resolved';entry.resolvedAtSpin=Number(state.spin||0);state.v13.storyStats.callbacksResolved++;
      const outcomes={
        'civilian-network':{title:'The People Remember',description:'Evacuees return with route intelligence and emergency supplies.',effect:{energy:.16,credits:100,bossPower:-.04,loyalty:2}},
        'faction-scrutiny':{title:'The Cost of the Strike',description:'The bypassed faction demands restitution before it will support the finale.',effect:{credits:-80,heat:2,loyalty:-2}},
        'allied-reinforcements':{title:'The Accord Holds',description:'The coalition arrives exactly when the route begins to collapse.',effect:{energy:.12,bossPower:-.07,loyalty:3}},
        'fractured-alliance':{title:'A Coalition Breaks',description:'The coerced alliance splinters and the boss absorbs its abandoned defenses.',effect:{bossPower:.08,heat:2,loyalty:-3}},
        'sealed-world':{title:'A World Answers',description:'The protected universe sends a stabilizing signal through the sealed fracture.',effect:{fate:1,bossPower:-.08,loyalty:3}},
        'corrupted-relic':{title:'The Relic Collects Its Debt',description:'The claimed relic surges against its bearer and reveals the build to the enemy.',effect:{health:-.12,bossPower:.1,loyalty:-4}}
      };
      const outcome=clone(outcomes[entry.type]||{title:'A Choice Returns',description:'An earlier decision changes the route.',effect:{}});
      this.highlight(state,{type:'callback',spin:state.spin,title:outcome.title,detail:outcome.description,weight:4});
      return{...outcome,callback:clone(entry)};
    }

    rivalOutcome({respect=0,wins=0,losses=0,hero=0,villain=0,finalWin=false,choice='auto'}={}) {
      if(choice==='invite'&&wins>=2&&respect>=18)return{id:'recruit',label:'Recruited Rival',description:'Respect became trust, and the rival joined the next timeline.'};
      if((choice==='sacrifice'||(finalWin&&respect>=75&&wins>=4&&hero>=villain+3)))return{id:'sacrifice',label:'Final Sacrifice',description:'The rival spent their last transformation to hold the fracture closed.'};
      if(choice==='redeem'||(respect>=55&&hero>villain))return{id:'redemption',label:'Redeemed Rival',description:'The rival abandoned the cycle and defended the worlds they once threatened.'};
      if(losses>wins+1||villain>=hero+5)return{id:'final-transformation',label:'Final Transformation',description:'Every defeat and ruthless choice became fuel for the rival’s last form.'};
      if(respect<0||choice==='bind')return{id:'permanent-nemesis',label:'Permanent Nemesis',description:'The rivalry survived the ending and now follows every inherited timeline.'};
      if(finalWin&&wins>=3&&respect>=25)return{id:'recruit',label:'Recruited Rival',description:'The final victory converted hard-earned respect into an alliance.'};
      return{id:'escape',label:'Rival Escaped',description:'The rival vanished into an unresolved branch, carrying every learned counter.'};
    }

    highlight(state,{type='route',spin=0,title='Timeline moment',detail='',weight=1}={}) {
      state.v13.highlights.push({type:String(type),spin:Number(spin||0),title:String(title),detail:String(detail),weight:Number(weight||1)});
      state.v13.highlights=state.v13.highlights.sort((a,b)=>b.weight-a.weight||b.spin-a.spin).slice(0,24);return state.v13.highlights[0];
    }

    scoreBreakdown(state,{baseScore=0,difficulty='normal'}={}) {
      const arcs=Object.values(state.v13.relationshipArcs||{}),devoted=arcs.filter(arc=>arc.loyalty>=80).length,trusted=arcs.filter(arc=>arc.loyalty>=65&&arc.loyalty<80).length;
      const bonds=devoted*250+trusted*140,story=Number(state.v13.storyStats.worldsProtected||0)*180+Number(state.v13.storyStats.callbacksResolved||0)*90;
      const fate=Math.max(0,Number(state.v13.fate.earned||0)*40-Number(state.v13.fate.spent||0)*10),difficultyBonus={story:0,normal:150,heroic:350,cosmic:650,impossible:1000}[difficulty]||0;
      const sections={core:Math.max(0,Math.round(Number(baseScore)||0)),bonds,story,fate,difficulty:difficultyBonus};
      return{sections,total:Object.values(sections).reduce((sum,value)=>sum+value,0),devoted,trusted};
    }

    deriveEnding(state,{finalWin=false,baseScore=0,difficulty='normal',uniqueUniverses=0,rivalOutcome=null}={}) {
      const stats=state.v13.storyStats,arcs=Object.values(state.v13.relationshipArcs||{}),devoted=arcs.filter(arc=>arc.loyalty>=80).length,outcome=rivalOutcome||state.v13.rivalResolution;
      let ending;
      if(!finalWin&&Number(stats.worldsProtected||0)>=4)ending={id:'last-light',title:'The Last Light',epilogue:'The hero fell, but the protected worlds carried one another beyond the erased route.'};
      else if(!finalWin)ending={id:'fractured-timeline',title:'The Fractured Timeline',epilogue:'The route ended unresolved. Its rival, debts, and unfinished promises survived as warnings.'};
      else if(outcome&&['recruit','redemption','sacrifice'].includes(outcome.id))ending={id:'rivals-end',title:'Two at the Last Horizon',epilogue:'The final adversary became part of the answer, changing what victory meant for every connected world.'};
      else if(devoted>=2)ending={id:'covenant',title:'The Multiversal Covenant',epilogue:'The strongest force in the finale was not a borrowed power, but a team that chose to remain.'};
      else if(Number(uniqueUniverses)>=5)ending={id:'living-nexus',title:'The Living Nexus',epilogue:'The hero became a stable bridge between incompatible universes without erasing what made them distinct.'};
      else if(Number(stats.villain||0)>Number(stats.hero||0))ending={id:'sovereign',title:'Sovereign of the Wheel',epilogue:'The crisis ended beneath a single will. The worlds survived, but their freedom became the price.'};
      else ending={id:'horizon-guardian',title:'Guardian of the Last Horizon',epilogue:'The final fracture closed, leaving a watchful hero at the border of every possible world.'};
      return{...ending,win:Boolean(finalWin),rivalOutcome:outcome||null,score:this.scoreBreakdown(state,{baseScore,difficulty}),storyStats:clone(stats)};
    }

    recap(state,{hero='Unknown hero',ending=null,record={},build='Unformed Build',party=[]}={}) {
      const selected=[...(state.v13.highlights||[])].sort((a,b)=>b.weight-a.weight||b.spin-a.spin).slice(0,6).sort((a,b)=>a.spin-b.spin||b.weight-a.weight),partyCopy=clone(party),mvp=[...partyCopy].sort((a,b)=>Number(b.loyalty||0)-Number(a.loyalty||0))[0]||null;
      return{hero,ending:clone(ending||state.v13.ending),record:clone(record),build,party:partyCopy,mvp,highlights:selected,challengeCode:String(state.v13.runContext?.challengeCode||''),seed:Number(state.seed||0)};
    }
  }

  const LEGACY_BENEFITS=Object.freeze([
    {id:'signature-source',label:'Inherited Signature',description:'Carry the strongest copied source at Mastery 2.'},
    {id:'trusted-ally',label:'Unbroken Bond',description:'Carry the most loyal active ally into the new timeline.'},
    {id:'relic-cache',label:'Crossroads Cache',description:'Begin with 900 credits and two Evolution Points.'},
    {id:'fate-bond',label:'Fatebound',description:'Begin with a seven-point Fate cap and five Fate.'}
  ]);
  const LEGACY_MUTATORS=Object.freeze([
    {id:'mirrored-rival',label:'Mirrored Rival',description:'The previous rival returns immediately with learned counters.'},
    {id:'scarce-energy',label:'Scarce Energy',description:'Energy recovery is reduced, rewarding disciplined loadouts.'},
    {id:'volatile-fate',label:'Volatile Fate',description:'Fate is plentiful, but every alteration raises Director heat.'},
    {id:'boss-marathon',label:'Boss Marathon',description:'Every stage boss gains an additional crisis phase.'}
  ]);

  class LegacyExperienceEngine {
    options(){return{benefits:clone(LEGACY_BENEFITS),mutators:clone(LEGACY_MUTATORS)};}
    createPlan(state,benefitId,mutatorId,characterResolver=id=>null) {
      const benefit=LEGACY_BENEFITS.find(item=>item.id===benefitId),mutator=LEGACY_MUTATORS.find(item=>item.id===mutatorId);
      if(!benefit||!mutator)return{ok:false,error:'Choose one legacy benefit and one timeline mutator.'};
      const kits=(state.kits||[]).map(kit=>({kit,character:characterResolver(kit.id)})).filter(item=>item.character);
      const strongest=kits.sort((a,b)=>STAT_KEYS.reduce((sum,key)=>sum+Number(b.character.stats?.[key]||0)-Number(a.character.stats?.[key]||0),0))[0]?.kit||null;
      const trusted=(state.party||[]).map(id=>({id,loyalty:Number(state.v13?.relationshipArcs?.[id]?.loyalty??state.partyRoster?.[id]?.loyalty??50)})).sort((a,b)=>b.loyalty-a.loyalty)[0]||null;
      return{ok:true,benefit:clone(benefit),mutator:clone(mutator),carry:{sourceId:benefit.id==='signature-source'?strongest?.id||null:null,allyId:benefit.id==='trusted-ally'?trusted?.id||null:null,hero:clone(state.customCharacter||{}),campaignLimit:Number(state.campaignLimit||30),difficulty:String(state.difficulty||'normal'),balance:String(state.balanceMode||'chaos'),previousRivalId:state.rivalArc?.id||null}};
    }
  }

  class DailyRecordRepository {
    constructor(storage,key='multiverse-wheel-v13-daily-records'){this.storage=storage;this.keyName=key;}
    read(){try{const value=JSON.parse(this.storage?.getItem(this.keyName)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return{};}}
    get(dateKey){return clone(this.read()[String(dateKey)]||null);}
    submit(dateKey,record={}) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey)))throw new TypeError('Daily records require YYYY-MM-DD.');
      const records=this.read(),previous=records[dateKey]||null,score=Math.max(0,Math.round(Number(record.score)||0)),attempts=Number(previous?.attempts||0)+1;
      const candidate={dateKey:String(dateKey),score,win:Boolean(record.win),ending:String(record.ending||''),hero:String(record.hero||'Unknown hero'),seed:Number(record.seed||0)>>>0,completedAt:String(record.completedAt||new Date().toISOString()),attempts};
      const best=!previous||score>Number(previous.score||0)?candidate:{...previous,attempts};records[dateKey]=best;this.storage?.setItem(this.keyName,JSON.stringify(records));return clone(best);
    }
    list(limit=30){return Object.values(this.read()).sort((a,b)=>String(b.dateKey).localeCompare(String(a.dateKey))).slice(0,Math.max(1,Number(limit)||30)).map(clone);}
  }

  class RunSlotRepository {
    constructor(storage,prefix='multiverse-wheel-v13-slot',slotCount=DEFAULT_SLOT_COUNT) {
      this.storage=storage;this.prefix=prefix;this.slotCount=Math.max(1,Number(slotCount)||DEFAULT_SLOT_COUNT);
    }
    key(slot) {const value=Number(slot);if(!Number.isInteger(value)||value<1||value>this.slotCount)throw new RangeError(`Slot must be between 1 and ${this.slotCount}.`);return `${this.prefix}-${value}`;}
    list() {return Array.from({length:this.slotCount},(_,index)=>{const slot=index+1,snapshot=this.load(slot);return snapshot?{slot,empty:false,...snapshot.meta}:{slot,empty:true};});}
    load(slot) {const key=this.key(slot);try{const raw=this.storage?.getItem(key);if(!raw)return null;const value=JSON.parse(raw);return value?.format==='multiverse-wheel-slot'&&value.version===1&&value.state?clone(value):null;}catch{return null;}}
    save(slot,state,meta={}) {if(!state||typeof state!=='object')throw new TypeError('A state object is required.');const snapshot={format:'multiverse-wheel-slot',version:1,meta:{hero:String(meta.hero||state.customCharacter?.codename||'Unnamed hero'),spin:Number(state.spin||0),score:Number(meta.score||0),savedAt:String(meta.savedAt||new Date().toISOString())},state:clone(state)};this.storage?.setItem(this.key(slot),JSON.stringify(snapshot));return clone(snapshot);}
    clear(slot) {this.storage?.removeItem(this.key(slot));}
  }

  const api={
    V13_SCHEMA_VERSION,CHALLENGE_CODE_PREFIX,FATE_COSTS,
    canonicalUniverse,canonicalUniverseGroups,identityFor,structuredWeaknesses,
    localDateKey,dailyChallenge,encodeChallengeCode,decodeChallengeCode,
    V13StateEngine,RunSlotRepository,BuildProgressionEngine,CombatExperienceEngine,NarrativeExperienceEngine,
    LegacyExperienceEngine,DailyRecordRepository,UNIVERSE_EVENT_PACKS,LEGACY_BENEFITS,LEGACY_MUTATORS,MASTERY_BRANCHES
  };
  root.MultiverseDomain=Object.assign(root.MultiverseDomain||{},api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
