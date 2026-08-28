'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {
  V14_SCHEMA_VERSION,POINT_BUY_BUDGET,ABILITY_KEYS,MACGUFFINS,SAGA_CHAPTERS,
  CharacterCreationEngine,MultiplayerEngine,SagaEngine,ChoiceForgeEngine,
  migrateV14,assetFor
}=require('../js/domain/v14-engine.js');

const baseState=()=>migrateV14({seed:44014,spin:4,customCharacter:{codename:'Riftwalker',archetype:'fighter'}});

test('27-point character creation validates ranges and produces a complete visual sheet model',()=>{
  const engine=new CharacterCreationEngine(),config=engine.defaults();
  config.abilities={power:15,agility:14,endurance:13,intellect:12,insight:10,presence:8};
  config.proficiencies=['athletics','perception','persuasion','technology'];
  const result=engine.createSheet(config);
  assert.equal(result.ok,true);assert.equal(result.spent,POINT_BUY_BUDGET);assert.equal(result.remaining,0);
  assert.equal(result.sheet.callingId,'vanguard');assert.equal(result.sheet.maxHealth>=24,true);
  assert.deepEqual(Object.keys(result.sheet.derived),['might','defense','speed','skill','mind','energy','hax']);
  assert.equal(result.sheet.skills.athletics.proficient,true);assert.equal(result.sheet.saves.includes('endurance'),true);
  assert.equal(ABILITY_KEYS.every(key=>Number.isInteger(result.sheet.modifiers[key])),true);
});

test('character creation rejects overspent, out-of-range, and unknown choices',()=>{
  const engine=new CharacterCreationEngine(),config=engine.defaults();
  config.abilities=Object.fromEntries(ABILITY_KEYS.map(key=>[key,15]));config.lineage='missing';config.proficiencies=['made-up'];
  const result=engine.createSheet(config);assert.equal(result.ok,false);assert.match(result.errors.join(' '),/exceeds 27/);assert.match(result.errors.join(' '),/lineage/i);assert.match(result.errors.join(' '),/Unknown skill/);
});

test('multiplayer supports one to ten hot-seat players, rotation, and council tie-breaking',()=>{
  const engine=new MultiplayerEngine(),group=engine.create({count:10,names:Array.from({length:10},(_,index)=>`Hero ${index+1}`),decisionMode:'council'});
  assert.equal(group.players.length,10);assert.equal(group.mode,'hotseat');assert.equal(group.decisionMode,'council');
  for(let index=0;index<10;index++)engine.advance(group);assert.equal(group.round,2);assert.equal(engine.active(group).name,'Hero 1');
  engine.beginVote(group,'scene',['shield','break']);
  group.players.forEach((player,index)=>engine.castVote(group,player.id,index%2?'shield':'break'));
  const result=engine.castVote(group,group.players[9].id,'shield');
  assert.equal(result.ready,true);assert.equal(result.winner,'break','active captain breaks a tied council vote');
  assert.equal(engine.create({count:99}).players.length,10);assert.equal(engine.create({count:0}).players.length,1);
});

test('the Chronicle War maps nine campaign chapters plus an explicit finale',()=>{
  const engine=new SagaEngine(),chapters=[];
  for(let stage=1;stage<=3;stage++)for(let branch=0;branch<3;branch++)chapters.push(engine.chapterFor({stage,branch,totalStages:3}).number);
  assert.deepEqual(chapters,[1,2,3,4,5,6,7,8,9]);
  const finale=engine.scene({finale:true,hero:'Nova',rival:'Cipher'});assert.equal(finale.number,10);assert.equal(finale.choices.length,4);assert.match(finale.prompt,/Nova/);
  assert.equal(SAGA_CHAPTERS.length,10);assert.equal(new Set(SAGA_CHAPTERS.map(chapter=>chapter.id)).size,10);assert.equal(MACGUFFINS.length,10);
});

test('story choices preserve their mechanical consequence and author',()=>{
  const engine=new SagaEngine(),state=baseState(),scene=engine.scene({stage:1,branch:0,totalStages:3,hero:'Riftwalker'});
  const result=engine.applyChoice(state,scene,'accord');assert.equal(result.ok,true);assert.equal(state.v14.saga.history.length,1);assert.equal(state.v14.saga.history[0].playerId,'player-1');assert.equal(state.v14.saga.axes.hope,2);assert.equal(state.v14.saga.macguffins[0],'axis-shard');
});

test('custom plans use a deterministic d20 check and remain part of the Chronicle',()=>{
  const forge=new ChoiceForgeEngine(),first=baseState(),second=baseState(),plan={text:'Redirect the applause into the prison locks.',skill:'technology',risk:'bold',sceneId:'echo-tournament'};
  const one=forge.resolveCustom(first,plan),two=forge.resolveCustom(second,plan);assert.equal(one.ok,true);assert.equal(one.roll,two.roll);assert.equal(one.total,two.total);assert.equal(first.v14.saga.customPlans.length,1);
  assert.equal(forge.setIntent(first,{stance:'discover',description:'Ask the erased witnesses first.',skill:'insight',risk:'safe'}).ok,true);assert.equal(forge.bonuses(first,'counter').battle,.035);assert.equal(forge.bonuses(first).hazard,.025);
});

test('V14 migration is idempotent, preserves legacy fields, and caps old multiplayer arrays',()=>{
  const state={customField:'keep',customCharacter:{archetype:'scientist'},v14:{multiplayer:{activeIndex:42,decisionMode:'council',players:Array.from({length:14},(_,index)=>({name:`P${index+1}`,turns:index}))}}};
  const once=migrateV14(state),snapshot=JSON.stringify(once),twice=migrateV14(once);
  assert.equal(JSON.stringify(twice),snapshot);assert.equal(twice.customField,'keep');assert.equal(twice.v14.schemaVersion,V14_SCHEMA_VERSION);assert.equal(twice.v14.multiplayer.players.length,10);assert.equal(twice.v14.multiplayer.activeIndex,9);assert.equal(twice.customCharacter.v14.callingId,'channeler');
});

test('verified asset lookup distinguishes characters, items, and MacGuffins',()=>{
  const manifest=[{kind:'character',id:'hero',path:'verified/hero.webp'},{kind:'item',id:'key',path:'items/key.png'},{kind:'macguffin',id:'key',path:'keys/key.png'}];
  assert.equal(assetFor('character','hero',manifest).path,'verified/hero.webp');assert.equal(assetFor('artifact','key',manifest).path,'items/key.png');assert.equal(assetFor('macguffin','key',manifest).path,'keys/key.png');assert.equal(assetFor('character','missing',manifest),null);
});
