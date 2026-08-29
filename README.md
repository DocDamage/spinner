# Multiverse Wheel V23 — Tactical Missions & Warfront Operations

A local-first browser/PWA game about forging a custom hero, bending a seeded event Wheel with Fate, and writing a persistent multiverse saga alone or with up to ten local/directly connected players. The runtime roster contains 1,326 character profiles.

V23 turns the strategic wars and civilian stakes established in V21–V22 into persistent tactical operations that are planned before deployment and completed through ordinary Wheel outcomes. It adds mission continuity without turning Multiverse Wheel into a separate tactical RPG.

Play the current release at [docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Release stack

The modern runtime is deliberately layered and fallback-safe:

- **V16 — Living Multiverse:** persistent universes, factions, relations, wars, alliances, nemeses, artifact ownership, world memory, collapse/recovery, and bounded offline simulation.
- **V17 — Reality Rules:** Universe DNA, destinations, secret routes, faction work, Favor, travel routes, and multi-spin Wheel currents.
- **V18 — Multiversal Economy:** authoritative Credits/material wallets, markets, equipment, crafting, enchantment, transmutation, contracts, auctions, and artifact evolution.
- **V19 — Party Consequences:** Loyalty, Trust, Respect, Friendship, Rivalry, Fear, Resentment, morale, wounds, scars, reserves, personal quests, betrayal, defection, mentorship, and relationship endings.
- **V20 — Relic Bonds & Equipment Mastery:** mastery, signature/awakened gear, equipment sets, faction Regalia, vendor loyalty, relic Bond/Purity/Corruption, attunement, relic quests, disputes, nemesis theft/recovery, and Legacy Convergence.
- **V21 — Faction Campaigns & Strongholds:** membership, rank, Authority, long campaigns, strategic territory/fronts, strongholds, facilities, specialists, diplomacy, infiltration, sieges, faction-exclusive unlocks, and faction legacy endings.
- **V22 — Settlements & Civilian Worlds:** persistent civilian populations, displacement/refugees, civilian needs, Wheel-driven relief requests, rebuilding, sanctuaries, public opinion, bounded market pressure, and civilian legacy endings.
- **V23 — Tactical Missions & Warfront Operations:** persistent mission opportunities sourced from the living world, five-stage operations, pre-deployment planning, recoverable setbacks, and bounded aftermath across warfronts, strongholds, civilians, party bonds, relics, and faction progression.

`js/bootstrap.js` loads these layers in order. If V23 fails to load, the browser logs the failure and continues as the complete V22 game.

## Run locally

The app has no build step. Serve the repository with a static HTTP server:

```powershell
python -m http.server 8765
```

Then open:

`http://localhost:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html`

Serving over HTTP enables installation and offline caching. Opening the HTML directly still runs the local game, but not its service worker.

## V23 Tactical Missions & Warfront Operations

### What creates an operation

V23 discovers opportunities from persistent state that already matters:

- active V21 campaigns;
- active V21 warfronts;
- V22 civilian crises and heavy displacement;
- threatened or besieged V21 strongholds;
- V21 infiltration operations;
- stolen V20 relics;
- active V16 nemeses.

Discovery is deterministic and keyed to its source. Opening or rendering the Operations screen never rerolls or advances an operation.

### Operation families

The release includes thirteen mission families:

- Extraction
- Rescue
- Escort
- Sabotage
- Reconnaissance
- Interception
- Artifact Recovery
- Stronghold Defense
- Civilian Evacuation
- Counter-Infiltration
- Warfront Breakthrough
- Leadership Capture
- Route Stabilization

### Five-stage mission loop

Every operation persists across five ordered stages:

1. Intel
2. Approach
3. Complication
4. Objective
5. Extraction

The sixth concept, Aftermath, writes the result into the existing systems that own the affected world state.

Each stage lists compatible normal Wheel signals. A matching ordinary gameplay result advances the current stage. Unrelated Wheel results do not advance it.

### Mission planning

Before deployment, the player can choose:

- Adaptive, Direct, Stealth, or Diplomatic approach;
- up to three active V19 allies;
- an assigned V21 specialist where available;
- optional V21 faction support;
- optional owned V20 relic support;
- a V18 supply commitment;
- a strategic priority such as Balanced, Civilians First, Objective First, or Team Safety.

Planning is free. Supply resources are spent only when **Deploy** succeeds. Invalid deployment spends nothing.

V23 planning is intentionally bounded: its own combat contribution is capped at approximately **±6% odds** and **±8% damage**.

### Party integration

V23 reads the authoritative V19 relationship records. Dead, departed, or defected allies cannot deploy. Severe resentment, broken trust, or broken loyalty can cause an active ally to refuse a mission.

Setbacks can add Fear, Trust loss, and bounded V19 wounds. Success can improve Trust, Respect, Friendship, and Loyalty. V23 adds no approval meter.

### Warfront consequences

Mission outcomes can make small changes to existing V21 front pressure, supply, and morale. A single operation cannot instantly conquer a warfront. Warfront Breakthrough keeps territory strategically contested so V21 remains authoritative for conquest and campaign resolution.

### Civilian consequences

V22 crisis settlements can create Rescue, Escort, Civilian Evacuation, and Route Stabilization missions.

Success can reduce displacement and improve Security, Health, Infrastructure, Morale, and Public Opinion. Failure can create additional bounded displacement using V22's existing protected-population rules. There is no second civilian simulator.

### Stronghold defense

Threatened V21 strongholds can generate Stronghold Defense and Counter-Infiltration operations.

Success can restore bounded Integrity, Defense, Supply, or Morale. Failure is recoverable and cannot delete a player stronghold; the existing V21 siege/recovery layer remains authoritative.

### Existing rewards only

Operation rewards feed existing systems:

- V18 Credits and Salvage;
- V21 rank XP and Authority;
- V21 campaign momentum;
- V20 relic Bond/history when relic support was committed;
- V19 relationship changes;
- V22 civilian recovery/public opinion.

V23 introduces no new currency, shop, inventory, relationship meter, faction reputation model, relic inventory, or city-building economy.

### Recoverable setbacks

A failed matching Wheel result adds operational Stress instead of instantly deleting the mission. Repeated setbacks can eventually fail an operation. The source campaign, front, settlement, stronghold, or relic remains recoverable and can generate future opportunities.

The player can also order a withdrawal. Withdrawals are recorded in operation history and apply bounded consequences. A failed or withdrawn operation can then be reopened and replanned for another attempt.

### Offline simulation

V23 hooks into the existing V16 world tick. Background simulation can discover opportunities, raise urgency, and add a small amount of pressure to an active mission.

Offline catch-up is capped at six ticks by default and cannot auto-complete a mission.

## UI

Open **World → Operations** to see:

- the active operation;
- five-stage progress;
- current stress;
- next compatible Wheel signals;
- source stakes and strategic context;
- available operations sorted by urgency;
- party availability/refusal reasons;
- approach, specialist, faction, relic, priority, and supply planning;
- exact supply costs;
- recent resolved-operation history.

A compact **Operations** beacon sits alongside the existing Reality, Economy, Party, Legacy, Faction Command, and Civilians surfaces.

## Persistence and PWA

V23 uses schema `23`. Migration from V22 is idempotent. Once `state.v23.schemaVersion` is 23, ordinary `ensure()` calls do not replay older V16–V22 migrations.

The service worker cache is `multiverse-wheel-v23-operations-1` and precaches the V23 CSS/domain/browser layers.

The first-install safety rule remains intact: a brand-new service worker does not immediately claim and reload a live page. Client claiming occurs only when an older Multiverse Wheel cache proves this is a real release upgrade; `SKIP_WAITING` remains explicit.

## Validation

Run the full unit/content/migration gate:

```powershell
npm run validate
```

Run only V23 content validation:

```powershell
npm run validate:v23
```

Run all Chromium browser journeys:

```powershell
npm run test:e2e
```

Run the complete local release gate:

```powershell
npm run validate:release
```

GitHub Actions runs two required jobs on pushes to `main`:

1. **Unit and content validation** — all historical tests and V13–V23 validators.
2. **Chromium release journeys** — all historical Playwright journeys plus V23 journeys.

V23 is complete only when both jobs are green on the exact authoritative `main` commit.

## V23 primary files

- `js/domain/v23-engine.js`
- `js/v23-experience.js`
- `styles/v23.css`
- `tests/v23.test.js`
- `tests/e2e/v23.spec.js`
- `tools/validate-v23-content.js`
- `docs/V23_TACTICAL_MISSIONS_WARFRONT_OPERATIONS.md`

Release wiring also updates:

- `js/bootstrap.js`
- `sw.js`
- `package.json`
- `package-lock.json`
- `manifest.webmanifest`
- `index.html`
- `README.md`
- `tools/validate-v22-content.js` (forward-compatible service-worker release check)

## Scope boundary

V23 is not a tactical RPG, RTS, XCOM-like grid game, second combat system, second economy, second party model, second faction campaign system, or replacement for the Wheel.

The Wheel remains the core interaction. V23 makes the worlds around the Wheel react with clearer mission stakes, planning, persistence, and consequences.

See [`docs/V23_TACTICAL_MISSIONS_WARFRONT_OPERATIONS.md`](docs/V23_TACTICAL_MISSIONS_WARFRONT_OPERATIONS.md) for the implementation design and ownership boundaries.
