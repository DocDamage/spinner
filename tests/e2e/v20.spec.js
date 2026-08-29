'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v20';

async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>game?.state?.v20?.schemaVersion)).toBe(20);
}

async function seedV20(page){
  const seeded=await page.evaluate(()=>{
    game.state.characterReady=true;
    const ids=DATA.characters.slice(0,2).map(c=>c.id),artifact=Array.from(ART.values())[0];
    game.state.party=[...ids];for(const id of ids)game.v8Party(id);
    if(artifact&&!game.state.artifacts.includes(artifact.id))game.state.artifacts.push(artifact.id);
    const gear={id:'e2e-v20-weapon',name:'E2E Legacy Blade',kind:'equipment',slot:'weapon',rarity:'epic',bonuses:{might:6,skill:4},tags:['weapon','martial'],baseValue:120};
    game.state.lootInventory=(game.state.lootInventory||[]).filter(item=>item.id!==gear.id);game.state.lootInventory.push(gear);game.state.equipment={...(game.state.equipment||{}),weapon:gear.id};
    game.ensureV20();Object.assign(game.state.v18.wallet,{salvage:300,cosmicFragments:60,voidMarks:10,bountySeals:5});
    for(const id of ids){game.state.v19.records[id].axes.trust=85;game.state.v19.records[id].axes.friendship=80;}
    game.save();return{ids,artifactId:artifact?.id||'',gearId:gear.id};
  });
  await page.evaluate(()=>game.closeTitleV13(true));
  await expect(page.locator('#v20-relic-beacon')).toBeVisible();
  await page.locator('[data-v18-economy-open]').click();
  await expect(page.locator('.v20-head')).toBeVisible();
  return seeded;
}

test('V20 economy UI exposes mastery, relic bonds, and real set forging',async({page})=>{
  await load(page);const seeded=await seedV20(page);await expect(page.locator('.v20-gear-card')).toContainText('E2E Legacy Blade');await expect(page.locator('.v20-relic-card').first()).toBeVisible();
  const before=await page.evaluate(()=>game.state.lootInventory.length);
  await page.locator('[data-v20-forge-set]').selectOption('rift-vanguard');await page.locator('[data-v20-forge-slot]').selectOption('armor');await page.locator('[data-v20-forge]').click();
  await expect.poll(()=>page.evaluate(()=>game.state.lootInventory.length)).toBe(before+1);
  const forged=await page.evaluate(()=>game.state.lootInventory.find(item=>item.v20SetId==='rift-vanguard'&&item.slot==='armor'));
  expect(forged).toBeTruthy();expect(forged.kind).toBe('equipment');expect(seeded.gearId).toBe('e2e-v20-weapon');
});

test('relic attunement, temptation, and purification operate through player controls',async({page})=>{
  await load(page);const {artifactId}=await seedV20(page);expect(artifactId).not.toBe('');
  await page.locator(`[data-v20-attune="${artifactId}|hero"]`).click();await expect.poll(()=>page.evaluate(id=>game.state.v20.relics[id].bearerId,artifactId)).toBe('hero');
  await page.locator(`[data-v20-corrupt="${artifactId}"]`).click();await expect.poll(()=>page.evaluate(id=>game.state.v20.relics[id].corruption,artifactId)).toBe(20);
  await page.locator(`[data-v20-purify="${artifactId}"]`).click();await expect.poll(()=>page.evaluate(id=>game.state.v20.relics[id].corruption,artifactId)).toBe(0);
  await expect(page.locator('.v20-relic-card').first()).toContainText('Hero');
});

test('vendor loyalty discounts the live V18 market rather than creating a parallel shop',async({page})=>{
  await load(page);await seedV20(page);
  const result=await page.evaluate(()=>{
    const engine=new MultiverseDomain.RelicMasteryEngine();for(let i=0;i<30;i++)engine.noteCommerce(game.state,'purchase',120);game.renderAll();
    const raw=new MultiverseDomain.EconomyCraftingEngine().summary(game.state,Array.from(ART.values())).market.offers[0]?.price||0,summary=game.economySummaryV18();return{discount:summary.v20Vendor.discount,raw,adjusted:summary.market.offers[0]?.price||0,rank:summary.v20Vendor.rank};
  });
  expect(result.discount).toBeGreaterThan(0);expect(result.discount).toBeLessThanOrEqual(.14);expect(result.adjusted).toBeLessThan(result.raw);expect(result.rank).toBeGreaterThan(0);await expect(page.locator('#v20-relic-beacon')).toContainText('Vendor Rank');
});

test('Legacy Convergence stacks with Resonant Ascension in the live effective-stat model',async({page})=>{
  await load(page);const {ids,artifactId}=await seedV20(page);const result=await page.evaluate(({ids,artifactId})=>{
    const party=new MultiverseDomain.PartyConsequencesEngine(),pair=party.pair(game.state,ids[0],ids[1],Array.from(CHAR.values()));Object.assign(pair,{compatibility:95,trust:95,friendship:95,rivalry:0,resentment:0});for(const id of ids){game.state.v19.records[id].axes.trust=90;game.state.v19.records[id].axes.friendship=90;}game.state.v19.morale=90;
    Object.assign(game.state.v20.relics[artifactId],{awakened:true,bearerId:'hero',status:'owned',bond:90,purity:90});game.state.pending=null;const base=game.effectiveStats();game.state.pending={type:'battle',stage:'offer'};const boosted=game.effectiveStats(),v19=game.partySummaryV19().surge,v20=game.relicSummaryV20().convergence;game.state.pending=null;return{v19,v20,delta:Object.fromEntries(Object.keys(base).map(key=>[key,boosted[key]-base[key]]))};
  },{ids,artifactId});
  expect(result.v19.ready).toBe(true);expect(result.v19.statBonus).toBe(4);expect(result.v20.ready).toBe(true);expect(result.v20.label).toBe('Legacy Convergence');expect(result.v20.statBonus).toBe(2);expect(Object.values(result.delta).every(value=>value===6)).toBe(true);
});
