#!/usr/bin/env python3
"""Makes the moving side strips of a themed card (img/<name>l-*.webp, img/<name>r-*.webp) from its background
img/<name>-960.webp: the left and right edges with a soft fade. Also writes <name>-480.webp.

Run from the repo root after saving a new card image, e.g.:  python3 scripts/card_sides.py th-pumpkin-card th-haunted-card
(needs Pillow: pip install pillow)"""
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img")


def strip(im, side):
    w, h = im.size
    full, fade = int(w * .30), int(w * .42)
    mask = Image.new("L", (w, 1), 0)
    for x in range(w):
        d = x if side == "l" else w - 1 - x
        mask.putpixel((x, 0), 255 if d <= full else max(0, int(255 * (fade - d) / (fade - full))))
    out = im.convert("RGBA")
    out.putalpha(mask.resize((w, h)))
    return out


def main(names):
    for name in names:
        src = Image.open(os.path.join(ROOT, f"{name}-960.webp")).convert("RGB")
        if src.width != 960:
            src = src.resize((960, round(src.height * 960 / src.width)), Image.LANCZOS)
            src.save(os.path.join(ROOT, f"{name}-960.webp"), "WEBP", quality=82, method=6)
        small = src.resize((480, round(src.height * 480 / 960)), Image.LANCZOS)
        small.save(os.path.join(ROOT, f"{name}-480.webp"), "WEBP", quality=82, method=6)
        for side in "lr":
            for w, im in ((960, src), (480, small)):
                strip(im, side).save(os.path.join(ROOT, f"{name}{side}-{w}.webp"), "WEBP", quality=82, method=6)
        print("done", name)


if __name__ == "__main__":
    main(sys.argv[1:] or ["th-pumpkin-card", "th-haunted-card"])
