# V20 — Relic Bonds & Equipment Mastery

V20 makes the equipment and artifact systems part of the persistent narrative simulation rather than a collection of flat bonuses. It builds directly on V16 world ownership, V18 economy/crafting, and V19 party relationships without replacing any of those systems.

## Release goals

V20 has five primary goals:

1. Make equipped gear improve through use rather than only through purchases and enchantment.
2. Give matching equipment pieces meaningful 2-piece and 4-piece identities.
3. Turn artifacts into persistent relic relationships with personalities, bearers, quests, purity, corruption, awakening, theft, and recovery.
4. Connect gear/relic progression to existing factions, vendors, nemeses, party relationships, Chronicle memory, combat, and endings.
5. Keep all V20 state isolated under `state.v20` and preserve a clean V19 fallback if the V20 runtime fails to load.

## State and migration

`migrateV20(state, artifacts, roster)` is idempotent and upgrades existing saves in place.

V20 stores its new state under:

```text
state.v20
  gear
  relics
  vendorLoyalty
  disputes
  chronicle
  processedEvents
  forgeCounter
  stats
```

Existing V18 structures remain authoritative for inventory and currencies:

- `state.lootInventory` remains the equipment inventory.
- `state.equipment` remains the equipped-slot map.
- `state.artifacts` remains the owned artifact list.
- `state.v18.artifactEvolution` remains the artifact evolution/fusion record.
- `state.v18.wallet` remains the specialist-currency wallet.

V20 layers mastery/bond metadata around those structures. It does not create a parallel inventory.

## Equipment mastery

Every V18 equipment item receives a persistent V20 mastery record.

Tracked fields include:

- mastery XP;
- mastery level, 1–10;
- equipment-set identity;
- signature name;
- awakened state;
- owner;
- compact history.

Only equipped gear earns event mastery. Current progression rewards are weighted toward meaningful use:

- Boss victory: 34 XP
- Battle victory: 16 XP
- Training success: 10 XP
- Other successful progression: 5 XP
- Loss: no mastery XP

Mastery thresholds rise with level. Mastery adds incremental bonuses to stats the item already supports, so it strengthens the original equipment identity instead of replacing it.

### Mastery ranks

The UI groups mastery levels into six readable ranks:

- Initiate
- Familiar
- Veteran
- Masterwork
- Signature
- Ascendant

At Mastery Level 6, an item can become named signature equipment. At Level 10 it becomes awakened equipment.

Signature naming is persistent. If the player does not provide a name, V20 derives one from the hero identity and the original item name.

## Equipment sets

V20 ships five deterministic set families:

- **Rift Vanguard** — assault / mobility
- **Paradox Savant** — mind / energy / hax
- **World Warden** — defense / stability
- **Starbound Hunter** — speed / precision
- **Void Covenant** — forbidden power

Matching equipped pieces activate real incremental combat bonuses:

- 2 pieces: first set bonus
- 4 pieces: first + second set bonuses

These bonuses stack on top of V18 item stats. They do not replace or re-add the item’s original bonuses.

### Faction Regalia

The strongest known V16 faction unlocks a generated Regalia set when its Reputation reaches 35.

Faction-set stats are derived from ethos:

- Mercy → defense / mind
- Knowledge → mind / hax
- Freedom → speed / skill
- Order → defense / might
- Balance → energy / mind
- Ambition → might / hax

This makes faction allegiance feed equipment progression rather than ending at a reputation number.

### Legacy Forge

The V18 Economy screen now includes a Legacy Forge.

Players can forge Weapon, Armor, Focus, and Charm pieces into available V20 set families using the existing V18 Salvage, Cosmic Fragments, and Void Marks.

Existing inventory limits still apply. Forged pieces are normal V18 equipment records and therefore continue to work with equip, sell, salvage, enchant, transmute, save/load, and the existing combat-stat pipeline.

### Reforging

Existing equipment can be rebound to an unlocked equipment set for a material cost. Reforging changes the V20 set identity while preserving the underlying V18 item, enchantments, and bonuses.

## Relic personalities

Every owned artifact receives one deterministic relic personality derived from its artifact identity:

- Guardian
- Seeker
- Sovereign
- Trickster
- Sage
- Avenger

Personality determines:

- favored stats;
- preferred quest/event types;
- awakening flavor;
- corruption temptation text.

A relic record persists:

- Bond, 0–100
- Purity, 0–100
- Corruption, 0–100
- current bearer
- awakened state
- relic quest
- ownership status
- nemesis thief/world when stolen
- party claim/dispute state
- compact relic history

## Attunement and party relationships

Relics may attune to the hero or to an active/reserve party member.

Hero attunement is unrestricted while the relic is owned. Ally attunement requires **Trust 40+** in the existing V19 relationship record.

When an ally bearer reaches strong Trust and Friendship, the relic gains an extra resonance contribution. The relationship system therefore changes the usefulness of the same relic without duplicating V19’s relationship state.

## Relic bond progression

Owned relics gain or lose Bond through the same event outcomes that already drive V19 party consequences.

Representative pressure:

- Boss victory: strong Bond gain
- Battle victory: moderate Bond gain
- Other successful events: small Bond gain
- Loss: small Bond loss and possible Corruption gain
- Forbidden actions: significant Corruption gain and Purity loss

This keeps relic progression attached to normal play rather than a separate grind screen.

## Relic quests

Each personality receives a deterministic personal relic quest:

- Guardian — Stand Between Worlds
- Seeker — Trace the Impossible
- Sovereign — Claim a Worthy Victory
- Trickster — Break a Rule and Survive
- Sage — Teach the Relic a New Truth
- Avenger — Settle the Blood Debt

Quest completion increases Bond and Purity and is one path toward relic awakening.

## Relic awakening

A relic can awaken when all major relationship requirements are met:

- Bond 80+
- Purity 55+
- and either its relic quest is complete or its V18 artifact evolution has reached Level 4+

Awakening adds stronger favored-stat resonance and becomes part of the V20 epilogue.

## Purity and corruption

Corruption is not only a penalty track.

### Embrace temptation

The player may deliberately accept a relic’s temptation:

- Corruption rises;
- Purity falls;
- Bond rises faster;
- high Corruption can add Hax power while weakening Defense.

### Purify

Purification consumes existing V18 Cosmic Fragments and Salvage. It:

- lowers Corruption substantially;
- restores Purity;
- slightly improves Bond.

This creates a real power-versus-consequence decision instead of a cosmetic alignment label.

## Nemesis theft and recovery

V20 uses the existing V16 ownership model.

On eligible battle/boss losses, a recurring V16 nemesis can steal a bonded relic.

When stolen:

- the artifact leaves `state.artifacts`;
- V18 evolution state is snapshotted;
- the V20 relic becomes `stolen`;
- the nemesis receives the artifact in `stolenArtifacts`;
- `state.v16.artifactOwners` changes to nemesis ownership;
- the thief and last known world are shown in the V20 Economy UI;
- the theft enters Chronicle / long memory.

Defeating that nemesis recovers its stolen V20 relics:

- ownership returns to the player;
- V18 artifact evolution is restored;
- the nemesis stolen list is cleaned;
- V16 ownership returns to `player`;
- the recovery is written to Chronicle.

This makes the existing V16 relic-owner state player-facing and consequential.

## Party relic claims

Relics can create party disputes when multiple allies have enough Respect and the deterministic dispute roll triggers.

The player chooses which claimant carries the relic. The winner gains Trust/Respect while the losing claimant can gain Resentment. Resolution therefore feeds the existing V19 relationship axes instead of storing a separate V20 approval score.

## Vendor loyalty

Every V18 market location now maintains persistent V20 vendor loyalty.

Transactions and services add points. Loyalty ranks 0–5 and grants a bounded discount. Combined vendor/faction discount is capped at **14%**.

The V20 price is applied to the real V18 offer object returned to the purchase flow, so there is only one shop and one authoritative transaction ledger.

## Legacy Convergence

V20 adds one combined transformation state that deliberately requires both V19 party progression and V20 relic progression.

**Legacy Convergence** requires:

- at least one owned, awakened, attuned relic;
- Party Morale 75+;
- strongest V19 Duo Bond 82+.

During Battle/Boss combat it adds **+2 to all seven core stats**.

This stacks with V19 Resonant Ascension. When both thresholds are met, the live battle model gains:

- +4 all stats from Resonant Ascension;
- +2 all stats from Legacy Convergence;
- total transformation delta: +6 all stats before other bounded damage/odds effects.

The Chromium release journey verifies this against `effectiveStats()` rather than checking UI text alone.

## Chronicle and endings

Major V20 events are written into the V20 Chronicle and also forwarded into V16 long memory where possible.

Examples include:

- set forging;
- reforging;
- signature naming;
- gear awakening;
- relic discovery;
- attunement;
- relic quest completion;
- relic awakening;
- corruption/purification;
- relic claims;
- theft/recovery;
- vendor-rank upgrades.

V20 adds a relic/equipment epilogue to the existing ending recap without replacing the V13 campaign ending or V19 party ending.

Current V20 epilogues:

- **The Relics Still Call** — bonded relics remain in enemy hands.
- **Crowned by Ruin** — high-corruption relics define the legacy.
- **The Living Armory** — awakened relics and signature equipment survive as a major legacy.
- **The Relic Remembers** — an awakened relic carries the timeline forward.
- **Tools of the Road** — equipment remained useful but never became destiny.

## UI

The V18 Economy tab remains the single inventory/equipment surface and is extended with:

- Relic Mastery beacon;
- Vendor Rank / loyalty discount;
- active 2/4-piece set summary;
- Legacy Forge;
- mastery XP and rank per gear item;
- signature action;
- set reforging;
- Bond / Purity / Corruption bars;
- relic personality and quest;
- hero/ally attunement;
- purification and temptation actions;
- stolen relic tracking;
- party relic disputes;
- Legacy Convergence readiness;
- V20 Chronicle.

## Offline and fallback behavior

Bootstrap loads V20 only after a successful V19 load:

```text
V16 → V17 → V18 → V19 → V20 → game construction
```

If V20 domain/UI loading fails, the app continues as V19 Party Consequences.

The V20 service worker precaches the V20 domain, experience layer, and stylesheet. The V19 first-install safety remains mandatory: a first install does not call `clients.claim()` against the already-open page. Claiming is reserved for a real upgrade when an older Multiverse Wheel cache exists.

## Validation

V20 adds:

- `tests/v20.test.js`
- `tests/e2e/v20.spec.js`
- `tools/validate-v20-content.js`
- `npm run validate:v20`

Unit coverage includes migration, mastery, set bonuses, faction Regalia, signatures, attunement, relic awakening, corruption/purification, vendor discounts, theft/recovery, relationship disputes, Legacy Convergence, and epilogues.

Chromium coverage exercises the player-facing Economy UI, real set forging, attunement, corruption/purification, live vendor discounting, and stacked V19+V20 combat stats.

The release gate remains:

```powershell
npm run validate:release
```

V20 should not merge unless both the full historical/unit/content job and Chromium release journeys pass on the same PR head.

## Scope boundary

V20 establishes persistent relic/equipment identity and ownership consequences. It deliberately does not yet add:

- bespoke authored dialogue for every artifact/character pairing;
- grid-based tactical inventory positioning;
- hundreds of hand-authored faction equipment models;
- deep player settlement/base construction;
- cross-run hereditary artifact families beyond the existing ending/NG+ hooks.

Those can build on V20 later without changing the V18 inventory authority or V16/V19 state ownership rules.
