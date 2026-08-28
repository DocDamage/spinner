'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
const {migrateV16}=require('../js/domain/v16-engine.js');
const {V17_SCHEMA_VERSION,RealityRulesEngine,migrateV17,CHAIN_DEFINITIONS}=require('../js/domain/v17-engine.js');

function state(seed=1701){
  const value={seed,spin:4,customCharacter:{homeworld:'Earth-Prime'},balanceMode:'roguelite',party:[],kits:[],artifacts:[]};
  migrateV16(value,[]);return migrateV17(value,[]);
}

test('V17 migration is idempotent and Universe DNA is deterministic',()=>{
  const first=state(),snapshot=JSON.stringify(first),second=state();migrateV17(first,[]);
  assert.equal(JSON.stringify(first),snapshot);assert.deepEqual(first.v17.universeDNA,second.v17.universeDNA);
  const dna=Object.values(first.v17.universeDNA)[0];assert.equal(first.v17.schemaVersion,V17_SCHEMA_VERSION);assert.equal(Object.keys(dna.laws).length,6);assert.equal(dna.amplifiedTags.length,2);assert.equal(dna.suppressedTags.length,2);
});

test('each reality receives branching routes with gated secret destinations',()=>{
  const engine=new RealityRulesEngine(),value=state(),world=value.v16.universes['earth-prime'];let routes=engine.routesFor(value,'Earth-Prime');
  assert.equal(routes.length,7);assert.equal(routes.filter(route=>route.secret).length,2);assert.equal(routes.some(route=>route.secret&&!route.unlocked),true);
  world.corruption=80;world.visits=5;Object.values(value.v16.factions).forEach(faction=>faction.reputation=60);value.v16.nemeses.local={id:'local',name:'Local Nemesis',universe:'Earth-Prime',status:'hunting'};
  engine.refreshUnlocks(value);routes=engine.routesFor(value,'Earth-Prime');assert.equal(routes.filter(route=>route.secret&&route.unlocked).length>=1,true);
});

test('faction quests accept, progress, and award persistent reputation and Favor',()=>{
  const engine=new RealityRulesEngine(),value=state(),faction=Object.values(value.v16.factions)[0],quest=engine.makeQuest(value,faction,'battle',99);quest.target=1;quest.universe='Earth-Prime';value.v17.quests.push(quest);
  assert.equal(engine.acceptQuest(value,quest.id).ok,true);const before=faction.reputation,completed=engine.progressEvent(value,{type:'battle',outcome:'win',universe:'Earth-Prime',eventId:'battle-win-1'});
  assert.equal(completed.length,1);assert.equal(quest.status,'completed');assert.equal(faction.reputation>before,true);assert.equal(engine.factionFavor(value,faction.id)>=1,true);assert.equal(value.v17.wheel.activeChain?.id,'golden-route');
});

test('Wheel currents provide bounded multi-spin directives and concealment',()=>{
  const engine=new RealityRulesEngine(),value=state(),chain=engine.beginChain(value,'forbidden-current','test');
  assert.equal(chain.remaining,CHAIN_DEFINITIONS['forbidden-current'].duration);const directive=engine.wheelDirective(value);assert.equal(directive.conceal,1);assert.equal(directive.bias.artifact>=1,true);assert.equal(directive.hazard<=.25,true);
  engine.consumeChain(value);assert.equal(value.v17.wheel.activeChain.remaining,2);
});

test('reality strategy/tag modifiers remain inside safety caps',()=>{
  const engine=new RealityRulesEngine(),value=state(),mods=engine.ruleModifiers(value);for(const modifier of Object.values(mods))assert.equal(modifier>=-.12&&modifier<=.12,true);
  const pressure=engine.tagPressure(value,['magic','tech','space','speed']);assert.equal(pressure>=-.045&&pressure<=.035,true);
});

test('faction Favor can stabilize the current reality',()=>{
  const engine=new RealityRulesEngine(),value=state(),faction=Object.values(value.v16.factions)[0],world=value.v16.universes['earth-prime'];value.v17.factionFavor[faction.id]=3;const before=world.stability;
  const result=engine.spendFavor(value,faction.id,'stabilize');assert.equal(result.ok,true);assert.equal(result.cost,2);assert.equal(world.stability>=before,true);assert.equal(engine.factionFavor(value,faction.id),1);
});
