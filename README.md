# Multiverse Wheel V18 — Multiversal Economy

A local-first browser game about forging a custom hero, bending a seeded event
wheel with Fate, and writing a connected multiverse saga alone or with up to ten
local or directly connected players. The runtime roster contains 1,326 character
profiles.

V16 made the multiverse persistent. V17 gave each reality unique laws,
destinations, hidden routes, faction operations, and Wheel currents. **V18 makes
those places economically meaningful** with location-specific markets,
equipment, crafting, artifact evolution, auctions, scarcity, and contracts.

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

## V18 Multiversal Economy

- Credits remain the authoritative legacy currency. V18 adds **Cosmic
  Fragments, Salvage, Void Marks, and Bounty Seals** with real sources and sinks.
- The current V17 destination selects the active vendor: Crossroads Exchange,
  Fracture Forge, Faction Quartermaster, Relic Broker, Arena Broker, or the
  Interdimensional Black Market.
- Markets are deterministic per run seed + universe + destination + three-tick
  rotation. Rerendering does not reroll stock.
- Prices react to rarity, vendor type, world threat, corruption, stability,
  demand, and faction reputation inside bounded multipliers.
- Eight rarity tiers are formalized: Common, Uncommon, Rare, Epic, Legendary,
  Mythic, Divine, and Forbidden.
- V18 activates the existing `lootInventory` / `equipment` hooks with Weapon,
  Armor, Focus, and Charm slots. Equipped stat bonuses feed real combat stats;
  equipment tags participate in V17 Universe DNA amplification/suppression.
- Equipment can be bought, sold, equipped, salvaged, enchanted, or transmuted.
  Inventory is capped at 24 gear records.
- Crafting includes portable Field Forge, location-gated Masterwork Forge, and
  Black-Market-only Forbidden Craft. Forbidden gear is cursed and raises local
  corruption.
- Every owned named artifact now receives rarity and persistent evolution data.
  Two artifacts can be fused: the secondary relic is consumed and the primary
  gains an evolution level and bounded deterministic stat growth.
- Artifacts can also be sold for Credits plus some Cosmic Fragments. V16 relic
  ownership state then sees them as no longer owned by the player.
- Hostile encounters, bosses, hazards, rare events, artifact events, and
  training now feed economy rewards without replacing their existing rewards.
- V18 adds commerce/bounty contracts alongside V17 faction quests. Contracts
  cover battles, hazards, travel, relic procurement, purchases, sales, and
  crafting and award Credits/material currencies.
- Every market rotation includes a deterministic sealed auction. Failed bids do
  not charge Credits; winning checks inventory capacity before finalizing.
- The existing World State modal gains an **Economy** tab with wallet, vendor,
  stock, auction, equipment, artifact evolution/fusion, crafting, contracts,
  Bounty Seal exchange, and transaction ledger.
- A compact Economy beacon under the V17 Reality beacon shows Credits,
  materials, vendor, and equipment capacity without adding another top-level
  dashboard.
- V18 state is isolated under `state.v18`, migrates idempotently over V17,
  travels in existing host-authoritative multiplayer snapshots, and is cached
  for offline play.

The [V18 Multiversal Economy guide](docs/V18_MULTIVERSAL_ECONOMY.md) documents
currencies, pricing, vendors, equipment, rarity, crafting, artifact evolution,
contracts, auctions, compatibility, and validation.

## V17 Reality Rules

- Every discovered universe receives deterministic **Universe DNA** from the run
  seed and canonical universe name. Six law axes describe gravity, technology,
  mystic law, time, mortality, and psionics.
- Each reality receives amplified and suppressed power tags that feed real
  battle/hazard probability changes inside safety caps.
- Every universe receives seven deterministic internal destinations: five public
  routes and two hidden routes. Destinations change wheel weighting, faction
  work, hazard severity, strategy modifiers, and now V18 vendor availability.
- Hidden destinations unlock through persistent conditions such as corruption,
  faction trust, a local nemesis, or repeated visits.
- Up to three faction quests can run at once. Rewards include reputation,
  Faction Favor, and universe stability.
- Wheel currents include Reality Storm, Bounty Hunt, Golden Route, Forbidden
  Current, Echo Chain, and ??? Signal.
- Protected first-discovery, boss, scripted story/camp/ending, and Daily
  Challenge wheels remain protected from V17 rewriting.
- The World State modal exposes DNA, Routes, and Quests; the Reality beacon shows
  current laws, route, Wheel current, active faction work, and hidden routes.

The [V17 Reality Rules guide](docs/V17_REALITY_RULES.md) documents the full
rules/destination/faction layer V18 consumes.

## V16 Living Multiverse

- Every completed encounter advances a deterministic world tick. Discovered
  realities persist stability, corruption, threat, collapse state, visits, and
  off-screen events.
- Six seeded factions persist reputation, power, resources, goals, and bilateral
  relations. Wars and alliances alter world pressure.
- Major enemies can become recurring nemeses that level up, hunt routes, and
  directly pressure future matchups.
- Relic ownership persists separately from inventory so artifacts can be lost,
  recovered, traded, and now sold/fused through V18.
- Offline catch-up advances one world tick per 90 minutes away, capped at 12.
- The World panel exposes the multiverse map, world meters, factions, nemeses,
  recent activity, and long memory.

## V15 Hero Ascension

- Cross-device table play connects 2–10 browsers directly with WebRTC while the
  host owns the authoritative timeline/save.
- Every hero starts at Level 1. XP grants core attribute points and gradually
  expands power-source, technique, and transformation capacity.
- Hero Forge includes 12 lineages, 10 callings, 12 backgrounds, 18 skills, six
  point-buy abilities, and deeper identity/story prompts.
- Portable `.mwhero.json` files use checksums and strict creation validation.
- Transformation media uses exact runtime IDs with clearly labeled exact-ID
  fallbacks instead of fuzzy portrait substitution.

## Chronicle Saga

- Local hot-seat and online table play support 1–10 named players, rotating
  captains, and optional council voting.
- The Chronicle War is a ten-chapter saga from **The Hour That Broke** through
  **The Unwritten Horizon**.
- Story scenes offer four authored approaches plus freeform d20 plans.
- Protect, Discover, Connect, and Defy intentions influence Chronicle mechanics,
  factions, and persistent world state.

## Foundation retained from V13

- Title command deck, three save slots, Daily Challenge, challenge codes,
  Archive, Settings, install/update UX, and offline-first shell.
- Fate wheel controls, Build Lab presets/pins/undo/mastery, structured character
  identities/weaknesses, tactical combat, assists/team combos, after-action
  reports, loyalty/callbacks/rivals/endings, share cards, and New Game+.

## Structure

- `styles/app.css`, `styles/v9.css`, `styles/v13.css` through `styles/v18.css` —
  layered shell, Chronicle, progression, Living Multiverse, Reality Rules, and
  economy/crafting presentation.
- `js/data/` — base data, expansions, and mega roster.
- `js/domain/` — independently testable balance, combat, campaign, identity,
  Chronicle, progression, living-world, reality-rule, and economy engines.
- `js/domain/v16-engine.js`, `js/v16-experience.js` — persistent worlds,
  factions, nemeses, relic ownership, memory, and World State UI.
- `js/domain/v17-engine.js`, `js/v17-experience.js` — Universe DNA, branching
  destinations, secret routes, faction operations/Favor, and Wheel currents.
- `js/domain/v18-engine.js` — currencies, rarity, deterministic markets, demand,
  equipment, crafting, artifact evolution/fusion, contracts, auctions, and
  economy migration.
- `js/v18-experience.js` — event income, combat-stat equipment integration,
  market/inventory/crafting UI, artifact trade/fusion, contracts, auctions, and
  the Economy beacon.
- `download_game_assets.py` — staged asset search, scoring, validation,
  provenance, review, and activation.
- `manifest.webmanifest`, `sw.js` — installable offline shell.

Classic scripts remain layered through V15. `js/bootstrap.js` then loads V16,
V17, and V18 in order before constructing the game instance. Each newer layer
has an independent fallback: V18 failure leaves V17 playable, V17 failure leaves
V16 playable, and a V16 failure still starts the older V15-compatible shell.

## Validation

Run all unit, content, migration, syntax/reference, and offline checks:

```powershell
npm run validate
```

Run only the newest validators:

```powershell
npm run validate:v16
npm run validate:v17
npm run validate:v18
```

Run the full release gate, including automated Chromium journeys, keyboard
controls, persistence, and offline reload:

```powershell
npm run validate:release
```

GitHub Actions runs the validation suite and Chromium journeys on pull requests
and pushes to `main`.

Generate deterministic balance reports:

```powershell
npm run analyze:balance
npm run analyze:v13
```

For the detailed alias, generated-identity, and missing-media report:

```powershell
npm run validate:content -- --json
```

State migration is idempotent and marked with schema version 18. Autosaves are
local to the browser; portable JSON backup import/export remains available.
