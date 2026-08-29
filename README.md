# Multiverse Wheel V24 — Multiverse Activities & Competition Circuits

A local-first browser/PWA game about forging a custom hero through a persistent multiverse built around a seeded event Wheel. The runtime roster contains 1,326 character profiles.

V24 adds persistent **races, tournaments, trials, hunts, rescue drills, community cups, stronghold games, and faction competition** without turning Multiverse Wheel into a collection of detached minigames. Every activity progresses through ordinary Wheel outcomes.

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
- **V24 — Multiverse Activities & Competition Circuits:** persistent races, tournaments, trials, hunts, and hosted events with entry planning, four-segment Wheel progression, deterministic placement, Circuit Score, and cross-system consequences.

`js/bootstrap.js` loads these layers in order. If V24 fails, the game remains fully playable as V23.

## V24 highlights

V24 ships with twelve activity families:

- Speed Race
- Portal Rally
- Combat Tournament
- Arena Exhibition
- Survival Gauntlet
- Relic Trial
- Treasure Hunt
- Bounty Pursuit
- Rescue Drill
- Civilian Cup
- Stronghold Games
- Faction Grand Prix

### Races are real persistent activities

Speed Race and Portal Rally have named race segments, live score, deterministic opposition, entry fees, final placement, standings, and history. They use normal Wheel signals rather than a separate steering/physics minigame.

### Tournaments reuse real combat

Combat Tournament and Arena Exhibition use existing battle and boss outcomes. V24 does not add a second combat resolver.

### Existing systems stay authoritative

- V18 Credits pay entry fees and existing V18 resources pay purses.
- V19 companions can participate and react through existing relationship axes.
- V20 relic support can gain bounded existing Bond on top finishes.
- V21 factions and strongholds can host events and receive bounded existing benefits.
- V22 settlements can host community events and receive bounded morale/opinion benefits.
- V23 operations and V24 activities are mutually exclusive so one Wheel outcome cannot silently progress both.

Circuit Score is **non-spendable** ranking state. V24 introduces no new wallet, shop, inventory, approval meter, combat engine, or city-builder.

## UI

Open **World → Activities** to view the current circuit. The screen exposes:

- active event and four-segment progress;
- live score and setbacks;
- next compatible Wheel signals;
- available events with venue, difficulty, and heat;
- exact V18 Credit entry fee and prize purse;
- competition style;
- optional V19 companion;
- optional V20 relic support;
- Circuit Score/tier;
- recent placements and rewards.

A compact **Activity Circuit** beacon sits alongside Reality, Economy, Party, Legacy, Faction Command, Civilians, and Operations surfaces.

## Persistence and PWA

V24 uses schema `24`. Migration from V23 is idempotent and ordinary V24 `ensure()` calls do not replay older migrations after schema 24 is established.

The service worker advances to a V24 activity cache and precaches the V24 CSS/domain/browser layers while preserving first-install claim safety and explicit `SKIP_WAITING` behavior.

## Validation

Run the full unit/content gate:

```powershell
npm run validate
```

Run V24 content validation:

```powershell
npm run validate:v24
```

Run all Chromium journeys:

```powershell
npm run test:e2e
```

Run the complete local release gate:

```powershell
npm run validate:release
```

GitHub Actions must pass both required jobs on the exact authoritative `main` commit:

1. **Unit and content validation**
2. **Chromium release journeys**

## V24 primary files

- `js/domain/v24-engine.js`
- `js/v24-experience.js`
- `styles/v24.css`
- `tests/v24.test.js`
- `tests/e2e/v24.spec.js`
- `tools/validate-v24-content.js`
- `docs/V24_MULTIVERSE_ACTIVITIES_COMPETITION_CIRCUITS.md`

Release wiring also updates `js/bootstrap.js`, `sw.js`, `package.json`, `package-lock.json`, `manifest.webmanifest`, `index.html`, and this README.
