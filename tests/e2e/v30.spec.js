'use strict';
const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v30';
async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v30?.schemaVersion)).toBe(30);
}
async function enterAtlas(page){
  await page.evaluate(()=>game.closeTitleV13(true));
  await page.locator('[data-v26-open]').first().click();
  await expect(page.locator('.v30-atlas-head')).toBeVisible();
}

test('V30 Journey 1 — Massive World Atlas exposes the complete release',async({page})=>{
  await load(page);
  await enterAtlas(page);
  await expect(page.locator('.v30-atlas-head')).toContainText('6,616');
  await expect(page.locator('.v30-atlas-head')).toContainText('40 world-content families');
  await expect(page.locator('[data-v30-new-only]')).toBeVisible();
  const release=await page.evaluate(()=>({total:WORLD_CONTENT_CATALOG.length,added:WORLD_CONTENT_META.addedTotal,families:Object.keys(WORLD_CONTENT_META.counts||{}).length,newFamilies:WORLD_CONTENT_META.newFamilies?.length||0}));
  expect(release).toEqual({total:6616,added:4704,families:40,newFamilies:15});
});

test('V30 Journey 2 — V30-only filtering and normal card clicks feed Seen history',async({page})=>{
  await load(page);
  await enterAtlas(page);
  await page.locator('[data-v30-new-only]').click();
  await expect(page.locator('[data-v30-new-only]')).toHaveClass(/active/);
  await expect.poll(()=>page.evaluate(()=>game.state.v30.atlasNewOnly&&game.queryAtlasV30().length)).toBe(4704);
  const cards=page.locator('[data-v26-asset-card]');
  expect(await cards.count()).toBeGreaterThan(0);
  const nonV30=await cards.evaluateAll(nodes=>nodes.filter(node=>!node.classList.contains('v30-new-asset')).length);
  expect(nonV30).toBe(0);
  await expect(cards.first().locator('.v30-new-badge')).toContainText('NEW V30');
  const id=await cards.first().getAttribute('data-v26-asset-card');
  await cards.first().click();
  await expect.poll(()=>page.evaluate(id=>game.state.v30.discoveries.includes(id),id)).toBe(true);
  await page.locator('[data-v28-toggle="discoveredOnly"]').click();
  await expect(page.locator(`[data-v26-asset-card="${id}"]`)).toBeVisible();
});

test('V30 Journey 3 — V30 inspection records discovery and preserves release metadata',async({page})=>{
  await load(page);
  await enterAtlas(page);
  await page.locator('[data-v30-new-only]').click();
  const card=page.locator('[data-v26-asset-card]').first(),id=await card.getAttribute('data-v26-asset-card');
  await card.locator('[data-v28-inspect]').click();
  await expect(page.locator('#v28-asset-inspector')).toBeVisible();
  await expect(page.locator('#v28-asset-inspector')).toContainText('NEW V30');
  await expect(page.locator('#v28-asset-inspector')).toContainText('V30');
  const state=await page.evaluate(id=>({selected:game.state.v28.inspector.selectedAssetId,release:WORLD_CONTENT_CATALOG.find(a=>a.id===id)?.release,discovered:game.state.v30.discoveries.includes(id)}),id);
  expect(state).toEqual({selected:id,release:30,discovered:true});
});

test('V30 Journey 4 — world context renders eight visuals and a six-role scout encounter',async({page})=>{
  await load(page);
  await page.evaluate(()=>{game.closeTitleV13(true);game.openWorldV16('overview');});
  await expect(page.locator('.v30-context-strip')).toBeVisible();
  await expect(page.locator('.v30-field-encounter')).toBeVisible();
  await expect(page.locator('.v30-context-strip [data-v26-asset-card]')).toHaveCount(8);
  await expect(page.locator('.v30-encounter-grid article')).toHaveCount(6);
  const before=await page.evaluate(()=>({nonce:game.state.v30.scoutNonce,log:game.state.v30.encounterLog.length}));
  await page.locator('[data-v30-scout]').click();
  await expect.poll(()=>page.evaluate(()=>game.state.v30.scoutNonce)).toBe(before.nonce+1);
  await expect.poll(()=>page.evaluate(()=>game.state.v30.encounterLog.length)).toBe(Math.min(24,before.log+1));
  await expect(page.locator('.v30-encounter-grid article')).toHaveCount(6);
});

test('V30 Journey 5 — V30 Atlas preferences survive reload without browser errors',async({page})=>{
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('pageerror',error=>errors.push(error.message));
  await load(page);
  await enterAtlas(page);
  await page.locator('[data-v30-new-only]').click();
  await page.locator('[data-v30-group="adventure"]').click();
  await page.locator('[data-v28-view]').click();
  await expect.poll(()=>page.evaluate(()=>game.state.v30.atlasNewOnly&&game.state.v28.atlas.group==='adventure'&&game.state.v28.atlas.view==='compact')).toBe(true);
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v30?.atlasNewOnly)).toBe(true);
  await page.evaluate(()=>game.closeTitleV13(true));
  await page.locator('[data-v26-open]').first().click();
  await expect(page.locator('[data-v30-new-only]')).toHaveClass(/active/);
  await expect(page.locator('[data-v30-group="adventure"]')).toHaveClass(/active/);
  await expect(page.locator('.v26-asset-grid')).toHaveClass(/v28-compact/);
  expect(errors).toEqual([]);
});
