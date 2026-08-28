'use strict';

(function attachExperienceEngine(root) {
  const PRESETS = [
    {id:'vanguard',label:'Vanguard',name:'Jordan Reyes',codename:'Aegis',homeworld:'Earth-Prime',archetype:'soldier',accent:'#38bdf8',tone:'hopeful heroic',flaw:'refuses to abandon anyone',summary:'Durable and direct. Strong defense, weapons, and tactical fundamentals.',story:'Jordan Reyes was a rescue specialist who held a collapsing transit hub together long enough for everyone else to escape. The dimensional fracture that followed turned Aegis into a living receiver for heroic power signatures. They now cross realities to bring everyone home, even when retreat would be safer.'},
    {id:'striker',label:'Striker',name:'Maya Chen',codename:'Velocity',homeworld:'Earth-Prime',archetype:'athlete',accent:'#f97316',tone:'anime tournament',flaw:'cannot ignore a challenge',summary:'Fast and aggressive. Excels at speed, pressure, and martial techniques.',story:'Maya Chen was a champion racer whose final lap crossed a fracture in time. The accident left Velocity able to learn the movement patterns of beings from other worlds. Every new rival is a chance to grow, but every challenge makes it harder to know when to stop.'},
    {id:'tactician',label:'Tactician',name:'Rowan Vale',codename:'Cipher',homeworld:'Earth-Prime',archetype:'detective',accent:'#a78bfa',tone:'cosmic mystery',flaw:'overthinks simple fights',summary:'Precise and prepared. Strong mind, skill, counters, and strategic options.',story:'Rowan Vale investigated impossible crimes until the evidence began pointing into other universes. A sentient archive chose Cipher as its field agent and opened channels to borrowed power signatures. They intend to map the whole crisis before it can erase another world.'},
    {id:'support',label:'Guardian',name:'Samira Okafor',codename:'Lifeline',homeworld:'Earth-Prime',archetype:'medic',accent:'#2dd4bf',tone:'science-fiction survival',flaw:'pushes through injuries instead of resting',summary:'Resilient and supportive. Strong healing, analysis, and team utility.',story:'Samira Okafor kept a dimensional disaster ward alive after every system failed. The anomaly taught Lifeline to recognize and stabilize foreign power signatures. She enters the multiverse to protect the people caught between its strongest combatants.'}
  ];
  const BEATS = {
    1:['DISCOVERY','Power source'],2:['DISCOVERY','Build choice'],3:['STORY','Decision'],4:['DISCOVERY','World event'],5:['RIVAL','Rival encounter'],
    6:['STORY','Decision'],7:['DISCOVERY','Build test'],8:['STORY','Final decision'],9:['CAMP','Prepare'],10:['BOSS','Stage boss']
  };
  const STAT_KEYS = ['might','defense','speed','skill','mind','energy','hax'];
  const COLLECTION_REWARDS = [
    {milestone:1,credits:50,evolution:0,label:'First Contact'},
    {milestone:5,credits:100,evolution:0,label:'World Walker'},
    {milestone:10,credits:100,evolution:1,label:'Power Curator'},
    {milestone:25,credits:250,evolution:1,label:'Multiverse Scout'},
    {milestone:50,credits:400,evolution:2,label:'Archive Builder'},
    {milestone:100,credits:750,evolution:3,label:'Living Compendium'},
    {milestone:250,credits:1500,evolution:5,label:'Omniversal Archivist'},
    {milestone:500,credits:3000,evolution:8,label:'Keeper of Worlds'},
    {milestone:1000,credits:6000,evolution:12,label:'Infinite Index'}
  ];

  class ExperienceEngine {
    presets() { return PRESETS.map(preset => ({...preset})); }
    preset(id) { const preset=PRESETS.find(item => item.id === id); return preset ? {...preset} : null; }

    timeline({stageNumber = 1, localSpin = 1} = {}) {
      return Array.from({length:10}, (_,index) => {
        const spin=index+1,[type,label]=BEATS[spin];
        const status=spin < localSpin ? 'complete' : spin === localSpin ? 'current' : 'upcoming';
        return {spin,globalSpin:(Math.max(1,stageNumber)-1)*10+spin,type,label,status};
      });
    }

    rewardComparison({enemy, ownedKit, activeCount = 0, maxActive = 3, cost = 1, remainingBudget = 0, partyCount = 0, partyCapacity = 3} = {}) {
      const topStats=[...STAT_KEYS].sort((a,b)=>Number(enemy?.stats?.[b]||0)-Number(enemy?.stats?.[a]||0)).slice(0,3);
      return [
        {id:'copy',label:'Copy power set',headline:ownedKit?`Mastery ${ownedKit.mastery || 1} → ${Math.min(5,(ownedKit.mastery || 1)+1)}`:`${enemy?.powers?.length || 0} abilities • Cost ${cost}`,gain:ownedKit?'Improves this source and its unlocked techniques.':activeCount < maxActive && cost <= remainingBudget?'Fits your current active loadout.':'Stored safely; equip it later in Build Lab.',tradeoff:'Uses power capacity only while active.'},
        {id:'recruit',label:'Recruit / train',headline:partyCount < partyCapacity?`Party ${partyCount} → ${partyCount+1}/${partyCapacity}`:'Party full • replacement required',gain:'Adds a persistent fighter, support action, and relationship growth.',tradeoff:partyCount < partyCapacity?'No ally is displaced.':'You choose exactly which ally is replaced.'},
        {id:'surge',label:'Victory surge',headline:`+6 ${topStats.map(key=>key.toUpperCase()).join(' / ')}`,gain:'Immediate permanent stats with no loadout cost.',tradeoff:'You do not gain this character’s abilities or party role.'},
        {id:'study',label:'Study weakness',headline:'+3 MIND / +2 SKILL',gain:'Records counters for future encounters.',tradeoff:'No power set or party member.'},
        {id:'release',label:'Release',headline:'+100 credits / reputation',gain:'Funds shops and improves the relationship.',tradeoff:'No direct combat power.'}
      ];
    }

    collectionProgress(characters = [], discoveredIds = [], universeNormalizer = value => value) {
      const discovered=new Set(discoveredIds);
      const rosterIds=new Set(characters.map(character=>character.id));
      const universes=new Map();
      for (const character of characters) {
        const universe=universeNormalizer(character.universe);
        const entry=universes.get(universe) || {universe,total:0,discovered:0};
        entry.total++;
        if (discovered.has(character.id)) entry.discovered++;
        universes.set(universe,entry);
      }
      const count=[...discovered].filter(id => rosterIds.has(id)).length;
      const milestones=[1,5,10,25,50,100,250,500,1000,characters.length];
      return {count,total:characters.length,nextMilestone:milestones.find(value => value > count) || characters.length,universes:[...universes.values()].sort((a,b)=>b.discovered-a.discovered || b.total-a.total || a.universe.localeCompare(b.universe))};
    }

    collectionRewards(count = 0, claimed = []) {
      const claimedSet=new Set(claimed);
      return COLLECTION_REWARDS.filter(reward=>reward.milestone<=count && !claimedSet.has(reward.milestone)).map(reward=>({...reward}));
    }

    nextCollectionReward(count = 0) {
      const reward=COLLECTION_REWARDS.find(item=>item.milestone>count);
      return reward ? {...reward} : null;
    }
  }

  const api={ExperienceEngine,QUICK_START_PRESETS:PRESETS,COLLECTION_REWARDS};
  root.MultiverseDomain=Object.assign(root.MultiverseDomain || {},api);
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
