'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {
  V13_SCHEMA_VERSION,
  canonicalUniverse,
  canonicalUniverseGroups,
  identityFor,
  dailyChallenge,
  encodeChallengeCode,
  decodeChallengeCode,
  V13StateEngine,
  RunSlotRepository,
  BuildProgressionEngine,
  CombatExperienceEngine,
  NarrativeExperienceEngine,
  LegacyExperienceEngine,
  DailyRecordRepository,
  UNIVERSE_EVENT_PACKS
}=require('../js/domain/v13-engine.js');

const character=(id,universe='Marvel Comics',overrides={})=>({
  id,name:id.replace(/_/g,' '),universe,role:'',
  stats:{might:70,defense:70,speed:70,skill:70,mind:70,energy:70,hax:70},
  powers:['Opening Strike','Adaptive Defense','Signature Burst'],
  tags:['strength','energy'],signature:'Signature Burst',weakness:'Power nullification and exhaustion',
  ...overrides
});

class MemoryStorage {
  constructor(){this.values=new Map();}
  getItem(key){return this.values.has(key)?this.values.get(key):null;}
  setItem(key,value){this.values.set(key,String(value));}
  removeItem(key){this.values.delete(key);}
}

test('canonical universes merge known source aliases without losing labels',()=>{
  assert.equal(canonicalUniverse('Marvel Comics'),'Marvel');
  assert.equal(canonicalUniverse('DC Comics'),'DC');
  assert.equal(canonicalUniverse('Naruto'),'Naruto / Boruto');
  assert.equal(canonicalUniverse('Sonic'),'Sonic the Hedgehog');
  assert.equal(canonicalUniverse('A New Universe'),'A New Universe');
  const groups=canonicalUniverseGroups([
    character('a','Marvel'),character('b','Marvel Comics'),character('c','DC Comics')
  ]);
  assert.deepEqual(groups.find(group=>group.universe==='Marvel'),{
    universe:'Marvel',total:2,ids:['a','b'],sourceLabels:['Marvel','Marvel Comics']
  });
});

test('every character receives deterministic mechanical identity fallbacks',()=>{
  const source=character('velocity','Sonic',{role:'',tags:['speed','teleport'],weakness:''});
  const first=identityFor(source),second=identityFor(source);
  assert.deepEqual(first,second);
  assert.equal(first.canonicalUniverse,'Sonic the Hedgehog');
  assert.equal(first.role,'speedster');
  assert.ok(first.passive.name);
  assert.ok(first.ultimate.name);
  assert.ok(first.moves.length>=3);
  assert.ok(first.weaknessTags.length>=1);
});

test('hand-authored identity fields override generated fallbacks',()=>{
  const passive={name:'Authored Passive',description:'A bespoke rule.',effect:'bespoke'},ultimate={name:'Authored Ultimate',energy:22},moves=[{id:'move-one',name:'Handmade Move',tags:['time']}];
  const identity=identityFor(character('authored','DC',{role:'mystic',passive,ultimate,moves,weaknessTags:['custom counter']}));
  assert.deepEqual(identity.passive,passive);
  assert.deepEqual(identity.ultimate,ultimate);
  assert.equal(identity.moves[0].id,'move-one');
  assert.deepEqual(identity.weaknessTags,['custom counter']);
  assert.equal(identity.generated.passive,false);
});

test('V13 migration is idempotent and preserves legacy state',()=>{
  const engine=new V13StateEngine();
  const legacy={version:3,seed:42,spin:7,kits:[{id:'a'}],party:[],log:[],slices:[],customField:'keep'};
  const once=engine.migrate(legacy);
  const snapshot=JSON.stringify(once);
  const twice=engine.migrate(once);
  assert.equal(JSON.stringify(twice),snapshot);
  assert.equal(twice.schemaVersion,V13_SCHEMA_VERSION);
  assert.equal(twice.customField,'keep');
  assert.equal(twice.v13.fate.current,3);
});

test('Fate is capped, costed, logged, and blocked on protected beats',()=>{
  const engine=new V13StateEngine(),state=engine.migrate({});
  assert.equal(engine.spendFate(state,'ban',{type:'hazard'},{spin:2}).ok,true);
  assert.equal(state.v13.fate.current,1);
  assert.equal(state.v13.fate.controls.bannedType,'hazard');
  assert.equal(engine.spendFate(state,'lock',{sliceId:'x'},{spin:10,boss:true}).ok,false);
  assert.equal(engine.earnFate(state,99,'boss',10),4);
  assert.equal(state.v13.fate.current,state.v13.fate.max);
  assert.equal(state.v13.fate.history[0].action,'earn');
  assert.equal(engine.spendFate(state,'nudge',{direction:1},{spin:4,hasPending:true}).ok,true);
  assert.equal(engine.spendFate(state,'reroll',{}, {spin:4,hasPending:true}).ok,false);
  assert.equal(engine.canUseFate(state,'lock',{spin:5,daily:true}).ok,false);
  engine.clearWheelControls(state);
  assert.equal(state.v13.fate.controls.bannedType,null);
});

test('build identities and mastery branches are deterministic and exclusive',()=>{
  const engine=new V13StateEngine(),progression=new BuildProgressionEngine();
  const speed=character('speed','Sonic',{tags:['speed','teleport'],role:''});
  const build=progression.buildIdentity([speed,character('tech','DC',{tags:['speed','tech'],role:''})]);
  assert.equal(build.role,'speedster');
  assert.match(build.label,/Speed/i);
  const state=engine.migrate({kits:[{id:'speed',mastery:4}],activePowerSets:['speed']});
  assert.equal(progression.chooseMastery(state,speed,2,'discipline').ok,true);
  assert.equal(progression.chooseMastery(state,speed,2,'amplify').ok,false);
  assert.equal(progression.chooseMastery(state,speed,4,'signature').ok,true);
  assert.deepEqual(progression.branchEffects(state,['speed']),{odds:0,energy:.05,damage:.08,health:0});
  assert.deepEqual(progression.branchEffects(state,[]),{odds:0,energy:0,damage:0,health:0});
});

test('combat experience previews quick resolve and manages assists and exploits',()=>{
  const combatEngine=new CombatExperienceEngine(),combat={round:2};
  const preview=combatEngine.quickResolvePreview({type:'battle',winChance:.82,heroRating:88,enemyRating:80,difficulty:'normal'});
  assert.equal(preview.eligible,true);
  assert.equal(combatEngine.quickResolvePreview({...preview,type:'boss'}).eligible,false);
  combatEngine.charge(combat,'attack',{landed:true});
  combatEngine.charge(combat,'counter',{succeeded:true});
  combatEngine.charge(combat,'support');
  assert.equal(combat.v13.assist,66);
  assert.equal(combatEngine.spendAssist(combat,50,2).ok,true);
  assert.equal(combatEngine.spendAssist(combat,50,2).ok,false);
  const vulnerable=character('mage','DC',{weakness:'Power nullification',tags:['magic']});
  assert.equal(combatEngine.exploit(vulnerable,['nullification']).active,true);
  assert.equal(combatEngine.exploit(vulnerable,['strength']).active,false);
});

test('boss rules and adaptive plans expose behavioral counterplay',()=>{
  const combatEngine=new CombatExperienceEngine(),enemy=character('oracle','DC',{tags:['strategy','precognition']});
  const rule=combatEngine.bossRule(enemy,1,42);
  assert.ok(rule.name&&rule.description&&rule.counter);
  const plan=combatEngine.adaptivePlan({difficulty:'heroic',round:3,playerHistory:['same','same']});
  assert.equal(plan.id,'punish-repeat');
  const combat={round:3};
  combatEngine.record(combat,{round:3,label:'Counter',damageDealt:12,damageTaken:4,counter:true,pivotal:'Turned the intent'});
  const summary=combatEngine.summarize(combat,[{id:'ally',name:'Ally',loyalty:70}]);
  assert.equal(summary.damageDealt,12);
  assert.equal(summary.counters,1);
  assert.equal(summary.mvp.name,'Ally');
});

test('daily descriptors and challenge codes are deterministic and tamper evident',()=>{
  const first=dailyChallenge('2026-08-28'),second=dailyChallenge('2026-08-28');
  assert.deepEqual(first,second);
  assert.notEqual(first.seed,dailyChallenge('2026-08-29').seed);
  const code=encodeChallengeCode(first),decoded=decodeChallengeCode(code);
  assert.equal(decoded.ok,true);
  assert.equal(decoded.config.seed,first.seed);
  assert.equal(decoded.config.preset,first.preset);
  assert.deepEqual(decoded.config.modifiers,['daily','fixed-seed']);
  const tampered=`${code.slice(0,-1)}${code.endsWith('a')?'b':'a'}`;
  assert.equal(decodeChallengeCode(tampered).ok,false);
});

test('three local run slots remain isolated and expose summaries',()=>{
  const storage=new MemoryStorage(),repository=new RunSlotRepository(storage);
  repository.save(1,{spin:4,customCharacter:{codename:'Aegis'},kits:[]},{score:1200,savedAt:'2026-08-28T00:00:00.000Z'});
  repository.save(2,{spin:9,customCharacter:{codename:'Cipher'},kits:[{id:'x'}]},{score:2400,savedAt:'2026-08-28T00:00:00.000Z'});
  assert.equal(repository.load(1).state.customCharacter.codename,'Aegis');
  assert.equal(repository.load(2).state.customCharacter.codename,'Cipher');
  assert.deepEqual(repository.list().map(slot=>slot.empty),[false,false,true]);
  repository.clear(1);
  assert.equal(repository.load(1),null);
  assert.throws(()=>repository.load(4),RangeError);
});

test('universe event packs provide specific deterministic three-beat arcs',()=>{
  const engine=new NarrativeExperienceEngine();
  assert.ok(UNIVERSE_EVENT_PACKS.length>=10);
  const marvel=engine.packFor('Marvel Comics');
  assert.equal(marvel.universe,'Marvel');
  assert.equal(marvel.events.length,3);
  assert.match(marvel.events[0].title,/Manhattan/);
  assert.equal(engine.eventFor('Marvel Comics',3).id,marvel.events[0].id);
  const fallback=engine.eventFor('Unlisted Universe',1);
  assert.equal(fallback.universe,'Unlisted Universe');
  assert.equal(fallback.choices.length,2);
});

test('story choices change loyalty and return as delayed callbacks',()=>{
  const state=new V13StateEngine().migrate({spin:4}),engine=new NarrativeExperienceEngine();
  const event=engine.eventFor('DC Comics',0);
  const result=engine.recordChoice(state,event,'evacuate',{spin:4,stage:1,allyIds:['ally']});
  assert.equal(result.ok,true);
  assert.equal(state.v13.relationshipArcs.ally.loyalty,55);
  assert.equal(state.v13.storyStats.rescues,1);
  assert.equal(engine.nextCallback(state,5),null);
  const callback=engine.nextCallback(state,6);
  assert.ok(callback);
  const outcome=engine.resolveCallback(state,callback.id);
  assert.equal(outcome.callback.status,'resolved');
  assert.equal(state.v13.storyStats.callbacksResolved,1);
});

test('loyalty thresholds unlock assists, refusal, and departure',()=>{
  const state=new V13StateEngine().migrate({}),engine=new NarrativeExperienceEngine();
  engine.relationship(state,'trusted',70);
  assert.equal(engine.allyDecision(state,'trusted','assist').allowed,true);
  engine.relationship(state,'strained',25);
  assert.equal(engine.allyDecision(state,'strained','assist').allowed,false);
  engine.relationship(state,'fractured',10);
  const departure=engine.allyDecision(state,'fractured','coerce');
  assert.equal(departure.departed,true);
  assert.equal(state.v13.relationshipArcs.fractured.departed,true);
});

test('rival resolution and multiple endings respond to the complete run',()=>{
  const state=new V13StateEngine().migrate({record:{wins:8,bossWins:3}}),engine=new NarrativeExperienceEngine();
  state.v13.storyStats.worldsProtected=5;
  const rival=engine.rivalOutcome({respect:60,wins:3,hero:8,villain:1,finalWin:true});
  assert.equal(rival.id,'redemption');
  const win=engine.deriveEnding(state,{finalWin:true,baseScore:5000,difficulty:'heroic',uniqueUniverses:6,rivalOutcome:rival});
  assert.equal(win.id,'rivals-end');
  assert.ok(win.score.total>5000);
  const loss=engine.deriveEnding(state,{finalWin:false,baseScore:2000});
  assert.equal(loss.id,'last-light');
  assert.notEqual(loss.id,win.id);
});

test('New Game Plus plans require one inheritance and one mutator',()=>{
  const state=new V13StateEngine().migrate({customCharacter:{codename:'Aegis'},campaignLimit:40,difficulty:'heroic',kits:[{id:'weak'},{id:'strong'}],party:['ally'],partyRoster:{ally:{loyalty:72}},rivalArc:{id:'rival'}});
  const characters=new Map([['weak',character('weak','Marvel',{stats:{might:10,defense:10,speed:10,skill:10,mind:10,energy:10,hax:10}})],['strong',character('strong')]]);
  const engine=new LegacyExperienceEngine(),plan=engine.createPlan(state,'signature-source','mirrored-rival',id=>characters.get(id));
  assert.equal(plan.ok,true);
  assert.equal(plan.carry.sourceId,'strong');
  assert.equal(plan.carry.previousRivalId,'rival');
  assert.equal(engine.createPlan(state,'unknown','scarce-energy').ok,false);
});

test('daily records count attempts while preserving the highest score',()=>{
  const storage=new MemoryStorage(),records=new DailyRecordRepository(storage);
  records.submit('2026-08-28',{score:1800,hero:'Aegis',win:false,seed:4});
  const lower=records.submit('2026-08-28',{score:1200,hero:'Cipher',win:true,seed:4});
  assert.equal(lower.score,1800);
  assert.equal(lower.hero,'Aegis');
  assert.equal(lower.attempts,2);
  const higher=records.submit('2026-08-28',{score:2400,hero:'Cipher',win:true,seed:4});
  assert.equal(higher.score,2400);
  assert.equal(higher.attempts,3);
  assert.equal(records.list()[0].dateKey,'2026-08-28');
});
