'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {BalanceEngine} = require('../js/domain/balance-engine.js');
const {CombatEngine} = require('../js/domain/combat-engine.js');
const {CampaignEngine} = require('../js/domain/campaign-engine.js');
const {TraitEngine} = require('../js/domain/trait-engine.js');
const {SaveRepository} = require('../js/domain/save-repository.js');
const {WheelService} = require('../js/domain/wheel-service.js');
const {ViewTemplates} = require('../js/ui/view-templates.js');
const {DerivedStateCache} = require('../js/domain/derived-state-cache.js');
const {wrappedIndex} = require('../js/ui/dialog-controller.js');
const {SimulationEngine} = require('../js/domain/simulation-engine.js');
const {tabIndexForKey} = require('../js/ui/tab-controller.js');
const {CollectionWindow} = require('../js/domain/collection-window.js');
const {CombatAdvisor} = require('../js/domain/combat-advisor.js');

const character = (id, rating, tags = []) => ({
  id,
  name:id,
  universe:'Test',
  version:'Test',
  stats:Object.fromEntries(['might','defense','speed','skill','mind','energy','hax'].map(key => [key, rating])),
  tags,
  powers:['Test power'],
  signature:'Test signature'
});

test('power loadouts enforce both slot and cost budgets', () => {
  const engine = new BalanceEngine({maxActiveSets:3, baseBudget:8});
  const roster = new Map([
    ['street', character('street', 45, ['martial'])],
    ['cosmic', character('cosmic', 120, ['cosmic','reality'])],
    ['tech', character('tech', 78, ['tech','genius'])],
    ['speed', character('speed', 90, ['speed','time'])]
  ]);
  const kits = [...roster.keys()].map(id => ({id, mastery:1}));
  const result = engine.normalizeLoadout(kits, ['cosmic','tech','speed','street'], id => roster.get(id), 8);
  assert.ok(result.active.length <= 3);
  assert.ok(result.spent <= 8);
  assert.deepEqual(result.active, ['cosmic','tech','street']);
});

test('inactive sets grant bounded passive growth', () => {
  const engine = new BalanceEngine();
  const roster = new Map([
    ['active', character('active', 70)],
    ['inactive', {...character('inactive', 70), stats:{might:100,defense:90,speed:20,skill:20,mind:20,energy:20,hax:20}}]
  ]);
  const bonuses = engine.passiveBonuses([{id:'active',mastery:5},{id:'inactive',mastery:5}], ['active'], id => roster.get(id));
  assert.equal(bonuses.might, 3);
  assert.equal(bonuses.defense, 3);
  assert.equal(bonuses.speed, 0);
});

test('large collections cannot exceed the aggregate passive stat cap', () => {
  const engine = new BalanceEngine({passiveStatCap:12});
  const roster = new Map();
  const kits = Array.from({length:20}, (_, index) => {
    const id = `inactive-${index}`;
    roster.set(id, {...character(id, 20), stats:{might:100,defense:90,speed:20,skill:20,mind:20,energy:20,hax:20}});
    return {id, mastery:5};
  });
  const bonuses = engine.passiveBonuses(kits, [], id => roster.get(id));
  assert.equal(bonuses.might, 12);
  assert.equal(bonuses.defense, 12);
  assert.equal(bonuses.speed, 0);
});

test('normalization preserves an explicit unequip choice', () => {
  const engine = new BalanceEngine();
  const kits = [{id:'one',mastery:1},{id:'two',mastery:1}];
  const lookup = id => character(id, 50);
  assert.deepEqual(engine.normalizeLoadout(kits, ['two'], lookup).active, ['two']);
  assert.deepEqual(engine.normalizeLoadout(kits, [], lookup).active, []);
});

test('tag stacking has diminishing returns and counters are explicit', () => {
  const engine = new BalanceEngine();
  assert.ok(engine.diminishingTagValue(3) < 3);
  assert.ok(engine.diminishingTagValue(4) - engine.diminishingTagValue(3) < 1);
  const profile = engine.counterProfile(['reality','time'], ['nullification','precognition']);
  assert.deepEqual(profile.threats, ['reality','time']);
  assert.deepEqual(new Set(profile.counters), new Set(['nullification','precognition']));
  assert.equal(profile.coverage, 1);
});

test('combat intents and previews expose cause and effect', () => {
  const engine = new CombatEngine();
  const enemy = character('mage', 80, ['magic','time']);
  const intent = engine.intent(enemy, 1);
  assert.equal(intent.type, 'control');
  const preview = engine.preview({
    fighter:{stats:character('hero', 80).stats},
    enemy,
    technique:{cost:12},
    spec:{accuracy:.8,power:70,energy:12,cooldown:1,crit:.1,armorPen:.1},
    strategyOdds:.65,
    repetition:1,
    matchup:.05
  });
  assert.ok(preview.accuracy > .5 && preview.accuracy < 1);
  assert.ok(preview.maxDamage >= preview.minDamage);
  assert.equal(preview.reasons.length, 4);
});

test('tactical advice excludes unusable moves and rewards intent counters', () => {
  const advisor = new CombatAdvisor();
  const techniques = [
    {id:'expensive',name:'Expensive Blast',tags:['energy'],spec:{energy:90,power:200}},
    {id:'sealed',name:'Sealed Strike',tags:['strength'],spec:{energy:5,power:160}},
    {id:'answer',name:'Null Field',tags:['nullification'],spec:{energy:12,power:70}}
  ];
  const result = advisor.advise({
    techniques,
    strategies:[{id:'precise',name:'Precise'}],
    intent:{responseTags:['nullification']},
    fighterEnergy:40,
    cooldowns:{sealed:2},
    specFor:technique => ({accuracy:.8,cooldown:0,effects:[],...technique.spec}),
    previewFor:technique => technique.id === 'answer' ? {accuracy:.82,minDamage:30,maxDamage:42} : {accuracy:.9,minDamage:80,maxDamage:100}
  });
  assert.equal(result.techniqueId, 'answer');
  assert.deepEqual(result.matchedTags, ['nullification']);
});

test('tactical advice recommends recovery when no move is usable', () => {
  const result = new CombatAdvisor().advise({
    techniques:[{id:'empty',name:'Empty',tags:[]}],
    strategies:[{id:'steady'}],
    fighterEnergy:0,
    specFor:() => ({energy:10})
  });
  assert.equal(result.kind, 'recover');
});

test('tactical advice accounts for repeated-use penalties', () => {
  const result = new CombatAdvisor().advise({
    techniques:[
      {id:'repeated',name:'Repeated Move',tags:[]},
      {id:'fresh',name:'Fresh Move',tags:[]}
    ],
    strategies:[{id:'steady'}],
    fighterEnergy:20,
    history:['repeated','repeated'],
    specFor:() => ({energy:5,cooldown:0,effects:[]}),
    previewFor:() => ({accuracy:.8,minDamage:20,maxDamage:30})
  });
  assert.equal(result.techniqueId, 'fresh');
});

test('campaign decisions persist and modify the boss', () => {
  const engine = new CampaignEngine();
  const arc = engine.createArc({stageNumber:2, characters:[character('rival',80)], random:() => 0});
  assert.equal(arc.name, 'Convergence');
  const choice = engine.applyChoice(arc, 'recon', 'rescue');
  assert.equal(choice.effect.rescues, 1);
  engine.addProgress(arc, 'missions', 2);
  assert.equal(arc.completed, true);
  assert.ok(engine.bossModifiers(arc).scale < 1);
});

test('signature traits include explicit and generated identities', () => {
  const engine = new TraitEngine();
  assert.equal(engine.trait({...character('batman',80),name:'Batman'}).name, 'Contingency Protocol');
  const generated = engine.trait({...character('new_speedster',80,['speed']),name:'New Speedster'});
  assert.equal(generated.kind, 'speedster');
  assert.equal(engine.quest({...character('new_speedster',80,['speed']),name:'New Speedster'}).stages.length, 3);
});

test('save repository creates isolated schema-versioned snapshots', () => {
  const values = new Map();
  const storage = {getItem:key => values.get(key) || null, setItem:(key,value) => values.set(key,value), removeItem:key => values.delete(key)};
  const repository = new SaveRepository(storage, 'save', 9);
  const original = {spin:4};
  repository.save(original);
  assert.equal(original.schemaVersion, undefined);
  assert.equal(repository.load().schemaVersion, 9);
  repository.clear();
  assert.equal(repository.load(), null);
});

test('wheel cadence reserves story, camp, and boss beats', () => {
  const wheel = new WheelService();
  assert.equal(wheel.cadence(3, 0).storyDue, true);
  assert.equal(wheel.cadence(9, 3).campDue, true);
  assert.equal(wheel.cadence(10, 3, true).bossDue, true);
  assert.deepEqual(wheel.rivalReplacementIndexes([{type:'hazard'},{type:'power'},{type:'battle'},{type:'recruit'}],2), [1,2]);
});

test('view templates escape dynamic combat content', () => {
  const views = new ViewTemplates();
  const html = views.intent({intent:{icon:'!',label:'<Control>',telegraph:'Read & react',danger:2},technique:{t:{name:'Time "Stop"'}}});
  assert.match(html, /&lt;Control&gt;/);
  assert.doesNotMatch(html, /<Control>/);
});

test('derived-state cache reuses models and returns defensive copies', () => {
  const cache = new DerivedStateCache();
  let calculations = 0;
  const copy = value => ({...value});
  const first = cache.memo('stats','same',() => ({might:++calculations}),copy);
  first.might = 99;
  const second = cache.memo('stats','same',() => ({might:++calculations}),copy);
  assert.equal(second.might,1);
  assert.equal(calculations,1);
  assert.equal(cache.report().hits,1);
});

test('dialog focus navigation wraps in both directions', () => {
  assert.equal(wrappedIndex(3,3),0);
  assert.equal(wrappedIndex(-1,3),2);
  assert.equal(wrappedIndex(0,0),-1);
});

test('tab navigation supports arrows and boundary keys', () => {
  assert.equal(tabIndexForKey(2,3,'ArrowRight'),0);
  assert.equal(tabIndexForKey(0,3,'ArrowLeft'),2);
  assert.equal(tabIndexForKey(1,3,'Home'),0);
  assert.equal(tabIndexForKey(1,3,'End'),2);
});

test('collection windows filter and clamp late-run pages', () => {
  const collection = new CollectionWindow({pageSize:2});
  const items=[{name:'Batman DC'},{name:'Flash DC'},{name:'Hulk Marvel'},{name:'Thor Marvel'}];
  const filtered=collection.select(items,{query:'marvel',page:9,text:item=>item.name});
  assert.deepEqual(filtered.items.map(item=>item.name),['Hulk Marvel','Thor Marvel']);
  assert.equal(filtered.page,0);
  assert.equal(filtered.filtered,2);
});

test('balance simulations are deterministic and respect constraints', () => {
  const roster = [character('one',45,['martial']),character('two',70,['tech']),character('three',90,['speed']),character('four',110,['reality']),character('five',80,['magic'])];
  const simulation = new SimulationEngine({balance:new BalanceEngine()});
  const first = simulation.run(roster,{runs:100,seed:42});
  const second = simulation.run(roster,{runs:100,seed:42});
  assert.deepEqual(first,second);
  assert.ok(first.averages.activeSets <= 3);
  assert.ok(first.averages.spent <= 8);
});
