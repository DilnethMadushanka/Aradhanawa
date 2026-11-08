#!/usr/bin/env python3
"""Turns the grey-and-white "transparent" checkerboard that AI image tools draw into real transparency.

It works on the grey-and-white grids Gemini and similar tools draw.

Usage:  python3 scripts/strip_checker.py in.jpg out.webp [width height]
(needs Pillow and numpy)

How: a pixel is background when it is light and neutral grey, like the checker squares. Background regions
touching the image edge are cleared; closed regions (inside a spider web, between wings) are cleared only when they
hold both checker tones (light and lighter), so plain white shapes such as ghosts stay. Light edge pixels next to the cleared area are
faded so no white halo shows on a dark page."""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


def strip(src):
    rgb = np.asarray(src.convert("RGB")).astype(np.int16)
    mx, mn = rgb.max(2), rgb.min(2)
    neutral = (mx - mn) < 14
    cand = neutral & (mn >= 190)
    lum0 = rgb.mean(2)
    # label at half size (fast enough in pure Python)
    h, w = cand.shape
    c2 = cand[::2, ::2].copy()
    L2 = lum0[::2, ::2]
    H, W = c2.shape
    lab = np.zeros((H, W), np.int32)
    bg = np.zeros((H, W), bool)
    nid = 0
    rest = []
    for sy in range(H):
        row = c2[sy]
        for sx in np.nonzero(row & (lab[sy] == 0))[0]:
            if lab[sy, sx]:
                continue
            nid += 1
            q = deque([(sy, sx)]); lab[sy, sx] = nid; pts = []; edge = False
            while q:
                y, x = q.popleft(); pts.append((y, x))
                if y in (0, H - 1) or x in (0, W - 1):
                    edge = True
                for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= yy < H and 0 <= xx < W and c2[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = nid; q.append((yy, xx))
            ys, xs = zip(*pts)
            n = len(pts)
            if edge:
                bg[ys, xs] = True
            elif n >= 20:
                rest.append((ys, xs))
    # closed pockets (inside a web, between twisted vines): background when made of the same two flat checker tones
    hist = np.bincount(np.clip(L2[bg], 0, 255).astype(int), minlength=256)
    t1 = int(hist.argmax()); hist[max(0, t1 - 8):t1 + 9] = 0; t2 = int(hist.argmax())
    for ys, xs in rest:
        v = L2[ys, xs]
        n1, n2 = (abs(v - t1) < 8).mean(), (abs(v - t2) < 8).mean()
        if n1 + n2 >= .6 and n1 >= .1 and n2 >= .1:
            bg[ys, xs] = True
    # back to full size: a full-size candidate pixel is background when its half-size cell is
    big = np.repeat(np.repeat(bg, 2, 0), 2, 1)[:h, :w] & cand
    alpha = np.where(big, 0, 255).astype(np.uint8)
    # thin leftovers of the checker grid (seams 1-2 px wide, still light and greyish) go too
    opened = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5)))
    alpha = np.where((opened == 0) & ((mx - mn) < 12) & (lum0 > 185), 0, alpha).astype(np.uint8)
    a = Image.fromarray(alpha)
    # fade light, greyish fringe pixels within 3 px of the cleared area
    near = np.asarray(a.filter(ImageFilter.MinFilter(7))) == 0
    lum = rgb.mean(2)
    fringe = near & (alpha == 255) & ((mx - mn) < 26) & (lum > 150)
    fa = np.clip((245 - lum) / 95, 0, 1) * 255
    alpha = np.where(fringe, fa, alpha).astype(np.uint8)
    out = src.convert("RGBA")
    out.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.6)))
    return out


if __name__ == "__main__":
    im = strip(Image.open(sys.argv[1]))
    if len(sys.argv) > 4:
        im = im.resize((int(sys.argv[3]), int(sys.argv[4])), Image.LANCZOS)
    im.save(sys.argv[2], "WEBP", quality=85, method=6)
