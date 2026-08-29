# Multiverse Wheel V24 — Multiverse Activities & Competition Circuits

## Release intent

V24 makes the multiverse feel playable between wars and crises. It adds persistent races, tournaments, trials, hunts, rescue drills, community cups, stronghold games, and faction-hosted competition while keeping the **Wheel** as the only event-resolution loop.

V24 is not a second racing engine, tournament combat engine, detached minigame suite, separate economy, or replacement for the existing world systems. Every activity advances through ordinary Wheel outcomes already produced by the game.

## Ownership boundaries

V24 extends the current stack without taking ownership away from older releases.

- **V16** remains authoritative for universes, factions, world memory, threat/corruption, nemeses, and world ticks.
- **V17** remains authoritative for destinations, routes, Favor, and reality/travel rules.
- **V18** remains authoritative for Credits, Salvage, Cosmic Fragments, markets, inventory, crafting, and transactions. V24 entry fees and purses use these existing resources.
- **V19** remains authoritative for party membership and Loyalty, Trust, Respect, Friendship, Rivalry, Fear, and Resentment. A selected competition companion reacts through those existing axes.
- **V20** remains authoritative for relic ownership, Bond, Purity, Corruption, equipment, and mastery. Optional relic support can earn only bounded existing Bond.
- **V21** remains authoritative for faction membership, rank, Authority, strongholds, specialists, and facilities. Faction/stronghold-hosted activities write only bounded results back to those systems.
- **V22** remains authoritative for settlements, civilians, morale, prosperity, public opinion, displacement, and recovery. Settlement-hosted activities can create bounded morale/opinion benefits.
- **V23** remains authoritative for tactical operations. An active V23 operation and active V24 activity are mutually exclusive so one Wheel result cannot silently progress two major commitments.
- **V24** owns only persistent activity records, entry planning, activity segment progress, competition score, final placement, activity history, and non-spendable Circuit Score.

## Activity catalog

V24 ships with twelve activity families:

1. **Speed Race** — a direct multiversal race built around training, travel, hazards, overtakes, and a final lap.
2. **Portal Rally** — a route-heavy race through unstable reality gates.
3. **Combat Tournament** — a four-round bracket resolved through the existing battle/boss signals.
4. **Arena Exhibition** — a prestige combat showcase using the normal combat loop.
5. **Survival Gauntlet** — endurance through hazards, battles, recovery, and a final stand.
6. **Relic Trial** — artifact-focused competition that respects V20 relic ownership.
7. **Treasure Hunt** — clue, travel, hazard, and artifact discovery competition.
8. **Bounty Pursuit** — a tracking and capture event using travel/hazard/battle signals.
9. **Rescue Drill** — a scored emergency-response exercise.
10. **Civilian Cup** — a settlement-hosted community event that can improve morale after a podium.
11. **Stronghold Games** — a V21 stronghold-hosted readiness competition.
12. **Faction Grand Prix** — a faction-hosted high-profile race that can grant bounded existing Authority/rank XP.

## Four-segment activity loop

Each activity persists through four named segments appropriate to the event. A Speed Race uses Starting Grid, Launch, Hazard Run, and Final Lap. A Combat Tournament uses Qualifier, Quarterfinal, Semifinal, and Championship.

Each segment lists compatible ordinary Wheel signals. Matching outcomes advance the segment and add performance score. Unrelated outcomes do nothing. Setbacks reduce final placement quality but do not create a detached failure minigame.

Opening or rendering the Activities screen never progresses an event.

## Planning

Before entry the player can choose:

- **Balanced** style — consistent scoring;
- **Aggressive** style — higher ceiling with larger setback penalty;
- **Technical** style — Skill/Mind-oriented scoring;
- **Endurance** style — steadier recovery;
- one active **V19 companion** where available;
- one owned **V20 relic** as optional support.

Planning is free. The activity entry fee is charged only after valid entry succeeds.

## Entry fees and rewards

V24 introduces no spendable activity currency.

Every entry fee uses existing **V18 Credits**. Event purses pay existing V18 Credits/materials. The activity screen also displays **Circuit Score**, but Circuit Score is explicitly **non-spendable** ranking state used only for the current competition record and tier.

Season tiers are informational:

- Rookie
- Challenger
- Contender
- Elite
- Legend

## Placement

Completed activities resolve to ranks 1–4.

Placement uses:

- successful/failed segment outcomes;
- the activity family's relevant hero stats;
- chosen competition style;
- small companion/relic support bonuses;
- deterministic opponent scores derived from the saved world seed and activity identity.

Rendering cannot reroll opponents or placement inputs.

## Race implementation

Speed Race and Portal Rally are actual persistent race activities, not placeholder cards. They have named race segments, live scoring, deterministic opposition, entry fees, final placement, circuit standings, and result history. They still use normal Wheel signals rather than introducing steering physics or a second real-time game.

## Tournament implementation

Combat Tournament and Arena Exhibition use the existing battle/boss signals. V24 never creates a second combat resolver. The player's normal combat systems remain authoritative; V24 records how those outcomes affect bracket score and placement.

## Party integration

Only active V19 party members can be selected as activity companions. Dead, departed, defected, benched, or severely resentful companions can be unavailable.

Participation can affect existing Friendship, Rivalry, Trust, and Respect. V24 adds no approval meter.

## Relic integration

Owned, available V20 relics may support an activity. A top-two finish can add one bounded point of existing relic Bond and record the event in existing relic history. Stolen relics cannot be selected.

## Faction and stronghold integration

Faction Grand Prix and Stronghold Games can be hosted by existing V21 entities. Podiums can add only small bounded Authority/rank XP or stronghold morale/defense. V21 remains authoritative for rank, territory, strongholds, and faction progression.

## Civilian integration

Civilian Cup and Rescue Drill can be sourced from V22 settlements. Podiums can slightly improve existing morale, prosperity, and player opinion. V24 does not create another civilian simulation.

## V23 focus guard

A player cannot enter a V24 activity while a V23 operation is active. V24 also patches V23 deployment in the browser runtime so an operation cannot start while a V24 activity is active.

This prevents one ordinary Wheel result from unexpectedly advancing both systems at the same time.

## Discovery and persistence

Activities are deterministic persistent records. Discovery can source events from:

- the current universe circuit;
- V22 settlements;
- player-aligned V21 strongholds;
- the player's primary V21 faction.

World catch-up may discover new events but cannot auto-complete an activity.

`state.v24.schemaVersion` is `24`. Migration from V23 is idempotent. Once schema 24 exists, ordinary `ensure()` calls do not replay V16–V23 migrations.

## Browser experience

World gains an **Activities** tab plus a compact Activity Circuit beacon.

The screen includes:

- active event and current segment;
- live score and setbacks;
- compatible next Wheel signals;
- available event cards with venue/difficulty/heat;
- exact V18 Credit entry fee;
- existing-resource prize purse;
- style, companion, and relic planning;
- Circuit Score and tier;
- recent placements and resolved rewards.

The interface remains keyboard friendly, responsive, readable without color-only status, and reduced-motion compatible.

## Fallback-safe runtime

The modern browser stack becomes:

V16 → V17 → V18 → V19 → V20 → V21 → V22 → V23 → V24

If V24 fails to load, bootstrap logs the failure and continues as the complete V23 Tactical Missions & Warfront Operations release.

## PWA safety

V24 advances the service-worker cache and precaches the V24 CSS/domain/browser layers. The first-install safety rule remains unchanged: a brand-new service worker does not immediately claim and reload an already-open first-run page. `clients.claim()` runs only when older Multiverse Wheel caches prove the activation is a real update. `SKIP_WAITING` remains explicit.

## Validation

V24 adds:

- `tests/v24.test.js` — migration, deterministic discovery, entry economy, race/tournament progression, placement, cross-system consequences, focus guard, and regression coverage;
- `tests/e2e/v24.spec.js` — Chromium journeys for race/tournament entry, Wheel completion, V23 focus exclusion, and historical UI coexistence;
- `tools/validate-v24-content.js` — content, wiring, PWA, economy, and release metadata validation.

All historical release tests, validators, and Chromium journeys remain in the release gate.
