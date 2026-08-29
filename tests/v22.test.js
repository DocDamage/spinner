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
const {FactionCampaignEngine}=require('../js/domain/v21-engine.js');
const {V22_SCHEMA_VERSION,SettlementEngine,migrateV22,NEED_DEFS_V22,CIVILIAN_ACTIONS_V22}=require('../js/domain/v22-engine.js');

const roster=[
  {id:'a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['healing','support','magic']},
  {id:'b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed','martial']},
  {id:'c',name:'Cipher',universe:'Earth-Prime',role:'tactician',tags:['tech','strategy']}
];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
function makeState(seed=22001){
  const state=migrateV22({seed,spin:11,credits:10000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{skill:72}},party:['a','b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'},balanceMode:'roguelite'},artifacts,roster);
  Object.assign(state.v18.wallet,{salvage:1000,cosmicFragments:200,voidMarks:20,bountySeals:20});
  for(const f of Object.values(state.v16.factions))f.reputation=70;
  return state;
}
function factionSetup(state){const f=new FactionCampaignEngine(),ids=Object.keys(state.v16.factions),id=ids[0];f.joinFaction(state,id,roster);Object.assign(state.v21.memberships[id],{rank:5,rankXp:300,authority:70});const t=Object.values(state.v21.territories)[0];t.controllerFactionId=id;t.contested=false;return{f,id,ids,t};}
function strongholdSetup(state){const {f,id,t}=factionSetup(state),result=f.buildStronghold(state,{territoryId:t.id,factionId:id});assert.equal(result.ok,true);return{f,id,t,hold:state.v21.strongholds[result.stronghold.id]};}

test('1. V22 migration is idempotent',()=>{const state=makeState(),engine=new SettlementEngine(),before=JSON.stringify(state);engine.ensure(state,artifacts,roster);assert.equal(state.v22.schemaVersion,V22_SCHEMA_VERSION);assert.equal(JSON.stringify(state),before);});
test('2. V21 faction and stronghold state survives V22 migration',()=>{const state=makeState();const {hold}=strongholdSetup(state);const campaignCount=Object.keys(state.v21.campaigns).length;migrateV22(state,artifacts,roster);assert.ok(state.v21.strongholds[hold.id]);assert.equal(Object.keys(state.v21.campaigns).length,campaignCount);});
test('3. every V21 territory receives one persistent settlement',()=>{const state=makeState();assert.equal(Object.keys(state.v22.settlements).length,Object.keys(state.v21.territories).length);});
test('4. settlement generation is deterministic',()=>{const a=makeState(77),b=makeState(77);assert.deepEqual(a.v22.settlements,b.v22.settlements);});
test('5. settlement metrics remain bounded',()=>{const state=makeState();for(const s of Object.values(state.v22.settlements))for(const key of ['food','housing','health','security','prosperity','morale','infrastructure'])assert.ok(s[key]>=0&&s[key]<=100);});
test('6. current settlement resolves from current V21 world territory',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state);assert.ok(s);assert.ok(state.v21.territories[s.territoryId]);});
test('7. high strategic pressure creates bounded displacement',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),t=state.v21.territories[s.territoryId];t.contested=true;for(const w of Object.values(state.v16.universes)){w.threat=100;w.corruption=100;w.stability=5;}state.v16.clock.tick++;const before=s.displaced;engine.advanceTick(state,state.v16.clock.tick);assert.ok(s.displaced>=before);assert.ok(s.population>=50);});
test('8. background simulation cannot silently erase a settlement',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),t=state.v21.territories[s.territoryId];s.population=55;t.contested=true;for(const w of Object.values(state.v16.universes)){w.threat=100;w.corruption=100;w.stability=0;}for(let i=0;i<30;i++){state.v16.clock.tick++;engine.advanceTick(state,state.v16.clock.tick);}assert.ok(state.v22.settlements[s.id]);assert.ok(s.population>=50);});
test('9. offline catch-up is capped',()=>{const state=makeState(),engine=new SettlementEngine();state.v22.lastWorldTick=0;state.v16.clock.tick=20;const result=engine.catchUp(state,6);assert.equal(result.ticks,6);assert.equal(state.v22.lastWorldTick,20);});
test('10. emergency aid spends the authoritative V18 credit balance',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),before=state.credits,food=s.food;const r=engine.action(state,s.id,'aid',roster);assert.equal(r.ok,true);assert.ok(state.credits<before);assert.ok(s.food>=food);});
test('11. invalid refugee resettlement spends nothing',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state);s.displaced=0;const before=state.credits,r=engine.action(state,s.id,'resettle',roster);assert.equal(r.ok,false);assert.equal(state.credits,before);});
test('12. rebuilding consumes real Salvage and improves infrastructure',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),before=state.v18.wallet.salvage,infra=s.infrastructure;assert.equal(engine.action(state,s.id,'rebuild',roster).ok,true);assert.ok(state.v18.wallet.salvage<before);assert.ok(s.infrastructure>=infra);});
test('13. sanctuary construction requires a safe player stronghold',()=>{const state=makeState(),engine=new SettlementEngine();assert.equal(engine.buildSanctuary(state,'missing').ok,false);});
test('14. sanctuary construction spends V18 resources and persists',()=>{const state=makeState(),engine=new SettlementEngine(),{hold}=strongholdSetup(state),before={credits:state.credits,salvage:state.v18.wallet.salvage},r=engine.buildSanctuary(state,hold.id);assert.equal(r.ok,true);assert.ok(state.credits<before.credits);assert.ok(state.v18.wallet.salvage<before.salvage);assert.ok(state.v22.sanctuaries[r.sanctuary.id]);});
test('15. displaced civilians transfer into available sanctuaries',()=>{const state=makeState(),engine=new SettlementEngine(),{hold}=strongholdSetup(state),x=engine.buildSanctuary(state,hold.id).sanctuary,s=state.v22.settlements[hold.territoryId];s.displaced=120;state.v16.clock.tick++;engine.advanceTick(state,state.v16.clock.tick);assert.ok(state.v22.sanctuaries[x.id].residents>0);assert.ok(s.displaced<120);});
test('16. sanctuary capacity is never exceeded',()=>{const state=makeState(),engine=new SettlementEngine(),{hold}=strongholdSetup(state),x=engine.buildSanctuary(state,hold.id).sanctuary,s=state.v22.settlements[hold.territoryId];s.displaced=x.capacity*3;for(let i=0;i<40;i++){state.v16.clock.tick++;engine.advanceTick(state,state.v16.clock.tick);}assert.ok(state.v22.sanctuaries[x.id].residents<=x.capacity);});
test('17. civilian requests are deterministic and persistent',()=>{const a=makeState(101),b=makeState(101),ea=new SettlementEngine(),eb=new SettlementEngine(),sa=ea.currentSettlement(a),sb=eb.currentSettlement(b),ra=ea.activeRequest(a,sa.id),rb=eb.activeRequest(b,sb.id);assert.deepEqual(ra,rb);});
test('18. civilian requests progress through normal Wheel event types',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),r=engine.activeRequest(state,s.id),before=r.progress;engine.processEvent(state,{id:'request-test',type:r.events[0],outcome:r.requiredOutcome||'success'},roster);assert.ok(r.progress>before);});
test('19. duplicate Wheel event IDs cannot double-progress civilian requests',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),r=engine.activeRequest(state,s.id),ctx={id:'dupe',type:r.events[0],outcome:r.requiredOutcome||'success'};engine.processEvent(state,ctx,roster);const after=r.progress;engine.processEvent(state,ctx,roster);assert.equal(r.progress,after);});
test('20. settlement market modifier is bounded',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state);Object.assign(s,{prosperity:0,security:0,playerOpinion:-100});assert.ok(engine.marketModifier(state)<=.08);Object.assign(s,{prosperity:100,security:100,playerOpinion:100});assert.ok(engine.marketModifier(state)>=-.06);});
test('21. public opinion remains bounded',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state);state.credits=100000;for(let i=0;i<40;i++)engine.action(state,s.id,'aid',roster);assert.ok(s.playerOpinion<=100&&s.playerOpinion>=-100);});
test('22. civilian relief can feed V19 party relationships',()=>{const state=makeState(),engine=new SettlementEngine(),s=engine.currentSettlement(state),before=state.v19.records.a.axes.trust;engine.action(state,s.id,'medical',roster);assert.ok(state.v19.records.a.axes.trust>=before);});
test('23. V22 ending recognizes a durable sanctuary network',()=>{const state=makeState(),engine=new SettlementEngine(),{hold}=strongholdSetup(state);engine.buildSanctuary(state,hold.id);const second=Object.values(state.v21.strongholds)[0];state.v22.sanctuaries.fake={id:'fake',strongholdId:'fake',settlementId:second.territoryId,universe:second.universe,name:'Second Sanctuary',capacity:500,residents:200,safety:80,stockpile:80,morale:80,status:'open',history:[]};state.v22.stats.resettled=450;assert.equal(engine.ending(state).id,'open-doors');});
test('24. summary access is side-effect free after migration',()=>{const state=makeState(),engine=new SettlementEngine(),before=JSON.stringify(state.v22);engine.summary(state);engine.summary(state);assert.equal(JSON.stringify(state.v22),before);});
test('25. V22 catalogs include relief actions and need families',()=>{assert.ok(Object.keys(CIVILIAN_ACTIONS_V22).length>=5);assert.ok(Object.keys(NEED_DEFS_V22).length>=7);});
