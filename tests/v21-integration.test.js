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
require('../js/domain/v20-engine.js');
const {FactionCampaignEngine,migrateV21}=require('../js/domain/v21-engine.js');
const {v21FacilitySupport}=require('../js/v21-integration.js');

const roster=[
  {id:'a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['healing','support','magic']},
  {id:'b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed','martial']},
  {id:'c',name:'Cipher',universe:'Earth-Prime',role:'tactician',tags:['tech','strategy']}
];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
function makeState(seed=21111){
  const state=migrateV21({seed,spin:12,credits:9000,customCharacter:{codename:'Bridge Tester',homeworld:'Earth-Prime',stats:{skill:78}},party:['a','b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'}},artifacts,roster);
  Object.assign(state.v18.wallet,{salvage:1200,cosmicFragments:240,voidMarks:30,bountySeals:30});state.v18.wallet.credits=state.credits;
  for(const f of Object.values(state.v16.factions))f.reputation=70;
  return state;
}
function setup(state){
  const engine=new FactionCampaignEngine(),ids=Object.keys(state.v16.factions),id=ids[0];assert.equal(engine.joinFaction(state,id,roster).ok,true);Object.assign(state.v21.memberships[id],{rank:6,rankXp:400,authority:80});state.v16.factions[id].reputation=80;const territory=Object.values(state.v21.territories)[0];territory.controllerFactionId=id;territory.contested=false;const built=engine.buildStronghold(state,{territoryId:territory.id,factionId:id});assert.equal(built.ok,true);return{engine,id,ids,territory,hold:state.v21.strongholds[built.stronghold.id]};
}
function level(engine,state,hold,type,target){let result;while((state.v21.facilities[`${hold.id}:${type}`]?.level||0)<target){result=engine.buildFacility(state,hold.id,type);assert.equal(result.ok,true);}return state.v21.facilities[`${hold.id}:${type}`];}

test('facility support reports live facilities and assigned specialists',()=>{const state=makeState(),{engine,hold}=setup(state);level(engine,state,hold,'forge',2);assert.equal(engine.assignSpecialist(state,hold.id,'a','smith').ok,true);const s=v21FacilitySupport(state);assert.equal(s.forge,2);assert.equal(s.smith,1);});

test('Faction Regalia uses V20 inventory/mastery and gains Forge discounts instead of a parallel gear system',()=>{const state=makeState(),{engine,id,hold}=setup(state);level(engine,state,hold,'forge',2);state.v21.stats.campaignsWon=1;const relics=new MultiverseDomain.RelicMasteryEngine(),setId=`faction:${id}`;assert.ok(relics.availableSets(state).some(s=>s.id===setId));const before={salvage:state.v18.wallet.salvage,fragments:state.v18.wallet.cosmicFragments},result=relics.forgeSetPiece(state,setId,'weapon');assert.equal(result.ok,true);assert.ok(result.v21Refund.salvage>0);assert.ok(state.lootInventory.some(i=>i.id===result.item.id));assert.ok(state.v20.gear[result.item.id]);assert.ok(result.item.tags.includes('faction-signature-ready'));assert.ok(state.v18.wallet.salvage<before.salvage);assert.ok(state.v18.wallet.cosmicFragments<before.fragments);});

test('Training Hall adds bounded bonus mastery through V20 gainGearMastery',()=>{const state=makeState(),{engine,hold}=setup(state),relics=new MultiverseDomain.RelicMasteryEngine(),record=relics.gearRecord(state,state.lootInventory[0]);record.xp=0;level(engine,state,hold,'training',3);relics.gainGearMastery(state,{type:'training',outcome:'win'});assert.ok(record.xp>10);assert.ok(record.xp<=20);});

test('Relic Vault strengthens V20 purification while retaining the same relic record',()=>{const state=makeState(),{engine,hold}=setup(state),relics=new MultiverseDomain.RelicMasteryEngine();level(engine,state,hold,'vault',1);const relic=relics.relicRecord(state,'relic-a',artifacts[0]);relic.corruption=60;relic.purity=35;const result=relics.purify(state,'relic-a');assert.equal(result.ok,true);assert.ok(result.v21VaultBonus>0);assert.equal(state.v20.relics['relic-a'],relic);assert.ok(relic.corruption<30);assert.ok(relic.purity>53);});

test('Medical Bay accelerates V19 recovery without replacing wound state',()=>{const state=makeState(),{engine,hold}=setup(state),party=new MultiverseDomain.PartyConsequencesEngine();level(engine,state,hold,'medical',2);state.v19.morale=40;party.wound(state,'a','minor','test wound');const before=state.v19.morale,result=party.healWound(state,'a');assert.equal(result.ok,true);assert.ok(result.v21RecoveryBonus>=4);assert.ok(state.v19.morale>before);assert.equal(state.v19.records.a.wounds.length,0);});

test('Portal Nexus reveals only a bounded number of real V17 routes',()=>{const state=makeState(),{engine,hold}=setup(state);level(engine,state,hold,'portal',3);for(const f of Object.values(state.v16.factions))f.reputation=0;state.v16.nemeses={};for(const world of Object.values(state.v16.universes)){world.corruption=0;world.visits=0;}const reality=new MultiverseDomain.RealityRulesEngine(),routes=reality.routesFor(state,state.v16.currentUniverse);for(const route of routes.filter(r=>r.secret)){route.unlocked=false;route.discovered=false;}state.v21.portalUnlocks=[];reality.refreshUnlocks(state);const portal=routes.filter(r=>r.v21PortalUnlocked);assert.ok(portal.length>=1);assert.ok(portal.length<=3);assert.equal(state.v21.portalUnlocks.length,portal.length);});

test('Quartermaster adds a logistics offer to the existing V18 market',()=>{const state=makeState(),{engine,hold}=setup(state);level(engine,state,hold,'quartermaster',2);const market=new MultiverseDomain.EconomyCraftingEngine().rotateMarket(state,artifacts),offer=market.offers.find(o=>o.v21Logistics);assert.ok(offer);assert.equal(offer.kind,'material');assert.equal(offer.currency,'credits');assert.ok(offer.grant.salvage>0);});

test('emergency resupply spends authoritative Credits and restores V21 supply',()=>{const state=makeState(),{engine,hold}=setup(state);level(engine,state,hold,'quartermaster',1);hold.supply=25;const before=state.credits,result=engine.resupplyStronghold(state,hold.id);assert.equal(result.ok,true);assert.ok(state.credits<before);assert.ok(hold.supply>25);assert.ok(hold.supply<=100);});

test('V21 offline catch-up is bounded and never deletes a player stronghold',()=>{const state=makeState(),{engine,ids,territory,hold}=setup(state);hold.integrity=18;hold.supply=20;territory.controllerFactionId=ids[1];state.v21.lastWorldTick=1;state.v16.clock.tick=40;const result=engine.catchUp(state,6);assert.equal(result.ticks,6);assert.ok(state.v21.strongholds[hold.id]);assert.ok(hold.integrity>=1);assert.equal(state.v21.lastWorldTick,40);assert.equal(state.v16.clock.tick,40);});

test('Command support and faction technique remain inside V21 combat caps',()=>{const state=makeState(),{engine,id,hold}=setup(state);level(engine,state,hold,'command',3);const c=engine.createCampaign(state,id,'border-war').campaign;c.momentum=40;hold.supply=100;const mod=engine.campaignCombatModifier(state);assert.ok(mod.odds<=.06&&mod.odds>=-.06);assert.ok(mod.damage<=.08&&mod.damage>=-.08);assert.ok(engine.factionGearUnlocks(state,id).technique);});
