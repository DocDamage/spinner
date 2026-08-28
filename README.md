# Multiverse Wheel V17 — Reality Rules

A local-first browser game about forging a custom hero, bending a seeded event
wheel with Fate, and writing a connected multiverse saga alone or with up to ten
local or directly connected players. The runtime roster contains 1,326 character
profiles.

V17 builds on the V16 Living Multiverse by giving every discovered reality its
own deterministic laws, internal destinations, faction operations, hidden
routes, and multi-spin Wheel currents.

Play the current release at
[docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Run locally

The app has no build step. Serve the repository with a static HTTP server:

```powershell
python -m http.server 8765
```

Open
`http://localhost:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html`.
Serving over HTTP also enables installation and offline caching; opening the
HTML directly still supports the local game but not its service worker.

## V17 Reality Rules

- Every discovered universe receives deterministic **Universe DNA** from the run
  seed and canonical universe name. Six law axes describe gravity, technology,
  mystic law, time, mortality, and psionics.
- Each reality also receives amplified and suppressed power tags. Local laws and
  the active build feed real battle/hazard probability changes inside hard
  safety caps; the system does not reduce matchups to automatic wins/losses.
- Every universe receives seven deterministic internal destinations: five public
  routes and two hidden routes. Destinations change wheel weighting, preferred
  faction work, hazard severity, and/or strategy modifiers.
- Hidden destinations can unlock through persistent world conditions such as
  high corruption, faction trust, a local nemesis, or repeated visits. Favor can
  also reveal a still-hidden route.
- Factions now offer persistent operations. Up to three faction quests can be
  active at once, with event-driven progress for battle wins, hazards, artifacts,
  recruitment, rare anomalies, training, Chronicle decisions, and travel.
- Quest rewards include faction reputation, **Faction Favor**, and universe
  stability. Favor can currently stabilize a world, reveal a hidden route, or
  soften a hostile faction relation.
- The Wheel can enter bounded multi-spin currents: **Reality Storm, Bounty Hunt,
  Golden Route, Forbidden Current, Echo Chain,** and **??? Signal**.
- Current effects can change event density, hazard pressure, repeat prior event
  pressure, or hide real wheel slices as `???` until they land. Hidden slices
  retain their real payload and reveal normally on resolution.
- Protected first-discovery, boss, scripted story/camp/ending, and Daily
  Challenge wheels are not rewritten by V17. Existing Fate controls remain
  authoritative after wheel generation.
- The V16 World State modal now includes **DNA**, **Routes**, and **Quests** tabs.
  A compact Reality beacon under the build rail shows the current universe,
  destination, key laws, Wheel current, active quest count, total Favor, and
  hidden-route discoveries.
- V17 state is isolated under `state.v17`, migrates idempotently on top of V16,
  participates in existing host-authoritative multiplayer snapshots, and is
  precached for offline play.

The [V17 Reality Rules guide](docs/V17_REALITY_RULES.md) documents the state
model, Universe DNA, destinations, secret-route conditions, faction quests,
Favor economy, Wheel currents, compatibility rules, and validation.

## V16 Living Multiverse

- Every completed encounter advances a deterministic world tick derived from the
  run seed. Discovered realities persist stability, corruption, threat, collapse
  state, visit history, and off-screen events.
- Six seeded factions maintain goals, ethos, reputation, power, resources, and
  bilateral relations. Chronicle intentions influence faction reputation while
  wars and alliances alter world pressure.
- Major losses can promote enemies into recurring nemeses. Nemeses remember the
  cause, gain levels off-screen, hunt routes, and directly pressure future
  matchups. Tactical-combat knockouts and quick/legacy battles share the same
  persistent nemesis rules.
- Relic ownership is tracked separately from player inventory. Lost artifacts
  remain part of world state and can later change hands.
- Offline catch-up advances one world tick per 90 minutes away, capped at 12
  ticks per load so absence creates history without unbounded run destruction.
- The **WORLD** panel exposes the discovered-reality map, travel focus, world
  meters, faction state, nemesis dossiers, and long-memory timeline.
- Stability, corruption, faction reputation, and nemesis pressure feed back into
  battle probability and eligible hazard pressure within safety caps.

The [V16 Living Multiverse guide](docs/V16_LIVING_MULTIVERSE.md) documents the
simulation and compatibility foundation V17 extends.

## V15 Hero Ascension

- Cross-device table play connects 2–10 browsers directly with WebRTC. The host
  owns the authoritative timeline and save.
- Every hero starts at Level 1. Encounters and victories award XP; levels grant
  core attribute points and progressively unlock additional active power sources,
  techniques, and transformations.
- The Hero Forge includes 12 lineages, 10 callings, 12 backgrounds, 18 skills,
  six point-buy abilities, and deeper identity/story prompts.
- Portable `.mwhero.json` files use checksums and strict creation validation;
  imports deliberately return to Level 1 without carrying progression or copied
  rewards.
- Transformation media uses exact runtime IDs. Verified exact art wins; missing
  art renders a clearly labeled exact-ID card instead of borrowing a fuzzy
  portrait.

## Chronicle Saga

- Local hot-seat and online table play support 1–10 named players, rotating
  captains, and optional private council voting.
- The Chronicle War is a ten-chapter time-fracture saga from **The Hour That
  Broke** through **The Unwritten Horizon**.
- Every story scene offers four authored approaches plus a freeform d20 plan.
- Player intent — Protect, Discover, Connect, or Defy — remains visible and now
  influences both Chronicle mechanics and the persistent faction/world layers.
- Character sheets include Armor, Initiative, Resolve, passive perception,
  trained skills, stat mapping, roleplay anchors, and a seven-axis constellation.

The [Chronicle Saga guide](docs/CHRONICLE_SAGA.md) and
[asset pipeline guide](docs/ASSET_PIPELINE.md) cover story/creator behavior and
safe media acquisition respectively.

## Foundation retained from V13

- Title command deck with Continue, three-step New Timeline setup, Daily
  Challenge, three save slots, challenge codes, Archive, and Settings.
- Condensed Play view with objective, wheel, event, hero/build/party/Fate rail,
  and the full dashboard one button away.
- Fate can lock/favor/ban before eligible spins and nudge/reroll after landing;
  protected route beats remain protected.
- Deterministic character roles, passives, ultimates, generated move sets, and
  structured weaknesses with authored overrides.
- Build Lab capacity/synergy, presets, pins, undo, reward comparisons, and
  mastery branches.
- Tactical battles with Quick Resolve, exploit windows, assists, team combos,
  adaptive enemy plans, boss rules, and after-action reports.
- Loyalty, universe event packs, callbacks, rival outcomes, named endings,
  chronological recap, share cards, New Game+, and Daily personal bests.

## Structure

- `styles/app.css`, `styles/v9.css`, `styles/v13.css`, `styles/v14.css`,
  `styles/v15.css`, `styles/v16.css`, `styles/v17.css` — layered game, Chronicle,
  progression, multiplayer, Living Multiverse, and Reality Rules presentation.
- `js/data/` — base data, expansions, and mega roster.
- `js/domain/` — independently testable balance, combat, campaign, save,
  identity, Chronicle, Hero Ascension, Living Multiverse, and Reality Rules
  engines.
- `js/ui/` — escaped templates and keyboard/focus controllers.
- `js/core.js` through `js/v12-command-center.js` — original simulator layers
  retained for compatibility.
- `js/v13-foundation.js` — schema migration, canonicalization, save slots, Daily,
  and challenge starts.
- `js/v13-shell.js` — title/setup flow and condensed play shell.
- `js/v13-agency.js` — Fate, presets, pins, undo, mastery, and build identity.
- `js/v13-combat.js` — tactical combat experience and after-action reports.
- `js/v13-narrative.js` — loyalty, universe packs, callbacks, rival resolution,
  endings, recap, and share-card generation.
- `js/v13-replay.js` — Daily records, New Game+, install/update UX, and campaign
  hardening.
- `js/domain/v14-engine.js`, `js/v14-experience.js` — creator, multiplayer,
  Chronicle choices, d20 plans, and asset integration.
- `js/domain/v15-engine.js`, `js/v15-experience.js` — Level 1 progression,
  portable heroes, exact transformation media, and WebRTC table play.
- `js/domain/v16-engine.js`, `js/v16-experience.js` — living worlds, factions,
  nemeses, relic ownership, long memory, offline evolution, and World State UI.
- `js/domain/v17-engine.js` — deterministic Universe DNA, branching routes,
  secret-route gates, faction operations/Favor, and Wheel-current rules.
- `js/v17-experience.js` — battle/hazard integration, wheel mutation/reveal,
  destination travel, quest progression, Reality beacon, and World tabs.
- `download_game_assets.py` — staged asset search, scoring, validation,
  provenance, review, and activation.
- `manifest.webmanifest`, `sw.js` — installable offline shell.

Classic scripts remain layered through V15. `js/bootstrap.js` loads V16 and then
V17 before constructing the game instance. V17 has an independent fallback: if
it fails to load, V16 remains playable; if V16 fails, the older V15-compatible
shell still starts.

## Validation

Run all unit, content, migration, syntax/reference, and offline checks:

```powershell
npm run validate
```

Run only the newest validators:

```powershell
npm run validate:v16
npm run validate:v17
```

Run the full release gate, including automated Chromium desktop/mobile journeys,
keyboard controls, persistence, and offline reload:

```powershell
npm run validate:release
```

Generate deterministic balance reports:

```powershell
npm run analyze:balance
npm run analyze:v13
```

For the detailed alias, generated-identity, and missing-media report:

```powershell
npm run validate:content -- --json
```

State migration is idempotent and marked with schema version 17. Autosaves are
local to the browser; portable JSON backup import/export remains available.
