# V18 — Multiversal Economy & Crafting

V18 turns the Credits, artifact, and dormant equipment hooks from earlier releases
into a persistent economy tied directly to V16 world state and V17 destinations.
The goal is not to add a disconnected shop screen. Where the player travels,
what factions think of them, how stable the current reality is, and what has
already been bought all affect what the economy offers.

## State model

V18 lives under `state.v18` and migrates idempotently over V17.

Persistent fields include:

- wallet balances for non-Credit currencies
- deterministic market rotations by reality + destination
- demand per product type
- transaction history
- procedural equipment inventory
- slot-based equipped gear
- artifact rarity/evolution records
- crafting counters
- offered/active/completed contracts
- deterministic sealed-auction lots
- economy statistics

`state.credits` remains the authoritative Credit balance for compatibility with
V11 collection focus and every older system that already spends Credits. V18
mirrors that value into `state.v18.wallet.credits` instead of inventing a second
Credit ledger.

## Currencies

V18 uses five currencies/material economies:

| Currency | Main use |
| --- | --- |
| Credits | General purchases, auctions, normal trade |
| Cosmic Fragments | High-order crafting and relic work |
| Salvage | Equipment crafting, enchantment, fusion |
| Void Marks | Forbidden Black Market equipment/crafting |
| Bounty Seals | Hostile contracts and quartermaster exchange |

Credits already existed before V18. The other balances start at zero and are
awarded by events, contracts, selling/salvaging, and rare corrupted-world
activity.

## Vendor types

The active vendor is derived from the current V17 destination.

- Portal Crossroads / normal routes → Crossroads Exchange
- Fracture Laboratory → Fracture Forge
- Faction Warfront / Sanctuary → Faction Quartermaster
- Impossible Archive / Veiled Shrine → Relic Broker
- Convergence Arena → Arena Broker
- Interdimensional Black Market → Black Market

Vendor type changes rarity pressure, price multipliers, stock character, and
which advanced crafting actions are allowed by the browser layer.

## Market rotation

Each `universe + destination` pair receives its own saved market.

A market rotates every three V16 world ticks. Rendering the market does not
reroll stock. The rotation key, run seed, reality, destination, and current
rotation deterministically produce the same stock until the world clock moves.

A rotation contains:

- five procedural equipment offers
- up to two named artifact offers from the actual artifact catalog
- Salvage bundles
- Cosmic Fragment bundles
- one sealed-auction lot

Purchased offers leave that market rotation instead of reappearing when the UI
rerenders.

## Dynamic prices

Price pressure combines:

- item rarity
- vendor multiplier
- current world threat
- current world corruption
- current world stability
- local demand for the product class
- best current faction reputation

Demand rises when equipment/artifacts/materials are purchased. The engine keeps
price pressure inside bounded multipliers so a bad world state cannot make basic
trade mathematically impossible.

## Rarity ladder

V18 formalizes eight rarity tiers:

1. Common
2. Uncommon
3. Rare
4. Epic
5. Legendary
6. Mythic
7. Divine
8. Forbidden

Rarity drives value, salvage yield, generated stat strength, crafting ceilings,
and visual treatment.

Forbidden gear is intentionally separate from Divine gear. It is stronger but
cursed and tied to Void Marks / Black Market behavior.

## Equipment

V18 activates the dormant `lootInventory` and `equipment` hooks anticipated by
the V10 performance cache.

Equipment slots:

- Weapon
- Armor
- Focus
- Charm

Equipment can provide Might, Defense, Speed, Skill, Mind, Energy, and Hax
bonuses plus tags such as weapon, martial, defense, armor, tech, magic, support,
or willpower.

Equipped gear feeds the same final stat calculation used by combat. Equipment
tags also join the active tag set, meaning V17 Universe DNA amplification and
suppression can interact with purchased/crafted gear.

Inventory is capped at 24 equipment records. Equipping a new item in a slot
replaces the slot reference without deleting the old item.

## Selling and salvaging

Equipment can be sold for a demand/rarity-aware fraction of local market value.
A sale also yields a small amount of Salvage.

Equipment can instead be dismantled entirely for Salvage based on rarity and
number of stat lines.

Equipped items are automatically unequipped before sale or salvage.

Artifacts can be sold for Credits plus some Cosmic Fragments. V16 relic
ownership synchronization then treats the missing artifact as no longer owned by
the player.

## Crafting

Three baseline recipes ship in V18.

### Field Forge

- 12 Salvage
- 1 Cosmic Fragment
- portable / available anywhere
- produces useful random gear

### Masterwork Forge

- 24 Salvage
- 3 Cosmic Fragments
- browser UI requires a Forge, Relic Broker, or Black Market
- higher minimum rarity

### Forbidden Craft

- 18 Salvage
- 2 Cosmic Fragments
- 3 Void Marks
- browser UI requires the Interdimensional Black Market
- always produces Forbidden cursed gear
- raises current-world corruption by 4

Craft results are deterministic from the run seed, recipe, and persistent craft
counter. Closing/reopening the UI cannot reroll a craft result for free.

## Enchantment

Enchantment costs:

- 8 Salvage
- 1 Cosmic Fragment

Each enchantment adds +2 to one deterministic stat line. At +3, eligible gear
moves up one rarity tier. Enchantment is capped at +5.

## Transmutation

Transmutation costs:

- 5 Salvage
- 1 Cosmic Fragment

The total stat budget of the item is preserved, but its stat distribution is
rerolled deterministically. This lets a valuable item fit another build without
creating extra total power from nothing.

## Artifact evolution and fusion

Every owned artifact receives a V18 evolution record containing:

- deterministic rarity
- evolution level
- evolution XP
- fusion count

Fusion requires two different owned artifacts and costs:

- 2 Cosmic Fragments
- 10 Salvage

The secondary artifact is consumed. The primary artifact gains an evolution
level, XP, and fusion count. A small portion of Cosmic material is recovered.

Evolution levels add bounded deterministic stat bonuses derived from the
artifact ID. Named artifact powers and original bonuses remain controlled by the
existing artifact catalog; V18 does not rewrite them.

## Event income

V18 gives the existing adventure loop an economy without forcing shop visits.

Examples:

- Battle victory → Credits + Bounty Seal
- Boss victory → larger Credits + Cosmic Fragments + Bounty Seals
- Hazard resolution → Salvage
- Rare event → Cosmic Fragment; corrupted worlds can also yield a Void Mark
- Artifact encounter → Credits
- Training → Salvage

Difficulty scales hostile-event Credit payouts upward.

Losses do not grant victory income.

## Contracts

V18 adds a separate commerce/bounty contract board alongside V17 faction quests.
Up to three contracts can be active.

Contract types:

- Bounty Contract — win battles/bosses
- Salvage Contract — resolve hazards
- Route Courier — travel
- Relic Procurement — acquire artifacts
- Trade Commission — purchase, sale, or craft actions

Contract rewards can include Credits, Bounty Seals, Cosmic Fragments, and
Salvage.

This intentionally complements V17 faction quests rather than replacing them:
V17 work primarily changes reputation/Favor/world state; V18 contracts primarily
feed the material economy.

## Bounty Seal exchange

The Economy UI allows one Bounty Seal to be exchanged for 60 Credits. This gives
Bounty Seals a guaranteed sink even when the current market is not a
quartermaster.

## Sealed auctions

Each market rotation contains one deterministic auction lot. It can be either
procedural equipment or a named unowned artifact.

- the visible current bid rises in 12% player increments
- the NPC ceiling is deterministic but hidden
- failed bids do not charge Credits
- winning deducts the final bid and grants the lot
- inventory capacity is checked before finalizing a win

This keeps auctions reproducible while still giving the player a price-risk
decision.

## UI

V18 extends the existing V16/V17 World State modal with an **Economy** tab.

The tab contains:

- five-currency wallet
- local vendor and market rotation
- market offers
- sealed auction
- equipment inventory and equipped-state indicators
- Sell / Equip / Salvage / Enchant / Transmute actions
- artifact rarity/evolution list
- artifact-fusion controls
- crafting recipes
- contract board
- Bounty Seal exchange
- transaction ledger

A compact Economy beacon sits beneath the V17 Reality beacon and shows Credits,
materials, active vendor, and inventory capacity.

## Compatibility

V18 preserves the layered release model:

1. V15-compatible base shell
2. V16 Living Multiverse
3. V17 Reality Rules
4. V18 Multiversal Economy

`js/bootstrap.js` loads each layer in order. A V18 load failure falls back to
V17 without preventing the game from starting.

V18 state lives inside the same host-authoritative save snapshot already used by
V15 multiplayer, so no new network protocol is required.

## Offline support

The service worker caches:

- `styles/v18.css`
- `js/domain/v18-engine.js`
- `js/v18-experience.js`

The cache namespace changes for V18 so installed clients receive the new runtime
instead of continuing indefinitely on the V17 shell.

## Validation

Run V18-only validation:

```powershell
npm run validate:v18
```

Run all historical unit/content/migration checks:

```powershell
npm run validate
```

Run the full release gate including Chromium journeys:

```powershell
npm run validate:release
```

GitHub Actions runs the validation and Chromium jobs on every PR and push to
`main`.

## Next expansion targets

The strongest follow-on systems are:

1. deeper location-specific vendors and faction-exclusive stock
2. crafted item sets and set bonuses
3. named recipe discoveries and crafting quests
4. cursed artifact purification/bonding
5. supply-line events that move prices between realities
6. artifact theft/recovery using V16 ownership state
7. shopkeeper/faction relationships and negotiation checks
8. town/city services tied to V17 destinations
9. player-created equipment recipes
10. economy-aware New Game+ inheritance rules
