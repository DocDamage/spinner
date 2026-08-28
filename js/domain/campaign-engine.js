'use strict';

(function attachCampaignEngine(root) {
  const STAGES = [
    {name:'Awakening', objective:'Acquire two compatible power sources', metric:'powers', target:2, rule:'Power rewards are common.', boss:'Tests whether the build has a coherent identity.'},
    {name:'Convergence', objective:'Complete two missions', metric:'missions', target:2, rule:'Connected worlds create branching objectives.', boss:'Uses the path the hero ignored.'},
    {name:'Collapse', objective:'Win three battles', metric:'wins', target:3, rule:'Hazards and hostile rivals become more common.', boss:'Punishes repeated combat strategies.'},
    {name:'Fracture', objective:'Use three distinct technique tags', metric:'diversity', target:3, rule:'Repeated powers destabilize faster.', boss:'Resists the most-used tag.'},
    {name:'Warfront', objective:'Win with party support twice', metric:'teamwork', target:2, rule:'Faction conflicts reshape rewards.', boss:'Targets the least-loyal ally.'},
    {name:'Ascension', objective:'Master or transform twice', metric:'growth', target:2, rule:'Forms are stronger but costlier.', boss:'Carries nullification countermeasures.'},
    {name:'Paradox', objective:'Resolve two events without brute force', metric:'control', target:2, rule:'Timeline choices create persistent consequences.', boss:'Copies the most successful tactic.'},
    {name:'Omniversal Siege', objective:'Protect three worlds', metric:'rescues', target:3, rule:'World losses alter the route map.', boss:'Draws power from unprotected worlds.'},
    {name:'Last Horizon', objective:'Defeat the evolved rival', metric:'rival', target:1, rule:'The rival challenges the build’s central weakness.', boss:'Shares the rival’s learned counters.'},
    {name:'End of All Worlds', objective:'Enter the finale prepared', metric:'prepared', target:1, rule:'Every major decision modifies the final encounter.', boss:'Combines unresolved stage consequences.'}
  ];

  const BRANCHES = [
    {id:'recon', title:'Faultline Signals', prompt:'Two distress calls arrive from opposite sides of the convergence.', choices:[
      {id:'rescue', label:'Rescue civilians', cost:'Lose 8% Energy', gain:'Objective progress and reputation', effect:{energy:-.08, rescues:1, hero:2}},
      {id:'pursue', label:'Pursue the source', cost:'Director heat +2', gain:'Reveal the boss counter', effect:{heat:2, intel:1}}
    ]},
    {id:'alliance', title:'Enemy of My Enemy', prompt:'A rival faction offers temporary cooperation against the stage threat.', choices:[
      {id:'ally', label:'Accept the alliance', cost:'Share the next reward', gain:'Party support and mission progress', effect:{missions:1, teamwork:1, sharedReward:true}},
      {id:'refuse', label:'Remain independent', cost:'Fight an elite patrol', gain:'Greater loot quality', effect:{heat:2, loot:1}}
    ]},
    {id:'crux', title:'The Stage Crux', prompt:'The anomaly can be sealed safely or harnessed for permanent power.', choices:[
      {id:'seal', label:'Seal the anomaly', cost:'No power reward', gain:'Weaken the boss and protect the world', effect:{bossPower:-.12, rescues:1, hero:2}},
      {id:'harness', label:'Harness its power', cost:'Boss gains a counter and hero takes damage', gain:'Permanent stat growth', effect:{bossPower:.08, stats:5, villain:2}}
    ]}
  ];

  const clampIndex = index => Math.max(0, Math.min(STAGES.length - 1, Number(index || 0)));

  class CampaignEngine {
    stage(stageNumber = 1) {
      return STAGES[clampIndex(stageNumber - 1)];
    }

    createArc({stageNumber = 1, characters = [], random = Math.random} = {}) {
      const stage = this.stage(stageNumber);
      const universes = [...new Set(characters.map(character => character?.universe).filter(Boolean))];
      const featuredUniverse = universes.length ? universes[Math.floor(random() * universes.length)] : 'The Crossroads';
      const pool = characters.filter(character => character?.universe === featuredUniverse);
      const rival = (pool.length ? pool : characters)[Math.floor(random() * Math.max(1, (pool.length ? pool : characters).length))] || null;
      return {
        stageNumber,
        name: stage.name,
        objective: stage.objective,
        metric: stage.metric,
        target: stage.target,
        progress: 0,
        featuredUniverse,
        rivalId: rival?.id || null,
        branchIndex: 0,
        decisions: [],
        bossPower: 1,
        bossIntel: 0,
        completed: false,
        startedAt: Date.now()
      };
    }

    nextBranch(arc) {
      if (!arc || arc.branchIndex >= BRANCHES.length) return null;
      return BRANCHES[arc.branchIndex];
    }

    applyChoice(arc, branchId, choiceId) {
      const branch = BRANCHES.find(item => item.id === branchId);
      const choice = branch?.choices.find(item => item.id === choiceId);
      if (!arc || !branch || !choice) return null;
      arc.decisions.push({branchId, choiceId, at: Date.now()});
      arc.branchIndex = Math.max(arc.branchIndex, BRANCHES.indexOf(branch) + 1);
      arc.bossPower = Math.max(.7, Number(arc.bossPower || 1) + Number(choice.effect.bossPower || 0));
      arc.bossIntel = Number(arc.bossIntel || 0) + Number(choice.effect.intel || 0);
      return {...choice, effect:{...choice.effect}};
    }

    addProgress(arc, metric, amount = 1) {
      if (!arc || arc.completed || metric !== arc.metric) return false;
      arc.progress = Math.min(arc.target, Number(arc.progress || 0) + Number(amount || 0));
      arc.completed = arc.progress >= arc.target;
      return arc.completed;
    }

    bossModifiers(arc) {
      if (!arc) return {scale:1, revealed:false, notes:[]};
      const objectiveRelief = arc.completed ? -.1 : .12;
      const scale = Math.max(.72, Number(arc.bossPower || 1) + objectiveRelief);
      const notes = [arc.completed ? 'Stage objective completed: boss weakened.' : 'Stage objective incomplete: boss empowered.'];
      if (arc.bossIntel) notes.push('Earlier investigation reveals the boss intent.');
      for (const decision of arc.decisions) notes.push(`${decision.branchId}: ${decision.choiceId}`);
      return {scale, revealed:arc.bossIntel > 0, notes};
    }
  }

  const api = {CampaignEngine, CAMPAIGN_STAGES: STAGES, CAMPAIGN_BRANCHES: BRANCHES};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
