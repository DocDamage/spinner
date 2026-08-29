'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v26';

async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v26?.schemaVersion)).toBe(26);
}
async function enter(page){await page.evaluate(()=>game.closeTitleV13(true));await expect(page.locator('#v26-world-content-beacon')).toBeVisible();}
async function openAtlas(page){await page.locator('[data-v26-open]').first().click();await expect(page.locator('.v26-atlas-head')).toBeVisible();await expect(page.locator('[data-v16-world-tab="atlas"]')).toHaveClass(/active/);}

test('V26 Journey 1 — Atlas exposes hundreds of rights-safe world assets',async({page})=>{
  await load(page);await enter(page);await openAtlas(page);
  await expect(page.locator('.v26-atlas-head')).toContainText('376');
  await expect(page.locator('.v26-asset-card').first()).toBeVisible();
  const count=await page.locator('.v26-asset-card').count();expect(count).toBe(72);
  const source=await page.locator('.v26-asset-card img').first().getAttribute('src');expect(source).toMatch(/^data:image\/svg\+xml/);
});

test('V26 Journey 2 — kind, rarity, and search filters keep the Atlas browsable',async({page})=>{
  await load(page);await enter(page);await openAtlas(page);
  await page.locator('[data-v26-kind="vehicle"]').click();
  await expect(page.locator('.v26-atlas-status')).toContainText('40 matching assets');
  await page.locator('[data-v26-search]').fill('rescue');
  await expect(page.locator('.v26-atlas-status')).toContainText('matching assets');
  const cards=page.locator('.v26-asset-card');expect(await cards.count()).toBeGreaterThan(0);await expect(cards.first()).toContainText(/Rescue/i);
  await page.locator('[data-v26-rarity]').selectOption('common');
  await expect(page.locator('.v26-atlas-status')).toContainText('matching assets');
});

test('V26 Journey 3 — favorites and recent views persist without a new wallet',async({page})=>{
  await load(page);await enter(page);await openAtlas(page);
  const card=page.locator('.v26-asset-card').first(),id=await card.getAttribute('data-v26-asset-card');await card.click();await card.locator('[data-v26-favorite]').click();
  const saved=await page.evaluate(id=>({favorite:game.state.v26.favorites.includes(id),recent:game.state.v26.recent.includes(id),wallet:game.state.v26.wallet,currency:game.state.v26.currency}),id);
  expect(saved.favorite).toBe(true);expect(saved.recent).toBe(true);expect(saved.wallet).toBeUndefined();expect(saved.currency).toBeUndefined();
  await page.reload();await expect.poll(()=>page.evaluate(id=>game?.state?.v26?.favorites?.includes(id),id)).toBe(true);
});

test('V26 Journey 4 — existing worlds and V21–V25 systems receive stable context art only',async({page})=>{
  await load(page);await enter(page);
  const seeded=await page.evaluate(()=>{
    game.state.characterReady=true;
    game.ensureV21();game.ensureV22();game.ensureV23();game.ensureV24();game.ensureV25();game.ensureV26();
    Object.assign(game.state.v18.wallet,{salvage:1200,cosmicFragments:240,voidMarks:30,bountySeals:30});game.state.credits=18000;
    for(const faction of Object.values(game.state.v16.factions))faction.reputation=85;
    const factions=new MultiverseDomain.FactionCampaignEngine(),factionId=Object.keys(game.state.v16.factions)[0],territory=Object.values(game.state.v21.territories)[0];
    if(game.state.v21.primaryFactionId!==factionId)factions.joinFaction(game.state,factionId,Array.from(CHAR.values()));
    Object.assign(game.state.v21.memberships[factionId],{rank:5,rankXp:320,authority:80});territory.controllerFactionId=factionId;territory.contested=false;game.state.v16.currentUniverse=territory.universe;
    const built=factions.buildStronghold(game.state,{territoryId:territory.id,factionId}),hold=game.state.v21.strongholds[built.stronghold.id];hold.name='Atlas Bastion';
    game.state.v21.strongholds={[hold.id]:hold};
    const operations=new MultiverseDomain.TacticalOperationsEngine(),createdOperation=operations.createOperation(game.state,{sourceKey:'e2e:v26:operation',sourceType:'test',family:'rescue',settlementId:territory.id,territoryId:territory.id,universe:territory.universe,factionId,urgency:74,label:'Atlas Convoy'}).operation;
    game.state.v23.operations={[createdOperation.id]:createdOperation};game.state.v23.activeOperationId=null;
    const activities=new MultiverseDomain.ActivityCircuitEngine(),createdActivity=activities.createActivity(game.state,{sourceKey:'e2e:v26:activity',sourceType:'test',family:'speed-race',universe:territory.universe,venue:'Atlas Raceway',difficulty:1,heat:70}).activity;createdActivity.label='Atlas Rally';
    game.state.v24.activities={[createdActivity.id]:createdActivity};game.state.v24.activeActivityId=null;
    const crises=new MultiverseDomain.CrisisArcEngine(),createdCrisis=crises.createCrisis(game.state,{sourceKey:'e2e:v26:crisis',sourceType:'test',family:'reality-fracture',primaryUniverse:territory.universe,universeIds:[territory.universe],severity:72,label:'Atlas Fracture'}).crisis;
    game.state.v25.crises={[createdCrisis.id]:createdCrisis};game.state.v25.activeCrisisId=null;
    new MultiverseDomain.WorldContentEngine().syncAssignments(game.state);game.save();
    return {holdId:hold.id,v21:JSON.stringify(game.state.v21.strongholds[hold.id]),assignments:Object.keys(game.state.v26.assignments).filter(k=>[hold.id,createdOperation.id,createdActivity.id,createdCrisis.id].some(id=>k.endsWith(`:${id}`)))};
  });
  expect(seeded.assignments.length).toBe(4);
  await page.evaluate(()=>game.openWorldV16('factions'));await expect(page.locator('.v26-context-strip')).toContainText('Atlas Bastion');
  const preserved=await page.evaluate(id=>JSON.stringify(game.state.v21.strongholds[id]),seeded.holdId);expect(preserved).toBe(seeded.v21);
  await page.locator('[data-v16-world-tab="operations"]').click();await expect(page.locator('.v26-context-strip')).toContainText('Atlas Convoy');
  await page.locator('[data-v16-world-tab="activities"]').click();await expect(page.locator('.v26-context-strip')).toContainText('Atlas Rally');
  await page.locator('[data-v16-world-tab="crises"]').click();await expect(page.locator('.v26-context-strip')).toContainText('Atlas Fracture');
});

test('V26 Journey 5 — V25 fallback-era surfaces still work with no console errors',async({page})=>{
  const errors=[];page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});page.on('pageerror',err=>errors.push(err.message));
  await load(page);await enter(page);await openAtlas(page);
  await page.locator('[data-v16-world-tab="crises"]').click();await expect(page.locator('.v25-head')).toBeVisible();
  await page.locator('[data-v16-world-tab="activities"]').click();await expect(page.locator('.v24-head')).toBeVisible();
  await page.locator('[data-v16-world-tab="operations"]').click();await expect(page.locator('.v23-head')).toBeVisible();
  await page.locator('[data-v16-world-tab="civilians"]').click();await expect(page.locator('.v22-head')).toBeVisible();
  await page.locator('[data-v16-world-tab="factions"]').click();await expect(page.locator('.v21-subnav')).toBeVisible();
  expect(errors).toEqual([]);
});