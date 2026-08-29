# Multiverse Wheel V19 — Party & Relationship Consequences

V19 turns the earlier loyalty layer into a persistent party system. The active
combat team, reserve roster, personal bonds, injuries, pair chemistry, faction
alignment, betrayals, and ending consequences now share one saved relationship
model instead of being disconnected flavor values.

## Goals

- Preserve all V13–V18 saves and keep `state.party` as the active combat party.
- Migrate legacy V13 loyalty into a richer relationship record instead of
  discarding or duplicating it.
- Make relationships affect combat, assists, shops, quests, nemeses, and endings.
- Keep lethal consequences opt-in by default so existing campaigns do not become
  unexpectedly punitive.
- Keep the system deterministic where randomness is involved so seeded runs,
  multiplayer snapshots, and testing remain reproducible.

## State

V19 stores its data under `state.v19` and raises the schema marker to `19`.

Core collections:

- `records` — one persistent relationship record per known ally.
- `pairs` — pairwise chemistry for active/reserve allies.
- `benchIds` — reserve roster; `state.party` remains the active combat party.
- `guests` — temporary guest allies with spin-based expiry.
- `personalQuests` — character-specific bond quests.
- `mentorBonds` — mentor/student lesson history.
- `incidents` — arguments and other unresolved party conflicts.
- `memories` — important relationship, betrayal, injury, death, and morale events.
- `morale` — global party morale from 0–100.
- `settings.permadeath` — off by default.

## Seven relationship axes

Every ally tracks:

1. **Loyalty** — compatibility bridge to the V13 loyalty system.
2. **Trust** — willingness to follow the hero into risky situations.
3. **Respect** — confidence in the hero's competence and judgment.
4. **Friendship** — positive emotional bond and willingness to support.
5. **Rivalry** — competitive tension; high values are not automatically hostile.
6. **Fear** — anxiety caused by losses, nemeses, wounds, and dangerous choices.
7. **Resentment** — accumulated anger that can drive refusals or defection.

Legacy `state.v13.relationshipArcs[id].loyalty` remains synchronized with the V19
Loyalty axis so older UI and assist rules keep working.

## Deterministic personality profiles

V19 derives a stable personality profile for every ally from character identity,
role, and tags. Profiles use eight dimensions:

- compassionate
- disciplined
- ambitious
- rebellious
- cautious
- honorable
- pragmatic
- vengeful

Support/healing tags bias compassion, strategy/genius biases discipline,
martial tags bias honor, tech biases pragmatism, and other traits use seeded
fallback values. This lets the 1,326-character roster participate without
requiring hand-authored relationship metadata for every entry.

## Pair bonds

Each active/reserve pair gets deterministic compatibility plus mutable:

- trust
- friendship
- rivalry
- resentment

Compatibility considers role diversity, shared universe, tag overlap, and
personality distance. Shared victories grow pair trust/friendship. Low morale
and poor compatibility can create arguments.

The strongest pair becomes the current Duo Bond.

### Duo thresholds

- Bond 70+ strengthens the existing team-combo system.
- Bond 82+ plus Morale 70+ unlocks **Resonant Ascension**.

Resonant Ascension is a relationship-driven combat transformation state rather
than a fake media asset. While the threshold remains met during combat, the
active build receives +4 to all seven core stats and the relationship damage
modifier can add up to +8%.

## Combat consequences

Relationships now feed the actual combat model.

Positive pressure comes from:

- morale above 50
- high trust
- high respect
- strong Duo Bond
- high friendship

Negative pressure comes from:

- low morale
- active wounds
- fear/resentment-driven refusal states

The aggregate battle-odds modifier is hard capped between -9% and +8%, and the
relationship damage modifier is capped between -12% and +12%.

## Assists and refusal

V13 loyalty remains authoritative, but V19 adds additional refusal conditions.
An active ally can refuse when trust or loyalty is extremely low, resentment is
high, or multiple untreated wounds combine with weak trust.

High friendship can reduce assist cost by another five points after older V13
loyalty discounts are applied.

## Wounds and scars

Losses can create deterministic minor or severe wounds.

- ordinary defeat: lower wound chance
- boss defeat: higher wound chance and severe injury
- impossible/boss tactical defeat: can trigger a severe consequence

Three accumulated wounds convert the oldest wound into a persistent scar.
Treatment removes one active wound and improves trust/friendship while reducing
fear.

Scars remain part of the relationship record and long-term party history.

## Permadeath

Permanent death support exists but is **off by default**.

With permadeath disabled, a severe consequence becomes a severe wound.
With permadeath enabled, the affected ally can be marked dead, removed from both
active and reserve rosters, recorded in long memory, and reflected in the final
relationship ending.

This prevents V19 migration from silently killing characters in existing saves.

## Active party and reserves

`state.party` remains the active party used by all existing combat systems.
V19 adds a reserve roster around it.

Players can:

- bench an active ally
- reactivate a reserve ally if capacity allows
- preserve all relationship axes, scars, wounds, and quest history while benched

This avoids rewriting older combat code while supporting a larger persistent
roster.

## Guests

The domain model supports up to four guest characters. Guests carry a spin-based
expiry and relationship record but are not automatically promoted into the
permanent active roster.

## Personal quests

Each ally receives a deterministic personal quest based on personality and role.
Quest families include:

- Keep Them Standing
- Prove It Together
- Learn the Impossible
- See Another World
- Find What Was Lost
- Choose the Team

Matching events advance progress. Completion grants substantial Loyalty, Trust,
Respect, and Friendship and reduces Resentment.

## Mentor/student progression

Training encounters now record mentor lessons. Each mentor/student bond tracks:

- lesson count
- respect
- trust

V19 currently uses the hero as the default student, while the state format can
also support explicit ally students in future content.

## Arguments and reconciliation

Low morale can create deterministic party arguments. The chance scales with:

- morale below 60
- weak pair compatibility

An unresolved incident appears in the Team UI. The player can:

- reconcile both allies
- side with ally A
- side with ally B

Reconciliation restores pair trust/friendship, reduces resentment, improves both
hero-to-ally relationships, and raises morale. Taking a side helps one ally but
raises resentment/rivalry in the other.

## Betrayal and defection

Defection requires a heavily fractured relationship:

- Loyalty below 28
- Trust below 30
- Resentment at least 65

A seeded betrayal check can then move the ally out of the active party and mark
them as defected. The system associates the defection with the most hostile known
V16 faction when available and records it as a high-weight party memory.

## Faction reactions

V17 faction ethos now interacts with ally personality.

Examples:

- compassionate allies tend to approve of mercy-aligned factions
- disciplined allies can favor order while rebellious allies resist it
- rebellious allies tend to favor freedom
- ambitious allies can respond positively to ambition
- pragmatic/cautious allies respond to knowledge factions

Completing faction work can therefore improve one party relationship while
straining another.

## Nemesis targeting

When a V16 nemesis is actively hunting, V19 can target the active ally with the
strongest friendship/loyalty bond. The target is marked in the Team UI and gains
fear plus a relationship-memory callback.

This connects the V16 Nemesis system to people the hero actually cares about.

## Markets and party reactions

V18 market pricing now receives a small party modifier derived from:

- average Trust
- average Friendship
- highly rebellious companions
- party Resentment

The modifier is capped between an 8% discount and a 10% surcharge. It layers on
top of V18 vendor, rarity, scarcity, world pressure, demand, and faction pricing.

## Banter

The Team view generates deterministic short banter from current relationship
state. Tones include:

- warm
- steady
- competitive
- uneasy
- cold

The text changes with friendship, rivalry, fear, and resentment instead of being
purely random flavor.

## Relationship endings

V19 adds a second ending lens to the existing V13 narrative ending and stores it
under `state.v19.ending` and the recap.

Current relationship endings include:

- **Found Across Worlds** — high trust/friendship across the surviving party.
- **The Names They Carry** — multiple permanent deaths define the route.
- **The Fractured Alliance** — multiple defections define the route.
- **Rivals to the Horizon** — rivalry becomes the dominant surviving bond.
- **The Surviving Company** — default mixed relationship outcome.

The original campaign victory/defeat ending remains intact; V19 adds a party
consequence epilogue rather than replacing it.

## Team UI

The existing Team dashboard receives a V19 relationship layer with:

- Morale meter/summary
- active ally cards
- reserve ally cards
- all seven relationship axes
- wounds, scars, refusal count, and nemesis target indicator
- personal quest status
- bench/activate controls
- wound treatment
- unresolved incident choices
- strongest Duo Bond
- Resonant Ascension readiness
- contextual party banter
- permadeath toggle

A compact Party beacon is placed beneath the existing V17/V18 beacons.

## Compatibility

V19 is loaded after V18 and before `MultiverseWheel` construction.

Fallback chain:

1. V19 failure → V18 remains playable.
2. V18 failure → V17 remains playable.
3. V17 failure → V16 remains playable.
4. V16 failure → V15-compatible shell remains playable.

V19 state rides inside the existing save and host-authoritative multiplayer
snapshots automatically.

## Validation

`tests/v19.test.js` covers:

- migration idempotence
- V13 loyalty compatibility
- deterministic pair/personality generation
- bounded combat modifiers
- wounds/scars and treatment
- active/reserve swapping
- personal quest completion
- reconciliation
- deterministic defection
- opt-in permadeath
- mentor progression
- market modifier bounds
- nemesis targeting
- Resonant Ascension
- relationship ending selection

`tools/validate-v19-content.js` checks release wiring, UI markers, schema, axes,
personal quests, pair bounds, and version compatibility.
