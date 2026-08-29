# Multiverse Wheel V22 — Settlements & Civilian Worlds

A local-first browser/PWA game about forging a custom hero, bending a seeded event wheel with Fate, and writing a persistent multiverse saga alone or with up to ten local/directly connected players. The runtime roster contains 1,326 character profiles.

V22 adds civilian populations, refugees, rebuilding, sanctuaries, public opinion, and local recovery to the persistent worlds and faction conflicts established in V16–V21. The Wheel remains the center of play.

Play the current release at [docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Release stack

The modern runtime is deliberately layered and fallback-safe:

- **V16 — Living Multiverse:** persistent universes, factions, relations, wars, alliances, nemeses, artifact ownership, world memory, collapse/recovery, and bounded offline world simulation.
- **V17 — Reality Rules:** Universe DNA, destinations, secret routes, faction work, Favor, travel routes, and multi-spin Wheel currents.
- **V18 — Multiversal Economy:** authoritative Credits/material wallets, markets, equipment, crafting, enchantment, transmutation, contracts, auctions, and artifact evolution.
- **V19 — Party Consequences:** Loyalty, Trust, Respect, Friendship, Rivalry, Fear, Resentment, morale, wounds, scars, reserves, personal quests, betrayal, defection, mentorship, and relationship endings.
- **V20 — Relic Bonds & Equipment Mastery:** mastery, signature/awakened gear, equipment sets, faction Regalia, vendor loyalty, relic Bond/Purity/Corruption, attunement, relic quests, disputes, nemesis theft/recovery, and Legacy Convergence.
- **V21 — Faction Campaigns & Strongholds:** membership, rank, Authority, long campaigns, strategic territory/fronts, strongholds, facilities, specialists, diplomacy, infiltration, sieges, faction-exclusive unlocks, and faction legacy endings.
- **V22 — Settlements & Civilian Worlds:** persistent civilian populations, displacement/refugees, civilian needs, Wheel-driven relief requests, rebuilding, sanctuaries, public opinion, bounded local market pressure, and civilian legacy endings.

`js/bootstrap.js` loads these layers in order. If V22 fails, the browser logs the failure and continues as the complete V21 game.

## Run locally

The app has no build step. Serve the repository with a static HTTP server:

```powershell
python -m http.server 8765
```

Then open:

`http://localhost:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html`

Serving over HTTP enables installation and offline caching. Opening the HTML directly still runs the local game, but not its service worker.

## V22 Settlements & Civilian Worlds

### Ownership rules

V22 extends older systems instead of duplicating them:

- V16 remains authoritative for worlds, threat, corruption, stability, factions, nemeses, memory, and world ticks.
- V17 remains authoritative for destinations, routes, Favor, and short faction work.
- V18 remains authoritative for Credits/materials, markets, equipment, crafting, and artifact evolution.
- V19 remains authoritative for party relationships and relationship consequences.
- V20 remains authoritative for equipment mastery and relic relationships.
- V21 remains authoritative for faction membership, campaigns, territory control, strongholds, facilities, specialists, diplomacy, infiltration, and sieges.
- V22 stores only civilian settlement, displacement, sanctuary, relief-request, public-opinion, and recovery state in `state.v22`.

### Civilian populations

Every persistent V21 territory receives one deterministic V22 settlement. Existing settlements are never rerolled by migration or rendering.

Settlements track:

- resident population;
- displaced population;
- food;
- housing;
- health;
- security;
- prosperity;
- morale;
- infrastructure;
- player public opinion;
- active civilian request;
- recovery history.

All settlement metrics are bounded.

### Strategic pressure and refugees

Civilian pressure is derived from the systems already driving the world:

- contested V21 territory;
- V21 front pressure;
- V21 stronghold sieges;
- V16 threat;
- V16 corruption;
- local territory stability and supply.

High pressure can create refugees and damage civilian conditions. Safer worlds gradually recover.

Background simulation is capped and cannot silently delete a settlement or reduce an inhabited settlement below its protected civilian floor.

### Civilian requests through the Wheel

Settlements generate persistent requests from their strongest current need:

- Refugee Influx;
- Food Shortage;
- Housing Crisis;
- Medical Emergency;
- Civilian Security;
- Infrastructure Damage;
- Local Economy Shock.

Requests progress from normal Wheel-compatible results such as Recovery, Travel, Recruit, Training, Battle, Boss, Artifact, Rare, and recognized faction service.

The request system provides long-term context around ordinary play rather than a detached minigame.

### Relief actions

Direct relief uses the authoritative V18 wallet:

- **Emergency Aid** — improves food, health, morale, prosperity, and public opinion.
- **Rebuild District** — improves infrastructure, housing, prosperity, and morale.
- **Medical Relief** — improves health and morale.
- **Open Relief Route** — improves food, security, prosperity, and access.
- **Resettle Refugees** — returns displaced residents to a community when there is room.

There is no civilian currency and no second shop.

Successful relief can also feed V19 Trust, Respect, Friendship, and Resentment through the existing relationship engine.

### Sanctuaries

A safe player-aligned V21 stronghold can open a V22 sanctuary.

The stronghold stays a V21 faction base. The sanctuary adds only civilian state:

- capacity;
- refugee residents;
- safety;
- stockpile;
- morale;
- history.

Construction and resupply spend V18 resources. Refugees transfer gradually during world ticks and cannot exceed sanctuary capacity.

### Public opinion

Each settlement tracks player public opinion from -100 to 100.

Relief, completed requests, and sanctuary work improve public opinion. This is civilian sentiment, not a replacement for V16 faction reputation.

### Local economy pressure

V22 modifies the existing V18 market price path instead of creating another economy.

Civilian prosperity, security, and public opinion contribute a bounded local modifier of approximately **-6% to +8%**. Existing V18 scarcity, V20 vendor loyalty, and faction modifiers remain authoritative.

### Civilian endings

V22 adds a civilian epilogue layer without replacing earlier endings. Possible outcomes include:

- **The Doors Stayed Open** — a durable sanctuary network resettled large numbers of refugees.
- **Worlds Worth Saving** — broad civilian recovery produced healthy, secure, prosperous worlds.
- **Caravans Between Stars** — major displacement remains part of the post-campaign multiverse.
- **People in the Margins** — civilian survival remains part of the Chronicle even without a perfect recovery.

## UI

Open **World → Civilians** for:

- total civilian population;
- displaced population;
- average health/security/prosperity/morale;
- current settlement needs;
- active Wheel-driven civilian request;
- direct relief actions and costs;
- sanctuary construction/resupply;
- all discovered settlements;
- local V18 market pressure.

A compact **Civilians** beacon appears with Reality, Economy, Party, Legacy, and Faction Command status surfaces.

## Persistence and PWA

V22 migration is idempotent and upgrades V21 saves without rerolling V16–V21 state.

The service worker cache is `multiverse-wheel-v22-civilian-1` and precaches the V22 CSS/domain/browser layers.

The first-install safety rule remains intact: a brand-new service worker does not immediately claim and reload a live page. Client claiming occurs only when an older Multiverse Wheel cache proves this is a release upgrade; `SKIP_WAITING` remains explicit.

## Validation

Run the full unit/content/migration gate:

```powershell
npm run validate
```

Run only V22 content validation:

```powershell
npm run validate:v22
```

Run all Chromium browser journeys:

```powershell
npm run test:e2e
```

Run the complete release gate:

```powershell
npm run validate:release
```

GitHub Actions runs two required jobs on pushes to `main`:

1. **Unit and content validation** — all historical tests and V13–V22 validators.
2. **Chromium release journeys** — all historical Playwright journeys plus V22 journeys.

V22 is considered complete only when both jobs are green on the exact `main` commit.

## V22 files

Primary release files:

- `js/domain/v22-engine.js`
- `js/v22-experience.js`
- `styles/v22.css`
- `tests/v22.test.js`
- `tests/e2e/v22.spec.js`
- `tools/validate-v22-content.js`
- `docs/V22_SETTLEMENTS_CIVILIAN_WORLDS.md`

Release wiring also updates:

- `js/bootstrap.js`
- `sw.js`
- `package.json`
- `package-lock.json`
- `manifest.webmanifest`
- `index.html`
- `tools/validate-v21-content.js` (forward-compatible release branding checks)

## Scope boundary

V22 is not a city builder, 4X game, tactical RTS, second economy, or replacement for V16/V21 strategy.

The Wheel remains the core game. Civilian systems add stakes, consequences, recovery, and long-term reasons to care about the worlds affected by normal play.

See [`docs/V22_SETTLEMENTS_CIVILIAN_WORLDS.md`](docs/V22_SETTLEMENTS_CIVILIAN_WORLDS.md) for the complete release design.
