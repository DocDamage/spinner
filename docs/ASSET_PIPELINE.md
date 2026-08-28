# Game asset pipeline

The asset pipeline is review-first. Search results are downloaded into the
ignored `asset_review/` workspace and never replace live art automatically
unless they pass the strict confidence gate. An explicit acceptance records the
query, source page, direct image URL, dimensions, real media type, score, and
SHA-256 hash.

## Setup

Use the repository virtual environment, which includes `ddgs` and `requests`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm run assets:catalog
```

The catalog contains the complete runtime roster plus every item and Chronicle
MacGuffin. Re-export it whenever game data changes.

## Find or repair a character image

Find the character ID in `assets/game-asset-catalog.json`, then stage candidates:

```powershell
.\.venv\Scripts\python.exe download_game_assets.py search --kind characters --ids man_bat --candidates 5
```

Open `asset_review/index.html`. Compare the label, universe, source page, and
candidate images. Accept only a source-backed match:

```powershell
.\.venv\Scripts\python.exe download_game_assets.py accept --id man_bat --candidate 2 --replace
```

Accepted character files go to `verified_character_images/`. They override the
legacy portrait only for that exact roster ID; the original library remains
untouched and recoverable. The older `download_character_images.py` filename is
now a safe compatibility entry point for the same workflow.

For a batch where automatic acceptance is appropriate:

```powershell
.\.venv\Scripts\python.exe download_game_assets.py search --kind characters --ids id_one id_two --auto-accept
```

Auto-accept requires a score of at least 80, at least 75% name-token coverage,
and a 10-point lead over the second candidate. Everything else remains staged.

## Items and MacGuffins

The current release includes 32 project-generated artifact cards and 10
project-generated Chronicle keys. Regenerate them and their provenance records:

```powershell
npm run assets:relics
.\.venv\Scripts\python.exe download_game_assets.py manifest
```

External alternatives can be staged with `--kind items` or `--kind macguffins`,
but source rights and identity must be reviewed before acceptance.

## Audit

```powershell
npm run assets:audit
```

The audit detects unreadable bytes, extensions that do not match the actual
media type, low resolution, and identical-file groups. It writes the detailed
report to `asset_review/audit.json`. Duplicate bytes are a review signal, not
automatic proof of a wrong image; some roster aliases intentionally share art.

`game_asset_manifest.js` is the only runtime override manifest. Rebuild it after
every accepted or regenerated asset so the browser and offline cache see the
same verified set.
