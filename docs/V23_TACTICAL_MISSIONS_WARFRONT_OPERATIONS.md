# Multiverse Wheel V23 — Tactical Missions & Warfront Operations

## Release intent

V23 turns the strategic pressure created by V21 campaigns/warfronts and V22 civilian crises into persistent, directly playable operations while keeping the Wheel as the primary gameplay loop. It is not a separate tactical RPG, grid combat mode, mission currency, or second progression game.

The Wheel remains the center of play. Operations create context, planning choices, consequences, and long-form continuity around ordinary Wheel outcomes.

## Ownership boundaries

V23 extends the existing stack rather than duplicating it. The V18 economy remains the only resource economy used by operations.

- **V16** remains authoritative for universes, stability, threat, corruption, factions, relations, wars, nemeses, world memory, and world ticks.
- **V17** remains authoritative for destinations, routes, Favor, and travel/reality rules.
- **V18** remains authoritative for Credits, Salvage, Cosmic Fragments, equipment, markets, crafting, and transactions.
- **V19** remains authoritative for Loyalty, Trust, Respect, Friendship, Rivalry, Fear, Resentment, wounds, party status, and companion consequences.
- **V20** remains authoritative for equipment mastery, relic Bond/Purity/Corruption, relic ownership, and relic progression.
- **V21 campaigns** remain authoritative for faction campaigns, territory, warfronts, strongholds, facilities, specialists, rank, Authority, diplomacy, and infiltration.
- **V22 civilian worlds** remain authoritative for settlements, displacement, refugees, civilian requests, public opinion, recovery, and sanctuary civilian state.
- **V23** owns only persistent tactical operation records, operation planning, stage progress, operational stress, operation history, and bounded operation aftermath bridges.

## Operation sources

V23 deterministically discovers mission opportunities from persistent state that already exists. Rendering never rerolls missions.

Sources include:

- active V21 faction campaigns;
- active V21 warfronts;
- V22 civilian crises and major displacement;
- threatened or besieged V21 strongholds;
- V21 infiltration opportunities;
- stolen V20 relics;
- active V16 nemeses.

Source keys prevent repeated rendering or repeated discovery scans from producing duplicate operations.

## Operation families

The release ships with thirteen operation families:

1. Extraction
2. Rescue
3. Escort
4. Sabotage
5. Reconnaissance
6. Interception
7. Artifact Recovery
8. Stronghold Defense
9. Civilian Evacuation
10. Counter-Infiltration
11. Warfront Breakthrough
12. Leadership Capture
13. Route Stabilization

Each family defines normal Wheel-compatible event signals for its stages. Operations do not use a detached combat or dice minigame.

## Five stages

Every operation advances through the same five stages:

1. **Intel** — learn what is actually happening.
2. **Approach** — enter the operation using the chosen plan.
3. **Complication** — absorb the mission's changing conditions.
4. **Objective** — execute the central task.
5. **Extraction** — survive the result and get people/assets out.

After Extraction, V23 writes an **Aftermath** into the systems that own the affected state.

Stages are persistent, ordered, save-safe, and recoverable. Opening the Operations interface never advances them.

## Planning

Before deployment, the player can configure a bounded plan:

- approach: Adaptive, Direct, Stealth, or Diplomatic;
- up to three active V19 allies;
- one already-assigned V21 specialist when available;
- optional V21 faction support;
- optional owned V20 relic support;
- V18 supply commitment from none through heavy;
- mission priority such as Balanced, Civilians First, Objective First, or Team Safety.

Planning itself spends nothing. Supply is paid only when the operation is actually deployed. Invalid deployment spends nothing.

Planning bonuses are deliberately modest. V23's own contribution is capped to approximately **±6% combat odds** and **±8% damage**, and is then combined with the existing combat stack.

## Party consequences

V19 relationships determine whether an active ally is willing to participate. Severe resentment, broken trust, broken loyalty, death, departure, or defection can make an ally unavailable.

Operation setbacks may:

- raise Fear;
- reduce Trust;
- create bounded wounds through the existing V19 wound system.

Successful operations can improve Trust, Respect, Friendship, and Loyalty. Failed or aborted missions can produce Resentment and Fear. V23 does not create an approval meter.

## Relic support

An owned V20 relic can be committed as support. V23 does not create another relic progression track.

Successful supported operations may add a small amount of existing V20 Bond and record the mission in that relic's existing history. Stolen relic operations are created from V20 theft state and resolve back through existing relic ownership/progression paths.

## Warfront operations

V21 fronts can create Interception, Sabotage, Reconnaissance, or Warfront Breakthrough operations.

One operation can only move front pressure, supply, and morale by a small bounded step. A single mission cannot instantly conquer a warfront or erase a territory. Breakthrough success keeps the territory strategically contested so the V21 campaign layer remains authoritative.

## Civilian stakes

V22 crisis settlements can produce Rescue, Escort, Civilian Evacuation, or Route Stabilization operations.

Successful civilian operations can:

- reduce displacement;
- improve Security, Health, Infrastructure, Morale, or Public Opinion;
- record civilians rescued in V23 statistics.

Failure can create additional bounded displacement through the existing V22 displacement rules, including their protected population floor. V23 does not duplicate settlement simulation.

## Stronghold defense

Threatened V21 strongholds can create Stronghold Defense or Counter-Infiltration operations.

Success can restore a small amount of Integrity, Defense, Supply, or Morale. Failure is recoverable: a mission cannot delete a player stronghold, and V23 maintains an Integrity floor before returning control to the V21 siege/recovery layer.

## Existing rewards only

Operation rewards use existing systems:

- V18 Credits and Salvage;
- V21 rank XP and Authority;
- V21 campaign momentum;
- V20 relic Bond when relic support was committed;
- V19 relationship progression;
- V22 public opinion/recovery.

There is no V23 currency, wallet, shop, inventory, relationship meter, faction reputation system, settlement simulation, or relic inventory.

## Setbacks, failure, and recovery

A failed Wheel result does not immediately erase a mission. It adds operational Stress and may produce a party consequence. Repeated setbacks can eventually fail the operation, but source systems remain intact and recoverable.

The player can also order a withdrawal. Withdrawal records a failed/aborted operation and applies bounded aftermath rather than destroying the source world state. Failed or withdrawn operations can be reopened, replanned, and attempted again when no other operation is active.

Important rules:

- one active operation at a time;
- no background mission completion;
- no silent stronghold deletion;
- no instant warfront conquest;
- no arbitrary settlement eradication;
- operation sources may create new future recovery operations after a failed attempt.

## World simulation

V23 participates in the existing V16 world clock.

World ticks can:

- discover newly relevant operations;
- increase urgency of available operations;
- add a small amount of stress to an active operation when strategic pressure persists.

Offline catch-up is capped at six ticks by default. Background catch-up cannot auto-complete an operation.

## Browser experience

The World interface gains an **Operations** tab and a compact **Operations** beacon.

The screen shows:

- active operation and current stage;
- five-stage progress track;
- next compatible Wheel signals;
- operation stress and source stakes;
- available operation cards sorted by urgency;
- planner controls and exact V18 supply cost;
- party availability/refusal reasons;
- selected specialist/faction/relic support;
- resolved operation history.

The UI remains keyboard friendly, responsive, readable without color-only state, and reduced-motion compatible.

## Persistence and migration

`state.v23.schemaVersion` is `23`.

Migration from V22 is idempotent. The first V23 migration ensures the V22 baseline, initializes V23, and discovers initial operation opportunities. Once schema 23 exists, ordinary V23 `ensure()` calls do not replay V16–V22 migrations.

## Fallback-safe runtime

The browser release stack remains:

V16 → V17 → V18 → V19 → V20 → V21 → V22 → V23

If V23 fails to load, bootstrap logs the error and continues as the complete V22 Settlements & Civilian Worlds release.

## PWA safety

The V23 service worker adds V23 CSS/domain/browser assets to the app shell and advances the release cache.

The existing first-install rule is preserved: a brand-new installation does not immediately claim and reload an already-open page. `clients.claim()` is used only when older Multiverse Wheel caches prove this activation is a real update. `SKIP_WAITING` remains explicit.

## Validation

V23 adds:

- `tests/v23.test.js` — domain, migration, integration, bounds, and regression coverage;
- `tests/e2e/v23.spec.js` — Chromium release journeys;
- `tools/validate-v23-content.js` — release wiring/content validation.

All historical tests and validators remain in the release gate. Historical checks may be made forward-compatible when their old version-brand assumptions would incorrectly reject a newer valid release, but their behavioral assertions remain intact.
