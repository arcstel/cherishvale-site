#!/usr/bin/env python3
"""Turn the supplied Cherishvale logo (cream background) into dark-theme assets:
- mark on transparent background, dark teal lifted to brand teal
- horizontal lockup (mark + wordmark) for light-on-dark
- favicon + apple touch icon on a dark rounded square
"""
import os
from PIL import Image, ImageDraw

SRC = "/home/xyzam/Downloads/ChatGPT Image Sep 19, 2026, 06_30_50 PM.png"
OUT = os.path.dirname(os.path.abspath(__file__))
TEAL = (53, 208, 224)
INK = (223, 230, 255)
DEEP = (8, 13, 26)


def load_cutout():
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            # cream background -> transparent (soft edge)
            if lum >= 240:
                a = 0
            elif lum <= 214:
                a = 255
            else:
                a = int(255 * (240 - lum) / 26)
            # teal (dark navy-teal orbit/wordmark) -> brand teal
            if b > r + 22 and g > r + 10 and lum < 190:
                r, g, b = TEAL
            px[x, y] = (r, g, b, a)
    return im


def split_mark(im):
    w, h = im.size
    a = im.split()[3]
    rows = [any(a.getpixel((x, y)) > 8 for x in range(0, w, 4)) for y in range(h)]
    # find content bands
    bands, start = [], None
    for y, on in enumerate(rows):
        if on and start is None:
            start = y
        if not on and start is not None:
            if y - start > 6:
                bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, h))
    return bands


if __name__ == "__main__":
    im = load_cutout()
    bands = split_mark(im)
    print("content bands:", bands)
    top = bands[0]
    # mark = first band (heart+orbit+sparkle)
    m = im.crop((0, max(0, top[0]-20), im.width, min(im.height, top[1]+20)))
    # trim
    bb = m.getbbox()
    mark = m.crop(bb)
    mark.save(os.path.join(OUT, "mark-transparent.png"))
    print("mark", mark.size)

    # wordmark band(s) after a gap
    if len(bands) >= 2:
        wb = bands[1]
        word = im.crop((0, wb[0]-10, im.width, min(im.height, wb[1]+10)))
        word = word.crop(word.getbbox())
        word.save(os.path.join(OUT, "wordmark-transparent.png"))
        print("wordmark", word.size)

    # favicon / app tile: mark centred on dark rounded square
    for size in (512, 180, 64):
        tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size-1, size-1], radius=int(size*0.22), fill=255)
        bg = Image.new("RGBA", (size, size), DEEP + (255,))
        tile.paste(bg, (0, 0), mask)
        inner = int(size * 0.72)
        mk = mark.copy()
        mk.thumbnail((inner, inner), Image.LANCZOS)
        tile.alpha_composite(mk, ((size-mk.width)//2, (size-mk.height)//2))
        if size == 512:
            tile.save(os.path.join(OUT, "icon-512.png"))
        if size == 180:
            tile.save(os.path.join(OUT, "apple-touch-icon.png"))
        if size == 64:
            tile.save(os.path.join(OUT, "favicon-64.png"))
    print("wrote favicons")
