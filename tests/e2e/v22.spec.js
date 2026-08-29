'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v22';

async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v22?.schemaVersion)).toBe(22);
}

async function seed(page){
  const data=await page.evaluate(()=>{
    game.state.characterReady=true;
    const party=DATA.characters.slice(0,2).map(c=>c.id);game.state.party=[...party];for(const id of party)game.v8Party(id);
    game.ensureV21();game.ensureV22();Object.assign(game.state.v18.wallet,{salvage:900,cosmicFragments:180,voidMarks:20,bountySeals:20});game.state.credits=9000;
    for(const f of Object.values(game.state.v16.factions))f.reputation=75;
    const factions=new MultiverseDomain.FactionCampaignEngine(),factionIds=Object.keys(game.state.v16.factions),primary=factionIds[0];factions.joinFaction(game.state,primary,Array.from(CHAR.values()));Object.assign(game.state.v21.memberships[primary],{rank:5,rankXp:300,authority:75});
    const territory=Object.values(game.state.v21.territories)[0];territory.controllerFactionId=primary;territory.contested=false;game.state.v16.currentUniverse=territory.universe;
    for(const id of party){const rec=game.state.v19.records[id];if(rec){rec.axes.trust=80;rec.axes.respect=75;rec.axes.friendship=72;}}
    game.ensureV22();game.save();const settlement=game.state.v22.settlements[territory.id];return{party,primary,territoryId:territory.id,settlementId:settlement.id};
  });
  await page.evaluate(()=>game.closeTitleV13(true));
  await expect(page.locator('#v22-civilian-beacon')).toBeVisible();
  return data;
}

async function openCivilians(page){await page.locator('[data-v22-open]').click();await expect(page.locator('.v22-head')).toBeVisible();await expect(page.locator('[data-v16-world-tab="civilians"]')).toHaveClass(/active/);}

test('V22 Journey 1 — civilian world state renders from persistent V21 territories',async({page})=>{
  await load(page);await seed(page);await openCivilians(page);await expect(page.locator('.v22-grid>article').first()).toBeVisible();const counts=await page.evaluate(()=>({settlements:Object.keys(game.state.v22.settlements).length,territories:Object.keys(game.state.v21.territories).length}));expect(counts.settlements).toBe(counts.territories);
});

test('V22 Journey 2 — emergency aid spends the V18 wallet and persists civilian recovery',async({page})=>{
  await load(page);const seeded=await seed(page);await openCivilians(page);const before=await page.evaluate(id=>({credits:game.state.credits,food:game.state.v22.settlements[id].food,opinion:game.state.v22.settlements[id].playerOpinion}),seeded.settlementId);await page.locator(`[data-v22-action="${seeded.settlementId}|aid"]`).click();const after=await page.evaluate(id=>({credits:game.state.credits,food:game.state.v22.settlements[id].food,opinion:game.state.v22.settlements[id].playerOpinion}),seeded.settlementId);expect(after.credits).toBeLessThan(before.credits);expect(after.food).toBeGreaterThanOrEqual(before.food);expect(after.opinion).toBeGreaterThan(before.opinion);await page.reload();await expect.poll(()=>page.evaluate(id=>game.state.v22.settlements[id].playerOpinion,seeded.settlementId)).toBe(after.opinion);
});

test('V22 Journey 3 — a V21 stronghold can open a civilian sanctuary and receive refugees',async({page})=>{
  await load(page);const seeded=await seed(page);const prepared=await page.evaluate(({primary,territoryId,settlementId})=>{const f=new MultiverseDomain.FactionCampaignEngine(),built=f.buildStronghold(game.state,{territoryId,factionId:primary});game.state.v22.settlements[settlementId].displaced=160;game.save();return{holdId:built.stronghold.id};},seeded);await openCivilians(page);await page.locator(`[data-v22-build-sanctuary="${prepared.holdId}"]`).click();await expect(page.locator('.v22-sanctuary').filter({hasText:'OPEN SANCTUARY'})).toBeVisible();await page.evaluate(()=>{game.state.v16.clock.tick++;new MultiverseDomain.SettlementEngine().advanceTick(game.state,game.state.v16.clock.tick);game.save();});const residents=await page.evaluate(()=>Object.values(game.state.v22.sanctuaries)[0].residents);expect(residents).toBeGreaterThan(0);
});

test('V22 Journey 4 — civilian requests progress from ordinary Wheel outcome signals',async({page})=>{
  await load(page);const seeded=await seed(page);const request=await page.evaluate(id=>{const e=new MultiverseDomain.SettlementEngine(),r=e.activeRequest(game.state,id);return{id:r.id,type:r.events[0],outcome:r.requiredOutcome||'success',before:r.progress};},seeded.settlementId);await page.evaluate(({type,outcome})=>{game.state.spin++;game.recordOutcomeV19(type,outcome,null);},{type:request.type,outcome:request.outcome});const progress=await page.evaluate(id=>game.state.v22.requests[id].progress,request.id);expect(progress).toBeGreaterThan(request.before);await openCivilians(page);await expect(page.locator('.v22-current')).toBeVisible();
});

test('V22 Journey 5 — V21 Factions, V20 Legacy, V18 Economy, and V22 Civilians coexist without console errors',async({page})=>{
  const errors=[];page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});page.on('pageerror',err=>errors.push(err.message));await load(page);await seed(page);await openCivilians(page);await page.locator('[data-v16-world-tab="factions"]').click();await expect(page.locator('.v21-subnav')).toBeVisible();await page.locator('[data-v16-world-close]').click();await page.locator('[data-v18-economy-open]').click();await expect(page.locator('.v20-head')).toBeVisible();expect(errors).toEqual([]);
});
