"""Compatibility entry point for the safe, review-first asset downloader.

The old script silently accepted the first search result and saved arbitrary
media as PNG. That behavior caused mismatched portraits and invalid extensions.
This filename now delegates to the verified pipeline and defaults to characters.
"""

from __future__ import annotations

import sys

from download_game_assets import main


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print(
            "No images were changed. Stage a review set with:\n"
            "  python download_character_images.py search --ids CHARACTER_ID\n\n"
            "Then open asset_review/index.html and accept one candidate with:\n"
            "  python download_game_assets.py accept --id CHARACTER_ID --candidate 1 --replace"
        )
        raise SystemExit(0)
    if sys.argv[1] not in {"search", "accept", "audit", "manifest"}:
        sys.argv[1:1] = ["search", "--kind", "characters"]
    elif sys.argv[1] == "search" and "--kind" not in sys.argv:
        sys.argv[2:2] = ["--kind", "characters"]
    main()
