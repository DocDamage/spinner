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
    game.ensureV21();game.ensureV22();game.ensureV23();game.ensureV24();game.ensureV25();game.ensureV26();
    game.state.v21.strongholds['v26-hold']={id:'v26-hold',name:'Atlas Bastion',type:'Forward Base',universe:'Earth-Prime',playerAligned:true,status:'safe',integrity:90,supply:70,morale:70,facilities:[],specialists:[]};
    game.state.v23.operations['v26-op']={id:'v26-op',label:'Atlas Convoy',type:'escort',universe:'Earth-Prime',status:'planned'};
    game.state.v24.activities['v26-act']={id:'v26-act',label:'Atlas Rally',family:'portal-rally',universe:'Earth-Prime',status:'available',venue:'Atlas Raceway'};
    game.state.v25.crises['v26-crisis']={id:'v26-crisis',label:'Atlas Fracture',family:'reality-fracture',primaryUniverse:'Earth-Prime',universeIds:['Earth-Prime'],status:'watching',severity:70,pressure:0,momentum:0,failures:0,successes:0,phaseIndex:0,phases:[],response:{},history:[]};
    new MultiverseDomain.WorldContentEngine().syncAssignments(game.state);game.save();
    return {v21:JSON.stringify(game.state.v21.strongholds['v26-hold']),assignments:Object.keys(game.state.v26.assignments).filter(k=>/v26-(hold|op|act|crisis)/.test(k))};
  });
  expect(seeded.assignments.length).toBe(4);
  await page.evaluate(()=>game.openWorldV16('factions'));await expect(page.locator('.v26-context-strip')).toContainText('Atlas Bastion');
  const preserved=await page.evaluate(()=>JSON.stringify(game.state.v21.strongholds['v26-hold']));expect(preserved).toBe(seeded.v21);
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
