'use strict';

(function attachTraitEngine(root) {
  const EXPLICIT = {
    batman:{name:'Contingency Protocol',description:'After seeing an enemy action, repeated enemy tactics become less effective.',kind:'tactician',strategy:'tactics',bonus:.055},
    hulk:{name:'Rage Without Limit',description:'Might and damage pressure rise as health falls.',kind:'berserker',strategy:'clash',bonus:.06},
    flash:{name:'Speed Force Tempo',description:'The first technique each battle gains accuracy; repeated techniques lose more value.',kind:'speedster',strategy:'blitz',bonus:.055},
    superman:{name:'Last Son’s Resolve',description:'Gains a comeback bonus below half health, but magic remains dangerous.',kind:'paragon',strategy:'clash',bonus:.045},
    spider_man:{name:'Spider-Sense',description:'Telegraphed attacks are easier to evade and counter.',kind:'precognitive',strategy:'blitz',bonus:.045},
    thor:{name:'Storm Sovereign',description:'Energy and lightning techniques intensify after guarding.',kind:'storm',strategy:'clash',bonus:.05},
    doctor_strange:{name:'Prepared Incantation',description:'Changing techniques improves mystic control and sealing.',kind:'mystic',strategy:'mystic',bonus:.055},
    scarlet_witch:{name:'Chaos Probability',description:'Low-probability actions gain power but increase instability.',kind:'chaos',strategy:'mystic',bonus:.06},
    goku:{name:'Battle Learning',description:'Fighting a stronger opponent steadily improves the matchup.',kind:'learner',strategy:'clash',bonus:.05},
    vegeta:{name:'Royal Pride',description:'Losing a round grants offense; accepting support reduces the bonus.',kind:'rival',strategy:'clash',bonus:.05},
    naruto:{name:'Unbreakable Bonds',description:'Party loyalty and assists provide a larger combat benefit.',kind:'leader',strategy:'outlast',bonus:.05},
    sasuke:{name:'Pattern Reading',description:'Once an enemy technique is seen, tactical counters improve.',kind:'tactician',strategy:'tactics',bonus:.05},
    luffy:{name:'Impossible Freedom',description:'Control effects are shorter and unconventional actions gain value.',kind:'wildcard',strategy:'outlast',bonus:.045},
    gojo:{name:'Infinity',description:'Direct attacks are reduced until the enemy reveals a counter.',kind:'barrier',strategy:'mystic',bonus:.055},
    doctor_doom:{name:'Sorcery-Technocracy',description:'Tech and magic synergy is stronger, but failed plans raise enemy pressure.',kind:'hybrid',strategy:'tactics',bonus:.055},
    wonder_woman:{name:'Warrior’s Truth',description:'Weapon clashes and honorable direct combat gain consistency.',kind:'warrior',strategy:'clash',bonus:.045},
    iron_man:{name:'Live Combat Analysis',description:'Each different technique used improves the next tactical action.',kind:'tactician',strategy:'tactics',bonus:.05},
    wolverine:{name:'Relentless Recovery',description:'Recovers a small amount after surviving a heavy hit.',kind:'regenerator',strategy:'outlast',bonus:.05}
  };

  const ROLE_TRAITS = {
    speedster:{name:'Momentum Engine',description:'Speed techniques are more accurate early in combat.',strategy:'blitz',bonus:.035},
    tactician:{name:'Adaptive Plan',description:'Changing strategies avoids repetition penalties.',strategy:'tactics',bonus:.035},
    mystic:{name:'Arcane Control',description:'Mystic and control techniques gain matchup value.',strategy:'mystic',bonus:.035},
    bruiser:{name:'Heavy Pressure',description:'Direct attacks become more threatening at low health.',strategy:'clash',bonus:.035},
    weaponmaster:{name:'Precision Arsenal',description:'Weapon techniques gain critical consistency.',strategy:'clash',bonus:.035},
    healer:{name:'Sustaining Presence',description:'Guard and recovery effects are stronger.',strategy:'outlast',bonus:.035},
    balanced:{name:'Adaptive Rhythm',description:'Switching strategies provides a small advantage.',strategy:'tactics',bonus:.025}
  };

  class TraitEngine {
    constructor() {
      this.traitCache = new WeakMap();
    }

    role(character) {
      if (character?.role && ROLE_TRAITS[character.role]) return character.role;
      const tags = new Set(character?.tags || []);
      if (tags.has('speed')) return 'speedster';
      if (tags.has('genius') || tags.has('strategy') || tags.has('prep')) return 'tactician';
      if (tags.has('magic') || tags.has('reality') || tags.has('psychic')) return 'mystic';
      if (tags.has('healing') || tags.has('regeneration')) return 'healer';
      if (tags.has('weapon') || tags.has('martial')) return 'weaponmaster';
      if (Number(character?.stats?.might || 0) >= 88) return 'bruiser';
      return 'balanced';
    }

    trait(character) {
      if (character && typeof character === 'object' && this.traitCache.has(character)) return this.traitCache.get(character);
      const explicit = EXPLICIT[character?.id];
      let result;
      if (explicit) result = {id:`signature:${character.id}`,...explicit,source:character.name,explicit:true};
      else {
        const role = this.role(character);
        const fallback = ROLE_TRAITS[role] || ROLE_TRAITS.balanced;
        result = {id:`role:${role}`,kind:role,...fallback,source:character?.name || 'Unknown',explicit:false};
      }
      if (character && typeof character === 'object') this.traitCache.set(character,result);
      return result;
    }

    modifier(character, context = {}) {
      const trait = this.trait(character);
      let value = trait.strategy === context.strategy ? Number(trait.bonus || 0) : 0;
      if (trait.kind === 'berserker') value += Math.max(0, .5 - Number(context.hpRatio ?? 1)) * .12;
      if (trait.kind === 'learner') value += Math.min(.06, Math.max(0, Number(context.round || 1) - 1) * .012);
      if (trait.kind === 'precognitive' && context.intentRevealed) value += .025;
      if (trait.kind === 'tactician' && context.changedStrategy) value += .018;
      if (trait.kind === 'leader') value += Math.min(.04, Number(context.partySize || 0) * .012);
      if (trait.kind === 'barrier' && !context.enemyHasCounter) value += .025;
      return {trait, value};
    }

    quest(character) {
      const trait = this.trait(character);
      return {
        id:`quest:${character?.id || trait.id}`,
        title:`${character?.name || trait.source}: ${trait.name}`,
        sourceId:character?.id || null,
        stages:[
          {id:'prove',label:`Prove ${trait.name}`,requirement:`Win using ${trait.strategy} strategy`,metric:`strategy:${trait.strategy}`,target:1},
          {id:'adapt',label:'Challenge the weakness',requirement:`Win against a counter to ${trait.kind}`,metric:'counterWin',target:1},
          {id:'master',label:'Master the signature',requirement:'Reach mastery 4 and defeat a rival',metric:'masteryRival',target:1}
        ],
        reward:{mastery:1, evolution:1, title:`Master of ${trait.name}`}
      };
    }
  }

  const api = {TraitEngine, SIGNATURE_TRAITS: EXPLICIT, ROLE_TRAITS};
  root.MultiverseDomain = Object.assign(root.MultiverseDomain || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
