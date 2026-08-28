'use strict';

(function attachSimulationEngine(root) {
  const seededRandom = seed => {
    let state = Number(seed || 1) >>> 0;
    return () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  };
  const mean = values => values.length ? values.reduce((sum,value) => sum + value,0) / values.length : 0;
  const round = value => Math.round(value * 1000) / 1000;

  class SimulationEngine {
    constructor({balance} = {}) {
      if (!balance) throw new TypeError('SimulationEngine requires a balance engine.');
      this.balance = balance;
    }

    run(roster,{runs=1000,seed=20260828,budget=8}={}) {
      if (!Array.isArray(roster) || roster.length < 4) throw new TypeError('A roster with at least four characters is required.');
      const random = seededRandom(seed);
      const lookup = new Map(roster.map(character => [character.id,character]));
      const activeCounts = [], spentValues = [], synergyValues = [], coverageValues = [], scaleValues = [];
      const costDistribution = {};
      for (let run=0;run<runs;run++) {
        const chosen = new Set();
        while (chosen.size < 4) chosen.add(roster[Math.floor(random()*roster.length)].id);
        const ids = [...chosen];
        const kits = ids.map(id => ({id,mastery:1}));
        const loadout = this.balance.normalizeLoadout(kits,ids.slice(0,3),id => lookup.get(id),budget);
        const active = loadout.active.map(id => lookup.get(id));
        const enemy = lookup.get(ids[3]);
        const synergy = this.balance.synergy(active);
        const ownedTags = active.flatMap(character => character.tags || []);
        const coverage = this.balance.counterProfile(enemy.tags || [],ownedTags).coverage;
        const stage = 1 + Math.floor(random()*10);
        const scale = this.balance.enemyScale({stage,activeCost:loadout.spent,synergyScore:synergy.score,difficulty:1});
        activeCounts.push(loadout.active.length);
        spentValues.push(loadout.spent);
        synergyValues.push(synergy.score);
        coverageValues.push(coverage);
        scaleValues.push(scale);
        for (const character of active) {
          const cost = this.balance.powerSetCost(character);
          costDistribution[cost] = (costDistribution[cost] || 0) + 1;
        }
      }
      return {
        seed,runs,budget,
        averages:{activeSets:round(mean(activeCounts)),spent:round(mean(spentValues)),synergy:round(mean(synergyValues)),counterCoverage:round(mean(coverageValues)),enemyScale:round(mean(scaleValues))},
        rates:{threeActive:round(activeCounts.filter(value => value === 3).length/runs),fullBudget:round(spentValues.filter(value => value === budget).length/runs)},
        ranges:{synergy:[Math.min(...synergyValues),Math.max(...synergyValues)],enemyScale:[round(Math.min(...scaleValues)),round(Math.max(...scaleValues))]},
        costDistribution
      };
    }
  }

  const api = {SimulationEngine, seededRandom};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {},api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
