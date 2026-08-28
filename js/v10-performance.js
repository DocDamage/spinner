'use strict';

// V9.2 performance layer: memoize the small derived models that legacy renderers
// request repeatedly. Keys contain only state that can affect each calculation,
// so direct legacy mutations remain safe without requiring a new state framework.
(() => {
  const {DerivedStateCache} = MultiverseDomain;
  const P = MultiverseWheel.prototype;
  const copyLoadout = value => ({...value,active:[...value.active]});
  const copyStats = value => ({...value});
  const copyTags = value => new Set(value);

  P.derivedCacheV10 = function() {
    return this._derivedCacheV10 ||= new DerivedStateCache();
  };

  const loadoutV10 = P.refreshPowerLoadout;
  P.refreshPowerLoadout = function(state = this.state) {
    if (!state) return loadoutV10.call(this,state);
    const key = this.derivedCacheV10().key([
      (state.kits || []).map(kit => [kit.id,kit.mastery]),
      state.activePowerSets || [],
      state.perkRanks?.loadout || 0,
      state.record?.bossWins || 0
    ]);
    return this.derivedCacheV10().memo('power-loadout',key,() => loadoutV10.call(this,state),copyLoadout);
  };

  const effectiveStatsV10 = P.effectiveStats;
  P.effectiveStats = function() {
    const state = this.state;
    if (!state || this._computingStatsV10) return effectiveStatsV10.call(this);
    const equipped = Object.values(state.equipment || {});
    const equippedLoot = (state.lootInventory || []).filter(item => equipped.includes(item.id)).map(item => [item.id,item.bonuses]);
    const key = this.derivedCacheV10().key([
      state.baseId,
      [state.customCharacter?.archetype,state.customCharacter?.codename],
      (state.kits || []).map(kit => [kit.id,kit.mastery]),
      state.activePowerSets || [],
      STAT_KEYS.map(stat => state.bonuses?.[stat] || 0),
      state.activeForm,
      state.forms || [],
      state.artifacts || [],
      state.mentors || [],
      (state.statuses || []).map(status => status.id),
      equipped,
      equippedLoot
    ]);
    return this.derivedCacheV10().memo('effective-stats',key,() => {
      this._computingStatsV10 = true;
      try { return effectiveStatsV10.call(this); }
      finally { this._computingStatsV10 = false; }
    },copyStats);
  };

  const ownedTagsV10 = P.ownedTags;
  P.ownedTags = function() {
    const state = this.state;
    if (!state || this._computingTagsV10) return ownedTagsV10.call(this);
    const key = this.derivedCacheV10().key([
      state.baseId,
      state.customCharacter?.archetype,
      (state.kits || []).map(kit => kit.id),
      state.activePowerSets || [],
      state.activeForm,
      state.forms || [],
      state.artifacts || [],
      state.mentors || [],
      (state.statuses || []).map(status => status.id)
    ]);
    return this.derivedCacheV10().memo('owned-tags',key,() => {
      this._computingTagsV10 = true;
      try { return [...ownedTagsV10.call(this)]; }
      finally { this._computingTagsV10 = false; }
    },copyTags);
  };

  const abilityCountV10 = P.abilityCount;
  P.abilityCount = function() {
    const state=this.state;
    if (!state) return abilityCountV10.call(this);
    const key=this.derivedCacheV10().key([state.baseId,(state.kits||[]).map(kit=>kit.id),state.forms||[],state.artifacts||[]]);
    return this.derivedCacheV10().memo('ability-count',key,() => abilityCountV10.call(this));
  };

  P.performanceReportV10 = function() {
    return this.derivedCacheV10().report();
  };
})();
