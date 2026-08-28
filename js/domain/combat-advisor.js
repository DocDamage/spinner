'use strict';

(function attachCombatAdvisor(root) {
  class CombatAdvisor {
    advise({techniques = [], strategies = [], intent = {}, fighterEnergy = 0, cooldowns = {}, history = [], specFor = () => ({}), keyFor = technique => technique?.id, previewFor = () => ({})} = {}) {
      const responseTags = new Set(intent.responseTags || []);
      const candidates = [];
      for (const [techniqueIndex, technique] of techniques.entries()) {
        if (!technique) continue;
        const spec = specFor(technique) || {};
        const key = keyFor(technique);
        if (Number(cooldowns[key] || 0) > 0 || Number(spec.energy || 0) > Number(fighterEnergy || 0)) continue;
        const matches = [...new Set(technique.tags || [])].filter(tag => responseTags.has(tag));
        const repetition = history.filter(entry => entry === key).length;
        for (const [strategyIndex, strategy] of strategies.entries()) {
          const preview = previewFor(technique, spec, strategy) || {};
          const averageDamage = (Number(preview.minDamage || 0) + Number(preview.maxDamage || 0)) / 2;
          const expectedDamage = averageDamage * Number(preview.accuracy || 0);
          const statusUtility = (spec.effects || []).length * 2.5 + (Number(spec.heal || 0) + Number(spec.drain || 0)) * 18;
          const reserveRatio = Number(fighterEnergy || 0) ? Math.max(0, Number(fighterEnergy) - Number(spec.energy || 0)) / Number(fighterEnergy) : 0;
          const score = expectedDamage + matches.length * 7 + statusUtility + reserveRatio * 2 - repetition * 2.5 - Number(spec.cooldown || 0) * .6;
          candidates.push({technique, spec, strategy, preview, matches, repetition, expectedDamage, score, techniqueIndex, strategyIndex});
        }
      }
      candidates.sort((a, b) => b.score - a.score || a.techniqueIndex - b.techniqueIndex || a.strategyIndex - b.strategyIndex);
      const best = candidates[0];
      if (!best) return {kind:'recover', label:'Guard + Recharge', reason:'No technique is currently affordable and off cooldown.', candidates:[]};
      const reasons = [
        `${Math.round(Number(best.preview.accuracy || 0) * 100)}% hit chance`,
        `${Math.round(Number(best.preview.minDamage || 0))}–${Math.round(Number(best.preview.maxDamage || 0))} projected damage`
      ];
      if (best.matches.length) reasons.push(`responds with ${best.matches.join(', ')}`);
      else reasons.push('best expected pressure among usable techniques');
      if (best.repetition) reasons.push(`${best.repetition} recent use${best.repetition === 1 ? '' : 's'} already priced in`);
      return {
        kind:'technique',
        techniqueId:best.technique.id,
        techniqueName:best.technique.name,
        strategyId:best.strategy.id,
        strategyName:best.strategy.name || best.strategy.id,
        preview:best.preview,
        matchedTags:best.matches,
        score:best.score,
        reasons,
        candidates
      };
    }
  }

  const api = {CombatAdvisor};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
