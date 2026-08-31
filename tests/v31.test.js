'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../js/data/world-content.js');
require('../js/data/world-content-v27.js');
require('../js/data/world-content-v30.js');
require('../js/domain/v27-engine.js');
const {migrateV28}=require('../js/domain/v28-engine.js');
const {migrateV30}=require('../js/domain/v30-engine.js');
const {V31_SCHEMA_VERSION,DynamicSceneEngine,migrateV31}=require('../js/domain/v31-engine.js');

const make=()=>migrateV31(migrateV30(migrateV28({
  seed:31031,
  spin:7,
  customCharacter:{homeworld:'Earth-Prime'},
  v26:{schemaVersion:26,assignments:{},favorites:[],recent:[],settings:{},stats:{}},
  v27:{schemaVersion:27,contexts:{},discoveries:[],settings:{contextSlots:6,atlasPageSize:72,showMegaContext:true},stats:{}},
  v28:{schemaVersion:28,atlas:{},inspector:{},stats:{}}
})));
const event=(ref='threat-a')=>({id:`event-${ref}`,type:'battle',ref,label:'Citadel Ambush',sub:'Earth-Prime'});

test('V31 migration is idempotent, imports V29 preferences, and preserves V30 state',()=>{
  const state=make(),before=JSON.stringify(state.v30);
  delete state.v31;
  state.v29={settings:{enabled:false,slots:5,avoidRepeat:9,historyLimit:16},history:[],remixByEvent:{},stats:{sceneRemixes:2}};
  migrateV31(state);
  assert.equal(state.v31.settings.enabled,false);
  assert.equal(state.v31.settings.slots,5);
  assert.equal(state.v31.stats.sceneRemixes,2);
  assert.equal(state.v31.schemaVersion,V31_SCHEMA_VERSION);
  assert.equal(JSON.stringify(state.v30),before);
  const once=JSON.stringify(state);
  migrateV31(state);
  assert.equal(JSON.stringify(state),once);
});

test('V31 scene composition stages unique context-aware V30 assets',()=>{
  const state=make(),engine=new DynamicSceneEngine(),scene=engine.compose(state,event());
  assert.ok(scene);
  assert.equal(scene.release,31);
  assert.equal(scene.assetIds.length,4);
  assert.equal(new Set(scene.assetIds).size,4);
  assert.equal(scene.usageTarget,'operation');
  assert.equal(scene.universe,'Earth-Prime');
  assert.ok(engine.assets(scene).every(asset=>asset.release===30));
});

test('same V31 event composition is stable and does not duplicate history',()=>{
  const state=make(),engine=new DynamicSceneEngine(),first=engine.compose(state,event()),count=state.v31.stats.scenesComposed,second=engine.compose(state,event());
  assert.deepEqual(second,first);
  assert.equal(state.v31.history.length,1);
  assert.equal(state.v31.stats.scenesComposed,count);
});

test('V31 staged assets use the existing V30 discovery authority',()=>{
  const state=make(),engine=new DynamicSceneEngine(),scene=engine.compose(state,event());
  for(const id of scene.assetIds)assert.ok(state.v30.discoveries.includes(id));
  assert.equal(state.v31.discoveries,undefined);
});

test('V31 remix changes only visual variation and creates no gameplay authority',()=>{
  const state=make(),engine=new DynamicSceneEngine(),pending=event(),pendingBefore=JSON.stringify(pending),first=engine.compose(state,pending),next=engine.remix(state,pending);
  assert.equal(next.variation,1);
  assert.notEqual(next.id,first.id);
  assert.equal(JSON.stringify(pending),pendingBefore);
  assert.equal(state.v31.stats.sceneRemixes,1);
  for(const key of ['wallet','currency','inventory','combat','factions','settlements','operations','activities','crises','party','relics'])assert.equal(state.v31[key],undefined);
});

test('V31 avoids recent scene assets when another event uses the same profile',()=>{
  const state=make(),engine=new DynamicSceneEngine(),first=engine.compose(state,event('a'));
  state.spin=8;
  const second=engine.compose(state,event('b'));
  assert.equal(first.assetIds.some(id=>second.assetIds.includes(id)),false);
});

test('disabled V31 staging does not compose a scene',()=>{
  const state=make(),engine=new DynamicSceneEngine();
  state.v31.settings.enabled=false;
  assert.equal(engine.compose(state,event()),null);
  assert.equal(state.v31.history.length,0);
});

test('V31 scene history and settings stay bounded',()=>{
  const state=make(),engine=new DynamicSceneEngine();
  state.v31.settings.historyLimit=999;
  state.v31.settings.slots=99;
  engine.ensure(state);
  assert.equal(state.v31.settings.historyLimit,40);
  assert.equal(state.v31.settings.slots,6);
  for(let i=0;i<45;i++){
    state.spin=i+1;
    engine.compose(state,{type:'rare',ref:`r${i}`,label:`Rare ${i}`});
  }
  assert.equal(state.v31.history.length,40);
});
