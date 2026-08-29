# Multiverse Wheel V25 — Cataclysms & Multiverse Crisis Arcs

A local-first browser/PWA game about forging a custom hero through a persistent multiverse built around a seeded event Wheel. The runtime roster contains 1,326 character profiles.

V25 turns severe instability, corruption, threat, warfront pressure, displacement, stronghold danger, relic failures, and nemesis escalation into persistent **multiverse crisis arcs** without replacing the systems that already simulate those worlds. Every response progresses through ordinary Wheel outcomes.

Play the current release at [docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Release stack

The modern runtime is deliberately layered and fallback-safe:

- **V16 — Living Multiverse:** persistent worlds, factions, wars, nemeses, memory, and bounded world simulation.
- **V17 — Reality Rules:** destinations, routes, Favor, travel, and reality rules.
- **V18 — Multiversal Economy:** Credits/materials, markets, inventory, crafting, contracts, auctions, and artifact evolution.
- **V19 — Party Consequences:** seven relationship axes, morale, wounds, reserves, betrayal, defection, mentorship, and party endings.
- **V20 — Relic Bonds & Equipment Mastery:** mastery, signature/awakened gear, sets, relic Bond/Purity/Corruption, attunement, quests, and theft/recovery.
- **V21 — Faction Campaigns & Strongholds:** membership, rank, Authority, campaigns, territory/fronts, strongholds, specialists, diplomacy, infiltration, and sieges.
- **V22 — Settlements & Civilian Worlds:** civilian populations, displacement, relief, rebuilding, sanctuaries, public opinion, and civilian endings.
- **V23 — Tactical Missions & Warfront Operations:** persistent five-stage operations sourced from campaigns, fronts, civilian crises, strongholds, relics, and nemeses.
- **V24 — Multiverse Activities & Competition Circuits:** persistent races, tournaments, trials, hunts, and hosted events with four-segment Wheel progression and non-spendable Circuit Score.
- **V25 — Cataclysms & Multiverse Crisis Arcs:** deterministic macro emergencies, five-phase Crisis Command responses, recoverable failure, and bounded aftermath across V16–V24.

`js/bootstrap.js` loads these layers in order. If V25 fails, the game remains fully playable as V24.

## V25 highlights

V25 ships with ten crisis families:

- Reality Fracture
- Corruption Surge
- Invasion Wave
- Temporal Storm
- Relic Cascade
- Faction World War
- Refugee Exodus
- Stronghold Breach
- Nemesis Uprising
- Convergence Event

### Five persistent crisis phases

Every crisis persists across Warning, Outbreak, Escalation, Convergence, and Resolution. Each phase lists normal Wheel signals that can advance it. Opening the Crises screen never progresses or rerolls an emergency.

### Crisis Command planning

Choose Adaptive Command, Containment, Civilian Lifeline, Strike the Source, Reality Stabilization, or Coalition Response. A response may assign up to three existing V19 allies, coordinate an existing faction relationship, use an owned V20 relic anchor, use a V21 stronghold anchor, and commit existing V18 resources.

Planning is free. Resources are spent only when the response starts. Invalid responses spend nothing.

### Existing systems stay authoritative

- V16 still owns stability, corruption, threat, worlds, wars, nemeses, world events, and memory.
- V18 remains the only spendable economy; V25 adds no wallet or crisis currency.
- V19 remains the only party relationship model.
- V20 remains the only relic progression/ownership system.
- V21 remains authoritative for campaigns, fronts, territory, factions, Authority, and strongholds.
- V22 remains authoritative for civilian population, displacement, refugees, recovery, and public opinion.
- V23 operations keep their own mission stages and aftermath.
- V24 activities keep their own entry, score, placement, and Circuit Score.

Unlike the V23/V24 mutual exclusion rule, V25 is macro context. An active crisis can coexist with an operation or activity; matching underlying Wheel outcomes may contribute to the crisis while the lower-level system keeps ownership of its own progress and rewards.

### Failure remains recoverable

Repeated setbacks can fail Crisis Command, but V25 does not erase a world, delete a stronghold, or wipe a settlement. Failed arcs can be reopened and replanned. V25 failure aftermath keeps protected V16 stability and V21 stronghold integrity floors and uses V22's bounded displacement rules.

The player can also stand down. Progress is preserved, committed resources are not refunded, and pressure rises modestly before the crisis returns to the watch board.

## UI

Open **World → Crises** to view active five-phase Crisis Command progress; severity, pressure, momentum, and setbacks; next compatible Wheel signals; affected realities and linked stakes; response posture and exact V18 support cost; V19 crisis-team availability; faction, relic, and stronghold coordination; deterministic crisis watch board; recovery paths; and aftermath history.

A compact **Crisis Command** beacon sits alongside Reality, Economy, Party, Legacy, Faction Command, Civilians, Operations, and Activity Circuit surfaces.

## Persistence and PWA

V25 uses schema `25`. Migration from V24 is idempotent and ordinary V25 `ensure()` calls do not replay older migrations after schema 25 is established.

The service worker advances to the V25 crisis cache and precaches the V25 CSS/domain/browser layers while preserving first-install claim safety and explicit `SKIP_WAITING` behavior.

## Validation

Run `npm run validate`, `npm run validate:v25`, `npm run test:e2e`, or `npm run validate:release`.

GitHub Actions must pass both required jobs on the exact authoritative `main` commit:

1. **Unit and content validation**
2. **Chromium release journeys**

## V25 primary files

- `js/domain/v25-engine.js`
- `js/v25-experience.js`
- `styles/v25.css`
- `tests/v25.test.js`
- `tests/e2e/v25.spec.js`
- `tools/validate-v25-content.js`
- `docs/V25_CATACLYSMS_MULTIVERSE_CRISIS_ARCS.md`

Release wiring also updates `js/bootstrap.js`, `sw.js`, `package.json`, `package-lock.json`, `manifest.webmanifest`, `index.html`, and this README.
