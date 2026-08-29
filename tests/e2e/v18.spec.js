'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v18';

async function load(page){await page.goto(APP);await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>game?.state?.v18?.schemaVersion)).toBe(18);}

test('V18 economy opens from World State and renders deterministic local stock',async({page})=>{
  await load(page);
  await page.evaluate(()=>{game.state.characterReady=true;game.closeTitleV13(true);game.openWorldV16('economy');});
  await expect(page.locator('[data-v16-world-tab="economy"]')).toHaveClass(/active/);
  await expect(page.locator('.v18-wallet')).toBeVisible();
  await expect(page.locator('.v18-offer-grid article').first()).toBeVisible();
  const snapshot=await page.evaluate(()=>{const s=game.economySummaryV18();return{schema:game.state.v18.schemaVersion,vendor:s.market.vendorLabel,rotation:s.market.rotation,offers:s.market.offers.map(item=>[item.offerId,item.name,item.price,item.currency])};});
  expect(snapshot.schema).toBe(18);expect(snapshot.vendor.length).toBeGreaterThan(3);expect(snapshot.offers.length).toBeGreaterThanOrEqual(7);
  const again=await page.evaluate(()=>game.economySummaryV18().market.offers.map(item=>[item.offerId,item.name,item.price,item.currency]));expect(again).toEqual(snapshot.offers);
});

test('crafted equipment can be equipped and changes the live combat stat model',async({page})=>{
  await load(page);
  const result=await page.evaluate(()=>{
    game.state.characterReady=true;game.closeTitleV13(true);game.ensureV18();game.state.v18.wallet.salvage=100;game.state.v18.wallet.cosmicFragments=20;
    const before=game.effectiveStats(),crafted=game.craftV18('field-forge'),item=game.state.lootInventory.at(-1);game.equipGearV18(item.id);const after=game.effectiveStats();return{item,delta:Object.fromEntries(Object.keys(before).map(key=>[key,after[key]-before[key]])),equipped:game.state.equipment[item.slot]};
  });
  expect(result.item).toBeTruthy();expect(result.equipped).toBe(result.item.id);expect(Object.values(result.delta).some(value=>value>0)).toBe(true);
  await page.evaluate(()=>game.openWorldV16('economy'));await expect(page.locator('.v18-inventory article.equipped')).toContainText(result.item.name);
});

test('market purchase spends authoritative Credits without desynchronizing the wallet',async({page})=>{
  await load(page);
  const purchase=await page.evaluate(()=>{game.state.characterReady=true;game.closeTitleV13(true);game.state.credits=10000;game.ensureV18();const offer=game.economySummaryV18().market.offers.find(item=>item.kind==='equipment'&&item.currency==='credits');const before=game.state.credits;game.buyV18(offer.offerId);return{before,after:game.state.credits,wallet:game.state.v18.wallet.credits,owned:game.state.lootInventory.some(item=>item.id===offer.id),price:offer.price};});
  expect(purchase.owned).toBe(true);expect(purchase.after).toBe(purchase.before-purchase.price);expect(purchase.wallet).toBe(purchase.after);
});
