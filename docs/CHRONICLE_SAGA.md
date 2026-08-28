# Chronicle Saga systems

## Story premise

At midnight, several histories occupy the same instant. Archivist Zero intends
to repair the damage by deleting every life the timeline cannot predict. The
player coalition crosses tournaments between seconds, archives of unlived
lives, mobile suns, future prisons, a comfortable false ending, and the margin
beyond mapped worlds. The final conflict is not simply who wins; it is who is
allowed to author reality after the war.

The ten chapters are one escalating arc:

1. The Hour That Broke
2. A Counterfeit Dawn
3. The Tournament of Echoes
4. The People Without Pasts
5. The War of Borrowed Suns
6. The Prison Beyond Tomorrow
7. The Tenfold Rebellion
8. The False Final Battle
9. The Author at the End
10. The Unwritten Horizon

Each has a unique story key, a useful function, and an explicit risk. The
objective beacon remains above the game throughout play, and Journey displays
the complete map, resolved chapters, secured keys, and player-written moments.

## Player decisions

Every chapter supports five routes:

- Save what is here: protect lives and create hope.
- Follow the hidden trail: expose truth and weaken later opposition.
- Offer an impossible alliance: build loyalty and coalition strength.
- Break the chapter's rule: gain immediate power while raising pressure.
- Invent another approach: write a plan, choose its lead skill and risk, and
  resolve a deterministic d20 check whose outcome is saved in the Chronicle.

Players also declare a persistent intent—Protect, Discover, Connect, or Defy.
The declaration includes an editable description, skill, and appetite for risk.
It supplies small, visible mechanical modifiers without replacing the specific
combat technique or story choice.

## Local and online multiplayer

New Timeline setup supports 1–10 named people sharing one device and one save.
The active captain rotates after resolved encounters. Captain mode lets the
active player make a story decision. Council mode gathers one private vote from
each player and uses the active captain's vote to break a tie. The one-device
version remains available as local hot-seat play.

V15 also supports direct cross-device tables. The host opens **Online**, creates
one invite for each remote seat, and sends that code out of band. Each guest
pastes the invite, returns one answer code, and receives host snapshots after
the WebRTC data channel opens. The host remains authoritative: a guest proposal
is accepted only when that guest owns the current captain turn or is the next
council voter. No gameplay or signaling service is required by GitHub Pages.
Public STUN attempts direct NAT traversal; an optional TURN URL, username, and
credential can be supplied for networks that require relay traffic.

## Hero Forge

The six abilities use a familiar d20 modifier formula while retaining original
game terminology:

| Ability | Covers |
| --- | --- |
| Power | Force, lifting, breaking, close combat |
| Agility | Reflexes, precision, movement, initiative |
| Endurance | Health, stamina, resistance, concentration |
| Intellect | Analysis, technology, investigation, occult theory |
| Insight | Perception, judgment, willpower, scene reading |
| Presence | Leadership, empathy, deception, personality |

Base scores are purchased from 8–15 with a 27-point budget. A lineage adds two
ability points, a calling defines saves and combat bias, and a background adds
two skills plus a narrative feature. Players can select up to four additional
skills and write their own ideal, bond, flaw, and origin.

All imported and newly created heroes begin at Level 1. XP comes from completed
encounters and combat victories. Every new level grants one allocation point
for the six core abilities, capped at 20. Active power-source capacity grows at
Levels 5 and 10; technique slots grow at Levels 3, 6, 10, and 15. Global forms
require Level 3, while character-source forms begin at Level 4 and later forms
require progressively higher levels. Mastery remains a second requirement, so
finding a powerful source does not reveal its entire move list immediately.

Portable `.mwhero.json` files contain only the creation concept and optional
portrait. Their checksum and 27-point validation reject corrupted or illegal
files. Import never carries XP, allocated points, copied powers, forms, items,
companions, perks, or reward bonuses.

The sheet translates the six roleplaying abilities into the existing seven
simulation axes so all old encounters remain compatible:

| Simulation stat | Main inputs |
| --- | --- |
| Might | Power and Endurance |
| Defense | Endurance and Agility |
| Speed | Agility and Insight |
| Skill | Agility and Intellect |
| Mind | Intellect and Insight |
| Energy | Endurance, Presence, and Intellect |
| Hax | Intellect, Insight, and Presence |

The browser presents both layers: d20 modifiers, saves, trained skills and
derived defenses in the character sheet; effective simulation values in stat
bars and a seven-axis constellation.
