'use strict';

// V9 turns the content-rich simulator into a structured, explainable campaign.
// It deliberately consumes pure domain services instead of adding more balance
// formulas directly to the UI layer.
(() => {
  const {
    BalanceEngine,
    CombatEngine,
    CampaignEngine,
    TraitEngine,
    SaveRepository,
    WheelService,
    COMBAT_STATUS_HELP
  } = MultiverseDomain;
  const {ViewTemplates,DialogController,TabController} = MultiverseUI;
  const P = MultiverseWheel.prototype;
  const balance = new BalanceEngine({maxActiveSets:3, baseBudget:8});
  const combat = new CombatEngine();
  const campaign = new CampaignEngine();
  const traits = new TraitEngine();
  const wheel = new WheelService();
  const views = new ViewTemplates();
  const difficultyScale = {story:.9, normal:1, heroic:1.08, cosmic:1.16, impossible:1.25};

  P.ensureV9 = function(state = this.state) {
    this.ensureV8?.(state);
    if (!state) return state;
    state.v9Version = 9;
    // Existing V6–V8 saves did not have this property. Seed those once from
    // owned kits, but preserve an explicit empty/partial V9 loadout thereafter.
    if (!Array.isArray(state.activePowerSets)) state.activePowerSets = (state.kits || []).map(kit => kit.id);
    state.stageArc ||= null;
    state.stageHistory ||= [];
    state.rivalArc ||= null;
    state.questChains ||= {};
    state.completedQuests ||= [];
    state.counterMemory ||= {};
    state.combatJournal ||= [];
    state.choiceHistory ||= [];
    state.campStages ||= [];
    state.onboarding ||= {step:state.characterReady ? 1 : 0, dismissed:false};
    state.guideFlags ||= {};
    this.refreshPowerLoadout(state);
    return state;
  };

  const newStateV9 = P.newState;
  P.newState = function(seed) { return this.ensureV9(newStateV9.call(this, seed)); };
  const loadStateV9 = P.loadState;
  P.loadState = function() { const state = loadStateV9.call(this); return state ? this.ensureV9(state) : state; };
  P.stateRepositoryV9 = function() {
    return this._v9Repository ||= new SaveRepository(localStorage, SAVE_KEY, 9);
  };
  const saveV9 = P.save;
  P.save = function() {
    try { return this.stateRepositoryV9().save(this.state); }
    catch { return saveV9.call(this); }
  };

  P.refreshPowerLoadout = function(state = this.state) {
    if (!state) return {active:[],spent:0,budget:8,remaining:8};
    const result = balance.normalizeLoadout(state.kits || [], state.activePowerSets || [], id => CHAR.get(id), balance.powerBudget(state));
    state.activePowerSets = result.active;
    return result;
  };
  P.powerLoadout = function() { return this.refreshPowerLoadout(); };
  P.activeKitRecords = function() {
    const active = new Set(this.refreshPowerLoadout().active);
    return (this.state.kits || []).filter(kit => active.has(kit.id));
  };
  P.inactiveKitRecords = function() {
    const active = new Set(this.refreshPowerLoadout().active);
    return (this.state.kits || []).filter(kit => !active.has(kit.id));
  };
  P.activePowerCharacters = function() { return this.activeKitRecords().map(kit => CHAR.get(kit.id)).filter(Boolean); };
  P.buildSynergyV9 = function() { return balance.synergy([this.baseCharacter(), ...this.activePowerCharacters()].filter(Boolean)); };
  P.togglePowerSetV9 = function(id) {
    const kit = this.state.kits.find(item => item.id === id);
    if (!kit) return;
    const current = new Set(this.state.activePowerSets);
    if (current.has(id)) current.delete(id);
    else {
      const cost = balance.powerSetCost(CHAR.get(id));
      const summary = this.powerLoadout();
      if (current.size >= balance.maxActiveSets) return this.toast(`Only ${balance.maxActiveSets} power sets can be active.`);
      if (summary.spent + cost > summary.budget) return this.toast(`Need ${cost} capacity; only ${summary.remaining} remains.`);
      current.add(id);
    }
    this.state.activePowerSets = [...current];
    this.refreshPowerLoadout();
    this.save();
    this.renderV9Dashboard('build');
    this.renderAll();
  };

  const effectiveStatsV9 = P.effectiveStats;
  P.effectiveStats = function() {
    if (!this.state?.kits || this._v9CalculatingStats) return effectiveStatsV9.call(this);
    const allKits = this.state.kits;
    this._v9CalculatingStats = true;
    this.state.kits = this.activeKitRecords();
    let stats;
    try { stats = effectiveStatsV9.call(this); }
    finally { this.state.kits = allKits; this._v9CalculatingStats = false; }
    const passive = balance.passiveBonuses(allKits, this.state.activePowerSets, id => CHAR.get(id));
    for (const key of STAT_KEYS) stats[key] = clamp(Math.round((stats[key] || 0) + passive[key]), 1, 360);
    return stats;
  };

  const ownedTagsV9 = P.ownedTags;
  P.ownedTags = function() {
    if (!this.state?.kits || this._v9CalculatingTags) return ownedTagsV9.call(this);
    const allKits = this.state.kits;
    this._v9CalculatingTags = true;
    this.state.kits = this.activeKitRecords();
    let result;
    try { result = ownedTagsV9.call(this); }
    finally { this.state.kits = allKits; this._v9CalculatingTags = false; }
    return result;
  };

  const techniqueCatalogV9 = P.techniqueCatalog;
  P.techniqueCatalog = function(enemy = null) {
    if (!this.state?.kits || this._v9Catalog) return techniqueCatalogV9.call(this, enemy);
    const allKits = this.state.kits;
    this._v9Catalog = true;
    this.state.kits = this.activeKitRecords();
    try { return techniqueCatalogV9.call(this, enemy); }
    finally { this.state.kits = allKits; this._v9Catalog = false; }
  };

  const availableFormsV9 = P.availableForms;
  P.availableForms = function() {
    if (!this.state?.kits || this._v9Forms) return availableFormsV9.call(this);
    const allKits = this.state.kits;
    this._v9Forms = true;
    this.state.kits = this.activeKitRecords();
    try { return availableFormsV9.call(this); }
    finally { this.state.kits = allKits; this._v9Forms = false; }
  };

  P.ensureStageArcV9 = function(stageNumber = this.stageNumber(this.state.spin + 1)) {
    if (this.state.stageArc?.stageNumber === stageNumber) return this.state.stageArc;
    if (this.state.stageArc) this.state.stageHistory.push({...this.state.stageArc, endedAt:Date.now()});
    const arc = campaign.createArc({stageNumber, characters:DATA.characters, random:() => this.rand()});
    if (this.state.rivalArc?.id && CHAR.has(this.state.rivalArc.id)) arc.rivalId = this.state.rivalArc.id;
    if (!this.state.rivalArc && arc.rivalId) this.state.rivalArc = {id:arc.rivalId,level:1,encounters:0,wins:0,losses:0,learnedTags:[],respect:0};
    this.state.stageArc = arc;
    return arc;
  };
  P.stageProgressV9 = function(metric, amount = 1) {
    const arc = this.ensureStageArcV9(this.stageNumber());
    const completedNow = campaign.addProgress(arc, metric, amount);
    if (completedNow && !arc.completionLogged) {
      arc.completionLogged = true;
      this.log(`STAGE OBJECTIVE COMPLETE: ${arc.objective}. The boss is weakened.`, 'rare');
    }
    return completedNow;
  };
  P.progressDiversityV9 = function(tags = []) {
    const arc = this.ensureStageArcV9(this.stageNumber());
    arc.uniqueTags ||= [];
    arc.uniqueTags = [...new Set([...arc.uniqueTags, ...tags])];
    if (arc.metric === 'diversity') {
      arc.progress = Math.min(arc.target, arc.uniqueTags.length);
      arc.completed = arc.progress >= arc.target;
    }
  };

  const generateWheelV9 = P.generateWheel;
  P.generateWheel = function() {
    const next = this.state.spin + 1;
    const arc = this.ensureStageArcV9(this.stageNumber(next));
    generateWheelV9.call(this);
    if (!this.state.slices?.length || next % 10 === 0) return;
    if (wheel.localSpin(next) === 5 && arc.rivalId) {
      const rival = CHAR.get(arc.rivalId);
      const candidates = wheel.rivalReplacementIndexes(this.state.slices, 3);
      for (const index of candidates) this.state.slices[index] = {...this.slice('battle',rival.id,`RIVAL: ${rival.name}`,`${rival.universe} • Adaptive rematch`),v9Rival:true};
    }
    this.save();
    this.drawWheel();
  };

  const landV9 = P.land;
  P.land = function(slice) {
    landV9.call(this, slice);
    if (this.state.pending && (slice.v9Rival || slice.ref === this.state.rivalArc?.id)) this.state.pending.v9Rival = true;
    this.advanceOnboardingV9('spin');
  };

  const battleProfileV9 = P.battleProfile;
  P.battleProfile = function(p) {
    const enemy = battleProfileV9.call(this, p);
    if (!enemy || enemy.v9Scaled) return enemy;
    const loadout = this.powerLoadout();
    const synergy = this.buildSynergyV9();
    const scale = balance.enemyScale({stage:this.stageNumber(),activeCost:loadout.spent,synergyScore:synergy.score,difficulty:difficultyScale[this.state.difficulty] || 1});
    const moderated = 1 + (scale - 1) * (p?.type === 'boss' ? .34 : .2);
    for (const key of STAT_KEYS) enemy.stats[key] = clamp(Math.round(enemy.stats[key] * moderated), 1, 360);
    if (p?.type === 'boss') {
      const boss = campaign.bossModifiers(this.ensureStageArcV9(this.stageNumber()));
      for (const key of STAT_KEYS) enemy.stats[key] = clamp(Math.round(enemy.stats[key] * boss.scale), 1, 360);
      enemy.v9BossNotes = boss.notes;
    }
    if (p?.v9Rival && this.state.rivalArc) {
      const rival = this.state.rivalArc;
      for (const key of STAT_KEYS) enemy.stats[key] += Math.max(0, rival.level - 1) * 3;
      enemy.tags = [...new Set([...(enemy.tags || []), ...(rival.learnedTags || [])])];
      enemy.name = `${enemy.name} — EVOLVED RIVAL Lv.${rival.level}`;
    }
    enemy.v9Scaled = true;
    return enemy;
  };

  P.playerTraitModifiersV9 = function(context = {}) {
    const sources = this.activePowerCharacters();
    let value = 0;
    const active = [];
    sources.forEach((character,index) => {
      const result = traits.modifier(character, {...context,partySize:this.state.party.length});
      const scaled = result.value * (index ? .55 : 1);
      value += scaled;
      active.push({...result.trait,value:scaled});
    });
    return {value:clamp(value,-.08,.12),active};
  };

  const battleOddsV9 = P.battleOdds;
  P.battleOdds = function(p, strategy) {
    const base = battleOddsV9.call(this, p, strategy);
    const enemy = this.battleProfile(p);
    if (!enemy) return base;
    const c = p?.combat;
    const fighter = c ? this.fighter(this.combat8(p)) : {hp:this.state.hp || 1,maxHP:this.maxHP?.() || 1};
    const trait = this.playerTraitModifiersV9({strategy,round:c?.round || 1,hpRatio:fighter.hp / Math.max(1,fighter.maxHP),intentRevealed:!!c?.v9Plan,changedStrategy:this.state.lastStrategyV9 && this.state.lastStrategyV9 !== strategy});
    const counter = balance.counterProfile(enemy.tags || [], [...this.ownedTags()]);
    const synergy = this.buildSynergyV9();
    const bonus = trait.value + counter.coverage * .018 + clamp(synergy.score * .002,-.02,.035);
    const result = clamp(base + bonus, .08, .96);
    this._v9OddsBreakdown = {base, result, bonus, trait, counter, synergy, strategy};
    return result;
  };

  const enemyTechV9 = P.enemyTech;
  P.enemyIntentV9 = function(p, enemy, state) {
    if (state.v9Plan?.round === state.round) return state.v9Plan;
    const technique = enemyTechV9.call(this, enemy, state);
    const intent = combat.intent({...enemy,tags:technique.t?.tags || enemy.tags}, state.round, {enemyHpRatio:state.enemyHP / Math.max(1,state.enemyMaxHP)});
    state.v9Plan = {round:state.round, technique, intent};
    return state.v9Plan;
  };
  P.enemyTech = function(enemy, state) {
    if (state.v9Plan?.round === state.round) return state.v9Plan.technique;
    return enemyTechV9.call(this, enemy, state);
  };

  const initCombatV9 = P.initCombat;
  P.initCombat = function(p) {
    const state = initCombatV9.call(this, p);
    if (!state.v9Paced) {
      state.v9Paced = true;
      if (p.type !== 'boss') {
        state.enemyMaxHP = Math.max(40, Math.round(state.enemyMaxHP * .8));
        state.enemyHP = Math.min(state.enemyHP, state.enemyMaxHP);
      }
    }
    return state;
  };

  const enemyTurnV9 = P.enemyTurn;
  P.enemyTurn = function(p, enemy, state, guard = false) {
    const plan = this.enemyIntentV9(p, enemy, state);
    const before = this.fighter(state).hp;
    enemyTurnV9.call(this, p, enemy, state, guard);
    const after = this.fighter(state).hp;
    const damage = Math.max(0, before - after);
    this.addCombatJournalV9(`${enemy.name} telegraphed ${plan.intent.label}; ${guard ? 'defense reduced' : 'you took'} ${damage} damage.`);
    delete state.v9Plan;
  };

  P.addCombatJournalV9 = function(message) {
    this.state.combatJournal.unshift({spin:this.state.spin,message,time:Date.now()});
    this.state.combatJournal = this.state.combatJournal.slice(0,30);
  };

  const combatAttackV9 = P.combatAttack;
  P.combatAttack = function(strategy) {
    const p = this.state.pending;
    const state = p && ['battle','boss'].includes(p.type) ? this.combat8(p) : null;
    const enemy = state ? this.battleProfile(p) : null;
    const technique = state ? this.fighterTech(enemy,state).find(item => item.id === p.technique || this.techKey(item) === p.technique) : null;
    const before = state ? state.enemyHP : 0;
    combatAttackV9.call(this, strategy);
    this.state.lastStrategyV9 = strategy;
    if (technique) {
      this.progressDiversityV9(technique.tags || []);
      this.progressQuestsV9(`strategy:${strategy}`);
      const damage = Math.max(0, before - Number(state?.enemyHP || 0));
      this.addCombatJournalV9(`${technique.name}: ${damage ? `${damage} damage` : 'missed or was negated'}; ${(technique.tags || []).slice(0,3).join(', ') || 'no typed interaction'}.`);
    }
    this.advanceOnboardingV9('combat');
  };

  P.combatCounterV9 = function() {
    const p = this.state.pending;
    if (!p || !['battle','boss'].includes(p.type)) return;
    const enemy = this.battleProfile(p), state = this.combat8(p);
    if (state.round > 1) this.roundStart(state);
    const fighter = this.fighter(state), plan = this.enemyIntentV9(p, enemy, state);
    const cost = Math.round(fighter.maxEnergy * .07);
    if (fighter.energy < cost) return this.toast(`Need ${cost} Energy to counter.`);
    this.setFighter(state, fighter.hp, fighter.energy - cost);
    const coverage = balance.counterProfile(plan.technique.t.tags || enemy.tags, [...fighter.tags]).coverage;
    const chance = clamp(.32 + coverage * .28 + (fighter.stats.skill - enemy.stats.skill) * .0015, .18, .82);
    this.enemyTurn(p, enemy, state, true);
    if (this.rand() <= chance && this.fighter(state).hp > 0) {
      const damage = Math.max(6, Math.round((fighter.stats.skill + fighter.stats.mind) * .09));
      state.enemyHP = Math.max(0, state.enemyHP - damage);
      this.statusAdd(state.enemyStatuses, 'stunned', 1);
      this.addCombatJournalV9(`Counter succeeded (${Math.round(chance*100)}%): ${damage} return damage and Stunned.`);
      this.log(`COUNTER: ${plan.intent.label} reversed for ${damage} damage.`, 'win');
    } else this.addCombatJournalV9(`Counter failed (${Math.round(chance*100)}% chance).`);
    if (state.enemyHP <= 0) { this.afterWin(enemy); return this.finishCombatVictory(p, enemy); }
    if (this.fighter(state).hp <= 0) return this.fighterKO(p, enemy, state);
    state.round++;
    this.save();
    this.renderAll();
  };

  P.combatSupportV9 = function() {
    const p = this.state.pending;
    if (!p || !['battle','boss'].includes(p.type) || !this.state.party.length) return this.toast('Recruit an ally to use Support.');
    const enemy = this.battleProfile(p), state = this.combat8(p), fighter = this.fighter(state);
    if (state.round > 1) this.roundStart(state);
    const allies = this.state.party.map(id => CHAR.get(id)).filter(Boolean);
    const healer = allies.find(character => ['healing','regeneration'].some(tag => character.tags?.includes(tag)));
    const tactician = allies.find(character => ['genius','strategy','prep'].some(tag => character.tags?.includes(tag)));
    if (healer) {
      const amount = Math.round(fighter.maxHP * .16);
      this.setFighter(state, fighter.hp + amount, fighter.energy);
      this.addCombatJournalV9(`${healer.name} restored ${amount} HP.`);
    } else if (tactician) {
      this.statusAdd(state.playerStatuses, 'barrier', 2);
      state.v9IntelRounds = 2;
      this.addCombatJournalV9(`${tactician.name} revealed enemy intent and raised a Barrier.`);
    } else {
      const amount = Math.round(fighter.maxEnergy * .18);
      this.setFighter(state, fighter.hp, fighter.energy + amount);
      this.addCombatJournalV9(`${allies[0].name} restored ${amount} Energy.`);
    }
    this.stageProgressV9('teamwork');
    this.enemyTurn(p, enemy, state, false);
    if (this.fighter(state).hp <= 0) return this.fighterKO(p, enemy, state);
    state.round++;
    this.save();
    this.renderAll();
  };

  const acquireKitV9 = P.acquireKit;
  P.acquireKit = function(id, quiet = false) {
    const existed = this.state.kits.some(kit => kit.id === id);
    const result = acquireKitV9.call(this, id, quiet);
    if (!existed) {
      const summary = this.powerLoadout();
      const cost = balance.powerSetCost(CHAR.get(id));
      if (summary.active.length < balance.maxActiveSets && summary.spent + cost <= summary.budget) this.state.activePowerSets.push(id);
      this.refreshPowerLoadout();
      this.startQuestV9(id);
      this.stageProgressV9('powers');
      this.advanceOnboardingV9('power');
      if (!this.state.activePowerSets.includes(id) && !quiet) this.log(`${CHAR.get(id)?.name} entered the passive library; equip it from Build Lab to use its techniques.`, 'info');
    } else if ((this.state.kits.find(kit => kit.id === id)?.mastery || 0) >= 4) this.progressQuestsV9('masteryRival');
    this.save();
    return result;
  };

  const acquireFormV9 = P.acquireForm;
  P.acquireForm = function(id, quiet = false) {
    const existed = this.state.forms.includes(id);
    const result = acquireFormV9.call(this, id, quiet);
    if (!existed) this.stageProgressV9('growth');
    this.advanceOnboardingV9('form_or_party');
    return result;
  };
  const recruitV9 = P.recruit;
  P.recruit = function(id, replace = false, quiet = false) {
    const existed = this.state.party.includes(id);
    const result = recruitV9.call(this, id, replace, quiet);
    if (!existed && this.state.party.includes(id)) this.advanceOnboardingV9('form_or_party');
    return result;
  };

  const resolveMissionV9 = P.resolveMission;
  P.resolveMission = function(mode) {
    const wins = this.state.missionWins;
    const result = resolveMissionV9.call(this, mode);
    if (this.state.missionWins > wins) {
      this.stageProgressV9('missions');
      if (mode === 'specialist') this.stageProgressV9('control');
    }
    return result;
  };

  const afterWinV9 = P.afterWin;
  P.afterWin = function(enemy) {
    afterWinV9.call(this, enemy);
    this.stageProgressV9('wins');
    const pending = this.state.pending;
    if (pending?.v9Rival && this.state.rivalArc) {
      this.state.rivalArc.encounters++;
      this.state.rivalArc.wins++;
      this.state.rivalArc.respect += 6;
      this.state.rivalArc.level = Math.min(12, this.state.rivalArc.level + 1);
      this.stageProgressV9('rival');
      this.progressQuestsV9('masteryRival');
    }
  };

  const handleCombatKOV9 = P.handleCombatKO;
  if (handleCombatKOV9) P.handleCombatKO = function(p, enemy) {
    if (p?.v9Rival && this.state.rivalArc) {
      const used = [...this.ownedTags()].slice(0,3);
      this.state.rivalArc.encounters++;
      this.state.rivalArc.losses++;
      this.state.rivalArc.level = Math.min(12, this.state.rivalArc.level + 1);
      this.state.rivalArc.learnedTags = [...new Set([...this.state.rivalArc.learnedTags, ...used])].slice(0,6);
    }
    return handleCombatKOV9.call(this, p, enemy);
  };

  P.startQuestV9 = function(id) {
    if (!CHAR.has(id) || this.state.questChains[id] || this.state.completedQuests.includes(id)) return;
    this.state.questChains[id] = {...traits.quest(CHAR.get(id)),stageIndex:0,progress:0};
  };
  P.progressQuestsV9 = function(metric) {
    for (const [id,quest] of Object.entries(this.state.questChains)) {
      const stage = quest.stages[quest.stageIndex];
      if (!stage || stage.metric !== metric) continue;
      quest.progress++;
      if (quest.progress < stage.target) continue;
      quest.stageIndex++;
      quest.progress = 0;
      if (quest.stageIndex < quest.stages.length) {
        this.log(`QUEST ADVANCED: ${quest.title} — ${quest.stages[quest.stageIndex].label}.`, 'rare');
        continue;
      }
      const kit = this.state.kits.find(item => item.id === id);
      if (kit) kit.mastery = Math.min(5, Number(kit.mastery || 1) + 1);
      this.state.evolutionPoints = Number(this.state.evolutionPoints || 0) + 1;
      this.state.completedQuests.push(id);
      delete this.state.questChains[id];
      this.log(`SIGNATURE QUEST COMPLETE: ${quest.title}. Mastery and Evolution increased.`, 'rare');
    }
  };

  P.storyInterludeV9 = function() {
    const arc = this.ensureStageArcV9(this.stageNumber());
    const branch = campaign.nextBranch(arc);
    if (!branch) return false;
    this.state.pending = {id:this.makeId('story'),type:'v9-story',stage:'offer',label:branch.title,sub:branch.prompt,branchId:branch.id};
    this.save();
    this.renderAll();
    return true;
  };
  P.campInterludeV9 = function() {
    const stage = this.stageNumber();
    if (this.state.campStages.includes(stage)) return false;
    this.state.pending = {id:this.makeId('camp'),type:'v9-camp',stage:'offer',label:'Crossroads Before the Boss',sub:'One deliberate preparation choice remains before the stage boss.'};
    this.save();
    this.renderAll();
    return true;
  };

  const completeEventV9 = P.completeEvent;
  P.completeEvent = function() {
    const pending = this.state.pending;
    if (!pending || pending.v9InterludeComplete) return completeEventV9.call(this);
    const arc = this.ensureStageArcV9(this.stageNumber());
    const cadence = wheel.cadence(this.state.spin, arc.branchIndex, this.state.campStages.includes(this.stageNumber()));
    if (cadence.storyDue && !cadence.bossDue && this.storyInterludeV9()) return;
    if (cadence.campDue && this.campInterludeV9()) return;
    return completeEventV9.call(this);
  };

  P.applyStoryChoiceV9 = function(branchId, choiceId) {
    const arc = this.ensureStageArcV9(this.stageNumber());
    const choice = campaign.applyChoice(arc, branchId, choiceId);
    if (!choice) return;
    const effect = choice.effect;
    if (effect.energy) this.state.energyPool = Math.max(0, this.state.energyPool + Math.round(this.maxEnergyPool() * effect.energy));
    if (effect.heat) this.state.director.heat += effect.heat;
    if (effect.hero) this.state.director.hero += effect.hero;
    if (effect.villain) this.state.director.villain += effect.villain;
    if (effect.stats) this.addBonuses(Object.fromEntries(STAT_KEYS.map(key => [key,effect.stats])));
    if (effect.loot) this.loot(CHAR.get(arc.rivalId));
    if (effect.rescues) this.stageProgressV9('rescues', effect.rescues);
    if (effect.missions) this.stageProgressV9('missions', effect.missions);
    if (effect.teamwork) this.stageProgressV9('teamwork', effect.teamwork);
    this.state.choiceHistory.push({stage:arc.stageNumber,branchId,choiceId,effect,time:Date.now()});
    this.state.pending.stage = 'result';
    this.state.pending.v9InterludeComplete = true;
    this.state.pending.resultText = `${choice.label}. Cost: ${choice.cost}. Consequence: ${choice.gain}.`;
    this.save();
    this.renderAll();
  };

  P.applyCampChoiceV9 = function(choice) {
    const stage = this.stageNumber(), arc = this.ensureStageArcV9(stage);
    if (choice === 'recover') {
      this.heal(Math.round(this.maxHP() * .35));
      this.restoreEnergy(Math.round(this.maxEnergyPool() * .3));
      this.state.statuses = this.state.statuses.slice(0,1);
    } else if (choice === 'prepare') {
      arc.bossIntel++;
      this.restoreEnergy(Math.round(this.maxEnergyPool() * .18));
      this.stageProgressV9('prepared');
    } else if (choice === 'overcharge') {
      this.addBonuses(Object.fromEntries(STAT_KEYS.map(key => [key,3])));
      this.applyShieldedDamage(Math.round(this.maxHP() * .1));
      arc.bossPower += .08;
    }
    this.state.campStages.push(stage);
    this.state.choiceHistory.push({stage,type:'camp',choice,time:Date.now()});
    this.state.pending.stage = 'result';
    this.state.pending.v9InterludeComplete = true;
    this.state.pending.resultText = choice === 'recover' ? 'You recovered safely before the boss.' : choice === 'prepare' ? 'You studied the boss and revealed its plan.' : 'You forced permanent growth, but the boss adapted to the power spike.';
    this.save();
    this.renderAll();
  };

  P.studyOpponentV9 = function(mode) {
    const p = this.state.pending, enemy = this.battleProfile(p);
    if (!p || !enemy) return;
    if (mode === 'study') {
      this.state.counterMemory[enemy.id] = [...new Set(enemy.tags || [])].slice(0,6);
      this.addBonuses({mind:3,skill:2});
      p.resultText = `You studied ${enemy.name} instead of taking more power. Future encounters expose their counters.`;
      this.progressQuestsV9('counterWin');
    } else {
      this.state.credits += 100;
      const relation = this.rel?.(enemy.id);
      if (relation) relation.respect = clamp(relation.respect + 8,-100,100);
      p.resultText = `${enemy.name} was released. Reputation and 100 credits replaced the power reward.`;
    }
    p.stage = 'result';
    this.save();
    this.renderAll();
  };

  P.renderStoryV9 = function(p) {
    if (p.stage === 'result') {
      this.eventPanel.innerHTML = this.eventHeader('rare',p.label,p.resultText) + '<div class="resolve-row"><button class="primary-btn" data-action="continue">CONTINUE</button></div>';
      return;
    }
    const branch = MultiverseDomain.CAMPAIGN_BRANCHES.find(item => item.id === p.branchId);
    const rival = CHAR.get(this.state.stageArc?.rivalId);
    this.eventPanel.innerHTML = `<div class="v9-story"><div class="v9-story-hero"><div class="eyebrow">CONNECTED STAGE MISSION • ${esc(this.state.stageArc.featuredUniverse)}</div><h2>${esc(branch.title)}</h2><p>${esc(branch.prompt)}${rival ? ` <b>${esc(rival.name)}</b> is watching how you respond.` : ''}</p></div><div class="choice-grid">${branch.choices.map(choice => `<button class="choice-btn" data-v9-story="${branch.id}|${choice.id}"><strong>${esc(choice.label)}</strong><small>${esc(choice.prompt || choice.gain)}</small><div class="v9-choice-consequence"><span>COST • ${esc(choice.cost)}</span><span>GAIN • ${esc(choice.gain)}</span></div></button>`).join('')}</div></div>`;
  };
  P.renderCampV9 = function(p) {
    if (p.stage === 'result') {
      this.eventPanel.innerHTML = this.eventHeader('recovery',p.label,p.resultText) + '<div class="resolve-row"><button class="primary-btn" data-action="continue">FACE THE BOSS</button></div>';
      return;
    }
    this.eventPanel.innerHTML = `<div class="v9-story"><div class="v9-story-hero"><div class="eyebrow">DELIBERATE PREPARATION</div><h2>${esc(p.label)}</h2><p>${esc(p.sub)}</p></div><div class="choice-grid three"><button class="choice-btn good" data-v9-camp="recover"><strong>REST & RECOVER</strong><small>Restore 35% HP and 30% Energy. Clear all but one condition.</small></button><button class="choice-btn" data-v9-camp="prepare"><strong>SCOUT THE BOSS</strong><small>Reveal intent and restore 18% Energy. No raw power gain.</small></button><button class="choice-btn gold" data-v9-camp="overcharge"><strong>FORCE EVOLUTION</strong><small>+3 all stats permanently; lose 10% HP and empower the boss.</small></button></div></div>`;
  };

  const renderEventV9 = P.renderEvent;
  P.renderEvent = function() {
    const p = this.state.pending;
    if (p?.type === 'v9-story') return this.renderStoryV9(p);
    if (p?.type === 'v9-camp') return this.renderCampV9(p);
    return renderEventV9.call(this);
  };

  const renderCombatV9 = P.renderCombat;
  P.renderCombat = function(p) {
    renderCombatV9.call(this, p);
    if (!p || p.stage === 'result') return;
    if (p.stage === 'battle_reward') {
      const row = this.eventPanel.querySelector('.choice-grid');
      row?.insertAdjacentHTML('afterend', `<div class="v9-combat-actions"><button data-v9-reward="study">STUDY WEAKNESS — NO POWER</button><button data-v9-reward="release">RELEASE — REPUTATION + CREDITS</button></div>`);
      return;
    }
    const enemy = this.battleProfile(p), state = this.combat8(p), fighter = this.fighter(state), plan = this.enemyIntentV9(p,enemy,state);
    const techniques = this.fighterTech(enemy,state);
    const selected = techniques.find(item => item.id === p.technique || this.techKey(item) === p.technique) || techniques[0];
    const spec = selected ? this.spec(selected) : null;
    const odds = this.battleOdds(p,this.selectedStrategy);
    const matchup = selected ? this.interactionDelta(enemy,selected).delta : 0;
    const resistance = selected ? this.resMult(enemy.tags || [],selected.tags || [],this.weaknessTags(enemy)) : 1;
    const repetition = selected ? state.playerHistory.filter(key => key === this.techKey(selected)).length : 0;
    const preview = combat.preview({fighter,enemy,technique:selected,spec,strategyOdds:odds,repetition,matchup,resistance});
    const intentHtml = views.intent(plan);
    const previewHtml = views.combatPreview(preview,{counterCoverage:this._v9OddsBreakdown?.counter.coverage,synergyScore:this._v9OddsBreakdown?.synergy.score});
    const head = this.eventPanel.querySelector('.v6-combat-top');
    head?.insertAdjacentHTML('afterend',intentHtml+previewHtml);
    const actions = this.eventPanel.querySelector('.resolve-row');
    actions?.insertAdjacentHTML('afterend',`<div class="v9-combat-actions"><button data-v9-combat="counter" data-tip="Spend Energy to guard, read the telegraph, and attempt return damage.">COUNTER INTENT</button><button data-v9-combat="support" data-tip="Use an ally’s role: heal, reveal intent, shield, or restore Energy.">PARTY SUPPORT</button></div><div class="v9-journal">${this.state.combatJournal.slice(0,3).map(entry => `<div>${esc(entry.message)}</div>`).join('')}</div>`);
    if (enemy.v9BossNotes?.length) this.eventPanel.insertAdjacentHTML('afterbegin',`<div class="v9-note">${enemy.v9BossNotes.map(esc).join(' • ')}</div>`);
    this.advanceOnboardingV9('combat');
  };

  P.statusHTML = function(list) {
    return `<div class="v8-statusrow">${(list || []).map(status => `<span class="v8-status bad" tabindex="0" data-tip="${esc(combat.statusHelp(status.id))}">◆ ${esc(titleCase(status.id))} ${status.duration}</span>`).join('')}</div>`;
  };

  P.advanceOnboardingV9 = function(event) {
    const onboarding = this.state.onboarding;
    if (!onboarding || onboarding.dismissed) return;
    const thresholds = {character_saved:1,spin:2,power:3,combat:4,form_or_party:5};
    if (thresholds[event] !== undefined) onboarding.step = Math.max(onboarding.step,thresholds[event]);
  };
  const coachSteps = [
    ['Create your hero','Identity and background define your baseline. Superhuman power comes from acquired sets.','CHARACTER'],
    ['Spin the wheel','Your first spin begins the campaign. The stage objective is always visible above the playfield.','PLAY'],
    ['Read the consequence','Rewards are not automatic upgrades. Check costs, drawbacks, and future effects.','PLAY'],
    ['Shape the build','Only three power sets can be active. Inactive sets grant small passive growth.','BUILD LAB'],
    ['Read enemy intent','Combat previews show the next enemy action, hit chance, damage range, and why.','PLAY'],
    ['Use the whole team','Forms have upkeep and drawbacks; allies provide distinct Support actions.','JOURNEY']
  ];
  P.renderCoachV9 = function() {
    const root = document.getElementById('v9-coach');
    if (!root) return;
    const onboarding = this.state.onboarding;
    if (onboarding.dismissed || onboarding.step >= coachSteps.length) return root.hidden = true;
    root.hidden = false;
    const [title,body,action] = coachSteps[onboarding.step];
    root.innerHTML = `<b>GUIDE ${onboarding.step+1}/${coachSteps.length} • ${esc(title)}</b><p>${esc(body)}</p><div class="v9-coach-actions"><button data-v9-guide="open">${esc(action)}</button><button data-v9-guide="skip">SKIP</button></div>`;
  };

  P.injectV9UI = function() {
    if (document.getElementById('v9-modal')) return;
    document.getElementById('v8-nav')?.insertAdjacentHTML('beforeend','<button data-v9-open="build">⌘ BUILD LAB</button>');
    const modal = document.createElement('div');
    modal.id = 'v9-modal';
    modal.className = 'v9-modal';
    modal.setAttribute('aria-labelledby','v9-modal-title');
    modal.innerHTML = '<div class="v9-modal-card"><div class="v9-modal-head"><div><b id="v9-modal-title">V9 CAMPAIGN COMMAND</b><small>BUILD • JOURNEY • FIELD GUIDE</small></div><button type="button" data-v9-close data-dialog-initial>CLOSE</button></div><div class="v9-tabs" role="tablist" aria-label="Campaign command views"><button type="button" role="tab" data-v9-tab="build">BUILD LAB</button><button type="button" role="tab" data-v9-tab="journey">JOURNEY</button><button type="button" role="tab" data-v9-tab="guide">FIELD GUIDE</button></div><div id="v9-body" role="tabpanel"></div></div>';
    document.body.appendChild(modal);
    this._v9Dialog = new DialogController(modal);
    this._v9Tabs = new TabController(modal.querySelector('.v9-tabs'),{onActivate:tab => this.renderV9Dashboard(tab)});
    const coach = document.createElement('aside');
    coach.id = 'v9-coach';
    coach.className = 'v9-coach';
    coach.setAttribute('aria-live','polite');
    document.body.appendChild(coach);
  };

  P.openV9 = function(tab = 'build') {
    this.renderV9Dashboard(tab);
    this._v9Dialog?.open(document.activeElement);
  };
  P.renderV9Dashboard = function(tab = 'build') {
    const body = document.getElementById('v9-body');
    if (!body) return;
    this._v9Tabs?.sync(tab);
    if (tab === 'build') {
      const summary = this.powerLoadout(), synergy = this.buildSynergyV9();
      const passives = balance.passiveBonuses(this.state.kits,this.state.activePowerSets,id => CHAR.get(id));
      body.innerHTML = `<div class="v9-summary"><div class="v9-metric"><span>Active sets</span><b>${summary.active.length}/${balance.maxActiveSets}</b></div><div class="v9-metric"><span>Capacity</span><b>${summary.spent}/${summary.budget}</b></div><div class="v9-metric"><span>Synergy</span><b>${synergy.score>=0?'+':''}${synergy.score}</b></div><div class="v9-metric"><span>Passive sets</span><b>${this.inactiveKitRecords().length}</b></div></div><div class="v9-note">Active sets provide techniques, tags, forms, and full stat scaling. The passive library grants only small bonuses to each source’s two strongest stats.</div><h3 class="v9-section-title">Power-set capacity</h3><div class="v9-grid">${this.state.kits.map(kit => {const character=CHAR.get(kit.id),active=summary.active.includes(kit.id),cost=balance.powerSetCost(character),trait=traits.trait(character);return `<article class="v9-card ${active?'active':''}"><h4>${esc(character.name)} • M${kit.mastery} • COST ${cost}</h4><p>${esc(trait.name)} — ${esc(trait.description)}</p><div class="v9-tags">${(character.tags||[]).slice(0,7).map(tag=>`<span>${esc(tag)}</span>`).join('')}</div><button data-v9-power="${character.id}">${active?'MOVE TO PASSIVE LIBRARY':'EQUIP POWER SET'}</button></article>`}).join('') || '<div class="v9-card"><p>Acquire a power set to begin shaping the active build.</p></div>'}</div><h3 class="v9-section-title">Synergy and passive effects</h3><div class="v9-grid"><article class="v9-card"><h4>Synergy</h4>${synergy.notes.map(note=>`<p>${note.value>=0?'+':''}${note.value} • ${esc(note.note)}</p>`).join('')||'<p>No major resonance or conflict yet.</p>'}</article><article class="v9-card"><h4>Passive stat growth</h4><p>${STAT_KEYS.filter(key=>passives[key]).map(key=>`+${passives[key]} ${STAT_META[key].abbr}`).join(' • ')||'No passive bonuses yet.'}</p></article></div>`;
      return;
    }
    if (tab === 'journey') {
      const arc = this.ensureStageArcV9(this.stageNumber()), rival = CHAR.get(this.state.rivalArc?.id), branch = campaign.nextBranch(arc);
      const quests = Object.values(this.state.questChains);
      body.innerHTML = `<div class="v9-summary"><div class="v9-metric"><span>Stage</span><b>${arc.stageNumber}</b></div><div class="v9-metric"><span>Objective</span><b>${arc.progress}/${arc.target}</b></div><div class="v9-metric"><span>Decisions</span><b>${arc.decisions.length}/3</b></div><div class="v9-metric"><span>Quest chains</span><b>${quests.length}</b></div></div><article class="v9-card active"><h4>${esc(arc.name)} • ${esc(arc.featuredUniverse)}</h4><p>${esc(arc.objective)}</p><div class="v9-progress"><i style="width:${arc.progress/arc.target*100}%"></i></div><p>${arc.completed?'Objective complete: boss weakened.':'Incomplete objective will empower the boss.'}</p></article><h3 class="v9-section-title">Evolving rival</h3><article class="v9-card"><h4>${esc(rival?.name||'Unrevealed rival')} • Lv.${this.state.rivalArc?.level||1}</h4><p>${this.state.rivalArc?.encounters||0} encounters • ${this.state.rivalArc?.wins||0} victories • ${this.state.rivalArc?.losses||0} defeats</p><p>Learned counters: ${(this.state.rivalArc?.learnedTags||[]).map(titleCase).join(', ')||'none'}</p></article><h3 class="v9-section-title">Connected story</h3><div class="v9-grid">${arc.decisions.map(decision=>`<article class="v9-card"><h4>${esc(titleCase(decision.branchId))}</h4><p>${esc(titleCase(decision.choiceId))}</p></article>`).join('')}${branch?`<article class="v9-card"><h4>Next: ${esc(branch.title)}</h4><p>${esc(branch.prompt)}</p></article>`:''}</div><h3 class="v9-section-title">Signature quests</h3><div class="v9-grid">${quests.map(quest=>{const stage=quest.stages[quest.stageIndex];return `<article class="v9-card"><h4>${esc(quest.title)}</h4><p>${esc(stage?.requirement||'Complete')}</p><div class="v9-progress"><i style="width:${stage?quest.progress/stage.target*100:100}%"></i></div></article>`}).join('')||'<article class="v9-card"><p>Acquiring a power source starts its identity-specific mastery quest.</p></article>'}</div>`;
      return;
    }
    body.innerHTML = `<div class="v9-grid"><article class="v9-card"><h4>Combat rhythm</h4><p><b>Attack</b> uses the selected technique. <b>Counter</b> reads the telegraph and risks Energy. <b>Support</b> consumes the turn for an ally role effect. <b>Guard</b> is the reliable defensive option.</p></article><article class="v9-card"><h4>Power capacity</h4><p>Up to three sets are active within the capacity budget. Higher-order cosmic sets cost more. Passive sets grant bounded growth without techniques or tags.</p></article><article class="v9-card"><h4>Stage structure</h4><p>Each stage has one objective, three connected decisions, an evolving rival, a preparation stop, and a boss modified by your choices.</p></article><article class="v9-card"><h4>Transformations</h4><p>Forms have activation and upkeep costs. Extreme forms can recoil, reduce defense, or add exploitable weaknesses.</p></article></div><h3 class="v9-section-title">Status glossary</h3><div class="v9-grid">${Object.entries(COMBAT_STATUS_HELP).map(([id,help])=>`<article class="v9-card"><h4>${esc(titleCase(id))}</h4><p>${esc(help)}</p></article>`).join('')}</div>`;
  };

  P.renderStageStripV9 = function() {
    const context = document.getElementById('v8-context');
    if (!context || document.getElementById('v9-stage-strip')) return;
    const arc = this.ensureStageArcV9(this.stageNumber()), percent = Math.round(arc.progress / arc.target * 100);
    context.insertAdjacentHTML('afterend',`<section id="v9-stage-strip" class="v9-stage-strip"><div><strong>STAGE ${arc.stageNumber} • ${esc(arc.name)}</strong><small>${esc(arc.featuredUniverse)}</small></div><div><strong>${esc(arc.objective)} • ${arc.progress}/${arc.target}</strong><div class="v9-progress"><i style="width:${percent}%"></i></div><small>${arc.completed?'Complete — boss weakened':'Incomplete — boss will adapt'}</small></div><button data-v9-open="journey">VIEW JOURNEY</button></section>`);
  };

  const contextV9 = P.context;
  P.context = function() { contextV9.call(this); document.getElementById('v9-stage-strip')?.remove(); this.renderStageStripV9(); };

  const renderAllV9 = P.renderAll;
  P.renderAll = function() {
    this.ensureV9();
    renderAllV9.call(this);
    this.renderCoachV9();
  };

  const saveCharacterV9 = P.saveCharacterCreator;
  P.saveCharacterCreator = function() {
    const result = saveCharacterV9.call(this);
    this.advanceOnboardingV9('character_saved');
    this.renderCoachV9();
    return result;
  };

  const bindV9 = P.bind;
  P.bind = function() {
    bindV9.call(this);
    this.ensureV9();
    this.injectV9UI();
    if (this._v9Bound) return;
    this._v9Bound = true;
    document.addEventListener('click', event => {
      const open = event.target.closest('[data-v9-open]');
      if (open) return this.openV9(open.dataset.v9Open);
      if (event.target.closest('[data-v9-close]')) return this._v9Dialog?.close();
      const tab = event.target.closest('[data-v9-tab]');
      if (tab) return this.renderV9Dashboard(tab.dataset.v9Tab);
      const power = event.target.closest('[data-v9-power]');
      if (power) return this.togglePowerSetV9(power.dataset.v9Power);
      const story = event.target.closest('[data-v9-story]');
      if (story) { const [branchId,choiceId] = story.dataset.v9Story.split('|'); return this.applyStoryChoiceV9(branchId,choiceId); }
      const campChoice = event.target.closest('[data-v9-camp]');
      if (campChoice) return this.applyCampChoiceV9(campChoice.dataset.v9Camp);
      const combatAction = event.target.closest('[data-v9-combat]');
      if (combatAction) return combatAction.dataset.v9Combat === 'counter' ? this.combatCounterV9() : this.combatSupportV9();
      const reward = event.target.closest('[data-v9-reward]');
      if (reward) return this.studyOpponentV9(reward.dataset.v9Reward);
      const guide = event.target.closest('[data-v9-guide]');
      if (guide?.dataset.v9Guide === 'skip') { this.state.onboarding.dismissed=true; this.save(); return this.renderCoachV9(); }
      if (guide?.dataset.v9Guide === 'open') {
        const step=this.state.onboarding.step;
        if (step===3) this.openV9('build');
        else if (step===5) this.openV9('journey');
        else this.shell.scrollIntoView({behavior:'smooth',block:'center'});
      }
    });
    document.getElementById('v9-modal')?.addEventListener('click',event => { if (event.target.id === 'v9-modal') this._v9Dialog?.close(); });
  };
})();
