# Multiverse Wheel V19 — Party Consequences

A local-first browser game about forging a custom hero, bending a seeded event
wheel with Fate, and writing a connected multiverse saga alone or with up to ten
local or directly connected players. The runtime roster contains 1,326 character
profiles.

The release stack now works as one connected simulation:

- **V16 — Living Multiverse:** persistent worlds, factions, nemeses, relic owners,
  long memory, and off-screen evolution.
- **V17 — Reality Rules:** Universe DNA, internal destinations, secret routes,
  faction quests, Favor, and multi-spin Wheel currents.
- **V18 — Multiversal Economy:** location markets, equipment, crafting, auctions,
  contracts, scarcity, and artifact evolution.
- **V19 — Party Consequences:** trust, friendship, rivalry, fear, resentment,
  morale, wounds, scars, reserves, personal quests, betrayal, and relationship
  endings that feed back into combat and the economy.

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

## V19 Party Consequences

V13 already had Loyalty, assist refusal, and possible departures. V19 keeps that
system compatible but turns it into a broader persistent relationship model.

### Seven relationship axes

Every known ally now tracks:

- Loyalty
- Trust
- Respect
- Friendship
- Rivalry
- Fear
- Resentment

Legacy V13 Loyalty remains synchronized with the V19 Loyalty axis. V19 does not
apply the same Loyalty reward twice when an older V13 story/combat hook already
owns that change.

### Deterministic personality and chemistry

Every roster character receives a deterministic personality profile derived from
identity, role, and tags. Personality dimensions include compassion, discipline,
ambition, rebellion, caution, honor, pragmatism, and vengeance.

Every active/reserve pair receives persistent chemistry with compatibility,
Trust, Friendship, Rivalry, and Resentment. Compatibility considers role
diversity, shared universe, tag overlap, and personality distance.

### Morale and real combat effects

Party Morale persists from 0–100. Relationship state now modifies real combat:

- high Morale, Trust, Respect, Friendship, and Duo Bond can improve performance;
- wounds, low morale, and fractured relationships can reduce performance;
- the relationship battle-odds contribution is capped between -9% and +8%;
- relationship damage pressure is capped between -12% and +12%.

### Duo Bond and Resonant Ascension

The strongest active pair becomes the current Duo Bond.

- Bond 70+ improves team-combo pressure.
- Bond 82+ plus Morale 70+ unlocks **Resonant Ascension**.

While Resonant Ascension is active during combat, the hero receives +4 to all
seven core stats and can gain up to +8% relationship-driven damage. This is a
real combat state based on party relationships, not a cosmetic placeholder.

### Assists and refusal

Older V13 Loyalty requirements still apply. V19 adds refusal pressure from:

- critically low Trust or Loyalty;
- high Resentment;
- multiple wounds combined with weak Trust.

High Friendship can reduce assist cost further. Eligibility checks are
side-effect free: merely rendering an assist option cannot increment refusal
history. A refusal is recorded only when the player actually requests the assist.

### Wounds and scars

Losses can create deterministic minor or severe wounds. Boss losses carry a
higher severe-injury risk.

- treatment removes one active wound;
- treatment improves Trust/Friendship and lowers Fear;
- accumulated wounds can convert into persistent scars;
- wounds affect relationship combat performance;
- scars stay in the character's long-term party record.

### Optional permadeath

Permadeath support is included but **off by default**.

With permadeath disabled, catastrophic consequences create severe wounds. With
permadeath enabled, a severe consequence can permanently mark an ally dead,
remove them from active/reserve rosters, lower morale, enter long memory, and
change the relationship ending.

### Active party and reserves

`state.party` remains the active combat party for backward compatibility. V19
adds a persistent reserve roster around it.

Players can bench and reactivate allies without losing:

- relationship axes;
- wounds/scars;
- personal quest progress;
- pair bonds;
- refusal history;
- nemesis targeting state.

The domain also supports temporary guest characters with spin-based expiry.

### Personal quests and mentors

Each ally receives a deterministic personal quest based on role and personality.
Quest families include protection, combat proof, training/research, travel,
relic recovery, and relationship choices. Completion strongly improves Loyalty,
Trust, Respect, and Friendship while reducing Resentment.

Training also records persistent mentor/student lessons with lesson count, Trust,
and Respect.

### Arguments, reconciliation, and taking sides

Low morale plus weak pair compatibility can create deterministic party arguments.
Unresolved incidents appear in the Team screen. The player can:

- reconcile both allies;
- side with the first ally;
- side with the second ally.

Reconciliation restores pair Trust/Friendship, lowers Resentment, and raises
Morale. Taking sides benefits one relationship while straining the other.

### Betrayal and defection

A heavily fractured ally can defect when all of these are true:

- Loyalty below 28;
- Trust below 30;
- Resentment at least 65;
- the seeded betrayal roll triggers.

A defector leaves the active party and can align with the most hostile known V16
faction. The betrayal enters the persistent party memory and affects the ending.

### Faction, nemesis, and market consequences

V19 connects earlier systems instead of building isolated relationship flavor:

- completing V17 faction work can please or anger allies based on faction ethos
  and personality;
- a hunting V16 nemesis can target the ally with the strongest Friendship/Loyalty
  bond;
- V18 market prices receive a bounded party modifier from Trust, Friendship,
  rebellion, and Resentment;
- deterministic party banter changes tone between warm, steady, competitive,
  uneasy, and cold based on current relationships.

### Relationship endings

The original campaign ending remains intact. V19 adds a party epilogue stored in
the recap. Current relationship outcomes include:

- **Found Across Worlds** — surviving allies form a deeply trusted family.
- **The Names They Carry** — multiple permanent deaths define the final memory.
- **The Fractured Alliance** — multiple defections define the route.
- **Rivals to the Horizon** — strong rivalry becomes the surviving bond.
- **The Surviving Company** — mixed/default party outcome.

### Team UI

The Team dashboard now exposes:

- Party Morale;
- active and reserve ally cards;
- all seven relationship axes;
- wounds, scars, refusal count, and nemesis-target state;
- personal quest progress;
- bench/reactivate actions;
- wound treatment;
- unresolved argument choices;
- strongest Duo Bond;
- Resonant Ascension readiness;
- contextual party banter;
- the optional permadeath toggle.

A compact Party beacon sits beneath the Reality/Economy beacons.

The [V19 Party Consequences guide](docs/V19_PARTY_CONSEQUENCES.md) documents the
complete relationship state model, thresholds, integration rules, and validation.

## V18 Multiversal Economy

- Credits remain the authoritative legacy currency; Cosmic Fragments, Salvage,
  Void Marks, and Bounty Seals add specialist resources with real sources/sinks.
- Current V17 destination selects Crossroads Exchange, Fracture Forge, Faction
  Quartermaster, Relic Broker, Arena Broker, or Interdimensional Black Market.
- Deterministic market stock rotates every three V16 world ticks. Prices react to
  rarity, vendor, world pressure, demand, faction reputation, and now bounded
  V19 party reactions.
- Eight rarity tiers: Common, Uncommon, Rare, Epic, Legendary, Mythic, Divine,
  and Forbidden.
- Weapon, Armor, Focus, and Charm equipment changes real combat stats and tags.
- Buy, sell, equip, salvage, enchant, transmute, Field/Masterwork/Forbidden
  crafting, artifact evolution/fusion, sealed auctions, and economy contracts.
- The World State modal includes the Economy tab and a compact Economy beacon.

The [V18 Multiversal Economy guide](docs/V18_MULTIVERSAL_ECONOMY.md) documents
pricing, vendors, equipment, crafting, artifacts, contracts, and auctions.

## V17 Reality Rules

- Every discovered universe receives deterministic Universe DNA with gravity,
  technology, mystic, time, mortality, and psionic laws.
- Each reality receives amplified/suppressed power tags and seven deterministic
  destinations: five public plus two hidden routes.
- Destinations change wheel weighting, hazard/strategy rules, faction work, and
  V18 vendor availability.
- Up to three faction quests can run at once and award Reputation, Favor, and
  stability.
- Wheel currents include Reality Storm, Bounty Hunt, Golden Route, Forbidden
  Current, Echo Chain, and ??? Signal.
- Protected first-discovery, boss, scripted story/camp/ending, and Daily wheels
  remain protected.

The [V17 Reality Rules guide](docs/V17_REALITY_RULES.md) covers this layer.

## V16 Living Multiverse

- Completed encounters advance a deterministic persistent world simulation.
- Realities retain stability, corruption, threat, visits, collapse state, and
  off-screen history.
- Six seeded factions persist goals, power, resources, reputation, and relations.
- Enemies can become recurring nemeses that grow and hunt routes.
- Relic ownership and long memory persist separately from inventory.
- Offline catch-up advances one tick per 90 minutes, capped at 12.
- The World panel exposes map, world meters, factions, nemeses, and memory.

The [V16 Living Multiverse guide](docs/V16_LIVING_MULTIVERSE.md) covers the
persistent simulation foundation.

## V15 Hero Ascension and Chronicle Saga

- Every hero starts at Level 1 and gains XP, core attribute points, power-source
  capacity, techniques, and transformations gradually.
- Hero Forge includes 12 lineages, 10 callings, 12 backgrounds, 18 skills, and
  six point-buy abilities.
- Portable hero files are checksum-validated and deliberately reset progression.
- Cross-device WebRTC table play supports 2–10 browsers with a host-authoritative
  save/timeline.
- Chronicle War is a ten-chapter saga with authored choices and freeform d20
  plans; Protect/Discover/Connect/Defy intentions feed later systems.

The [Chronicle Saga guide](docs/CHRONICLE_SAGA.md) covers story and multiplayer.

## Foundation retained from V13

The current game still retains title/setup flow, three save slots, Daily
Challenge, challenge codes, Archive, Settings, Fate controls, Build Lab,
structured character identities/weaknesses, tactical combat, assists/team combos,
after-action reports, callbacks/rivals/endings, share cards, New Game+, and the
offline-first install/update shell.

## Structure

- `styles/app.css`, `styles/v9.css`, `styles/v13.css` through `styles/v19.css` —
  layered shell, Chronicle, progression, Living Multiverse, Reality Rules,
  Economy, and Party presentation.
- `js/data/` — base data, expansions, and mega roster.
- `js/domain/v16-engine.js` — persistent worlds, factions, nemeses, relic owners,
  memory, and world pressure.
- `js/domain/v17-engine.js` — Universe DNA, routes, faction operations/Favor,
  secret gates, and Wheel currents.
- `js/domain/v18-engine.js` — currencies, markets, rarity, equipment, crafting,
  artifact evolution/fusion, contracts, and auctions.
- `js/domain/v19-engine.js` — relationship axes, personality, pair bonds, morale,
  wounds/scars, reserves, guests, personal quests, incidents, defection,
  permadeath, nemesis/faction/economy reactions, and party endings.
- `js/v19-experience.js` — combat/story/team integration and Party UI.
- `js/v19-hardening.js` — legacy Loyalty single-sourcing, side-effect-free assist
  probes, personal-quest outcome rules, and missing V13 arc migration.
- `manifest.webmanifest`, `sw.js` — installable offline shell.

Classic scripts remain layered through V15. `js/bootstrap.js` then loads V16 →
V17 → V18 → V19 before constructing the game instance. Every new layer has an
independent fallback, so a V19 load failure still leaves V18 playable.

## Validation

Run all unit, content, migration, syntax/reference, and offline checks:

```powershell
npm run validate
```

Run individual modern release validators:

```powershell
npm run validate:v16
npm run validate:v17
npm run validate:v18
npm run validate:v19
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

State migration is idempotent and marked with schema version 19. Autosaves are
local to the browser; portable JSON backup import/export remains available.
