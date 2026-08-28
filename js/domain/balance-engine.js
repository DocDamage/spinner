'use strict';

(function attachBalanceEngine(root) {
  const STAT_KEYS = ['might', 'defense', 'speed', 'skill', 'mind', 'energy', 'hax'];
  const PREMIUM_TAGS = new Set(['reality', 'time', 'cosmic', 'immortality', 'adaptation', 'nullification']);
  const SYNERGIES = [
    ['speed', 'time', 3, 'Speed/Time resonance'],
    ['psychic', 'precognition', 3, 'Precognitive mind-link'],
    ['magic', 'reality', 4, 'Reality-sorcery synthesis'],
    ['regeneration', 'immortality', 3, 'Layered survival'],
    ['tech', 'genius', 2, 'Tech mastery'],
    ['soul', 'light', 2, 'Soul purification'],
    ['absorption', 'energy', 2, 'Energy recycling']
  ];
  const CONFLICTS = [
    ['light', 'darkness', -2, 'Light/Darkness instability'],
    ['divine', 'corruption', -2, 'Divine/Corruption conflict'],
    ['order', 'chaos', -2, 'Order/Chaos interference']
  ];
  const COUNTERS = {
    reality: ['nullification', 'order', 'reality'],
    time: ['precognition', 'time', 'speed'],
    regeneration: ['sealing', 'soul', 'fire'],
    immortality: ['sealing', 'soul', 'nullification'],
    speed: ['precognition', 'time', 'area'],
    invulnerability: ['hax', 'soul', 'reality'],
    psychic: ['willpower', 'psychic', 'tech'],
    magic: ['nullification', 'magic', 'tech'],
    energy: ['absorption', 'reflection', 'phasing'],
    phasing: ['area', 'magic', 'space']
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  class BalanceEngine {
    constructor(options = {}) {
      this.maxActiveSets = Number(options.maxActiveSets || 3);
      this.baseBudget = Number(options.baseBudget || 8);
      const requestedPassiveCap = Number(options.passiveStatCap ?? 12);
      this.passiveStatCap = Number.isFinite(requestedPassiveCap) ? Math.max(0, requestedPassiveCap) : 12;
      this.costCache = new WeakMap();
    }

    powerSetCost(character) {
      if (!character) return 1;
      if (typeof character === 'object' && this.costCache.has(character)) return this.costCache.get(character);
      const rating = average(STAT_KEYS.map(key => Number(character.stats?.[key] || 0)));
      // Bands track the actual roster distribution: roughly the top third now
      // costs 3+, making the eight-point budget constrain elite combinations.
      let cost = rating >= 104 ? 4 : rating >= 86 ? 3 : rating >= 72 ? 2 : 1;
      const premiumCount = [...new Set(character.tags || [])].filter(tag => PREMIUM_TAGS.has(tag)).length;
      if (premiumCount >= 2) cost += 1;
      cost = clamp(cost, 1, 5);
      if (typeof character === 'object') this.costCache.set(character,cost);
      return cost;
    }

    powerBudget(state = {}) {
      const perk = Number(state.perkRanks?.loadout || 0);
      const progression = Math.floor(Number(state.record?.bossWins || 0) / 2);
      return this.baseBudget + Math.min(3, perk) + Math.min(2, progression);
    }

    normalizeLoadout(kits = [], requestedIds = [], lookup = () => null, budget = this.baseBudget) {
      const owned = new Map(kits.map(kit => [kit.id, kit]));
      // Requested IDs are authoritative. Migration/default selection belongs to
      // the state adapter; normalization must never undo a player's unequip.
      const ordered = [...new Set(requestedIds)].filter(id => owned.has(id));
      const active = [];
      let spent = 0;
      for (const id of ordered) {
        const cost = this.powerSetCost(lookup(id));
        if (active.length >= this.maxActiveSets || spent + cost > budget) continue;
        active.push(id);
        spent += cost;
      }
      return {active, spent, budget, remaining: Math.max(0, budget - spent)};
    }

    passiveBonuses(kits = [], activeIds = [], lookup = () => null) {
      const active = new Set(activeIds);
      const bonuses = Object.fromEntries(STAT_KEYS.map(key => [key, 0]));
      for (const kit of kits) {
        if (active.has(kit.id)) continue;
        const character = lookup(kit.id);
        if (!character) continue;
        const mastery = clamp(Number(kit.mastery || 1), 1, 5);
        const amount = Math.min(3, Math.ceil(mastery / 2));
        const strongest = [...STAT_KEYS].sort((a, b) => Number(character.stats?.[b] || 0) - Number(character.stats?.[a] || 0)).slice(0, 2);
        for (const key of strongest) bonuses[key] += amount;
      }
      for (const key of STAT_KEYS) bonuses[key] = Math.min(this.passiveStatCap, bonuses[key]);
      return bonuses;
    }

    tagCounts(characters = []) {
      const counts = new Map();
      for (const character of characters) {
        for (const tag of new Set(character?.tags || [])) counts.set(tag, (counts.get(tag) || 0) + 1);
      }
      return counts;
    }

    diminishingTagValue(count) {
      if (count <= 0) return 0;
      if (count === 1) return 1;
      if (count === 2) return 1.8;
      if (count === 3) return 2.35;
      return 2.35 + Math.min(1, count - 3) * .3;
    }

    synergy(characters = []) {
      const counts = this.tagCounts(characters);
      const tags = new Set(counts.keys());
      let score = 0;
      const notes = [];
      for (const [a, b, value, note] of [...SYNERGIES, ...CONFLICTS]) {
        if (tags.has(a) && tags.has(b)) {
          score += value;
          notes.push({note, value});
        }
      }
      for (const count of counts.values()) score += Math.max(0, this.diminishingTagValue(count) - 1) * .35;
      return {score: Math.round(score * 10) / 10, notes, counts};
    }

    counterProfile(enemyTags = [], playerTags = []) {
      const owned = new Set(playerTags);
      const threats = [];
      const counters = new Set();
      for (const tag of new Set(enemyTags)) {
        if (!COUNTERS[tag]) continue;
        threats.push(tag);
        for (const counter of COUNTERS[tag]) if (owned.has(counter)) counters.add(counter);
      }
      const coverage = threats.length ? clamp(counters.size / threats.length, 0, 1) : 0;
      return {threats, counters: [...counters], coverage};
    }

    enemyScale({stage = 1, activeCost = 0, synergyScore = 0, difficulty = 1} = {}) {
      const stageScale = 1 + Math.max(0, Number(stage) - 1) * .055;
      const buildScale = 1 + Math.max(0, Number(activeCost) - this.baseBudget * .5) * .018;
      const synergyScale = 1 + Math.max(0, Number(synergyScore)) * .008;
      return clamp(stageScale * buildScale * synergyScale * Number(difficulty || 1), .85, 2.25);
    }
  }

  const api = {BalanceEngine, BALANCE_STAT_KEYS: STAT_KEYS, BALANCE_COUNTERS: COUNTERS};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
