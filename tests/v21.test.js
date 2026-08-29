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
const {V21_SCHEMA_VERSION,FactionCampaignEngine,migrateV21,RANKS_V21,CAMPAIGN_DEFS_V21,FACILITY_DEFS_V21}=require('../js/domain/v21-engine.js');

const roster=[
  {id:'a',name:'Aegis',universe:'Earth-Prime',role:'support',tags:['healing','support','magic']},
  {id:'b',name:'Blitz',universe:'Earth-Prime',role:'weaponmaster',tags:['speed','martial']},
  {id:'c',name:'Cipher',universe:'Earth-Prime',role:'tactician',tags:['tech','strategy']}
];
const artifacts=[{id:'relic-a',name:'Chronicle Heart',powers:['time','memory'],bonuses:{mind:4,hax:3}}];
function makeState(seed=21001){
  const state=migrateV21({seed,spin:9,credits:4000,customCharacter:{codename:'Validator',homeworld:'Earth-Prime',stats:{skill:70}},party:['a','b'],kits:[],artifacts:['relic-a'],lootInventory:[{id:'gear-a',name:'Riftblade',kind:'equipment',slot:'weapon',rarity:'rare',bonuses:{might:5,skill:3},tags:['weapon'],baseValue:80}],equipment:{weapon:'gear-a'},balanceMode:'roguelite'},artifacts,roster);
  Object.assign(state.v18.wallet,{salvage:600,cosmicFragments:120,voidMarks:20,bountySeals:20});
  for(const f of Object.values(state.v16.factions))f.reputation=60;
  return state;
}
function primarySetup(state,engine=new FactionCampaignEngine()){
  const ids=Object.keys(state.v16.factions),id=ids[0],r=engine.joinFaction(state,id,roster);assert.equal(r.ok,true);const m=engine.membership(state,id);m.rank=5;m.rankXp=260;m.authority=60;state.v16.factions[id].reputation=70;return{id,ids,m,engine};
}
function controlledTerritory(state,factionId){const t=Object.values(state.v21.territories)[0];t.controllerFactionId=factionId;t.contested=false;return t;}
function completeCampaignOperations(state,engine,campaign){while(campaign.phase==='operations'){const objective=campaign.objectives[campaign.phaseIndex];for(let i=objective.progress;i<objective.target;i++)engine.progressCampaign(state,{type:objective.events[0],outcome:objective.requiredOutcome||'success',factionId:campaign.factionId});}}

test('1. V21 migration is idempotent',()=>{const state=makeState(),engine=new FactionCampaignEngine(),before=JSON.stringify(state);engine.ensure(state,artifacts,roster);assert.equal(state.v21.schemaVersion,V21_SCHEMA_VERSION);assert.equal(JSON.stringify(state),before);});

test('2. V20 state survives V21 migration',()=>{const state=makeState();state.v20.relics['relic-a'].bond=77;state.v20.gear['gear-a'].level=6;migrateV21(state,artifacts,roster);assert.equal(state.v20.relics['relic-a'].bond,77);assert.equal(state.v20.gear['gear-a'].level,6);});

test('3. joining faction creates one valid primary membership',()=>{const state=makeState(),engine=new FactionCampaignEngine(),ids=Object.keys(state.v16.factions);assert.equal(engine.joinFaction(state,ids[0],roster).ok,true);assert.equal(state.v21.primaryFactionId,ids[0]);assert.equal(engine.membership(state,ids[0]).status,'member');assert.equal(engine.joinFaction(state,ids[1],roster).ok,false);});

test('4. faction rank progression is bounded',()=>{const state=makeState(),{id,m,engine}=primarySetup(state);m.rank=1;m.rankXp=9999;m.authority=100;state.v16.factions[id].reputation=100;engine.addRankXp(state,id,1,'test');assert.equal(m.rank,8);assert.equal(RANKS_V21[m.rank-1].label,'Regent');assert.equal(engine.promote(state,id).ok,false);});

test('5. Authority is separate from reputation',()=>{const state=makeState(),engine=new FactionCampaignEngine(),id=Object.keys(state.v16.factions)[0];state.v16.factions[id].reputation=44;engine.joinFaction(state,id,roster);const before=state.v16.factions[id].reputation;engine.adjustAuthority(state,id,23,'test');assert.equal(engine.authority(state,id)>=23,true);assert.equal(state.v16.factions[id].reputation,before);});

test('6. leaving faction preserves historical membership',()=>{const state=makeState(),{id,engine}=primarySetup(state),joined=engine.membership(state,id).joinedTick;const result=engine.leaveFaction(state,id,roster);assert.equal(result.ok,true);assert.equal(state.v21.primaryFactionId,'');assert.equal(engine.membership(state,id).joinedTick,joined);assert.equal(engine.membership(state,id).status,'allied');assert.ok(engine.membership(state,id).history.some(h=>h.type==='leave'));});

test('7. defection changes relations and reputation correctly',()=>{const state=makeState(),{id,ids,engine}=primarySetup(state),to=ids[1],repFrom=state.v16.factions[id].reputation,repTo=state.v16.factions[to].reputation;const result=engine.defectFaction(state,id,to,roster);assert.equal(result.ok,true);assert.equal(state.v21.primaryFactionId,to);assert.equal(engine.membership(state,id).status,'defected');assert.ok(state.v16.factions[id].reputation<repFrom);assert.ok(state.v16.factions[to].reputation>repTo);assert.ok(Number(state.v16.factions[id].relations[to])<0);});

test('8. campaign generation is deterministic',()=>{const a=makeState(888),b=makeState(888),ea=new FactionCampaignEngine(),eb=new FactionCampaignEngine(),fa=Object.keys(a.v16.factions)[0],fb=Object.keys(b.v16.factions)[0],ca=ea.createCampaign(a,fa).campaign,cb=eb.createCampaign(b,fb).campaign;assert.deepEqual({type:ca.type,territoryId:ca.territoryId,enemy:ca.enemyFactionIds,objectives:ca.objectives},{type:cb.type,territoryId:cb.territoryId,enemy:cb.enemyFactionIds,objectives:cb.objectives});});

test('9. campaign state persists across ensure/save/load shape',()=>{const state=makeState(),engine=new FactionCampaignEngine(),id=Object.keys(state.v16.factions)[0],created=engine.createCampaign(state,id,'border-war').campaign.id,saved=JSON.parse(JSON.stringify(state));migrateV21(saved,artifacts,roster);assert.equal(saved.v21.campaigns[created].type,'border-war');assert.equal(saved.v21.campaigns[created].status,'active');});

test('10. campaign progress accepts matching V17/V21 events',()=>{const state=makeState(),engine=new FactionCampaignEngine(),id=Object.keys(state.v16.factions)[0],c=engine.createCampaign(state,id,'border-war').campaign;const before=c.objectives[0].progress;engine.progressCampaign(state,{type:c.objectives[0].events[0],outcome:'success',factionId:id});assert.ok(c.objectives[0].progress>before);});

test('11. territory control changes deterministically',()=>{const state=makeState(),engine=new FactionCampaignEngine(),ids=Object.keys(state.v16.factions),t=Object.values(state.v21.territories)[0];t.controllerFactionId=ids[1];const r=engine.captureTerritory(state,t.id,ids[0]);assert.equal(r.ok,true);assert.equal(t.controllerFactionId,ids[0]);assert.equal(t.contested,false);});

test('12. territory capture updates V16 faction pressure',()=>{const state=makeState(),engine=new FactionCampaignEngine(),ids=Object.keys(state.v16.factions),t=Object.values(state.v21.territories)[0];t.controllerFactionId=ids[1];const win=state.v16.factions[ids[0]],lose=state.v16.factions[ids[1]],wp=win.power,lp=lose.power;engine.captureTerritory(state,t.id,ids[0]);assert.ok(win.power>=wp);assert.ok(lose.power<=lp);});

test('13. fronts remain bounded',()=>{const state=makeState(),engine=new FactionCampaignEngine(),ids=Object.keys(state.v16.factions);engine.changeRelation(state,ids[0],ids[1],-100);engine.ensureFronts(state);state.v16.clock.tick++;for(let i=0;i<40;i++){state.v16.clock.tick++;engine.advanceFronts(state);}for(const f of Object.values(state.v21.fronts)){assert.ok(f.pressure>=10&&f.pressure<=90);assert.ok(f.supply>=15&&f.supply<=100);assert.ok(f.morale>=20&&f.morale<=100);}});

test('14. stronghold construction consumes real V18 resources',()=>{const state=makeState(),{id,engine}=primarySetup(state),t=controlledTerritory(state,id),before={credits:state.credits,salvage:state.v18.wallet.salvage,fragments:state.v18.wallet.cosmicFragments},r=engine.buildStronghold(state,{territoryId:t.id,factionId:id});assert.equal(r.ok,true);assert.ok(state.credits<before.credits);assert.ok(state.v18.wallet.salvage<before.salvage);assert.ok(state.v18.wallet.cosmicFragments<before.fragments);});

test('15. stronghold cannot be built in invalid territory',()=>{const state=makeState(),{id,ids,engine}=primarySetup(state),t=Object.values(state.v21.territories)[0];t.controllerFactionId=ids[1];const credits=state.credits,r=engine.buildStronghold(state,{territoryId:t.id,factionId:id});assert.equal(r.ok,false);assert.equal(state.credits,credits);});

test('16. facility construction consumes resources',()=>{const state=makeState(),{id,engine}=primarySetup(state),t=controlledTerritory(state,id),hold=engine.buildStronghold(state,{territoryId:t.id,factionId:id}).stronghold,before=state.v18.wallet.salvage,r=engine.buildFacility(state,hold.id,'forge');assert.equal(r.ok,true);assert.ok(state.v18.wallet.salvage<before);assert.equal(state.v21.facilities[`${hold.id}:forge`].level,1);});

test('17. stronghold facility benefits are bounded',()=>{const state=makeState(),{id,engine}=primarySetup(state),t=controlledTerritory(state,id),hold=engine.buildStronghold(state,{territoryId:t.id,factionId:id}).stronghold;for(let i=0;i<4;i++)engine.buildFacility(state,hold.id,'defense');assert.equal(state.v21.facilities[`${hold.id}:defense`].level,3);const mod=engine.strongholdDefenseModifier(state,hold.id);assert.ok(mod.odds<=.06);assert.ok(mod.damage<=.08);});

test('18. stronghold damage cannot go below zero',()=>{const state=makeState(),{id,ids,engine}=primarySetup(state),t=controlledTerritory(state,id),hold=engine.buildStronghold(state,{territoryId:t.id,factionId:id}).stronghold;state.v21.strongholds[hold.id].integrity=2;engine.beginSiege(state,hold.id,ids[1]);for(let i=0;i<6&&state.v21.strongholds[hold.id].underSiege;i++)engine.resolveSiegeStep(state,hold.id,'surrender');assert.ok(state.v21.strongholds[hold.id].integrity>=0);});

test('19. offline ticks cannot arbitrarily delete player stronghold',()=>{const state=makeState(),{id,ids,engine}=primarySetup(state),t=controlledTerritory(state,id),hold=engine.buildStronghold(state,{territoryId:t.id,factionId:id}).stronghold;t.controllerFactionId=ids[1];state.v21.strongholds[hold.id].integrity=3;for(let i=0;i<20;i++){state.v16.clock.tick++;engine.processWorldTick(state);}assert.ok(state.v21.strongholds[hold.id]);assert.ok(state.v21.strongholds[hold.id].integrity>=1);});

test('20. diplomacy changes V16 relations',()=>{const state=makeState(),{id,ids,m,engine}=primarySetup(state),other=ids[1];m.authority=80;engine.changeRelation(state,id,other,40);const before=state.v16.factions[id].relations[other],r=engine.proposeTreaty(state,other,'alliance');assert.equal(r.ok,true);assert.ok(state.v16.factions[id].relations[other]>before);assert.equal(state.v16.factions[id].relations[other],state.v16.factions[other].relations[id]);});

test('21. invalid diplomacy proposal consumes no resources',()=>{const state=makeState(),{id,ids,m,engine}=primarySetup(state),other=ids[1];m.authority=0;engine.changeRelation(state,id,other,-100);const credits=state.credits,r=engine.proposeTreaty(state,other,'trade');assert.equal(r.ok,false);assert.equal(state.credits,credits);});

test('22. infiltration cover and suspicion remain bounded',()=>{const state=makeState(),engine=new FactionCampaignEngine(),id=Object.keys(state.v16.factions)[1];assert.equal(engine.beginInfiltration(state,id).ok,true);for(let i=0;i<25;i++){const options=engine.infiltrationOptions(state,id);if(!options.length)break;engine.resolveInfiltration(state,options[0].id,id);}const inf=state.v21.infiltration[id];assert.ok(inf.cover>=0&&inf.cover<=100);assert.ok(inf.suspicion>=0&&inf.suspicion<=100);assert.ok(inf.intel>=0&&inf.intel<=100);});

test('23. faction specialist assignment persists',()=>{const state=makeState(),{id,engine}=primarySetup(state),t=controlledTerritory(state,id),hold=engine.buildStronghold(state,{territoryId:t.id,factionId:id}).stronghold,r=engine.assignSpecialist(state,hold.id,'a','field-medic');assert.equal(r.ok,true);const saved=JSON.parse(JSON.stringify(state));migrateV21(saved,artifacts,roster);assert.equal(saved.v21.assignments.a.role,'field-medic');assert.ok(saved.v21.strongholds[hold.id].specialists.includes('a'));});

test('24. dead or departed V19 allies cannot be assigned',()=>{const state=makeState(),{id,engine}=primarySetup(state),t=controlledTerritory(state,id),hold=engine.buildStronghold(state,{territoryId:t.id,factionId:id}).stronghold;state.v19.records.a.status='departed';assert.equal(engine.assignSpecialist(state,hold.id,'a','field-medic').ok,false);state.v19.records.a.status='dead';assert.equal(engine.assignSpecialist(state,hold.id,'a','field-medic').ok,false);});

test('25. V19 party reactions change after major faction choice',()=>{const state=makeState(),engine=new FactionCampaignEngine(),id=Object.keys(state.v16.factions)[0],before={...state.v19.records.a.axes};engine.joinFaction(state,id,roster);const after=state.v19.records.a.axes;assert.ok(Object.keys(after).some(k=>after[k]!==before[k])||engine.partyReaction(state,id,'betray',roster).length>0);});

test('26. V20 faction gear unlock conditions work',()=>{const state=makeState(),{id,m,engine}=primarySetup(state);m.rank=3;state.v16.factions[id].reputation=60;assert.equal(engine.factionGearUnlocks(state,id).regalia,false);m.rank=4;const unlock=engine.factionGearUnlocks(state,id);assert.equal(unlock.regalia,true);assert.equal(unlock.setId,`faction:${id}`);});

test('27. V20 faction relic consequences remain synchronized',()=>{const state=makeState(),{id,engine}=primarySetup(state);const r=engine.resolveRelicObjective(state,id,'relic-a','return');assert.equal(r.ok,true);assert.equal(state.v20.relics['relic-a'].status,'lost');assert.equal(state.v16.artifactOwners['relic-a'].ownerType,'faction');assert.equal(state.v16.artifactOwners['relic-a'].ownerId,id);assert.equal(state.artifacts.includes('relic-a'),false);});

test('28. V19 defected ally can become faction operative',()=>{const state=makeState(),engine=new FactionCampaignEngine();state.party=state.party.filter(id=>id!=='a');state.v19.records.a.status='defected';state.v19.records.a.defectedTo='';engine.ensure(state,artifacts,roster);assert.ok(state.v19.records.a.v21FactionId);assert.ok(state.v16.factions[state.v19.records.a.v21FactionId]);});

test('29. nemesis stronghold involvement uses valid V16 nemeses',()=>{const state=makeState(),engine=new FactionCampaignEngine();state.v16.nemeses.nem={id:'nem',name:'Collector',universe:'Earth-Prime',status:'active',level:3,power:1.2,grudges:2,defeats:0,victories:1,stolenArtifacts:[]};engine.ensure(state,artifacts,roster);assert.ok(state.v16.nemeses.nem.v21FactionId);assert.ok(state.v16.factions[state.v16.nemeses.nem.v21FactionId]);});

test('30. campaign combat modifier stays inside cap',()=>{const state=makeState(),{id,m,engine}=primarySetup(state);m.authority=100;const c=engine.createCampaign(state,id,'border-war').campaign;c.momentum=999;for(const s of Object.values(state.v21.strongholds))s.supply=100;const mod=engine.campaignCombatModifier(state);assert.ok(mod.odds<=.06&&mod.odds>=-.06);assert.ok(mod.damage<=.08&&mod.damage>=-.08);});

test('31. ending selection reflects faction legacy',()=>{const state=makeState(),{id,m,engine}=primarySetup(state);m.rank=8;state.v21.stats.campaignsWon=4;let n=0;for(const t of Object.values(state.v21.territories).slice(0,6)){t.controllerFactionId=id;n++;}assert.ok(n>=5);assert.equal(engine.ending(state).id,'faction-regent');});

test('32. repeated render-style summary calls do not progress campaigns',()=>{const state=makeState(),{id,engine}=primarySetup(state),c=engine.createCampaign(state,id,'border-war').campaign,before=JSON.stringify(c);engine.summary(state);engine.summary(state);assert.equal(JSON.stringify(state.v21.campaigns[c.id]),before);});

test('33. event dedupe prevents double rewards',()=>{const state=makeState(),{id,engine}=primarySetup(state),c=engine.createCampaign(state,id,'border-war').campaign,o=c.objectives[0],before=engine.membership(state,id).rankXp,ctx={id:'same-event',type:o.events[0],outcome:o.requiredOutcome||'success',factionId:id};engine.processEvent(state,ctx,roster);const once=engine.membership(state,id).rankXp;engine.processEvent(state,ctx,roster);assert.ok(once>before);assert.equal(engine.membership(state,id).rankXp,once);});

test('34. save and reload remains stable',()=>{const state=makeState(),{id,engine}=primarySetup(state),c=engine.createCampaign(state,id,'stabilization').campaign;engine.progressCampaign(state,{type:c.objectives[0].events[0],outcome:'success',factionId:id});const saved=JSON.parse(JSON.stringify(state));migrateV21(saved,artifacts,roster);const once=JSON.stringify(saved);migrateV21(saved,artifacts,roster);assert.equal(JSON.stringify(saved),once);assert.equal(saved.v21.schemaVersion,21);assert.equal(Object.keys(CAMPAIGN_DEFS_V21).length>=6,true);assert.equal(Object.keys(FACILITY_DEFS_V21).length>=10,true);});
