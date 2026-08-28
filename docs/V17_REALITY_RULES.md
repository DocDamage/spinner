# Multiverse Wheel V17 — Reality Rules

V17 builds directly on the V16 Living Multiverse. V16 made worlds, factions,
nemeses, relic ownership, and off-screen activity persistent. V17 gives each
reality its own laws, internal destinations, faction operations, and multi-spin
Wheel currents so choosing *where* to go starts affecting *how* the game plays.

## Goals

V17 targets five items from the larger roadmap:

1. Universe DNA and unique reality rules.
2. Branching destinations inside discovered universes.
3. Secret locations unlocked by persistent world conditions.
4. Faction quests, reputation rewards, and spendable Favor.
5. Chain/hidden Wheel behavior that persists across several spins.

The update deliberately does not implement a full economy, crafting system, or
tactical-grid rewrite yet. It creates the state and gameplay hooks those systems
need.

## State model

All V17 state lives under `state.v17` and is migrated idempotently on top of the
V16 state.

Key fields:

- `universeDNA` — deterministic rules for every discovered universe.
- `routes` — generated destinations for each universe.
- `currentLocation` — the focused destination inside each universe.
- `quests` — offered, active, completed, failed, and expired faction work.
- `questHistory` — bounded historical quest records.
- `factionFavor` — spendable relationship currency earned from operations.
- `wheel.activeChain` — the current multi-spin Wheel condition.
- `wheel.history` — prior Wheel currents.
- `wheel.secretDiscoveries` — hidden routes discovered during the run.
- `stats` — quest, location, secret, chain, and Favor counters.

V17 does not replace V16 world state. Universe stability/corruption/threat,
faction reputation and relations, nemeses, and world events remain owned by
`state.v16`.

## Universe DNA

Each discovered universe receives a deterministic DNA signature from the run
seed and canonical universe name. Reopening the same save produces the same
rules.

The six law axes are:

- **Gravity** — light, standard, or heavy.
- **Technology** — amplified, stable, or suppressed.
- **Mystic law** — amplified, stable, or suppressed.
- **Time** — stable, dilated, or fractured.
- **Mortality** — anchored, normal, or fragile.
- **Psionics** — open, normal, or shielded.

Every reality also receives two amplified power tags and two suppressed power
tags. Those tags interact with the player's active build.

### Mechanical effects

Reality laws change battle and hazard probability rather than only changing
flavor text. Examples:

- Light gravity favors Speed Blitz.
- Heavy gravity penalizes Speed Blitz but helps Clash/Outlast play.
- Amplified technology improves Tactical Counter.
- Suppressed technology weakens Tactical Counter.
- Amplified mystic law improves Mystic/Hax strategies.
- Fractured time improves some speed/hax possibilities but increases hazard
  severity.
- Anchored mortality favors Outlast.
- Fragile mortality makes survival harder and raises hazard pressure.
- Open psionics slightly improves Mystic/Hax play.
- Shielded psionics suppresses it.

All rule modifiers are hard-capped so no reality can turn an encounter into an
automatic win/loss.

## Branching destinations

Every universe receives seven deterministic destination records:

- five public destinations,
- two secret destinations.

The pool includes locations such as Portal Crossroads, Living Metropolis,
Convergence Arena, Impossible Archive, Fracture Laboratory, Reality Sanctuary,
Faction Warfront, Veiled Shrine, Interdimensional Black Market, Hunter's Wake,
and Fracture Depths.

A destination can modify:

- wheel result weighting,
- hazard severity,
- preferred quest types,
- strategy bonuses.

Traveling inside a universe does not destroy or regenerate world state. It only
changes the focused location and its local modifiers.

## Secret routes

Secret destinations can unlock through persistent V16 conditions:

- high universe corruption,
- high faction reputation,
- an active local nemesis,
- repeated visits to the universe.

Faction Favor can also reveal a still-hidden route.

This means secret content is no longer tied only to random rolls. Prior choices
and world history can expose it.

## Faction quests

The current destination seeds faction operations appropriate to that location.
The player can keep up to three active faction quests.

Quest families include:

- hostile interdiction,
- anomaly containment,
- relic recovery,
- coalition recruitment,
- rare-event investigation,
- field preparation,
- Chronicle intervention,
- route survey.

Progress is event-driven and saved. Battle quests require actual victories;
other quests advance from matching resolved encounter types or travel.

### Rewards

Completing a faction quest can grant:

- faction reputation,
- faction Favor,
- universe stability.

Quest completion also attempts to start a **Golden Route** Wheel current when
no other current is already active.

### Favor actions

V17 provides three initial Favor spends:

- **Stabilize** — costs 2 Favor; improves current-universe stability and lowers
  threat.
- **Reveal Route** — costs 2 Favor; reveals one still-hidden destination.
- **Ceasefire** — costs 3 Favor; softens one strongly hostile faction relation.

Favor is intentionally narrower than a full economy. Later economy/crafting
work can build on it without making ordinary currency and faction trust the same
resource.

## Wheel currents

Wheel currents are bounded multi-spin conditions. They can change event mix,
hazard pressure, or hide information across several spins.

V17 ships six currents:

- **Reality Storm** — more anomalies, transformations, and hazards.
- **Bounty Hunt** — more battles and artifact pressure.
- **Golden Route** — better reward density with lower hazard pressure.
- **Forbidden Current** — better rewards plus danger; may hide a slice.
- **Echo Chain** — repeats pressure from the previous result type.
- **??? Signal** — hides multiple Wheel slices until they land.

Hidden slices keep their real event payload internally. The wheel displays
`???`, but the original event is restored when the slice lands.

### Protected wheels

V17 does not alter:

- the first protected discovery,
- boss wheels,
- protected scripted story/camp/ending slices,
- Daily Challenge wheels.

Existing Fate controls remain authoritative after the wheel is generated.

## UI

V17 extends the existing V16 World State modal rather than creating another
parallel dashboard.

New tabs:

- **DNA** — reality laws, amplified/suppressed tags, and live strategy/hazard
  modifiers.
- **Routes** — public/secret destinations and their wheel/quest biases.
- **Quests** — active/offered faction work and Favor actions.

A compact Reality beacon under the build rail shows:

- current universe,
- current destination,
- key local laws,
- active Wheel current,
- active quest count,
- total Favor,
- hidden-route discoveries.

## Compatibility

- V16 saves migrate without deleting V16 state.
- V15/V16 network snapshots naturally carry `state.v17` because the host sends
  the complete authoritative state.
- Existing combat, Chronicle, Fate, progression, transformations, roster,
  saves, and offline systems remain layered underneath V17.
- Daily Challenge integrity is preserved by disabling V17 wheel mutation for
  Daily runs.
- V11 focused-discovery power slices are protected from V17 replacement while
  focus is active.

## Validation

Run:

```powershell
npm run validate:v17
npm test
npm run validate
```

The V17 unit suite covers:

- idempotent migration,
- deterministic Universe DNA,
- secret-route gating,
- faction quest progression and rewards,
- Wheel current directives,
- rule safety caps,
- Favor spending.

`tools/validate-v17-content.js` additionally verifies runtime/bootstrap/offline
wiring and key UI integration markers.

## Next logical systems

V17 makes these later phases practical without another state rewrite:

1. Full economy, shops, black markets, auctions, and dynamic scarcity.
2. Crafting, salvaging, artifact evolution, and faction-exclusive equipment.
3. More event chains and authored/seeded secret events.
4. Deeper relationship/betrayal/party-conflict systems.
5. Location-specific quest arcs, dungeons, and bosses.
6. Tactical terrain/grid combat after the world/route model is mature.
