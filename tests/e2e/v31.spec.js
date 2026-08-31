'use strict';
const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v31';

async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v31?.schemaVersion)).toBe(31);
  await page.evaluate(()=>game.closeTitleV13(true));
}

async function stage(page){
  await page.evaluate(()=>{if(!game.state.pending)game.land(game.state.slices[0]);});
  await expect(page.locator('.v31-scene-stage')).toBeVisible();
}

test('V31 Journey 1 — Wheel results stage V30 world assets inside the live event',async({page})=>{
  await load(page);
  await stage(page);
  await expect(page.locator('.v31-scene-grid')).toBeVisible();
  expect(await page.locator('.v31-scene-asset').count()).toBeGreaterThanOrEqual(3);
  const state=await page.evaluate(()=>({slots:game.state.v31.current?.assetIds?.length||0,releases:game.dynamicSceneAssetsV31().map(asset=>asset.release)}));
  expect(state.slots).toBeGreaterThanOrEqual(3);
  expect(state.releases.every(release=>release===30)).toBe(true);
});

test('V31 Journey 2 — scene remix changes visual staging without changing the pending event',async({page})=>{
  await load(page);
  await stage(page);
  const before=await page.evaluate(()=>({ref:game.state.pending.ref,stage:game.state.pending.stage,variation:game.state.v31.current.variation}));
  await page.locator('[data-v31-remix]').click();
  await expect.poll(()=>page.evaluate(()=>game.state.v31.current.variation)).toBe(before.variation+1);
  const after=await page.evaluate(()=>({ref:game.state.pending.ref,stage:game.state.pending.stage,remixes:game.state.v31.stats.sceneRemixes}));
  expect(after.ref).toBe(before.ref);
  expect(after.stage).toBe(before.stage);
  expect(after.remixes).toBe(1);
});

test('V31 Journey 3 — staged assets open the existing V30-aware inspector',async({page})=>{
  await load(page);
  await stage(page);
  const card=page.locator('.v31-scene-asset').first(),id=await card.getAttribute('data-v28-inspect');
  await card.click();
  await expect(page.locator('#v28-asset-inspector')).toBeVisible();
  await expect(page.locator('#v28-asset-inspector')).toContainText('NEW V30');
  await expect.poll(()=>page.evaluate(id=>game.state.v28.inspector.selectedAssetId===id,id)).toBe(true);
});

test('V31 Journey 4 — history keeps original and remixed compositions',async({page})=>{
  await load(page);
  await stage(page);
  await page.locator('[data-v31-remix]').click();
  await page.locator('[data-v31-history]').click();
  await expect(page.locator('#v31-scene-history')).toBeVisible();
  expect(await page.locator('.v31-history-list>section').count()).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#v31-scene-history')).toContainText('Recent staged Wheel scenes');
});

test('V31 Journey 5 — scene visibility persists while event controls remain usable',async({page})=>{
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('pageerror',error=>errors.push(error.message));
  await load(page);
  await stage(page);
  const pendingBefore=await page.evaluate(()=>JSON.stringify(game.state.pending));
  await page.locator('[data-v31-toggle-scenes]').click();
  await expect(page.locator('.v31-scene-disabled')).toBeVisible();
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v31?.settings?.enabled)).toBe(false);
  await page.evaluate(()=>game.closeTitleV13(true));
  await expect(page.locator('.v31-scene-disabled')).toBeVisible();
  await page.locator('[data-v31-toggle-scenes]').click();
  await expect(page.locator('.v31-scene-grid')).toBeVisible();
  expect(await page.evaluate(()=>JSON.stringify(game.state.pending))).toBe(pendingBefore);
  expect(await page.locator('#event-panel button[data-action]:visible').count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
