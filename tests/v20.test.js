'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
require('../js/domain/v16-engine.js');
require('../js/domain/v17-engine.js');
require('../js/domain/v18-engine.js');
require('../js/domain/v19-engine.js');
const {V20_SCHEMA_VERSION,RelicMasteryEngine,migrateV20}=require('../js/domain/v20-engine.js');

const roster=[
  {id:'a',name:'Aegis',universe:'Marvel',role:'support',tags:['healing','support','magic']},
  {id:'b',name:'Blitz',universe:'DC',role:'speedster',tags:['speed','martial']}
];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
function makeState(seed=2001){
  const value=migrateV20({seed,spin:5,credits:900,customCharacter:{codename:'Doc Prime',homeworld:'Earth-Prime'},party:['a','b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'},balanceMode:'roguelite'},artifacts,roster);
  Object.assign(value.v18.wallet,{salvage:300,cosmicFragments:60,voidMarks:10,bountySeals:5});
  return value;
}

test('V20 migration is idempotent and upgrades existing V18 gear/relic state',()=>{
  const value=makeState(),engine=new RelicMasteryEngine();assert.equal(value.v20.schemaVersion,V20_SCHEMA_VERSION);assert.ok(value.v20.gear['gear-a']);assert.ok(value.v20.relics['relic-a']);const before=JSON.stringify(value);engine.ensure(value,artifacts,roster);assert.equal(JSON.stringify(value),before);
});

test('equipped gear gains mastery and mastery produces incremental stat bonuses',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),record=value.v20.gear['gear-a'];for(let i=0;i<9;i++)engine.gainGearMastery(value,{type:'boss',outcome:'win'});assert.equal(record.level>1,true);const bonuses=engine.masteryBonuses(value);assert.equal(bonuses.might>0||bonuses.skill>0,true);assert.equal(value.v20.stats.masteryLevels>0,true);
});

test('matching equipment sets activate two-piece and four-piece bonuses',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),slots=['weapon','armor','focus','charm'];value.lootInventory=slots.map((slot,i)=>({id:`g${i}`,name:`Piece ${i}`,slot,rarity:'epic',bonuses:{might:2},tags:[],baseValue:80,v20SetId:'rift-vanguard'}));value.equipment=Object.fromEntries(slots.map((slot,i)=>[slot,`g${i}`]));engine.ensure(value,artifacts,roster);let sets=engine.setBonuses(value);assert.equal(sets.active[0].count,4);assert.equal(sets.stats.might,7);assert.equal(sets.stats.speed,2);assert.equal(sets.stats.defense,3);
});

test('legacy forge creates real V18 inventory pieces and faction reputation unlocks regalia',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),faction=Object.values(value.v16.factions)[0];faction.reputation=50;const factionSet=engine.unlockedFactionSet(value);assert.match(factionSet,/^faction:/);const before=value.lootInventory.length,result=engine.forgeSetPiece(value,factionSet,'armor');assert.equal(result.ok,true);assert.equal(value.lootInventory.length,before+1);assert.equal(result.item.v20SetId,factionSet);assert.equal(value.v20.stats.setPiecesForged,1);
});

test('mastered equipment can become a signature and awaken at level ten',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),record=value.v20.gear['gear-a'];record.level=6;const sig=engine.nameSignature(value,'gear-a');assert.equal(sig.ok,true);assert.match(sig.name,/Doc Prime/);value.v20.gear['gear-a'].level=10;engine.gearRecord(value,value.lootInventory[0]);assert.equal(value.v20.gear['gear-a'].awakened,true);assert.equal(engine.masteryBonuses(value).skill>=1,true);
});

test('relic attunement respects ally trust and relationship bonds amplify resonance',()=>{
  const value=makeState(),engine=new RelicMasteryEngine();value.v19.records.a.axes.trust=35;assert.equal(engine.attune(value,'relic-a','a',roster).ok,false);value.v19.records.a.axes.trust=85;value.v19.records.a.axes.friendship=80;const attune=engine.attune(value,'relic-a','a',roster);assert.equal(attune.ok,true);value.v20.relics['relic-a'].bond=75;const bonus=engine.relicBonuses(value);assert.equal(Object.values(bonus).some(v=>v>=4),true);
});

test('relic quests can complete and awaken a bonded relic',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),r=value.v20.relics['relic-a'];r.bearerId='hero';r.bond=79;r.purity=80;r.quest.events=['boss'];r.quest.target=1;r.quest.progress=0;r.quest.status='active';const result=engine.progressRelics(value,{type:'boss',outcome:'win'});assert.equal(result.completed.length,1);assert.equal(r.quest.status,'completed');assert.equal(r.awakened,true);assert.equal(value.v20.stats.relicAwakenings,1);
});

test('corruption offers power while purification spends V18 materials to reverse it',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),before=value.v18.wallet.cosmicFragments;const temptation=engine.embraceCorruption(value,'relic-a');assert.equal(temptation.ok,true);assert.equal(temptation.relic.corruption,20);const purified=engine.purify(value,'relic-a');assert.equal(purified.ok,true);assert.equal(purified.relic.corruption,0);assert.equal(value.v18.wallet.cosmicFragments<before,true);assert.equal(value.v20.stats.purifications,1);
});

test('vendor loyalty creates a bounded real price discount',()=>{
  const value=makeState(),engine=new RelicMasteryEngine();for(let i=0;i<30;i++)engine.noteCommerce(value,'purchase',120);const discount=engine.vendorDiscount(value);assert.equal(discount>0,true);assert.equal(discount<=.14,true);assert.equal(engine.discountedPrice(value,100)<100,true);
});

test('nemeses can steal bonded relics and victory restores ownership plus evolution',()=>{
  const value=makeState(),engine=new RelicMasteryEngine();value.v20.relics['relic-a'].bond=60;value.v18.artifactEvolution['relic-a'].level=4;value.v16.nemeses.nem={id:'nem',name:'The Collector',universe:'Earth-Prime',stolenArtifacts:[],status:'active'};const stolen=engine.maybeSteal(value,{type:'boss',outcome:'loss',enemyId:'nem',forceTheft:true});assert.ok(stolen);assert.equal(value.artifacts.includes('relic-a'),false);assert.equal(value.v16.artifactOwners['relic-a'].ownerType,'nemesis');const recovered=engine.recoverFromNemesis(value,'nem');assert.equal(recovered.length,1);assert.equal(value.artifacts.includes('relic-a'),true);assert.equal(value.v18.artifactEvolution['relic-a'].level,4);assert.equal(value.v16.artifactOwners['relic-a'].ownerType,'player');
});

test('relic disputes resolve through V19 relationship consequences',()=>{
  const value=makeState(),engine=new RelicMasteryEngine();value.v20.disputes.push({id:'d1',artifactId:'relic-a',allies:['a','b'],status:'open',spin:5});value.v20.relics['relic-a'].disputedBy=['a','b'];const before=value.v19.records.a.axes.respect,result=engine.resolveDispute(value,'relic-a','a');assert.equal(result.ok,true);assert.equal(value.v20.relics['relic-a'].bearerId,'a');assert.equal(value.v19.records.a.axes.respect>before,true);assert.equal(value.v19.records.b.axes.resentment>5,true);
});

test('awakened relic plus Resonant party bond unlocks Legacy Convergence',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),pair=new global.MultiverseDomain.PartyConsequencesEngine().pair(value,'a','b',roster);Object.assign(pair,{compatibility:95,trust:95,friendship:95,rivalry:0,resentment:0});value.v19.morale=90;Object.assign(value.v20.relics['relic-a'],{awakened:true,bearerId:'hero',status:'owned'});const result=engine.convergence(value);assert.equal(result.ready,true);assert.equal(result.label,'Legacy Convergence');assert.equal(result.statBonus,2);
});

test('V20 epilogues preserve unresolved theft and awakened legacy consequences',()=>{
  const value=makeState(),engine=new RelicMasteryEngine(),r=value.v20.relics['relic-a'];r.status='stolen';assert.equal(engine.epilogue(value).id,'unfinished-recovery');r.status='owned';r.awakened=true;assert.equal(engine.epilogue(value).id,'relic-bond');
});
