'use strict';

(function attachCombatEngine(root) {
  const STATUS_HELP = {
    burning: 'Takes damage at the start of each round.',
    frozen: 'Reduced mobility and may lose the next action.',
    shocked: 'Accuracy and energy control are disrupted.',
    poisoned: 'Takes persistent damage that bypasses ordinary defense.',
    mind_controlled: 'May lose control of the next action.',
    time_locked: 'Cannot act until the lock expires.',
    power_sealed: 'Power techniques are restricted temporarily.',
    soul_bound: 'Healing and resurrection effects are weakened.',
    barrier: 'The next incoming hit is substantially reduced.',
    stunned: 'Cannot act until the effect expires.'
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const hasAny = (set, values) => values.some(value => set.has(value));

  class CombatEngine {
    intent(enemy, round = 1, context = {}) {
      const tags = new Set(enemy?.tags || []);
      const lowHealth = Number(context.enemyHpRatio ?? 1) < .35;
      const sequence = [];
      if (hasAny(tags, ['psychic', 'magic', 'time', 'sealing', 'hax'])) sequence.push('control');
      if (hasAny(tags, ['strength', 'weapon', 'energy', 'martial'])) sequence.push('attack');
      if (hasAny(tags, ['genius', 'strategy', 'prep', 'adaptation'])) sequence.push('counter');
      if (hasAny(tags, ['regeneration', 'absorption', 'healing', 'immortality'])) sequence.push('fortify');
      if (!sequence.length) sequence.push('attack');
      const type = lowHealth && sequence.includes('fortify') ? 'fortify' : sequence[(Math.max(1, round) - 1) % sequence.length];
      const definitions = {
        attack: {label: 'Heavy Attack', icon: '✦', telegraph: 'Preparing direct damage.', preferredTags: ['strength', 'weapon', 'energy', 'martial'], responseTags: ['barrier', 'invulnerability', 'phasing', 'speed', 'precognition'], danger: 2},
        control: {label: 'Control Technique', icon: '◈', telegraph: 'Preparing a status effect or seal.', preferredTags: ['psychic', 'magic', 'time', 'sealing', 'soul'], responseTags: ['nullification', 'willpower', 'psychic', 'magic', 'time'], danger: 3},
        counter: {label: 'Adaptive Counter', icon: '◇', telegraph: 'Reading repeated actions and preparing a counter.', preferredTags: ['strategy', 'genius', 'adaptation', 'precognition'], responseTags: ['chaos', 'speed', 'reality', 'strategy', 'precognition'], danger: 2},
        fortify: {label: 'Fortify', icon: '◆', telegraph: 'Preparing defense, recovery, or absorption.', preferredTags: ['regeneration', 'healing', 'absorption', 'invulnerability'], responseTags: ['nullification', 'sealing', 'soul', 'fire', 'absorption'], danger: 1}
      };
      return {...definitions[type], type};
    }

    rankTechniques(techniques = [], intent, specFor = () => ({})) {
      const preferred = new Set(intent?.preferredTags || []);
      return [...techniques].map(entry => {
        const technique = entry.t || entry;
        const spec = entry.s || specFor(technique);
        const tagMatches = (technique.tags || []).filter(tag => preferred.has(tag)).length;
        const statusValue = (spec.effects || []).length * (intent?.type === 'control' ? 10 : 4);
        const recoveryValue = ((spec.heal || 0) + (spec.drain || 0)) * (intent?.type === 'fortify' ? 100 : 35);
        return {...entry, t: technique, s: spec, intentScore: tagMatches * 18 + Number(spec.power || 0) * .55 + Number(spec.accuracy || 0) * 30 + statusValue + recoveryValue - Number(spec.energy || 0) * .16};
      }).sort((a, b) => b.intentScore - a.intentScore);
    }

    preview({fighter, enemy, technique, spec, strategyOdds = .5, repetition = 0, matchup = 0, resistance = 1} = {}) {
      const accuracy = clamp(Number(spec?.accuracy || .7) * .72 + Number(strategyOdds) * .28 - Math.min(.22, Number(repetition) * .055), .18, .99);
      const attack = Number(fighter?.stats?.might || 0) + Number(fighter?.stats?.skill || 0) + Number(fighter?.stats?.energy || 0);
      const defense = Number(enemy?.stats?.defense || 0);
      const base = Math.max(4, attack * .055 + Number(spec?.power || 50) * .48 - defense * Math.max(0, 1 - Number(spec?.armorPen || 0)) * .1);
      const adjusted = base * Number(resistance || 1) * (1 + Number(matchup || 0));
      const minDamage = Math.max(4, Math.round(adjusted * .88));
      const maxDamage = Math.max(minDamage, Math.round(adjusted * 1.24 * (1 + Number(spec?.crit || .05) * .55)));
      const reasons = [
        `Technique accuracy ${Math.round(Number(spec?.accuracy || 0) * 100)}%`,
        `Strategy confidence ${Math.round(Number(strategyOdds) * 100)}%`,
        matchup ? `Matchup ${matchup > 0 ? '+' : ''}${Math.round(matchup * 100)}%` : 'Neutral matchup',
        repetition ? `Repeated-use penalty -${Math.round(Math.min(.22, repetition * .055) * 100)}%` : 'No repetition penalty'
      ];
      return {accuracy, minDamage, maxDamage, energy: Number(spec?.energy || technique?.cost || 0), cooldown: Number(spec?.cooldown || 0), reasons};
    }

    strategyBreakdown({playerScore = 0, enemyScore = 0, party = 0, synergy = 0, trait = 0, matchup = 0} = {}) {
      const rawDelta = Number(playerScore) + Number(party) + Number(synergy) + Number(trait) + Number(matchup) - Number(enemyScore);
      return {
        rawDelta,
        rows: [
          ['Your weighted build', Number(playerScore)],
          ['Party support', Number(party)],
          ['Build synergy', Number(synergy)],
          ['Signature traits', Number(trait)],
          ['Power matchup', Number(matchup)],
          ['Enemy weighted build', -Number(enemyScore)]
        ]
      };
    }

    statusHelp(id) {
      return STATUS_HELP[id] || 'A temporary combat condition.';
    }
  }

  const api = {CombatEngine, COMBAT_STATUS_HELP: STATUS_HELP};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
