'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/domain/v14-engine.js');
const {
  V15_SCHEMA_VERSION,HERO_FILE_SCHEMA,HeroProgressionEngine,HeroArchiveEngine,NetworkProtocolEngine,migrateV15
}=require('../js/domain/v15-engine.js');
const {CharacterCreationEngine,ABILITY_KEYS,LINEAGES,CALLINGS,BACKGROUNDS,SKILLS}=globalThis.MultiverseDomain;

function state(){
  const sheet=new CharacterCreationEngine().createSheet(new CharacterCreationEngine().defaults()).sheet;
  return migrateV15({customCharacter:{name:'Alex',codename:'Riftwalker',v14:sheet},kits:[],activePowerSets:[],abilityLoadout:[]});
}

test('hero progression begins at level one and grants allocatable points from XP',()=>{
  const engine=new HeroProgressionEngine(),value=state(),start=engine.summary(value);
  assert.equal(start.level,1);assert.equal(start.unspentAbilityPoints,0);assert.equal(start.activePowerSets,1);assert.equal(start.techniqueSlots,2);
  const result=engine.award(value,300,'Test arc','arc-1');assert.equal(result.level,3);assert.equal(result.levels,2);assert.equal(engine.summary(value).unspentAbilityPoints,2);
  assert.equal(engine.allocate(value,'agility').ok,true);assert.equal(engine.allocate(value,'intellect').ok,true);
  const sheet=engine.effectiveSheet(value);assert.equal(sheet.level,3);assert.equal(sheet.abilities.agility,11);assert.equal(sheet.abilities.intellect,12);assert.equal(sheet.derived.speed>20,true);
  assert.equal(engine.award(value,300,'Duplicate','arc-1').duplicate,true);
});

test('power sources, technique slots, and transformations unlock gradually',()=>{
  const engine=new HeroProgressionEngine();
  assert.deepEqual([1,4,5,9,10].map(level=>engine.activePowerSetLimit(level)),[1,1,2,2,3]);
  assert.deepEqual([1,3,6,10,15].map(level=>engine.techniqueSlotLimit(level)),[2,3,4,5,6]);
  assert.equal(engine.unlockedTechniqueCount(1,1),2);assert.equal(engine.unlockedTechniqueCount(9,1),4);
  assert.equal(engine.formLevel(0,'global'),3);assert.equal(engine.formLevel(0,'source'),4);assert.equal(engine.formLevel(2,'source'),8);
});

test('portable hero files validate creation rules and never contain progression',()=>{
  const files=new HeroArchiveEngine(),config=new CharacterCreationEngine().defaults();
  Object.assign(config,{pronouns:'they/them',appearance:'A coat stitched with maps.',drive:'Restore the erased city.'});
  const exported=files.create(config,'');assert.equal(exported.ok,true);assert.equal(exported.file.schema,HERO_FILE_SCHEMA);assert.equal(exported.file.rules.startingLevel,1);assert.equal('progression' in exported.file.hero,false);
  const imported=files.parse(JSON.stringify(exported.file));assert.equal(imported.ok,true);assert.equal(imported.startingLevel,1);assert.equal(imported.config.pronouns,'they/them');
  const tampered=JSON.parse(JSON.stringify(exported.file));tampered.hero.abilities.power=99;assert.match(files.parse(tampered).errors.join(' '),/checksum/i);
});

test('network invitation codes round-trip without losing SDP or seat identity',()=>{
  const network=new NetworkProtocolEngine(),offer={protocol:network.protocol,kind:'offer',sessionId:'table-test',playerId:'player-10',iceServers:[{urls:'stun:test.invalid'}],description:{type:'offer',sdp:'v=0\r\na=ice-ufrag:test ✓'}};
  const decoded=network.decode(network.encode(offer));assert.equal(decoded.ok,true);assert.deepEqual(decoded.value,offer);
  assert.equal(network.decode('not-an-invite').ok,false);assert.equal(network.validMessage(network.envelope('snapshot',{revision:2})),true);
});

test('V15 expands creator choice without breaking the shared V14 model',()=>{
  assert.equal(V15_SCHEMA_VERSION,15);assert.equal(Object.keys(LINEAGES).length>=12,true);assert.equal(Object.keys(CALLINGS).length>=10,true);assert.equal(Object.keys(BACKGROUNDS).length>=12,true);assert.equal(Object.keys(SKILLS).length>=18,true);
  const engine=new CharacterCreationEngine(),config=engine.defaults();config.lineage='spirit';config.calling='trickster';config.background='performer';config.proficiencies=['medicine','piloting'];
  const result=engine.createSheet(config);assert.equal(result.ok,true);assert.equal(result.sheet.lineageLabel,'Spirit-Touched');assert.equal(result.sheet.skills.performance.proficient,true);assert.equal(ABILITY_KEYS.every(key=>Number.isFinite(result.sheet.derived[{power:'might',agility:'speed',endurance:'defense',intellect:'mind',insight:'hax',presence:'energy'}[key]])),true);
});

test('V15 migration is stable and preserves unrelated run fields',()=>{
  const value={seed:15,custom:'keep'},once=migrateV15(value),snapshot=JSON.stringify(once),twice=migrateV15(once);
  assert.equal(JSON.stringify(twice),snapshot);assert.equal(twice.custom,'keep');assert.equal(twice.v15.schemaVersion,15);assert.equal(twice.v15.progression.level,1);
});
