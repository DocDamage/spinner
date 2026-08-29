'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
require('../js/domain/v16-engine.js');
require('../js/domain/v17-engine.js');
require('../js/domain/v18-engine.js');
const {V19_SCHEMA_VERSION,PartyConsequencesEngine,migrateV19,AXES}=require('../js/domain/v19-engine.js');

const roster=[
  {id:'a',name:'Aegis',universe:'Marvel',role:'support',tags:['healing','support','magic']},
  {id:'b',name:'Blitz',universe:'DC',role:'speedster',tags:['speed','martial']},
  {id:'c',name:'Cipher',universe:'Marvel',role:'tactician',tags:['tech','strategy','genius']}
];
function state(seed=1901){return migrateV19({seed,spin:5,credits:500,customCharacter:{homeworld:'Earth-Prime'},party:['a','b'],kits:[],artifacts:[],balanceMode:'roguelite'},roster);}

test('V19 migration is idempotent and preserves legacy loyalty compatibility',()=>{
  const value=state();value.v13.relationshipArcs.a.loyalty=73;migrateV19(value,roster);const snapshot=JSON.stringify(value);migrateV19(value,roster);
  assert.equal(JSON.stringify(value),snapshot);assert.equal(value.v19.schemaVersion,V19_SCHEMA_VERSION);assert.equal(value.v19.records.a.axes.loyalty,73);assert.deepEqual(Object.keys(value.v19.records.a.axes).sort(),[...AXES].sort());
});

test('pair compatibility and personality are deterministic',()=>{
  const engine=new PartyConsequencesEngine(),a=state(),b=state(),pa=engine.pair(a,'a','b',roster),pb=engine.pair(b,'a','b',roster);
  assert.deepEqual(pa,pb);assert.equal(pa.compatibility>=10&&pa.compatibility<=95,true);assert.deepEqual(a.v19.records.a.profile,b.v19.records.a.profile);
});

test('morale and relationship axes feed bounded combat modifiers',()=>{
  const engine=new PartyConsequencesEngine(),value=state();value.v19.morale=95;for(const id of value.party)engine.adjust(value,id,{trust:35,respect:30,friendship:30},'test bond');const mod=engine.combatModifier(value,roster);
  assert.equal(mod.odds>0,true);assert.equal(mod.odds<=.08,true);assert.equal(mod.damage<=.12,true);
});

test('wounds can harden into scars and treatment removes an active wound',()=>{
  const engine=new PartyConsequencesEngine(),value=state();engine.wound(value,'a','minor','one');engine.wound(value,'a','minor','two');engine.wound(value,'a','severe','three');
  assert.equal(value.v19.records.a.scars.length,1);assert.equal(value.v19.records.a.wounds.length,2);assert.equal(engine.healWound(value,'a').ok,true);assert.equal(value.v19.records.a.wounds.length,1);
});

test('active party and reserve roster can swap without losing relationship state',()=>{
  const engine=new PartyConsequencesEngine(),value=state(),before=value.v19.records.b.axes.trust;
  assert.equal(engine.bench(value,'b').ok,true);assert.deepEqual(value.party,['a']);assert.deepEqual(value.v19.benchIds,['b']);assert.equal(engine.activate(value,'b',4).ok,true);assert.equal(value.party.includes('b'),true);assert.equal(value.v19.records.b.axes.trust,before);
});

test('personal quests complete from matching events and strengthen the ally bond',()=>{
  const engine=new PartyConsequencesEngine(),value=state(),q=value.v19.personalQuests.a;q.events=['battle'];q.requiredOutcome='win';q.target=1;const before=value.v19.records.a.axes.trust,done=engine.progressPersonalQuests(value,{type:'battle',outcome:'win'});
  assert.equal(done.length,1);assert.equal(q.status,'completed');assert.equal(value.v19.records.a.axes.trust>before,true);assert.equal(value.v19.stats.personalQuests,1);
});

test('party incidents support reconciliation or taking sides',()=>{
  const engine=new PartyConsequencesEngine(),value=state(),pair=engine.pair(value,'a','b',roster);pair.trust=30;pair.friendship=30;pair.resentment=40;value.v19.incidents.push({id:'arg-1',type:'argument',a:'a',b:'b',title:'Test argument',status:'open',spin:5});
  const result=engine.resolveIncident(value,'arg-1','reconcile');assert.equal(result.ok,true);assert.equal(pair.trust,39);assert.equal(pair.friendship,38);assert.equal(pair.resentment,30);assert.equal(value.v19.stats.reconciliations,1);
});

test('fractured relationships can deterministically defect toward a hostile faction',()=>{
  const engine=new PartyConsequencesEngine(),value=state();value.v16.factions.hostile={id:'hostile',name:'Hostile',ethos:'ambition',reputation:-80,relations:{}};const r=value.v19.records.b;r.axes.loyalty=5;r.axes.trust=5;r.axes.resentment=95;let defected=null;
  for(let spin=1;spin<=100&&!defected;spin++){value.spin=spin;defected=engine.betrayalCheck(value,'b',roster);}
  assert.ok(defected);assert.equal(value.v19.records.b.status,'defected');assert.equal(value.party.includes('b'),false);assert.equal(value.v19.records.b.defectedTo,'hostile');
});

test('permadeath is opt-in while severe consequences still matter when disabled',()=>{
  const engine=new PartyConsequencesEngine(),value=state();const first=engine.severeConsequence(value,'a','boss loss');assert.equal(Boolean(first.dead),false);assert.equal(value.v19.records.a.wounds.length,1);value.v19.settings.permadeath=true;const second=engine.severeConsequence(value,'a','final sacrifice');assert.equal(second.dead,true);assert.equal(value.v19.records.a.status,'dead');assert.equal(value.party.includes('a'),false);
});

test('mentor lessons, market reactions, and nemesis targeting persist',()=>{
  const engine=new PartyConsequencesEngine(),value=state(),lesson=engine.mentorLesson(value,'mentor-x','hero'),target=engine.nemesisTarget(value,'nemesis-x'),price=engine.marketModifier(value);
  assert.equal(lesson.lessons,1);assert.ok(target);assert.equal(value.v19.records[target.id].targetedBy,'nemesis-x');assert.equal(price>=-.08&&price<=.1,true);
});

test('high friendship and pair bonds can unlock Resonant Ascension',()=>{
  const engine=new PartyConsequencesEngine(),value=state(),pair=engine.pair(value,'a','b',roster);pair.compatibility=95;pair.trust=95;pair.friendship=95;pair.rivalry=0;pair.resentment=0;value.v19.morale=90;
  const surge=engine.bondSurge(value,roster);assert.equal(surge.ready,true);assert.equal(surge.label,'Resonant Ascension');assert.equal(surge.statBonus,4);assert.equal(surge.damageBonus,.08);
});

test('relationship ending recognizes a found-family route',()=>{
  const engine=new PartyConsequencesEngine(),value=state();for(const id of value.party){value.v19.records[id].axes.friendship=90;value.v19.records[id].axes.trust=90;}const ending=engine.ending(value);
  assert.equal(ending.id,'found-family');assert.equal(ending.devoted.length,2);
});
