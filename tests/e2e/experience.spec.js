'use strict';

const {test,expect}=require('@playwright/test');

const APP='/Multiverse_Wheel_V8_1326_Real_Repo_Images.html?e2e=experience';

test('a new player reaches and claims the guaranteed first power',async({page})=>{
  await page.goto(APP);
  await expect(page.getByRole('heading',{name:'Choose a starting style'})).toBeVisible();
  await page.getByRole('button',{name:/Vanguard Aegis/}).click();
  await expect(page.getByRole('heading',{name:'Find your first power source'})).toBeVisible();
  await expect(page.locator('#v11-stage-map li')).toHaveCount(10);
  await expect(page.locator('.v11-collection-goal')).toContainText('0 / 1,326');
  await page.getByRole('button',{name:'SPIN FOR FIRST POWER'}).click();
  const claim=page.getByRole('button',{name:'ABSORB COMPLETE POWER SET'});
  await expect(claim).toBeVisible({timeout:15000});
  await claim.click();
  await expect(page.locator('#power-set-count')).toContainText('1 sets');
  await expect(page.locator('.v11-collection-goal')).toContainText('1 / 1,326');
  await expect(page.locator('#log-list')).toContainText('COLLECTION MILESTONE: First Contact');
});

test('reward comparison, collection focus, and focused combat stay connected',async({page})=>{
  await page.goto(APP);
  await page.getByRole('button',{name:/Tactician Cipher/}).click();
  await page.evaluate(()=>{
    const enemy=CHAR.get('scarlet_witch') || DATA.characters.find(character=>character.tags?.includes('magic'));
    game.state.pending={id:'reward-smoke',type:'battle',ref:enemy.id,profileId:enemy.id,label:enemy.name,sub:'Reward smoke',color:'#dc2626',stage:'battle_reward',phase:1,maxPhases:1};
    game.renderAll();
  });
  await expect(page.locator('.v11-reward-compare')).toContainText('Choose what permanently changes');
  await expect(page.locator('.v11-reward-compare')).toContainText('Victory surge');

  await page.evaluate(()=>{
    game.state.pending=null;
    game.state.credits=250;
    game.renderAll();
  });
  await page.locator('[data-v11-focus-universe]').selectOption('DC');
  await page.getByRole('button',{name:/FOCUS 3 WHEELS/}).click();
  await expect(page.locator('.v11-collection-goal')).toContainText('3 FOCUSED WHEELS LEFT');
  expect(await page.evaluate(()=>game.state.credits)).toBe(175);

  await page.evaluate(()=>{
    const enemy=CHAR.get('scarlet_witch') || DATA.characters[0];
    game.state.pending={id:'combat-smoke',type:'battle',ref:enemy.id,profileId:enemy.id,label:enemy.name,sub:'Combat smoke',color:'#dc2626',stage:'offer',phase:1,maxPhases:1};
    game.renderAll();
  });
  await page.getByRole('button',{name:'FOCUS VIEW'}).click();
  await expect(page.locator('body')).toHaveClass(/v11-combat-focus/);
  await expect(page.locator('.hero-panel')).toBeHidden();
  await expect(page.locator('.v11-advice,.v10-advice').first()).toBeVisible();
  await expect(page.locator('.v11-round-track li')).toHaveCount(4);
  await page.locator('[data-action="v6-attack"]').click();
  await expect(page.locator('.v11-impact')).toBeVisible();

  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator('.event-panel .resolve-row')).toHaveCSS('position','sticky');

  await page.evaluate(()=>{
    const enemy=CHAR.get('scarlet_witch') || DATA.characters[0];
    game.state.spin=10;
    game.state.stageArc={stageNumber:1,name:'Awakening Test',completed:true,decisions:[{},{},{}],progress:2,target:2};
    game.state.pending={id:'boss-summary-smoke',type:'boss',ref:enemy.id,profileId:enemy.id,label:enemy.name,sub:'Boss summary',color:'#dc2626',stage:'result',resultText:'Boss defeated.',phase:1,maxPhases:1};
    game.renderAll();
  });
  await expect(page.locator('.v11-stage-summary')).toContainText('STAGE 1 COMPLETE');
  await expect(page.locator('.v11-stage-summary')).toContainText('3 / 3');
});

test('display preferences are user controlled and persisted',async({page})=>{
  await page.goto(APP);
  await page.getByRole('button',{name:/Guardian Lifeline/}).click();
  await page.getByRole('button',{name:'Help'}).click();
  const large=page.getByRole('button',{name:'LARGER TEXT'});
  const contrast=page.getByRole('button',{name:'HIGH CONTRAST'});
  const motion=page.getByRole('button',{name:'REDUCE MOTION'});
  await large.click();await contrast.click();await motion.click();
  await expect(page.locator('body')).toHaveClass(/v11-large-text/);
  await expect(page.locator('body')).toHaveClass(/v11-high-contrast/);
  await expect(page.locator('body')).toHaveClass(/v11-reduce-motion/);
  await expect(large).toHaveAttribute('aria-pressed','true');
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/v11-large-text/);
  await expect(page.locator('body')).toHaveClass(/v11-high-contrast/);
  await expect(page.locator('body')).toHaveClass(/v11-reduce-motion/);
});

test('custom creation is reversible and maxed duplicates always convert',async({page})=>{
  await page.goto(APP);
  await page.getByRole('button',{name:'BUILD A CUSTOM ORIGIN'}).click();
  await expect(page.locator('.v6-character-grid')).toBeVisible();
  await page.getByRole('button',{name:/BACK TO QUICK START/}).click();
  await expect(page.getByRole('heading',{name:'Choose a starting style'})).toBeVisible();
  await page.getByRole('button',{name:/Striker Velocity/}).click();
  const conversion=await page.evaluate(()=>{
    const id=DATA.characters[0].id;
    game.state.kits=[{id,mastery:5}];
    game.state.credits=0;
    game.state.evolutionPoints=0;
    game.state.v11Experience.duplicateShards=0;
    game.acquireKit(id);game.acquireKit(id);game.acquireKit(id);
    return {credits:game.state.credits,evolution:game.state.evolutionPoints,shards:game.state.v11Experience.duplicateShards,mastery:game.state.kits[0].mastery};
  });
  expect(conversion).toEqual({credits:375,evolution:1,shards:0,mastery:5});
});

test('command center, pace controls, shortcuts, and backup export work together',async({page})=>{
  await page.goto(APP);
  await page.getByRole('button',{name:/Vanguard Aegis/}).click();
  const command=page.locator('#v12-command-center');
  await expect(command).toContainText('Find your first power source');

  await page.getByRole('button',{name:'Help'}).click();
  const fast=page.getByRole('button',{name:'FAST WHEEL'});
  const haptics=page.getByRole('button',{name:'HAPTIC FEEDBACK'});
  await fast.click();await haptics.click();
  await expect(fast).toHaveAttribute('aria-pressed','true');
  await expect(haptics).toHaveAttribute('aria-pressed','true');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'EXPORT BACKUP'}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^multiverse-wheel-aegis-spin-0\.json$/);
  await page.getByRole('button',{name:'Close'}).click();

  await page.keyboard.press('s');
  const claim=page.getByRole('button',{name:'ABSORB COMPLETE POWER SET'});
  await expect(claim).toBeVisible({timeout:5000});
  await claim.click();
  await expect(command).toHaveAttribute('data-objective','continue');
  await page.keyboard.press('c');
  await expect(command).toHaveAttribute('data-objective','spin');

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/v12-fast-turns/);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
