'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
require('../js/domain/v13-engine.js');
require('../js/domain/v14-engine.js');
require('../js/domain/v15-engine.js');
require('../js/domain/v16-engine.js');
require('../js/domain/v17-engine.js');
const {V18_SCHEMA_VERSION,EconomyCraftingEngine,migrateV18,RARITY_TIERS}=require('../js/domain/v18-engine.js');

const artifacts=[
  {id:'relic-a',name:'Relic A',powers:['one','two'],bonuses:{energy:4,hax:2}},
  {id:'relic-b',name:'Relic B',powers:['one','two','three'],bonuses:{defense:6}},
  {id:'relic-c',name:'Relic C',powers:['one'],bonuses:{skill:2}}
];
function state(seed=1801){return migrateV18({seed,spin:5,credits:5000,customCharacter:{homeworld:'Earth-Prime'},party:[],kits:[],artifacts:[],balanceMode:'roguelite'},artifacts);}

test('V18 migration preserves Credits and is idempotent',()=>{
  const value=state(),snapshot=JSON.stringify(value);migrateV18(value,artifacts);
  assert.equal(JSON.stringify(value),snapshot);assert.equal(value.v18.schemaVersion,V18_SCHEMA_VERSION);assert.equal(value.v18.wallet.credits,5000);assert.equal(value.credits,5000);
});

test('markets are deterministic for the same world tick and demand moves prices',()=>{
  const engine=new EconomyCraftingEngine(),a=state(),b=state(),ma=engine.rotateMarket(a,artifacts),mb=engine.rotateMarket(b,artifacts);
  assert.deepEqual(ma.offers,mb.offers);const offer=ma.offers.find(item=>item.kind==='equipment'&&item.currency==='credits');assert.ok(offer);const before=engine.marketPrice(a,offer.baseValue,offer.rarity,'equipment',ma.vendor);a.v18.markets[ma.key].demand.equipment=4;const after=engine.marketPrice(a,offer.baseValue,offer.rarity,'equipment',ma.vendor);assert.equal(after>before,true);
});

test('purchased equipment can be equipped and contributes bonuses',()=>{
  const engine=new EconomyCraftingEngine(),value=state(),market=engine.rotateMarket(value,artifacts),offer=market.offers.find(item=>item.kind==='equipment'&&item.currency==='credits'),credits=value.credits,result=engine.buy(value,offer,artifacts);
  assert.equal(result.ok,true);assert.equal(value.credits<credits,true);assert.equal(value.lootInventory.length,1);assert.equal(engine.equip(value,value.lootInventory[0].id).ok,true);const bonus=engine.equippedBonuses(value);assert.equal(Object.values(bonus.stats).some(amount=>amount>0),true);assert.equal(bonus.tags.length>0,true);
});

test('crafting consumes materials and forbidden crafting raises corruption',()=>{
  const engine=new EconomyCraftingEngine(),value=state();engine.addCurrency(value,'salvage',100);engine.addCurrency(value,'cosmicFragments',20);engine.addCurrency(value,'voidMarks',10);const world=value.v16.universes['earth-prime'],before=world.corruption,result=engine.craft(value,'forbidden');
  assert.equal(result.ok,true);assert.equal(result.item.rarity,'forbidden');assert.equal(result.item.cursed,true);assert.equal(world.corruption,before+4);assert.equal(value.v18.wallet.voidMarks,7);
});

test('salvage enchant and transmute mutate gear without duplicating inventory',()=>{
  const engine=new EconomyCraftingEngine(),value=state();engine.addCurrency(value,'salvage',100);engine.addCurrency(value,'cosmicFragments',20);const crafted=engine.craft(value,'field-forge').item,id=crafted.id,count=value.lootInventory.length;
  assert.equal(engine.enchant(value,id).ok,true);assert.equal(engine.transmute(value,id).ok,true);assert.equal(value.lootInventory.length,count);const salvaged=engine.salvageEquipment(value,id);assert.equal(salvaged.ok,true);assert.equal(value.lootInventory.length,count-1);assert.equal(value.v18.wallet.salvage>0,true);
});

test('artifact fusion consumes one relic and evolves the survivor',()=>{
  const engine=new EconomyCraftingEngine(),value=state();value.artifacts=['relic-a','relic-b'];engine.syncArtifactEvolution(value,artifacts);engine.addCurrency(value,'salvage',20);engine.addCurrency(value,'cosmicFragments',5);const result=engine.fuseArtifacts(value,'relic-a','relic-b',artifacts);
  assert.equal(result.ok,true);assert.deepEqual(value.artifacts,['relic-a']);assert.equal(value.v18.artifactEvolution['relic-a'].level,2);assert.equal(value.v18.artifactEvolution['relic-b'],undefined);assert.equal(value.v18.stats.artifactFusions,1);
});

test('contracts accept and pay currencies after matching events',()=>{
  const engine=new EconomyCraftingEngine(),value=state(),contract=value.v18.contracts.find(item=>item.status==='offered');contract.events=['battle'];contract.requiredOutcome='win';contract.target=1;contract.reward={credits:100,bountySeals:2,cosmicFragments:0,salvage:0};assert.equal(engine.acceptContract(value,contract.id).ok,true);const before=value.credits,completed=engine.progressContracts(value,{type:'battle',outcome:'win'});
  assert.equal(completed.length,1);assert.equal(contract.status,'completed');assert.equal(value.credits,before+100);assert.equal(value.v18.wallet.bountySeals,2);
});

test('artifact evolution bonuses scale but stay tied to owned evolution records',()=>{
  const engine=new EconomyCraftingEngine(),value=state();value.artifacts=['relic-a'];engine.syncArtifactEvolution(value,artifacts);value.v18.artifactEvolution['relic-a'].level=4;const bonus=engine.artifactEvolutionBonuses(value);assert.equal(Object.values(bonus).reduce((sum,v)=>sum+v,0)>0,true);assert.equal(RARITY_TIERS.length,8);
});
