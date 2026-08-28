# Multiverse Wheel V16 — Living Multiverse

V16 adds a deterministic world-simulation layer above V15 Hero Ascension. The wheel is still the immediate interaction engine, but the run now maintains a persistent multiverse that changes between player decisions and across bounded offline catch-up.

## Design goals

1. Make the multiverse feel alive rather than like a static backdrop.
2. Make prior decisions matter mechanically in later encounters.
3. Preserve deterministic seeded runs, local-first saves, offline play, and V15 network snapshots.
4. Add the system as an isolated schema layer so V15 saves migrate forward without destructive conversion.
5. Keep the existing wheel, Chronicle, tactical combat, Hero Forge, progression, and asset pipeline intact.

## Persistent V16 state

`state.v16` contains:

- **Clock** — deterministic world tick, last real save time, and bounded offline ticks.
- **Universes** — discovered reality, stability, corruption, threat, visit and change history, collapse status, and future tags.
- **Factions** — six seeded factions with archetype, ethos, goal, reputation, power, resources, cohesion, relations, and status.
- **Nemeses** — recurring enemies with level, pressure, grudges, win/loss history, status, and last-seen tick.
- **Artifact ownership** — player/lost/faction ownership state so relics can change hands off-screen.
- **Long memory** — important decisions, travel, faction reactions, world collapses, and nemesis history.
- **World events** — wars, alliances, incursions, dimensional fractures, stabilization, artifact recovery, emergence events, collapse, and nemesis hunts.
- **Statistics** — wars, alliances, incursions, collapses, recoveries, nemesis hunts, and travel counts.

## Deterministic simulation

Each resolved encounter advances one world tick. The tick RNG is derived from run seed + tick number, so the same state and same sequence of decisions produce the same world evolution.

Every tick can:

- Raise or reduce universe stability, corruption, and threat.
- Start or advance faction wars.
- Create temporary faction alliances.
- Trigger cross-reality incursions and dimensional fractures.
- Let local defenders stabilize a reality without player intervention.
- Move lost artifacts into faction ownership.
- Collapse critically unstable realities into dead universes.
- Level active nemeses and trigger route-hunting events.
- Record significant changes in the long-memory ledger.

## Offline evolution

Offline evolution is intentionally bounded. V16 defaults to one world tick per 90 minutes away, capped at 12 ticks on load. This creates the "what happened while I was gone?" effect without allowing a long absence to destroy a run.

The catch-up result is saved immediately and surfaced to the player once the UI is available.

## Universe gameplay pressure

The selected world is no longer cosmetic:

- High corruption/threat can force hazard pressure back into eligible wheels.
- Stability, corruption, average faction reputation, and nemesis power adjust battle probability within hard safety caps.
- Selecting a discovered reality in the World panel makes normal opponent selection prefer characters from that universe when the roster has enough valid candidates.

## Factions and consequences

Faction reputation reacts slowly to the existing Chronicle intentions:

- **Protect** favors mercy and balance, while exploitative factions dislike it.
- **Discover** favors knowledge and balance.
- **Connect** favors mercy and freedom.
- **Defy** favors freedom and ambition, while order factions resist it.

Faction relations are persistent. Strong negative relations count as wars; strong positive relations count as alliances. Faction power and resources change as these conflicts resolve.

## Nemesis lifecycle

Major losses can promote an opponent into a nemesis. Boss defeats and Nemesis challenge runs always qualify; normal losses use a deterministic seeded chance.

Nemeses:

- Remember why they became a recurring threat.
- Gain levels and pressure over time.
- Become stronger after defeating the player.
- Become wounded after a loss.
- Are permanently broken after three recorded defeats.
- Can enter a hunting state after enough time away from the party.
- Directly reduce battle odds when they return.

## World State UI

V16 adds **WORLD** to the condensed play bar. The modal contains five sections:

- **Overview** — current reality, map, average stability/corruption, wars, alliances, collapsed worlds, active nemeses, and recent off-screen activity.
- **Worlds** — discovered realities, stability/corruption/threat meters, visit history, collapse status, and route focus controls.
- **Factions** — faction goal, ethos, reputation, power/resources, and strongest visible relationship state.
- **Nemeses** — portrait, status, universe, level, pressure, record, and cause.
- **Memory** — a persistent chronological record of major world consequences.

## Compatibility

- V16 state lives entirely under `state.v16` plus schema markers.
- Migration is idempotent.
- V15 WebRTC snapshots automatically include V16 state because the host snapshot excludes only transient `state.v15.network` metadata.
- Existing V15 saves receive a fresh deterministic V16 world on first load.
- Existing game data and character/image manifests are not rewritten.
- V16 is loaded by `js/bootstrap.js` after all V15 layers but before the game instance is constructed, preserving the repository's prototype-extension order without rewriting the large legacy HTML shell.
- The service worker precaches all V16 runtime files for offline use.

## Validation

Run:

```powershell
npm run validate:v16
npm test
npm run validate
```

The V16 unit suite covers deterministic migration, deterministic tick results, nemesis growth/pressure, world focus travel, and capped offline catch-up. The content validator verifies the runtime loader, service-worker cache, seeded factions, memory, events, nemesis persistence, and travel state.

## Next V16.x expansion targets

The current layer establishes the state model needed for the larger roadmap. The next logical slices can build on it without another foundational rewrite:

- Faction-exclusive quests, recruits, shops, equipment, and endings.
- Universe DNA/rules that suppress or amplify specific powers.
- Interactive branching map destinations and secret locations.
- Artifact theft/recovery missions tied to ownership state.
- Nemesis sabotage, ally attacks, recruitment, and boss rematches.
- Living NPC simulation, faction leadership changes, and generated successor characters.
- Timeline variants and universe-merger events.
- Dynamic economy and supply/demand per reality.
- World-event driven dialogue and party reactions.
- Dead-universe salvage and collapse recovery arcs.
