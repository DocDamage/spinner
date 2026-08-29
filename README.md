# Multiverse Wheel V21 — Faction Campaigns & Strongholds

A local-first browser/PWA game about forging a custom hero, bending a seeded event wheel with Fate, and writing a persistent multiverse saga alone or with up to ten local/directly connected players. The runtime roster contains 1,326 character profiles.

V21 turns the persistent factions introduced in V16 into a playable strategic layer without replacing the Wheel or duplicating the systems built since V16.

Play the current release at [docdamage.github.io/spinner](https://docdamage.github.io/spinner/).

## Release stack

The modern runtime is deliberately layered and fallback-safe:

- **V16 — Living Multiverse:** persistent universes, six seeded factions, faction power/resources/cohesion/relations, wars, alliances, nemeses, artifact ownership, world memory, collapse/recovery, and bounded offline world simulation.
- **V17 — Reality Rules:** Universe DNA, destinations, secret routes, short faction quests, Favor, travel routes, faction warfronts, and multi-spin Wheel currents.
- **V18 — Multiversal Economy:** the authoritative Credits wallet plus Cosmic Fragments, Salvage, Void Marks, Bounty Seals, markets, equipment, crafting, enchantment, transmutation, contracts, auctions, and artifact evolution.
- **V19 — Party Consequences:** Loyalty, Trust, Respect, Friendship, Rivalry, Fear, Resentment, morale, wounds, scars, reserves, personal quests, betrayal, defection, mentor bonds, faction reactions, and relationship endings.
- **V20 — Relic Bonds & Equipment Mastery:** equipment mastery, signature/awakened gear, equipment sets, faction Regalia, vendor loyalty, relic Bond/Purity/Corruption/personality/attunement/quests, relic disputes, nemesis theft/recovery, and Legacy Convergence.
- **V21 — Faction Campaigns & Strongholds:** membership, rank, Authority, long campaigns, strategic territory/fronts, player strongholds, facilities, specialists, diplomacy, infiltration, sieges, faction-exclusive unlocks, and faction legacy endings.

`js/bootstrap.js` loads these layers in order. If V21 fails to load, the browser logs the failure and continues as V20 instead of taking the game down.

## Run locally

The app has no build step. Serve the repository with a static HTTP server:

```powershell
python -m http.server 8765
```

Then open:

`http://localhost:8765/Multiverse_Wheel_V8_1326_Real_Repo_Images.html`

Serving over HTTP enables installation and offline caching. Opening the HTML directly still runs the local game, but not its service worker.

## V21 Faction Campaigns & Strongholds

### Ownership rules

V21 extends older systems instead of shadowing them:

- V16 remains authoritative for faction identity, reputation, power, resources, cohesion, relations, nemeses, artifact ownership, world history, and world ticks.
- V17 remains authoritative for destinations, route unlocks, Favor, and short faction quests.
- V18 remains authoritative for Credits and all material currencies, equipment inventory, crafting, markets, and artifact evolution.
- V19 remains authoritative for party relationships, wounds, reserves, defections, personal quests, and relationship consequences.
- V20 remains authoritative for equipment mastery, faction Regalia items, signature/awakened gear, relic Bond/Purity/Corruption, relic bearer state, and relic quests.
- V21 stores only the new campaign/strategy layer in `state.v21`.

### Faction membership

Each V16 faction can have a persistent V21 membership record. Status can be neutral, allied, member, infiltrating, expelled, defected, or enemy.

The player may have one primary faction at a time. They can leave active service without erasing history, defect directly to a rival, or maintain a separate infiltration target.

Joining and defection write through to V16 reputation/relations and can trigger V19 party reactions.

### Rank and Authority

V21 has eight faction ranks:

1. Outsider
2. Associate
3. Operative
4. Veteran
5. Captain
6. Commander
7. Champion
8. Regent

Promotion uses campaign contribution XP plus V16 reputation and V21 Authority gates. Repeating trivial events alone cannot skip those gates.

**Authority** is separate from reputation. Reputation answers what the faction thinks of the player; Authority controls what strategic decisions the player can make inside the faction.

Authority is bounded from 0–100 and gates higher-level diplomacy, campaign decisions, stronghold construction, and faction access.

### Long-form campaigns

V21 campaigns are durable strategic arcs that progress through normal Wheel-compatible events rather than a detached minigame.

Current campaign families:

- Border War
- Liberation Campaign
- Relic Crusade
- Succession Crisis
- Reality Stabilization
- Faction Schism

Each campaign has persistent operations, progress, enemy factions, territory context, momentum, a final strategic decision, rewards, consequences, and aftermath.

Rendering the campaign screen does not advance it. Progress comes from deduplicated gameplay events and recognized V17 faction-service completions.

### Territory and frontlines

Territories are built from the existing V17 destination network. A territory stores controller, faction influence, stability, fortification, supply, contest state, campaign linkage, and history.

Hostile V16 relations can produce persistent fronts. Front pressure, supply, and morale move through bounded world ticks. Campaign aftermath and sieges can change control.

Offline simulation may damage strategic position, but it cannot arbitrarily delete a player stronghold or force an unrecoverable campaign finale.

### Strongholds

Player-aligned strongholds are expensive persistent bases built in eligible territory with the real V18 wallet.

Base construction currently requires Operative rank, 10 Authority, friendly/unclaimed eligible territory, and:

- 450 Credits
- 42 Salvage
- 6 Cosmic Fragments

Strongholds track level, integrity, defense, supply, morale, facilities, specialists, siege state, and history.

Occupied bases remain in state and can be recovered through later play; V21 does not permanently erase them during background simulation.

### Facilities

Strongholds support ten upgradeable facilities:

- Command Center — campaign/strategic support
- Forge — V20 equipment/set support
- Relic Vault — relic protection/purification support
- Medical Bay — V19 recovery support
- Training Hall — training/mastery support
- Intelligence Wing — infiltration support
- Portal Nexus — V17 route/travel support
- Quartermaster — supply/economy support
- Embassy — diplomacy support
- Defense Grid — siege/offline defense

Facility construction and upgrades use V18 Credits/materials. Benefits are intentionally bounded so they support the hero rather than replace the Wheel build.

### Specialists and party assignments

Living V19 allies can be temporarily assigned to stronghold roles such as Field Medic, Smith, Diplomat, Intelligence Officer, Portal Engineer, Archivist, or Defense Commander.

Assignments persist, can affect relationships, and do not permanently remove the character from the save. Dead, departed, or defected allies cannot be assigned.

V19 defectors remain the same relationship records and can reappear as faction operatives instead of being cloned into unrelated enemies.

### Diplomacy

Diplomatic actions use the real V16 faction relation matrix:

- propose alliance
- propose ceasefire
- trade resources
- threaten
- betray an agreement

Availability is driven by current relation, Authority, and relevant stronghold support. Invalid proposals spend nothing.

### Infiltration

A hostile faction can be infiltrated through a persistent cover/suspicion/intel record.

Covert operations include reconnaissance, sabotage, plan theft, prisoner rescue, leadership manipulation, and opening stronghold gates.

Outcomes use seeded checks influenced by cover, intel, player skill, suspicion, and Intelligence Wing support. Infiltration is not a pure random button. Exposure can create a persistent V16 counterintelligence nemesis.

### Sieges

Sieges are multi-step strategic events:

1. Preparation
2. Approach
3. Breach / Defense
4. Champion encounter
5. Final decision

Available approaches include direct assault, stealth, sabotage, diplomacy, relic breach, evacuation, surrender, and retreat options. Siege outcomes change stronghold integrity/status and territory control without deleting the base record.

### V19 and V20 integration

Major faction choices can change V19 Trust, Respect, Loyalty, Fear, and Resentment based on faction ethos and ally personality.

Faction progression unlocks the existing V20/V18 equipment path rather than a second inventory. V21 exposes the normal `faction:<id>` Regalia set identity and higher-rank signature/technique access.

Faction relic objectives operate on existing V20 relic records and V16 artifact ownership. Returning, keeping, attuning, purifying, corrupting, destroying, or redirecting a relic can change Bond/Purity/Corruption, ownership, reputation, and faction relations.

### Combat limits

V21 strategic support is deliberately capped:

- campaign/stronghold odds contribution: approximately ±6%
- damage contribution: approximately ±8%

These effects stack with older release systems without becoming the dominant source of combat power.

### UI

Open **World → Factions** for the V21 command surface:

- Overview
- Membership
- Campaign
- Territory
- Strongholds
- Diplomacy

A compact **Faction Command** beacon sits with the Reality/Economy/Party/Legacy status surfaces and shows primary allegiance, rank, Authority, current campaign, front pressure, and urgent stronghold status.

The interface keeps keyboard-friendly controls, text labels in addition to color, mobile layouts, and reduced-motion compatibility.

## Persistence and PWA

V21 migration is idempotent and upgrades V20 saves to schema 21 without rerolling persistent factions or losing V16–V20 relationships.

The service worker cache is `multiverse-wheel-v21-factions-1` and precaches the V21 CSS/domain/browser layers.

The first-install safety rule remains intact: a brand-new service worker installation does **not** immediately claim and reload a live page. Client claiming occurs only when an older Multiverse Wheel cache proves this is a real release update; `SKIP_WAITING` remains explicit.

## Validation

Run the full unit/content/migration gate:

```powershell
npm run validate
```

Run only V21 content validation:

```powershell
npm run validate:v21
```

Run all Chromium browser journeys:

```powershell
npm run test:e2e
```

Run the complete release gate:

```powershell
npm run validate:release
```

The GitHub Actions workflow requires two jobs:

1. **Unit and content validation** — all historical unit tests and V13–V21 validators.
2. **Chromium release journeys** — all historical Playwright journeys plus V21 journeys.

A V21 release should not be merged until both jobs are green on the exact final PR head.

## V21 files

Primary release files:

- `js/domain/v21-engine.js`
- `js/v21-experience.js`
- `styles/v21.css`
- `tests/v21.test.js`
- `tests/e2e/v21.spec.js`
- `tools/validate-v21-content.js`

Release wiring also updates:

- `js/bootstrap.js`
- `sw.js`
- `package.json`
- `package-lock.json`
- `manifest.webmanifest`
- `index.html`

## Previous release documentation

V20 remains fully supported under V21. Its detailed relic/equipment behavior is documented in [docs/V20_RELIC_BONDS.md](docs/V20_RELIC_BONDS.md). Older version documentation and validators remain in the repository and are still part of the release gate.
