# Multiverse Wheel V20 — Relic Bonds & Equipment Mastery

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
- **V20 — Relic Bonds & Equipment Mastery:** equipment mastery, 2/4-piece sets,
  faction Regalia, signature/awakened gear, relic personalities and quests,
  attunement, purity/corruption, nemesis theft/recovery, vendor loyalty, and the
  combined Legacy Convergence transformation.

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

## V20 Relic Bonds & Equipment Mastery

V20 upgrades the existing V18 inventory rather than creating a second gear
system. `state.lootInventory`, `state.equipment`, `state.artifacts`, V18
currencies, and V18 artifact evolution remain authoritative; V20 adds persistent
identity, mastery, bond, ownership-consequence, and narrative state around them.

### Equipment mastery

Every V18 equipment item receives a persistent mastery record. Equipped items
gain mastery XP from play, weighted toward combat and bosses. Mastery progresses
from Level 1 through Level 10 and adds incremental bonuses to stats the item
already supports.

Readable mastery ranks are Initiate, Familiar, Veteran, Masterwork, Signature,
and Ascendant.

- Mastery Level 6 unlocks persistent signature naming.
- Mastery Level 10 awakens the equipment.
- Mastery survives equip/unequip, enchantment, reforging, save/load, and normal
  inventory use.

### Equipment sets and Legacy Forge

V20 ships five core equipment set families:

- **Rift Vanguard** — assault and mobility.
- **Paradox Savant** — mind, energy, and hax.
- **World Warden** — defense and stability.
- **Starbound Hunter** — speed and precision.
- **Void Covenant** — forbidden power.

Matching equipped pieces activate real 2-piece and 4-piece bonuses without
re-adding the underlying V18 item stats.

The Economy tab now includes a Legacy Forge that creates normal V18 Weapon,
Armor, Focus, and Charm records using existing Salvage, Cosmic Fragments, and
Void Marks. Existing items can also be reforged into an unlocked set while
keeping their underlying bonuses and enchantment state.

### Faction Regalia

A V16 faction with Reputation 35+ can unlock a generated Regalia equipment set.
Its bonuses derive from faction ethos:

- Mercy → Defense / Mind
- Knowledge → Mind / Hax
- Freedom → Speed / Skill
- Order → Defense / Might
- Balance → Energy / Mind
- Ambition → Might / Hax

Faction loyalty therefore feeds equipment progression instead of ending at a
reputation number.

### Relic personalities and quests

Every owned artifact receives one deterministic persistent personality:

- Guardian
- Seeker
- Sovereign
- Trickster
- Sage
- Avenger

Each relic tracks Bond, Purity, Corruption, bearer, awakening, a personality-
specific quest, ownership status, nemesis thief/world, party claims, and history.

Relic quest families include protection, discovery, worthy victories, rule-
breaking survival, teaching/learning, and vengeance. Quest completion increases
Bond and Purity and can satisfy part of the awakening requirement.

### Attunement and relationship resonance

A relic can attune to the hero or a party member. Ally attunement requires V19
Trust 40+, and strong Trust/Friendship with the bearer amplifies the relic's
favored stat resonance.

This uses V19's existing relationship axes; V20 does not introduce a duplicate
ally-approval score.

### Relic awakening

A relic can awaken when it reaches:

- Bond 80+;
- Purity 55+;
- and either its relic quest is complete or V18 artifact evolution is Level 4+.

Awakened relics provide stronger favored-stat resonance and become part of V20
ending consequences.

### Purity, corruption, and temptation

Corruption is an intentional power-versus-consequence system.

The player can embrace a relic's temptation to gain Bond faster and eventually
more Hax pressure at the cost of Purity and defensive stability. Purification
spends existing V18 Cosmic Fragments and Salvage to lower Corruption, restore
Purity, and reinforce the bond.

### Nemesis theft and recovery

V20 finally makes V16's persistent relic ownership system directly playable.
A recurring nemesis can steal a bonded relic after eligible battle/boss losses.

A theft:

- removes the relic from `state.artifacts`;
- snapshots its V18 evolution state;
- records the thief and last known world;
- adds the relic to the nemesis `stolenArtifacts` list;
- changes `state.v16.artifactOwners` to nemesis ownership;
- enters Chronicle and long memory.

Defeating that nemesis recovers the relic, restores its V18 evolution state, and
returns V16 ownership to the player.

### Party relic claims

Relics can create disputes between sufficiently respected party members. The
player chooses which ally carries the relic. The winner gains Trust/Respect;
the losing claimant can gain Resentment. The outcome feeds directly into V19
relationships and therefore can later affect assists, morale, betrayal, and
endings.

### Vendor loyalty

V20 adds persistent loyalty per V18 market location. Purchases, sales, crafting,
enchantment, and transmutation build Vendor Rank 0–5.

Vendor loyalty changes the real V18 offer price returned to the existing shop
and is capped, with faction influence, at a 14% discount. There is still one
shop, one wallet, and one transaction ledger.

### Legacy Convergence

V20 adds a combined transformation that requires progress across both V19 and
V20.

**Legacy Convergence** requires:

- at least one owned, awakened, attuned relic;
- Party Morale 75+;
- strongest V19 Duo Bond 82+.

During Battle/Boss combat, Legacy Convergence adds +2 to all seven core stats.
It stacks with V19 Resonant Ascension (+4 all stats), producing a verified +6
all-stat live transformation delta when both states are active.

### Relic/equipment endings

The main campaign ending and V19 party epilogue remain intact. V20 adds another
recap layer based on the inventory legacy:

- **The Relics Still Call** — bonded relics remain in enemy hands.
- **Crowned by Ruin** — corruption defines the legacy.
- **The Living Armory** — awakened relics plus signature equipment survive as a
  major legacy.
- **The Relic Remembers** — an awakened relic carries the timeline forward.
- **Tools of the Road** — gear mattered without becoming destiny.

### V20 UI

The V18 Economy tab remains the single inventory surface and now includes:

- Relic Mastery beacon;
- Vendor Rank and live discount;
- active 2/4-piece set summary;
- Legacy Forge;
- gear mastery XP/rank;
- signature naming;
- set reforging;
- Bond / Purity / Corruption bars;
- relic personality and quest;
- hero/ally attunement;
- purification and temptation controls;
- stolen relic tracking;
- party relic claim decisions;
- Legacy Convergence readiness;
- Relic & Equipment Chronicle.

The [V20 Relic Bonds & Equipment Mastery guide](docs/V20_RELIC_BONDS.md)
documents state ownership, thresholds, economy/relationship integration, theft,
awakening, offline behavior, and release validation.

## V19 Party Consequences

V13 already had Loyalty, assist refusal, and possible departures. V19 keeps that
system compatible but turns it into a broader persistent relationship model.

### Seven relationship axes

Every known ally tracks Loyalty, Trust, Respect, Friendship, Rivalry, Fear, and
Resentment. Legacy V13 Loyalty remains synchronized with V19 instead of being
applied twice.

### Deterministic personality and chemistry

Every roster character receives a deterministic personality profile derived from
identity, role, and tags. Every active/reserve pair receives persistent
compatibility, Trust, Friendship, Rivalry, and Resentment.

### Morale and combat effects

Party Morale persists from 0–100. Relationships affect real combat with bounded
battle-odds (-9% to +8%) and damage (-12% to +12%) contributions.

### Duo Bond and Resonant Ascension

The strongest active pair becomes the Duo Bond. Bond 70+ improves team-combo
pressure. Bond 82+ plus Morale 70+ unlocks **Resonant Ascension**, which adds +4
to all seven core stats during combat and up to +8% relationship-driven damage.

### Assists, wounds, and reserves

Low Trust/Loyalty, high Resentment, and accumulated injuries can cause assist
refusal. High Friendship can reduce assist cost. Wounds can become scars;
treatment changes relationships. `state.party` remains the active combat team
and V19 adds persistent reserves around it.

### Optional permadeath, conflict, and defection

Permadeath is off by default. Low Morale and weak chemistry can trigger arguments
that support reconciliation or taking sides. Deeply fractured allies can defect
toward hostile V16 factions.

### Personal quests and endings

Allies receive deterministic personal quests and persistent mentor bonds. V19
adds party endings including Found Across Worlds, The Names They Carry, The
Fractured Alliance, Rivals to the Horizon, and The Surviving Company.

The [V19 Party Consequences guide](docs/V19_PARTY_CONSEQUENCES.md) documents the
complete relationship state model, thresholds, integration rules, and validation.

## V18 Multiversal Economy

- Credits remain the authoritative legacy currency; Cosmic Fragments, Salvage,
  Void Marks, and Bounty Seals add specialist resources with real sources/sinks.
- Current V17 destination selects Crossroads Exchange, Fracture Forge, Faction
  Quartermaster, Relic Broker, Arena Broker, or Interdimensional Black Market.
- Deterministic market stock rotates every three V16 world ticks. Prices react to
  rarity, vendor, world pressure, demand, faction reputation, V19 party reactions,
  and now V20 vendor loyalty.
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

- `styles/app.css`, `styles/v9.css`, `styles/v13.css` through `styles/v20.css` —
  layered shell, Chronicle, progression, Living Multiverse, Reality Rules,
  Economy, Party, and Relic Mastery presentation.
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
- `js/domain/v20-engine.js` — equipment mastery/sets, signature gear, relic
  personalities/bonds/quests/corruption, vendor loyalty, nemesis theft/recovery,
  party claims, Legacy Convergence, Chronicle, and V20 epilogues.
- `js/v19-experience.js` / `js/v19-hardening.js` — V19 gameplay integration and
  compatibility hardening.
- `js/v20-experience.js` — V20 combat/economy/ending integration and UI.
- `manifest.webmanifest`, `sw.js` — installable offline shell.

Classic scripts remain layered through V15. `js/bootstrap.js` then loads V16 →
V17 → V18 → V19 → V20 before constructing the game instance. Every new layer
has an independent fallback, so a V20 load failure still leaves V19 playable.

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
npm run validate:v20
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

State migration is idempotent and marked with schema version 20. Autosaves are
local to the browser; portable JSON backup import/export remains available.
