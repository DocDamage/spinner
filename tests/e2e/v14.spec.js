'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v14';

async function openFresh(page){await page.goto(APP);await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();}
async function reachRules(page,hero=/Aegis/i){await openFresh(page);await page.getByRole('button',{name:/NEW TIMELINE/i}).click();await page.getByRole('button',{name:hero}).click();await expect(page.getByRole('heading',{name:'Set the rules'})).toBeVisible();}
async function launchPlayers(page,count=3,mode='council'){
  await reachRules(page);await page.locator('[data-v14-player-count]').selectOption(String(count));if(count>1)await page.locator('[data-v14-decision-mode]').selectOption(mode);
  for(let index=0;index<count;index++)await page.locator(`[data-v14-player-name="${index}"]`).fill(['Nova','Cipher','Aegis'][index]||`Player ${index+1}`);
  await page.getByRole('button',{name:'REVIEW TIMELINE'}).click();await expect(page.locator('.v13-confirm')).toContainText(count===1?'Solo timeline':`${count}-player hot-seat`);await page.getByRole('button',{name:'BEGIN TIMELINE'}).click();await expect(page.locator('#v13-title-screen')).toBeHidden();
}

test('up to ten local players can be configured with rotating ownership',async({page})=>{
  await launchPlayers(page,10,'captain');const state=await page.evaluate(()=>({count:game.state.v14.multiplayer.players.length,names:game.state.v14.multiplayer.players.map(player=>player.name),mode:game.state.v14.multiplayer.decisionMode}));expect(state.count).toBe(10);expect(state.names.slice(0,3)).toEqual(['Nova','Cipher','Aegis']);expect(state.mode).toBe('captain');await expect(page.locator('#v14-story-beacon')).toContainText('Nova');
  await page.evaluate(()=>{game.state.pending={id:'turn-smoke',type:'training',ref:'turn-smoke',label:'Turn smoke',stage:'result',v9InterludeComplete:true};game.completeEvent();});await expect(page.locator('#v14-story-beacon')).toContainText('Cipher');
});

test('council story voting records every player and reveals one consequence',async({page})=>{
  await launchPlayers(page,3,'council');await page.evaluate(()=>game.storyInterludeV9());await expect(page.locator('.v14-saga-event')).toContainText('CHAPTER 1/10');await expect(page.locator('.v14-story-facts')).toContainText('OBJECTIVE');
  await page.locator('[data-v14-saga-choice="shield"]').click();await expect(page.locator('.v14-vote-call')).toContainText('Cipher');await page.locator('[data-v14-saga-choice="accord"]').click();await expect(page.locator('.v14-vote-call')).toContainText('Aegis');await page.locator('[data-v14-saga-choice="shield"]').click();await expect(page.locator('.v14-saga-result')).toContainText('Council decision');
  const result=await page.evaluate(()=>({history:game.state.v14.saga.history.length,key:game.state.v14.saga.macguffins[0],votes:game.state.v14.multiplayer.players.map(player=>player.decisions)}));expect(result).toEqual({history:1,key:'axis-shard',votes:[1,1,1]});
});

test('the Hero Forge exposes point buy, skills, roleplay anchors, and derived visuals',async({page})=>{
  await reachRules(page,/Custom Origin/i);await page.getByRole('button',{name:'REVIEW TIMELINE'}).click();await page.getByRole('button',{name:'OPEN ORIGIN CREATOR'}).click();await expect(page.locator('.v14-creator')).toBeVisible();await expect(page.locator('.v14-ability-grid article')).toHaveCount(6);await expect(page.locator('[data-v14-points]')).toContainText('15 / 27');
  await page.locator('[data-v14-ability-step="power|1"]').click();await expect(page.locator('[data-v14-points]')).toContainText('14 / 27');await page.locator('#v14-calling').selectOption('savant');await page.locator('#v14-background').selectOption('inventor');await page.locator('#v14-ideal').fill('Questions are more valuable than certainty.');await page.locator('#v14-bond').fill('I owe my life to an erased city.');await page.locator('#v6-origin-story').fill('I built a compass from the minute the universe forgot.');await page.getByRole('button',{name:/SAVE HERO/}).click();
  await page.getByRole('button',{name:'FULL DASHBOARD'}).click();await expect(page.locator('.v14-character-sheet')).toBeVisible();await expect(page.locator('#v14-stat-canvas')).toBeVisible();const sheet=await page.evaluate(()=>game.state.customCharacter.v14);expect(sheet.callingId).toBe('savant');expect(sheet.abilities.power).toBe(11);expect(sheet.derived.mind).toBeGreaterThan(20);
});

test('artifacts and Chronicle keys render local images and custom plans persist',async({page})=>{
  await launchPlayers(page,1,'captain');await page.evaluate(()=>{game.acquireArtifact('mjolnir',true);game.renderAll();});await expect(page.locator('.v14-relic-card img')).toHaveAttribute('src','item_images/mjolnir.png');await page.evaluate(()=>game.storyInterludeV9());await expect(page.locator('.v14-saga-event>header img')).toHaveAttribute('src','macguffin_images/axis-shard.png');await page.locator('.v14-custom-plan').evaluate(element=>element.open=true);await page.locator('textarea[data-v14-custom-plan]').fill('Ask the deleted witnesses to redraw the road beneath us.');await page.locator('[data-v14-custom-skill]').selectOption('insight');await page.locator('[data-v14-custom-risk]').selectOption('bold');await page.locator('[data-v14-custom-resolve]').evaluate(element=>element.click());await expect(page.locator('.v14-saga-result')).toContainText(/d20 \d+/);expect(await page.evaluate(()=>game.state.v14.saga.customPlans.length)).toBe(1);
});
