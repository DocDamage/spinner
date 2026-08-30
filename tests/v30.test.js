'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
for(const version of [13,14,15,16,17,18,19,20,21,22,23,24,25])require(`../js/domain/v${version}-engine.js`);
require('../js/data/world-content.js');require('../js/world-asset-art.js');require('../js/domain/v26-engine.js');
require('../js/data/world-content-v27.js');require('../js/world-asset-art-v27.js');require('../js/domain/v27-engine.js');
const {migrateV28}=require('../js/domain/v28-engine.js');
const {WORLD_CONTENT_V30_ADDED,WORLD_CONTENT_CATALOG_V30,WORLD_CONTENT_META_V30}=require('../js/data/world-content-v30.js');
const {V30_SCHEMA_VERSION,WorldExpansionEngine,migrateV30,WORLD_CONTENT_GROUPS_V30}=require('../js/domain/v30-engine.js');

const make=()=>{
  const state=migrateV28({seed:30030,spin:30,customCharacter:{homeworld:'Earth-Prime'},v26:{schemaVersion:26,assignments:{},favorites:[],recent:[],settings:{},stats:{}},v27:{schemaVersion:27,contexts:{},discoveries:[],settings:{},stats:{}}});
  return migrateV30(state);
};

test('V30 migration is idempotent and preserves V28 state',()=>{
  const state=make(),before=JSON.stringify(state.v28),once=JSON.stringify(state);
  migrateV30(state);
  assert.equal(state.v30.schemaVersion,V30_SCHEMA_VERSION);
  assert.equal(JSON.stringify(state.v28),before);
  assert.equal(JSON.stringify(state),once);
});

test('V30 catalog exposes exact release totals and family counts',()=>{
  assert.equal(WORLD_CONTENT_V30_ADDED.length,4704);
  assert.equal(WORLD_CONTENT_CATALOG_V30.length,6616);
  assert.equal(WORLD_CONTENT_META_V30.baseTotal,1912);
  assert.equal(WORLD_CONTENT_META_V30.addedTotal,4704);
  assert.equal(Object.keys(WORLD_CONTENT_META_V30.counts).length,40);
  assert.equal(WORLD_CONTENT_META_V30.newFamilies.length,15);
});

test('V30 context preserves legacy prefix and enriches to eight visuals',()=>{
  const state=make(),engine=new WorldExpansionEngine(),legacy=[...(state.v27.contexts['world:Earth-Prime']?.assetIds||[])],assets=engine.context(state,'world','Earth-Prime',{slots:8});
  assert.equal(assets.length,8);
  assert.deepEqual(assets.slice(0,legacy.length).map(asset=>asset.id),legacy);
  assert.ok(assets.some(asset=>asset.release===30));
});

test('V30 field encounters are deterministic and fill all six roles',()=>{
  const state=make(),engine=new WorldExpansionEngine(),a=engine.encounter(state,'world','Earth-Prime',{difficulty:4,salt:'unit',record:false}),b=engine.encounter(state,'world','Earth-Prime',{difficulty:4,salt:'unit',record:false});
  assert.deepEqual(a,b);
  assert.deepEqual(Object.keys(a.resolvedAssets).sort(),['actor','mobility','pressure','reward','scene','support']);
  assert.ok(Object.values(a.resolvedAssets).every(asset=>asset.release===30));
  assert.equal(a.mcguffin,a.resolvedAssets.reward.kind==='relic');
});

test('recorded V30 encounters update bounded state without adding inventory authority',()=>{
  const state=make(),engine=new WorldExpansionEngine();
  for(let i=0;i<30;i++)engine.encounter(state,'operation','unit-op',{salt:`record-${i}`,record:true});
  assert.equal(state.v30.stats.encountersGenerated,30);
  assert.ok(state.v30.encounterLog.length<=24);
  assert.equal(state.v30.inventory,undefined);
  assert.equal(state.v30.wallet,undefined);
  assert.equal(state.v30.party,undefined);
});

test('V30 travel plans are deterministic and use valid travel families',()=>{
  const state=make(),engine=new WorldExpansionEngine(),a=engine.travelPlan(state,'Earth-Prime','Arcology',{record:false}),b=engine.travelPlan(state,'Earth-Prime','Arcology',{record:false});
  assert.deepEqual(a,b);
  assert.ok(['route','portal','transit'].includes(a.route.kind));
  assert.ok(['vehicle','mount'].includes(a.transport.kind));
  assert.ok(['weather','anomaly','hazard'].includes(a.conditions.kind));
  assert.ok(a.stop&&a.encounter);
});

test('V30 discovery history is bounded and resolves only catalog assets',()=>{
  const state=make(),engine=new WorldExpansionEngine();
  for(const asset of WORLD_CONTENT_V30_ADDED.slice(0,260))engine.markDiscovered(state,asset.id);
  assert.equal(state.v30.discoveries.length,240);
  assert.ok(state.v30.discoveries.every(id=>engine.find(id)));
});

test('V30 browsing groups expose structures, world, travel, gear, people, adventure, and ui',()=>{
  assert.deepEqual(Object.keys(WORLD_CONTENT_GROUPS_V30).sort(),['adventure','gear','people','structures','travel','ui','world']);
  assert.ok(WORLD_CONTENT_GROUPS_V30.adventure.includes('dungeon'));
  assert.ok(WORLD_CONTENT_GROUPS_V30.travel.includes('mount'));
  assert.ok(WORLD_CONTENT_GROUPS_V30.gear.includes('relic'));
});
