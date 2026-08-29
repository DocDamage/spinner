'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v19';

async function load(page){await page.goto(APP);await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>game?.state?.v19?.schemaVersion)).toBe(19);}

async function seedParty(page){
  const ids=await page.evaluate(()=>{game.state.characterReady=true;const ids=DATA.characters.slice(0,2).map(c=>c.id);game.state.party=[...ids];for(const id of ids)game.v8Party(id);game.ensureV19();game.save();return ids;});
  await page.evaluate(()=>game.closeTitleV13(true));
  await page.locator('[data-v8-nav="team"]').click();
  await expect(page.locator('#v8-shell')).toHaveClass(/open/);
  return ids;
}

test('V19 Team view exposes relationship axes and reserve management',async({page})=>{
  await load(page);const ids=await seedParty(page);await expect(page.locator('#v19-team-layer')).toBeVisible();await expect(page.locator('.v19-team-grid .v19-ally-card')).toHaveCount(2);await expect(page.locator('.v19-axes').first()).toContainText('Trust');await expect(page.locator('#v19-party-beacon')).toContainText('Morale');
  await page.locator(`[data-v19-bench="${ids[1]}"]`).click();await expect.poll(()=>page.evaluate(id=>({active:game.state.party.includes(id),bench:game.state.v19.benchIds.includes(id)}),ids[1])).toEqual({active:false,bench:true});await expect(page.locator('.v19-reserves .v19-ally-card')).toHaveCount(1);
  await page.locator(`[data-v19-activate="${ids[1]}"]`).click();await expect.poll(()=>page.evaluate(id=>({active:game.state.party.includes(id),bench:game.state.v19.benchIds.includes(id)}),ids[1])).toEqual({active:true,bench:false});
  await page.locator('[data-v19-permadeath]').click();await expect(page.locator('[data-v19-permadeath]')).toContainText('ON');
});

test('Resonant Ascension changes the live effective-stat model only when bond thresholds are met',async({page})=>{
  await load(page);const ids=await seedParty(page);const result=await page.evaluate(ids=>{
    const engine=new MultiverseDomain.PartyConsequencesEngine(),pair=engine.pair(game.state,ids[0],ids[1],Array.from(CHAR.values()));Object.assign(pair,{compatibility:95,trust:95,friendship:95,rivalry:0,resentment:0});for(const id of ids){game.state.v19.records[id].axes.friendship=90;game.state.v19.records[id].axes.trust=90;}game.state.v19.morale=90;game.state.pending=null;const base=game.effectiveStats();game.state.pending={type:'battle',stage:'offer'};const boosted=game.effectiveStats(),surge=game.partySummaryV19().surge;game.state.pending=null;return{surge,delta:Object.fromEntries(Object.keys(base).map(key=>[key,boosted[key]-base[key]]))};
  },ids);expect(result.surge.ready).toBe(true);expect(result.surge.label).toBe('Resonant Ascension');expect(Object.values(result.delta).every(value=>value===4)).toBe(true);
});

test('V13 loyalty remains single-sourced while V19 story axes react',async({page})=>{
  await load(page);const ids=await seedParty(page);const result=await page.evaluate(id=>{game.ensureV19();const before={loyalty:game.state.v19.records[id].axes.loyalty,trust:game.state.v19.records[id].axes.trust};game.applyNarrativeEffectV13({loyalty:5,hero:1},'V19 e2e choice');const after=game.state.v19.records[id].axes;return{before,after:{loyalty:after.loyalty,trust:after.trust},legacy:game.state.v13.relationshipArcs[id].loyalty};},ids[0]);
  expect(result.after.loyalty-result.before.loyalty).toBe(5);expect(result.after.trust-result.before.trust).toBe(3);expect(result.legacy).toBe(result.after.loyalty);
});
