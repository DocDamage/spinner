# V13 content schema

V13 keeps generated roster identity and universe stories in testable data
models. Run `npm run validate:content` after changing roster or story data.

## Character identity

Every runtime character resolves to:

- `characterId`, canonical and original universe labels;
- one `role` and player-facing `roleLabel`;
- a `passive` with `name`, `description`, and stable effect identifier;
- an `ultimate` with a name and combat cost/cooldown metadata;
- at least one signature `move` with a stable ID, tags, cost, and cooldown;
- one or more structured `weaknessTags` used by exploit windows;
- `generated` flags that report which fields came from deterministic fallback.

Character-authored `role`, `passive`, `ultimate`, `moves`, and
`weaknessTags` take precedence over fallbacks. Generated output must be stable
for the same source character.

## Universe event pack

Each pack has a stable `id`, canonical `universe`, at least three `locations`,
three `factions`, and three ordered `events`. An event requires:

- stable `id` and `kind`;
- `title`, `prompt`, `location`, `faction`, and visible `hazard`;
- at least two choices with stable IDs, labels, prompts, cost/gain previews, and
  an `effect` object.

Supported effect fields include Health/Energy ratios, credits, stats, Fate,
Director heat/alignment, loyalty/respect, objective progress, boss power/intel,
and a delayed `callback` with a registered type and delay in spins. Event IDs
must be globally unique. Choices are recorded in V13 history before effects are
adapted into the legacy runtime.

## Offline shell

Every same-origin path in `sw.js` must exist. The content validator checks the
web manifest start URL and all precached static-shell references. Character art
is runtime-cached on first use and is reported separately so missing art never
silently invalidates mechanical roster content.
