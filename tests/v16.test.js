'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
const {V16_SCHEMA_VERSION,OFFLINE_TICK_MS,LivingMultiverseEngine,migrateV16}=require('../js/domain/v16-engine.js');
const roster=[
  {id:'hero',name:'Hero',universe:'Prime',stats:{}},
  {id:'rival',name:'Rival',universe:'Elsewhere',stats:{}}
];
function make(){return migrateV16({seed:42,baseId:'hero',party:[],kits:[],artifacts:[],customCharacter:{homeworld:'Prime'},v14:{intent:{stance:'protect'}}},roster);}

test('V16 migration creates deterministic living-world state and is idempotent',()=>{
  const state=make(),snapshot=JSON.stringify(state);migrateV16(state,roster);assert.equal(JSON.stringify(state),snapshot);assert.equal(state.v16.schemaVersion,V16_SCHEMA_VERSION);assert.equal(Object.keys(state.v16.factions).length,6);assert.equal(Object.keys(state.v16.universes).length>=1,true);
});

test('advancing the same seeded state yields the same world event',()=>{
  const a=make(),b=make(),engine=new LivingMultiverseEngine();const ea=engine.advance(a,{roster,universe:'Prime',type:'battle',label:'Test battle'}),eb=engine.advance(b,{roster,universe:'Prime',type:'battle',label:'Test battle'});assert.equal(ea.tick,1);assert.deepEqual(a.v16.factions,b.v16.factions);assert.deepEqual(a.v16.universes,b.v16.universes);assert.equal(ea.event?.title,eb.event?.title);
});

test('nemeses grow and affect pressure',()=>{
  const state=make(),engine=new LivingMultiverseEngine();engine.registerNemesis(state,roster[1],'Defeated the hero');const base=engine.pressure(state,{enemyId:'rival'}).oddsDelta;for(let i=0;i<6;i++)engine.advance(state,{roster,universe:'Elsewhere'});const nemesis=state.v16.nemeses.rival;assert.equal(nemesis.level>=3,true);assert.equal(engine.pressure(state,{enemyId:'rival'}).oddsDelta<=base,true);
});

test('travel changes the focused universe and records memory',()=>{
  const state=make(),engine=new LivingMultiverseEngine();engine.travel(state,'Elsewhere');assert.equal(state.v16.currentUniverse,'Elsewhere');assert.equal(state.v16.stats.travels,1);assert.match(state.v16.memory[0].title,/Elsewhere/);
});

test('offline catch-up is capped and records that the multiverse moved',()=>{
  const state=make(),engine=new LivingMultiverseEngine(),start=state.v16.clock.lastRealAt;const result=engine.catchUp(state,{now:start+OFFLINE_TICK_MS*30,roster});assert.equal(result.ticks,12);assert.equal(state.v16.clock.offlineTicks,12);assert.equal(state.v16.memory.some(item=>/while you were away/.test(item.title)),true);
});
