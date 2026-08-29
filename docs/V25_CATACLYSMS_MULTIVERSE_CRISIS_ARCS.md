# Multiverse Wheel V25 — Cataclysms & Multiverse Crisis Arcs

## Release intent

V25 turns severe pressure already simulated by the Living Multiverse into durable, player-facing crisis arcs. V16 already owns individual wars, incursions, fractures, collapses, threat, corruption, and stability. V25 does **not** replace that simulation. It recognizes when several existing conditions become serious enough to form a larger emergency, persists that emergency, and lets the player answer it through normal Wheel outcomes.

The Wheel remains the core interaction. V25 is a coordination and consequence layer, not another combat game, city builder, faction simulator, economy, or mission engine.

## Ownership boundaries

- **V16** remains authoritative for universes, stability, corruption, threat, factions, wars, incursions, nemeses, world events, world memory, and world ticks.
- **V17** remains authoritative for destinations, routes, Favor, and reality/travel rules.
- **V18** remains authoritative for Credits, Salvage, Cosmic Fragments, Void Marks, Bounty Seals, markets, inventory, crafting, and transactions.
- **V19** remains authoritative for party members, wounds, and Loyalty/Trust/Respect/Friendship/Rivalry/Fear/Resentment.
- **V20** remains authoritative for relic Bond, Purity, Corruption, ownership, mastery, and relic history.
- **V21** remains authoritative for membership, rank, Authority, campaigns, fronts, territory, strongholds, facilities, specialists, diplomacy, infiltration, and sieges.
- **V22** remains authoritative for settlements, population, displacement, refugees, needs, relief, recovery, public opinion, and sanctuary state.
- **V23** remains authoritative for tactical operations, mission planning, operation stages, operational stress, and operation aftermath.
- **V24** remains authoritative for races, tournaments, trials, hunts, activity entry, placements, and non-spendable Circuit Score.
- **V25** owns only crisis records, crisis phase progress, active Crisis Command focus, response posture/support planning, crisis pressure/momentum, crisis history, and bounded cross-system aftermath bridges.

## Crisis families

V25 ships with ten crisis families:

1. **Reality Fracture** — critically low V16 stability becomes a sustained structural emergency.
2. **Corruption Surge** — extreme V16 corruption begins affecting more than isolated encounters.
3. **Invasion Wave** — extreme V16 threat becomes a world-scale offensive.
4. **Temporal Storm** — temporal/fracture-tagged realities suffer route and continuity failure.
5. **Relic Cascade** — stolen or highly corrupted V20 relics amplify instability.
6. **Faction World War** — extreme V21 frontline pressure threatens the wider world layer.
7. **Refugee Exodus** — severe V22 displacement exceeds local recovery capacity.
8. **Stronghold Breach** — a V21 stronghold crisis becomes a regional strategic emergency.
9. **Nemesis Uprising** — a sufficiently developed V16 nemesis becomes a world-scale destabilizer.
10. **Convergence Event** — two or more severely unstable realities begin collapsing into one shared emergency.

Discovery is deterministic from saved world state and the V16 tick epoch. Opening or rendering the Crises screen never rerolls a crisis.

## Five-phase crisis loop

Each crisis persists through:

1. **Warning** — identify the emergency and establish response channels.
2. **Outbreak** — survive the first active spread.
3. **Escalation** — contain compounding pressure.
4. **Convergence** — address the cross-system consequences.
5. **Resolution** — stabilize the emergency and write aftermath back into the systems that own the affected state.

Every phase lists compatible ordinary Wheel signals. Unrelated outcomes do not advance it. High-severity later phases can require more than one matching result. Rendering never progresses a phase.

## Crisis Command planning

Before activating one crisis response, the player chooses a response posture: Adaptive Command, Containment, Civilian Lifeline, Strike the Source, Reality Stabilization, or Coalition Response. The player can also select up to three V19 active allies, one existing faction relationship, one owned and available V20 relic anchor, one existing V21 stronghold anchor, and a V18 support commitment.

Planning is free. V18 resources are spent only when the response actually starts. Invalid responses spend nothing.

## V18 support commitment

V25 has no wallet or crisis currency. Support tiers consume the existing V18 economy: Local Response, Prepared, Mobilized, and Total Response. Successful crisis resolution awards only existing V18 Credits, Salvage, and bounded Cosmic Fragments.

## Macro context and V23/V24 coexistence

Unlike the mutual exclusion between V23 operations and V24 activities, a V25 crisis is a macro world context rather than a second immediate mission. An active crisis can remain in the background while the player carries out a V23 operation or V24 activity. When those lower-level experiences produce ordinary Wheel outcomes that match the active crisis phase, they can naturally contribute to crisis progress.

The operation/activity remains the immediate owner of its own stage, rewards, stress, score, and aftermath. V25 only recognizes the same underlying world event as part of the larger emergency.

## Failure and recovery

Setbacks increase crisis Pressure and reduce Momentum. Repeated severe setbacks can fail the active response, but failure is deliberately recoverable: V16 universe stability has a protected floor, V21 strongholds cannot be deleted or reduced below a recoverable integrity floor, V22 settlement failure uses the existing bounded displacement system, and failed crisis records can be reopened and replanned.

The player may also Stand Down an active response. Progress is preserved, resources are not refunded, and severity/pressure rise modestly before the crisis returns to the watch board.

## Bounded aftermath

A successful resolution can produce bounded changes such as higher V16 stability; lower V16 corruption and threat; reduced V22 displacement; improved V22 security, health, morale, infrastructure, and public opinion; restored V21 stronghold integrity, supply, and morale; existing V21 rank XP and Authority; existing V20 Bond/Purity/Corruption changes; existing V19 Trust/Respect/Loyalty changes; and existing V18 rewards.

V25 never directly conquers territory, permanently deletes a stronghold, erases a settlement, creates a second relationship model, or adds a new spendable resource.

## Offline evolution

V25 participates in the V16 world clock. Bounded background ticks can discover newly eligible crisis arcs, increase severity of unresolved crises, and add limited pressure to an active response. Offline catch-up is capped at six V25 ticks by default. Background simulation cannot complete a crisis and cannot automatically fail one. Severity and pressure stop below catastrophic endpoints until the player returns.

## UI

Open **World → Crises** to see the active Crisis Command focus, five-phase progress, severity, pressure, momentum, setbacks, next compatible Wheel signals, affected realities, response posture, exact V18 support cost, V19 crisis-team availability, faction/relic/stronghold coordination, recovery paths, and aftermath history.

A compact **Crisis Command** beacon is added alongside the existing Reality, Economy, Party, Legacy, Faction, Civilians, Operations, and Activity Circuit surfaces. The UI remains keyboard friendly, responsive, readable without color-only meaning, and reduced-motion compatible.

## Persistence and migration

`state.v25.schemaVersion` is `25`. Migration from V24 is idempotent. The first V25 migration ensures the V24 baseline, initializes V25, and performs a deterministic first discovery pass. Once schema 25 exists, ordinary V25 `ensure()` calls do not replay V16–V24 migrations.

## Fallback-safe runtime

V16 → V17 → V18 → V19 → V20 → V21 → V22 → V23 → V24 → V25

If V25 fails to load, bootstrap logs the error and continues as the complete V24 Multiverse Activities & Competition Circuits release.

## PWA safety

The V25 service worker adds V25 CSS/domain/browser assets to the app shell. The first-install safety rule remains unchanged: a brand-new service worker does not claim and reload an already-open first-run page. `clients.claim()` is only used when an older Multiverse Wheel cache proves activation is a real update. `SKIP_WAITING` remains explicit.

## Validation

V25 adds `tests/v25.test.js`, `tests/e2e/v25.spec.js`, and `tools/validate-v25-content.js`. All historical tests and validators remain part of the release gate.
