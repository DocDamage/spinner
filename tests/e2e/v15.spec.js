'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v15';

async function load(page){await page.goto(APP);await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();}

test('Level 1 progression gates powers and exposes real attribute allocation',async({page})=>{
  await load(page);const start=await page.evaluate(()=>({summary:game.progressionV15(),forms:game.availableForms().slice(0,2)}));expect(start.summary.level).toBe(1);expect(start.summary.activePowerSets).toBe(1);expect(start.summary.techniqueSlots).toBe(2);
  await page.evaluate(()=>{game.state.characterReady=true;game.state.customCharacter.v14=new MultiverseDomain.CharacterCreationEngine().createSheet(new MultiverseDomain.CharacterCreationEngine().defaults()).sheet;game.awardHeroXPV15(100,'First chapter','e2e-level');game.closeTitleV13(true);game.renderAll();});
  await page.getByRole('button',{name:'FULL DASHBOARD'}).click();await expect(page.locator('.v15-progression')).toContainText('Level 2');await expect(page.locator('.v15-progression')).toContainText('1 ATTRIBUTE POINT');
  await page.locator('[data-v15-allocate="agility"]').click();const result=await page.evaluate(()=>({points:game.progressionV15().unspentAbilityPoints,agility:game.effectiveSheetV15().abilities.agility}));expect(result).toEqual({points:0,agility:11});
});

test('creator offers deeper prompts, portable Level 1 files, and exact transformation art',async({page})=>{
  await load(page);await page.getByRole('button',{name:/NEW TIMELINE/i}).click();await page.getByRole('button',{name:/Custom Origin/i}).click();await page.getByRole('button',{name:'REVIEW TIMELINE'}).click();await page.getByRole('button',{name:'OPEN ORIGIN CREATOR'}).click();
  await expect(page.locator('[data-v15-creator]')).toHaveCount(10);await expect(page.locator('#v14-lineage option')).toHaveCount(12);await expect(page.locator('#v14-calling option')).toHaveCount(10);await expect(page.locator('[data-v14-skill]')).toHaveCount(18);await expect(page.locator('.v15-hero-portability')).toContainText('always enter at Level 1');
  const download=page.waitForEvent('download');await page.locator('[data-v15-hero-export]').click();const file=await download;expect(file.suggestedFilename()).toMatch(/\.mwhero\.json$/);
  const heroFile=await page.evaluate(()=>JSON.stringify(new MultiverseDomain.HeroArchiveEngine().create(game.readCreatorV14(),'').file));await page.evaluate(()=>{game.awardHeroXPV15(600,'Imported-save setup','import-setup');game.state.kits=[{id:DATA.characters[0].id,mastery:5}];game.state.activePowerSets=[DATA.characters[0].id];game.state.artifacts=[DATA.artifacts[0].id];});await page.locator('[data-v15-hero-import]').setInputFiles({name:'riftwalker.mwhero.json',mimeType:'application/json',buffer:Buffer.from(heroFile)});await expect(page.locator('[data-v14-creator-error]')).toContainText('Level 1');await page.getByRole('button',{name:/SAVE HERO/}).click();const reset=await page.evaluate(()=>({level:game.progressionV15().level,kits:game.state.kits.length,items:game.state.artifacts.length,bonus:Object.values(game.state.bonuses).reduce((a,b)=>a+b,0)}));expect(reset).toEqual({level:1,kits:0,items:0,bonus:0});
  const art=await page.evaluate(()=>({missing:game.formPortrait({name:'Super Saiyan Blue',source:'Goku'},'source:goku:3'),exact:game.gameAssetPathV14('transformation','source:goku:3')}));expect(art.missing).toContain('data:image/svg+xml');expect(decodeURIComponent(art.missing)).toContain('EXACT-ID PLACEHOLDER');expect(art.exact).toBe('');
});

test('two isolated browser devices exchange WebRTC codes and synchronize host-authoritative state',async({browser})=>{
  const hostContext=await browser.newContext({serviceWorkers:'block'}),guestContext=await browser.newContext({serviceWorkers:'block'}),host=await hostContext.newPage(),guest=await guestContext.newPage();
  try{
    await Promise.all([load(host),load(guest)]);
    const invite=await host.evaluate(async()=>{game.state.v14.multiplayer=new MultiverseDomain.MultiplayerEngine().create({count:2,names:['Host','Guest'],decisionMode:'captain'});return game.networkTableV15().createInvite('player-2');});
    expect(invite.length).toBeGreaterThan(500);
    const answer=await guest.evaluate(code=>game.networkTableV15().answerInvite(code),invite);expect(answer.length).toBeGreaterThan(500);
    await host.evaluate(code=>game.networkTableV15().acceptAnswer(code),answer);
    await expect.poll(()=>host.evaluate(()=>game.networkTableV15().meta().connected.includes('player-2')),{timeout:15000}).toBe(true);
    await expect.poll(()=>guest.evaluate(()=>game.networkTableV15().peers.get('host')?.channel?.readyState),{timeout:15000}).toBe('open');
    await host.evaluate(()=>{game.state.v14.saga.currentObjective='Synchronize the unwritten bridge.';game.save();});
    await expect.poll(()=>guest.evaluate(()=>game.state.v14.saga.currentObjective),{timeout:10000}).toBe('Synchronize the unwritten bridge.');
    await host.evaluate(()=>{game.state.v14.multiplayer.activeIndex=1;game.save();});
    await expect.poll(()=>guest.evaluate(()=>game.state.v14.multiplayer.activeIndex),{timeout:10000}).toBe(1);
    await guest.evaluate(()=>{game.state.v14.intent.description='The guest chooses the bridge route.';game.save();});
    await expect.poll(()=>host.evaluate(()=>game.state.v14.intent.description),{timeout:10000}).toBe('The guest chooses the bridge route.');
  }finally{await hostContext.close();await guestContext.close();}
});
