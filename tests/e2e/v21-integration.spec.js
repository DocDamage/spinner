'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v21-integration';

async function load(page){
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.release||'')).toContain('v21');
  await expect.poll(()=>page.evaluate(()=>game?.state?.v21?.schemaVersion)).toBe(21);
}

async function seedFaction(page){
  return page.evaluate(()=>{
    game.state.characterReady=true;
    game.ensureV21();
    game.state.credits=5000;Object.assign(game.state.v18.wallet,{credits:5000,salvage:800,cosmicFragments:160,voidMarks:20,bountySeals:20});
    for(const f of Object.values(game.state.v16.factions))f.reputation=75;
    const engine=new MultiverseDomain.FactionCampaignEngine(),ids=Object.keys(game.state.v16.factions),primary=ids[0];
    engine.joinFaction(game.state,primary,Array.from(CHAR.values()));Object.assign(game.state.v21.memberships[primary],{rank:6,rankXp:400,authority:80});
    const territory=Object.values(game.state.v21.territories)[0];territory.controllerFactionId=primary;territory.contested=false;
    game.save();return{primary,territoryId:territory.id};
  });
}

test('V21 integration loads and applies bounded campaign Wheel pressure only on replaceable spins',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  await load(page);const seeded=await seedFaction(page);
  const result=await page.evaluate(({primary})=>{
    const engine=new MultiverseDomain.FactionCampaignEngine();game.state.spin=4;const campaign=engine.createCampaign(game.state,primary,'relic-crusade').campaign;game.state.v21.wheelCurrent=null;game.generateWheel();
    const active=game.state.v21.wheelCurrent,first={current:active,types:game.state.slices.map(s=>s.type),objective:campaign.objectives[0].events};
    game.state.spin=9;game.state.v21.wheelCurrent=null;game.generateWheel();
    return{support:typeof MultiverseDomain.v21FacilitySupport,pressure:typeof game.applyFactionWheelPressureV21,first,protectedCurrent:game.state.v21.wheelCurrent};
  },seeded);
  expect(result.support).toBe('function');expect(result.pressure).toBe('function');expect(result.first.current).toBeTruthy();expect(result.first.current.types.every(type=>['rare','artifact'].includes(type))).toBe(true);expect(result.first.current.types.some(type=>result.first.types.includes(type))).toBe(true);expect(result.protectedCurrent).toBeNull();expect(errors).toEqual([]);
});

test('V21 stronghold logistics UI spends authoritative Credits and restores supply',async({page})=>{
  await load(page);const seeded=await seedFaction(page);
  const prepared=await page.evaluate(({primary,territoryId})=>{
    const engine=new MultiverseDomain.FactionCampaignEngine(),built=engine.buildStronghold(game.state,{territoryId,factionId:primary});if(!built.ok)throw new Error(built.error);const hold=game.state.v21.strongholds[built.stronghold.id],facility=engine.buildFacility(game.state,hold.id,'quartermaster');if(!facility.ok)throw new Error(facility.error);hold.supply=28;game.save();game.renderAll();return{id:hold.id,beforeCredits:game.state.credits,beforeSupply:hold.supply};
  },seeded);
  await page.evaluate(()=>game.closeTitleV13(true));await page.locator('[data-v21-open]').click();await page.locator('[data-v21-faction-tab="strongholds"]').click();
  await expect(page.locator('.v21-logistics')).toBeVisible();await page.locator(`[data-v21-resupply="${prepared.id}"]`).click();
  const after=await page.evaluate(id=>({credits:game.state.credits,supply:game.state.v21.strongholds[id].supply}),prepared.id);expect(after.credits).toBeLessThan(prepared.beforeCredits);expect(after.supply).toBeGreaterThan(prepared.beforeSupply);expect(after.supply).toBeLessThanOrEqual(100);
});
