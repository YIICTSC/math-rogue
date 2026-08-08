#!/usr/bin/env python3
"""Normalize one finished ImageGen card illustration to the shipped 1024x572 WebP size."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


TARGET_SIZE = (1024, 572)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--quality", type=int, default=84)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.input) as source:
        source = source.convert("RGB")
        normalized = ImageOps.fit(
            source,
            TARGET_SIZE,
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        normalized.save(args.output, "WEBP", quality=args.quality, method=6)

    print(f"Wrote {args.output} at {TARGET_SIZE[0]}x{TARGET_SIZE[1]}")


if __name__ == "__main__":
    main()
