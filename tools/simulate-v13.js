'use strict';

const {
  V13StateEngine,
  NarrativeExperienceEngine,
  CombatExperienceEngine,
  canonicalUniverse
}=require('../js/domain/v13-engine.js');
const {loadRoster}=require('./roster-loader.js');

const runs=Math.max(100,Number(process.argv[2]||5000));
const seed=Number(process.argv[3]||20260828)>>>0;
const roster=loadRoster();
let randomState=seed||1;
const random=()=>{
  randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;
  return randomState/4294967296;
};
const pick=items=>items[Math.floor(random()*items.length)];
const strategies=['clash','blitz','counter','mystic','outlast'];
const playStyles=[
  {id:'bonded',firstChoiceChance:.78,uniqueUniverses:4,rivalChoice:'bind',rivalRespect:-8},
  {id:'explorer',firstChoiceChance:.38,uniqueUniverses:7,rivalChoice:'bind',rivalRespect:-4},
  {id:'ruthless',firstChoiceChance:.12,uniqueUniverses:3,rivalChoice:'bind',rivalRespect:-20},
  {id:'guardian',firstChoiceChance:.52,uniqueUniverses:4,rivalChoice:'bind',rivalRespect:-2},
  {id:'rivalist',firstChoiceChance:.60,uniqueUniverses:5,rivalChoice:'invite',rivalRespect:32}
];
const report={
  runs,
  seed,
  completed:0,
  wins:0,
  strategies:Object.fromEntries(strategies.map(id=>[id,0])),
  playStyles:Object.fromEntries(playStyles.map(style=>[style.id,0])),
  fate:{earned:0,spent:0,ending:0},
  resources:{energyEnding:0,loyaltyEnding:0},
  endings:{}
};
const stateEngine=new V13StateEngine();
const narrative=new NarrativeExperienceEngine();
const combat=new CombatExperienceEngine();

for(let run=0;run<runs;run++){
  const style=pick(playStyles);
  report.playStyles[style.id]++;
  const state=stateEngine.migrate({
    seed:(seed+run)>>>0,
    spin:0,
    record:{wins:0,losses:0,bossWins:0},
    kits:[],
    party:['ally-a','ally-b'],
    partyRoster:{'ally-a':{loyalty:50},'ally-b':{loyalty:50}},
    difficulty:'normal'
  });
  let energy=100;
  let completed=true;
  for(const id of state.party)narrative.relationship(state,id,50);

  journey: for(let stage=1;stage<=10;stage++){
    const universe=canonicalUniverse(pick(roster).universe);
    for(let branch=0;branch<3;branch++){
      state.spin=(stage-1)*10+2+branch*2;
      const event=narrative.eventFor(universe,branch);
      const choice=event.choices[random()<style.firstChoiceChance?0:1];
      const result=narrative.recordChoice(state,event,choice.id,{spin:state.spin,stage,allyIds:state.party});
      energy=Math.max(0,Math.min(100,energy+Number(result.effect.energy||0)*100));
      stateEngine.earnFate(state,result.effect.fate||0,'story',state.spin);
      const due=narrative.nextCallback(state,state.spin);
      if(due){
        const outcome=narrative.resolveCallback(state,due.id);
        energy=Math.max(0,Math.min(100,energy+Number(outcome.effect.energy||0)*100));
        for(const id of state.party){
          if(outcome.effect.loyalty)narrative.adjustLoyalty(state,id,outcome.effect.loyalty,outcome.title,state.spin);
        }
        stateEngine.earnFate(state,outcome.effect.fate||0,'callback',state.spin);
      }
      if(random()<.28&&state.v13.fate.current>=1){
        stateEngine.spendFate(state,'favor',{type:'power'},{spin:state.spin});
      }
    }

    for(let battle=0;battle<2;battle++){
      const strategy=pick(strategies);
      report.strategies[strategy]++;
      const chance=Math.max(.42,Math.min(.9,.67+(energy-50)*.002+(strategy==='counter'?.025:0)));
      const win=random()<chance;
      if(win){
        state.record.wins++;
        energy=Math.max(5,energy-7);
        stateEngine.earnFate(state,battle===1?1:0,'combat',state.spin);
      }else{
        state.record.losses++;
        energy=Math.max(0,energy-15);
      }
      const preview=combat.quickResolvePreview({
        type:'battle',
        winChance:chance,
        heroRating:75+energy*.1,
        enemyRating:78,
        difficulty:'normal'
      });
      if(preview.eligible&&random()<.35)energy=Math.max(0,energy-preview.damageMin*.3);
    }

    const bossChance=Math.max(.3,Math.min(.88,.58+energy*.0025+state.v13.storyStats.worldsProtected*.004));
    if(random()<bossChance){
      state.record.wins++;
      state.record.bossWins++;
      stateEngine.earnFate(state,2,'boss',stage*10);
      energy=Math.min(100,energy+20);
    }else{
      state.record.losses++;
      energy=Math.max(0,energy-25);
    }

    // Zero-energy routes can collapse. The check is deliberately probabilistic:
    // resilient builds may recover, while weak routes give completion a real cost.
    if(energy===0&&random()<.32){
      completed=false;
      break journey;
    }
  }

  while(narrative.nextCallback(state,100)){
    narrative.resolveCallback(state,narrative.nextCallback(state,100).id);
  }
  const finalWin=completed&&state.record.bossWins>=7&&state.record.wins>=20;
  const rival=narrative.rivalOutcome({
    respect:style.rivalRespect+Math.round((random()-.5)*18),
    wins:style.id==='rivalist'?3+Math.floor(random()*3):Math.floor(random()*4),
    losses:state.record.losses,
    hero:state.v13.storyStats.hero,
    villain:state.v13.storyStats.villain,
    finalWin,
    choice:style.rivalChoice
  });
  const ending=narrative.deriveEnding(state,{
    finalWin,
    baseScore:state.record.wins*120+state.record.bossWins*500,
    difficulty:'normal',
    uniqueUniverses:style.uniqueUniverses,
    rivalOutcome:rival
  });

  if(completed)report.completed++;
  if(finalWin)report.wins++;
  report.endings[ending.id]=(report.endings[ending.id]||0)+1;
  report.fate.earned+=state.v13.fate.earned;
  report.fate.spent+=state.v13.fate.spent;
  report.fate.ending+=state.v13.fate.current;
  report.resources.energyEnding+=energy;
  report.resources.loyaltyEnding+=Object.values(state.v13.relationshipArcs)
    .reduce((sum,arc)=>sum+arc.loyalty,0)/Math.max(1,Object.keys(state.v13.relationshipArcs).length);
}

const percent=value=>Math.round(value/runs*1000)/10;
const strategyTotal=Object.values(report.strategies).reduce((sum,value)=>sum+value,0);
report.completionRate=percent(report.completed);
report.victoryRate=percent(report.wins);
report.strategyShare=Object.fromEntries(Object.entries(report.strategies)
  .map(([id,count])=>[id,Math.round(count/strategyTotal*1000)/10]));
report.playStyleShare=Object.fromEntries(Object.entries(report.playStyles)
  .map(([id,count])=>[id,percent(count)]));
report.fate={
  earnedPerRun:Math.round(report.fate.earned/runs*100)/100,
  spentPerRun:Math.round(report.fate.spent/runs*100)/100,
  endingPerRun:Math.round(report.fate.ending/runs*100)/100
};
report.resources={
  energyEndingAverage:Math.round(report.resources.energyEnding/runs*10)/10,
  loyaltyEndingAverage:Math.round(report.resources.loyaltyEnding/runs*10)/10
};
report.endingDistribution=Object.fromEntries(Object.entries(report.endings)
  .sort((a,b)=>b[1]-a[1])
  .map(([id,count])=>[id,percent(count)]));
delete report.endings;
delete report.playStyles;
console.log(JSON.stringify(report,null,2));
