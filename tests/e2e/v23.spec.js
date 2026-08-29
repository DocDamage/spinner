'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v23';

async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v23?.schemaVersion)).toBe(23);
}

async function seed(page){
  const data=await page.evaluate(()=>{
    game.state.characterReady=true;
    const party=DATA.characters.slice(0,2).map(c=>c.id);game.state.party=[...party];for(const id of party)game.v8Party(id);
    game.ensureV21();game.ensureV22();game.ensureV23();Object.assign(game.state.v18.wallet,{salvage:1000,cosmicFragments:200,voidMarks:20,bountySeals:20});game.state.credits=10000;
    for(const f of Object.values(game.state.v16.factions))f.reputation=80;
    const factions=new MultiverseDomain.FactionCampaignEngine(),primary=Object.keys(game.state.v16.factions)[0];if(game.state.v21.primaryFactionId!==primary)factions.joinFaction(game.state,primary,Array.from(CHAR.values()));Object.assign(game.state.v21.memberships[primary],{rank:5,rankXp:320,authority:78});
    const territory=Object.values(game.state.v21.territories)[0];territory.controllerFactionId=primary;territory.contested=false;game.state.v16.currentUniverse=territory.universe;
    for(const id of party){const rec=game.state.v19.records[id];if(rec){rec.status='active';Object.assign(rec.axes,{loyalty:80,trust:82,respect:80,friendship:76,resentment:2,fear:4});}}
    game.ensureV23();const ops=new MultiverseDomain.TacticalOperationsEngine(),created=ops.createOperation(game.state,{sourceKey:'e2e:v23:rescue',sourceType:'test',family:'rescue',settlementId:territory.id,territoryId:territory.id,universe:territory.universe,factionId:primary,urgency:74,label:'E2E Rescue Corridor'});game.save();
    return{party,primary,territoryId:territory.id,settlementId:territory.id,operationId:created.operation.id};
  });
  await page.evaluate(()=>game.closeTitleV13(true));
  await expect(page.locator('#v23-operation-beacon')).toBeVisible();
  return data;
}

async function openOperations(page){await page.locator('[data-v23-open]').click();await expect(page.locator('.v23-head')).toBeVisible();await expect(page.locator('[data-v16-world-tab="operations"]')).toHaveClass(/active/);}

async function deploy(page,operationId,partyId,{supply=0,priority='balanced'}={}){
  await page.locator(`[data-v23-plan="${operationId}"]`).click();
  await expect(page.locator(`[data-v23-planner="${operationId}"]`)).toBeVisible();
  await page.locator(`[data-v23-planner="${operationId}"] [data-v23-ally][value="${partyId}"]`).check();
  await page.locator(`[data-v23-planner="${operationId}"] [data-v23-supply]`).selectOption(String(supply));
  await page.locator(`[data-v23-planner="${operationId}"] [data-v23-priority]`).selectOption(priority);
  await page.locator(`[data-v23-deploy="${operationId}"]`).click();
  await expect(page.locator('.v23-active')).toBeVisible();
}

async function completeActive(page){
  await page.evaluate(()=>{
    let guard=0;
    while(game.state.v23.activeOperationId&&guard++<20){
      const op=game.state.v23.operations[game.state.v23.activeOperationId],stage=op.stages[op.stageIndex];
      game.state.spin++;
      game.recordOutcomeV19(stage.events[0],stage.requiredOutcome||'win',null);
    }
  });
}

test('V23 Journey 1 — Operations surface exposes persistent strategic missions',async({page})=>{
  await load(page);const seeded=await seed(page);await openOperations(page);await expect(page.locator(`[data-v23-plan="${seeded.operationId}"]`)).toBeVisible();await expect(page.locator('.v23-operation-card').filter({hasText:'E2E Rescue Corridor'})).toBeVisible();
});

test('V23 Journey 2 — mission planning selects allies and spends only the existing V18 supply wallet on deployment',async({page})=>{
  await load(page);const seeded=await seed(page);await openOperations(page);const before=await page.evaluate(()=>({credits:game.state.credits,salvage:game.state.v18.wallet.salvage}));await deploy(page,seeded.operationId,seeded.party[0],{supply:2,priority:'team'});const after=await page.evaluate(id=>({credits:game.state.credits,salvage:game.state.v18.wallet.salvage,status:game.state.v23.operations[id].status,allies:game.state.v23.operations[id].planning.allyIds}),seeded.operationId);expect(after.credits).toBeLessThan(before.credits);expect(after.salvage).toBeLessThan(before.salvage);expect(after.status).toBe('active');expect(after.allies).toContain(seeded.party[0]);
});

test('V23 Journey 3 — ordinary Wheel outcomes advance Intel through Extraction and resolve the operation',async({page})=>{
  await load(page);const seeded=await seed(page);await openOperations(page);await deploy(page,seeded.operationId,seeded.party[0]);await completeActive(page);await expect.poll(()=>page.evaluate(id=>game.state.v23.operations[id].status,seeded.operationId)).toBe('completed');await page.evaluate(()=>game.renderWorldV16('operations'));await expect(page.locator('.v23-history')).toContainText('E2E Rescue Corridor');
});

test('V23 Journey 4 — a civilian-priority operation writes recovery into V22 rather than a duplicate civilian system',async({page})=>{
  await load(page);const seeded=await seed(page);await page.evaluate(id=>{const s=game.state.v22.settlements[id];s.displaced=180;s.population=Math.max(500,s.population);game.save();},seeded.settlementId);const before=await page.evaluate(id=>({displaced:game.state.v22.settlements[id].displaced,opinion:game.state.v22.settlements[id].playerOpinion}),seeded.settlementId);await openOperations(page);await deploy(page,seeded.operationId,seeded.party[0],{priority:'civilians'});await completeActive(page);const after=await page.evaluate(id=>({displaced:game.state.v22.settlements[id].displaced,opinion:game.state.v22.settlements[id].playerOpinion,rescued:game.state.v23.stats.civiliansRescued}),seeded.settlementId);expect(after.displaced).toBeLessThan(before.displaced);expect(after.opinion).toBeGreaterThan(before.opinion);expect(after.rescued).toBeGreaterThan(0);
});

test('V23 Journey 5 — stronghold defense changes V21 state in bounded, recoverable steps',async({page})=>{
  await load(page);const seeded=await seed(page);const prepared=await page.evaluate(({primary,territoryId})=>{const f=new MultiverseDomain.FactionCampaignEngine(),built=f.buildStronghold(game.state,{territoryId,factionId:primary});const hold=game.state.v21.strongholds[built.stronghold.id];hold.underSiege=true;hold.status='threatened';const e=new MultiverseDomain.TacticalOperationsEngine();e.discoverOperations(game.state,20);const op=Object.values(game.state.v23.operations).find(x=>x.strongholdId===hold.id&&x.family==='stronghold-defense');return{holdId:hold.id,opId:op.id,before:hold.integrity};},seeded);await page.evaluate(({opId,partyId})=>{new MultiverseDomain.TacticalOperationsEngine().beginOperation(game.state,opId,{allyIds:[partyId],supplyCommitment:0});game.save();},{opId:prepared.opId,partyId:seeded.party[0]});await completeActive(page);const after=await page.evaluate(id=>({exists:Boolean(game.state.v21.strongholds[id]),integrity:game.state.v21.strongholds[id].integrity,underSiege:game.state.v21.strongholds[id].underSiege}),prepared.holdId);expect(after.exists).toBe(true);expect(after.integrity).toBeGreaterThanOrEqual(prepared.before);expect(after.integrity).toBeLessThanOrEqual(100);expect(after.underSiege).toBe(false);
});

test('V23 Journey 6 — Operations, Civilians, Factions, Legacy/Economy coexist without console errors',async({page})=>{
  const errors=[];page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});page.on('pageerror',err=>errors.push(err.message));await load(page);await seed(page);await openOperations(page);await page.locator('[data-v16-world-tab="civilians"]').click();await expect(page.locator('.v22-head')).toBeVisible();await page.locator('[data-v16-world-tab="factions"]').click();await expect(page.locator('.v21-subnav')).toBeVisible();await page.locator('[data-v16-world-close]').click();await page.locator('[data-v18-economy-open]').click();await expect(page.locator('.v20-head')).toBeVisible();expect(errors).toEqual([]);
});
