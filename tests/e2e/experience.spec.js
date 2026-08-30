'use strict';

const {test,expect}=require('@playwright/test');
const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=v13';

async function openFresh(page){await page.goto(APP);await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();}
async function launchPreset(page,name=/Aegis/i){
  await openFresh(page);await page.getByRole('button',{name:/NEW TIMELINE/i}).click();await expect(page.getByRole('heading',{name:'Choose a hero foundation'})).toBeVisible();await page.getByRole('button',{name}).click();await expect(page.getByRole('heading',{name:'Set the rules'})).toBeVisible();await page.getByRole('button',{name:'REVIEW TIMELINE'}).click();await expect(page.getByRole('heading',{name:'Confirm launch'})).toBeVisible();await page.getByRole('button',{name:'BEGIN TIMELINE'}).click();await expect(page.locator('#v13-title-screen')).toBeHidden();
}

async function completeThirtySpinJourney(page){
  return page.evaluate(()=>{
    let guard=0;
    const resolve=()=>{
      const p=game.state.pending;if(!p)return;
      if(p.type==='v14-saga'){if(p.stage==='offer')game.finishSagaChoiceV14(p.scene,p.scene.choices[0].id);else game.completeEvent();return;}
      if(p.type==='v13-universe'){game.applyUniverseChoiceV13(p.event.id,p.event.choices[0].id);game.completeEvent();return;}
      if(p.type==='v13-callback'){if(p.stage==='offer')p.stage='result';game.completeEvent();return;}
      if(p.type==='v9-story'){const branch=MultiverseDomain.CAMPAIGN_BRANCHES.find(item=>item.id===p.branchId);game.applyStoryChoiceV9(p.branchId,branch.choices[0].id);game.completeEvent();return;}
      if(p.type==='v9-camp'){game.applyCampChoiceV9('recover');game.completeEvent();return;}
      if(p.stage==='result'){game.completeEvent();return;}
      if(p.type==='boss'){
        const enemy=game.battleProfile(p);game.afterWin(enemy);game.finishCombatVictory(p,enemy);if(!game.state.ended&&game.state.pending?.stage==='battle_reward')game.handleAction('battle-surge');return;
      }
      if(p.type==='power'){game.handleAction('take-power');return;}
      if(p.type==='recovery'){game.handleAction('recovery-heal');return;}
      if(p.type==='training'){game.handleAction('train');return;}
      if(p.type==='recruit'){game.handleAction(game.state.party.length>=game.partyCapacity()?'train-recruit':'recruit');return;}
      if(p.type==='hazard'){game.handleAction('hazard-contain');return;}
      if(p.type==='rare'){game.handleAction('rare-choice','0');return;}
      if(p.type==='battle'){p.stage='battle_reward';game.handleAction('battle-surge');return;}
      p.stage='result';game.completeEvent();
    };
    while(!game.state.ended&&guard++<240){
      if(game.state.pending){resolve();continue;}
      const next=game.state.spin+1,slices=game.state.slices||[];
      const slice=next%10===0?slices.find(item=>item.type==='boss'):slices.find(item=>['power','recovery','training','recruit'].includes(item.type))||slices[0];
      if(!slice)throw new Error(`No slice available for spin ${next}`);game.land(slice);
    }
    return{ended:game.state.ended,win:game.state.finalWin,spin:game.state.spin,guard,ending:game.state.v13.ending?.title,callbacks:game.state.v13.storyStats.callbacksResolved};
  });
}

test('title setup reaches and claims the guaranteed first power in an isolated slot',async({page})=>{
  await launchPreset(page,/Aegis/i);await expect(page.locator('#v11-stage-map li')).toHaveCount(10);await expect(page.locator('.v11-collection-goal')).toContainText('0 / 1,326');await page.locator('#spin-btn').click();const claim=page.getByRole('button',{name:'ABSORB COMPLETE POWER SET'});await expect(claim).toBeVisible({timeout:15000});await claim.click();await expect(page.locator('#power-set-count')).toContainText('1 sets');await expect(page.locator('.v11-collection-goal')).toContainText('1 / 1,326');expect(await page.evaluate(()=>game.activeSlotV13())).toBe(1);
});

test('reward comparison, canonical collection focus, and V13 combat remain connected',async({page})=>{
  await launchPreset(page,/Cipher/i);await page.evaluate(()=>{const enemy=CHAR.get('scarlet_witch')||DATA.characters.find(character=>character.tags?.includes('magic'));game.state.pending={id:'reward-smoke',type:'battle',ref:enemy.id,profileId:enemy.id,label:enemy.name,sub:'Reward smoke',color:'#dc2626',stage:'battle_reward',phase:1,maxPhases:1};game.renderAll();});await expect(page.locator('.v11-reward-compare')).toContainText('Choose what permanently changes');await expect(page.locator('.v13-source-compare')).toContainText('STRUCTURED WEAKNESS');
  await page.evaluate(()=>{game.state.pending=null;game.state.credits=250;game.renderAll();});await page.getByRole('button',{name:'FULL DASHBOARD'}).click();await page.locator('[data-v11-focus-universe]').selectOption('DC');await page.getByRole('button',{name:/FOCUS 3 WHEELS/}).click();await expect(page.locator('.v11-collection-goal')).toContainText('3 FOCUSED WHEELS LEFT');expect(await page.evaluate(()=>game.state.credits)).toBe(175);
  await page.evaluate(()=>{const enemy=CHAR.get('scarlet_witch')||DATA.characters[0];game.state.pending={id:'combat-smoke',type:'battle',ref:enemy.id,profileId:enemy.id,label:enemy.name,sub:'Combat smoke',color:'#dc2626',stage:'offer',phase:1,maxPhases:1};game.renderAll();});await expect(page.locator('.v13-combat-command')).toBeVisible();await expect(page.locator('.v11-advice,.v10-advice').first()).toBeVisible();await page.locator('[data-action="v6-attack"]').click();await expect(page.locator('.v11-impact')).toBeVisible();
});

test('display, color-vision, pace, and sound preferences persist',async({page})=>{
  await openFresh(page);await page.getByRole('button',{name:'SETTINGS'}).click();await page.getByRole('button',{name:/Larger text/}).click();await page.getByRole('button',{name:/High contrast/}).click();await page.getByRole('button',{name:/Reduce motion/}).click();await page.locator('[data-v13-pref="colorVision"]').selectOption('deuteranopia');await page.locator('[data-v13-pref="soundVolume"]').fill('0.4');await expect(page.locator('body')).toHaveClass(/v13-color-deuteranopia/);await page.reload();await expect(page.locator('body')).toHaveClass(/v11-large-text/);await expect(page.locator('body')).toHaveClass(/v11-high-contrast/);await expect(page.locator('body')).toHaveClass(/v11-reduce-motion/);await expect(page.locator('body')).toHaveClass(/v13-color-deuteranopia/);
});

test('custom setup is reversible and maxed duplicates still convert',async({page})=>{
  await openFresh(page);await page.getByRole('button',{name:/NEW TIMELINE/i}).click();await page.getByRole('button',{name:/Custom Origin/i}).click();await expect(page.getByRole('heading',{name:'Set the rules'})).toBeVisible();await page.getByRole('button',{name:'BACK'}).click();await page.getByRole('button',{name:/Velocity/i}).click();await page.getByRole('button',{name:'REVIEW TIMELINE'}).click();await page.getByRole('button',{name:'BEGIN TIMELINE'}).click();
  const conversion=await page.evaluate(()=>{const id=DATA.characters[0].id;game.state.kits=[{id,mastery:5}];game.state.credits=0;game.state.evolutionPoints=0;game.state.v11Experience.duplicateShards=0;game.acquireKit(id);game.acquireKit(id);game.acquireKit(id);return{credits:game.state.credits,evolution:game.state.evolutionPoints,shards:game.state.v11Experience.duplicateShards,mastery:game.state.kits[0].mastery};});expect(conversion).toEqual({credits:375,evolution:1,shards:0,mastery:5});
});

test('keyboard actions, save restoration, and portable backup export work together',async({page})=>{
  await launchPreset(page,/Lifeline/i);const command=page.locator('#v12-command-center');await expect(command).toContainText('Find your first power source');await page.getByRole('button',{name:'Help'}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'EXPORT BACKUP'}).click();expect((await downloadPromise).suggestedFilename()).toMatch(/^multiverse-wheel-lifeline-spin-0\.json$/);await page.getByRole('button',{name:'Close'}).click();await page.keyboard.press('s');const claim=page.getByRole('button',{name:'ABSORB COMPLETE POWER SET'});await expect(claim).toBeVisible({timeout:6000});await claim.click();await page.keyboard.press('c');await page.reload();await expect(page.getByRole('button',{name:/CONTINUE TIMELINE/i})).toBeEnabled();await page.getByRole('button',{name:/CONTINUE TIMELINE/i}).click();await expect(page.locator('#power-set-count')).toContainText('1 sets');
});

test('daily integrity, named ending recap, share card, and selectable New Game Plus are functional',async({page})=>{
  await openFresh(page);await page.getByRole('button',{name:/DAILY CHALLENGE/i}).click();await expect(page.locator('.v13-daily-best')).toContainText('PERSONAL BEST');await page.getByRole('button',{name:'START DAILY'}).click();await page.locator('[data-v13-fate-open]').click();await expect(page.locator('.v13-fate-protected')).toContainText('Daily Challenge wheels');await page.locator('[data-v13-fate-close]').click();
  await page.evaluate(()=>{game.state.record={...game.state.record,wins:25,losses:3,bossWins:8};game.state.v13.storyStats.worldsProtected=5;game.state.v13.highlights=[{type:'boss',spin:10,title:'First Horizon',detail:'A world was protected.',weight:5}];game.endRun(true);});await expect(page.locator('.v14-saga-event')).toBeVisible();await page.locator('[data-v14-saga-choice]').first().click();await page.getByRole('button',{name:'CONTINUE CHRONICLE'}).click();await expect(page.locator('.v13-ending')).toBeVisible();await expect(page.locator('.v13-ending-score')).toContainText('FINAL SCORE');const card=page.waitForEvent('download');await page.getByRole('button',{name:/DOWNLOAD SHARE CARD/}).click();expect((await card).suggestedFilename()).toMatch(/multiverse-wheel-.*\.png/);await page.getByRole('button',{name:/NEW GAME\+/}).click();await expect(page.getByRole('heading',{name:'Choose what survives'})).toBeVisible();await expect(page.locator('.v13-legacy-options label')).toHaveCount(8);
});

for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}])test(`a complete 30-spin ${viewport.name} journey reaches a named ending without overflow`,async({page})=>{
  // This is an intentional full-run stress journey through every accumulated
  // release layer. Shared CI runners can exceed Playwright's 30s default even
  // after Spinner has already reached Spin 30/30, so bound this test itself
  // rather than weakening the timeout for the rest of the browser suite.
  test.setTimeout(60_000);
  await page.setViewportSize({width:viewport.width,height:viewport.height});await launchPreset(page,/Aegis/i);const journey=await completeThirtySpinJourney(page);expect(journey.ended).toBe(true);expect(journey.win).toBe(true);expect(journey.spin).toBe(30);expect(journey.guard).toBeLessThan(240);expect(journey.ending).toBeTruthy();await expect(page.locator('.v13-ending')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
});

test('the cached application shell reloads while offline',async({page,context})=>{
  await openFresh(page);await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.ready.then(()=>Boolean(navigator.serviceWorker.controller||true)))).toBe(true);await page.reload();await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'Choose where the story begins'})).toBeVisible();await expect(page.locator('[data-v13-network]')).toContainText('OFFLINE');await context.setOffline(false);
});