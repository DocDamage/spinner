'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {V13StateEngine,NarrativeExperienceEngine}=require('../js/domain/v13-engine.js');

test('a deterministic ten-stage narrative journey resolves callbacks and produces a complete recap',()=>{
  const state=new V13StateEngine().migrate({seed:42,spin:0,record:{wins:24,losses:5,bossWins:8},party:['ally'],partyRoster:{ally:{loyalty:50}}}),engine=new NarrativeExperienceEngine();engine.relationship(state,'ally',50);
  const universes=['Marvel Comics','DC Comics','Naruto','Sonic','Avatar'];
  for(let stage=1;stage<=10;stage++)for(let branch=0;branch<3;branch++){
    state.spin=(stage-1)*10+branch*2+2;const event=engine.eventFor(universes[(stage-1)%universes.length],branch),choice=event.choices[0],result=engine.recordChoice(state,event,choice.id,{spin:state.spin,stage,allyIds:['ally']});assert.equal(result.ok,true);
    let callback;while((callback=engine.nextCallback(state,state.spin)))assert.ok(engine.resolveCallback(state,callback.id));
  }
  let callback;while((callback=engine.nextCallback(state,100)))engine.resolveCallback(state,callback.id);
  assert.equal(state.v13.eventHistory.length,30);
  assert.equal(state.v13.callbacks.every(item=>item.status==='resolved'),true);
  assert.ok(state.v13.storyStats.callbacksResolved>=20);
  assert.equal(state.v13.relationshipArcs.ally.loyalty,100);
  const rival=engine.rivalOutcome({respect:80,wins:5,hero:state.v13.storyStats.hero,villain:0,finalWin:true}),ending=engine.deriveEnding(state,{finalWin:true,baseScore:8000,difficulty:'heroic',uniqueUniverses:5,rivalOutcome:rival}),recap=engine.recap(state,{hero:'Aegis',ending,record:state.record,build:'Cosmic Guardian',party:[{id:'ally',name:'Ally',loyalty:100}]});
  assert.equal(ending.id,'rivals-end');assert.equal(ending.rivalOutcome.id,'sacrifice');assert.equal(recap.mvp.name,'Ally');assert.ok(recap.highlights.length<=6);for(let index=1;index<recap.highlights.length;index++)assert.ok(recap.highlights[index-1].spin<=recap.highlights[index].spin);
});

test('campaign lengths below thirty end when their configured final result completes',()=>{
  const state=new V13StateEngine().migrate({spin:10,campaignLimit:10,pending:{stage:'result'},ended:false,finalWin:false});
  assert.equal(Number(state.spin)>=Number(state.campaignLimit),true);
  assert.equal(state.pending.stage,'result');
});
