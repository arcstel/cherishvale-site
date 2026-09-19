#!/usr/bin/env python3
"""Concept logos for Cherishvale (original artwork). Renders 1024x1024 PNGs."""
import math, os
from PIL import Image, ImageDraw, ImageFilter

S = 1024
SS = 2  # supersample
D = S * SS
OUT = os.path.dirname(os.path.abspath(__file__))

TEAL = (53, 208, 224)
BLUE = (79, 140, 255)
GOLD = (232, 194, 122)
CREAM = (247, 240, 226)
DEEP = (10, 17, 32)
INK = (223, 230, 255)


def canvas():
    return Image.new("RGBA", (D, D), (0, 0, 0, 0))


def disc(d, cx, cy, r, fill):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)


def star_pts(cx, cy, r, inner=0.42, rot=-90, n=5):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 180 / n)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def heart_pts(cx, cy, scale, n=240):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * scale, cy - y * scale))
    return pts


def save(img, name):
    img = img.resize((S, S), Image.LANCZOS)
    p = os.path.join(OUT, name)
    img.save(p)
    print("wrote", p)


def glow(img, fn, color, layers=20):
    g = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    fn(gd, layers, color)
    g = g.filter(ImageFilter.GaussianBlur(D * 0.02))
    img.alpha_composite(g)


# ---- A: orbiting heart -------------------------------------------------
def logo_a():
    img = canvas()
    glow(img, lambda d, L, c: [d.ellipse([D*.5-r*D*.0016, D*.5-r*D*.0016, D*.5+r*D*.0016, D*.5+r*D*.0016],
                                          outline=(c[0], c[1], c[2], int(30*(1-i/L))) )
                               for i, r in enumerate(range(300, 300+L*22, 22))], TEAL)
    d = ImageDraw.Draw(img)
    # orbit ring (behind heart) - draw on layer then rotate
    ring = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse([D*.5-D*.40, D*.5-D*.13, D*.5+D*.40, D*.5+D*.13], outline=TEAL + (235,), width=int(D*.028))
    ring = ring.rotate(-22, resample=Image.BICUBIC, center=(D*.5, D*.5))
    img.alpha_composite(ring)
    # heart
    hp = heart_pts(D*.5, D*.50, D*.0125)
    d.polygon(hp, fill=GOLD + (255,))
    d.line(hp + [hp[0]], fill=(255, 245, 220, 255), width=int(D*.006), joint="curve")
    # star on ring
    cx, cy = D*.5 + D*.30*math.cos(math.radians(-22+18)), D*.5 + D*.13*math.sin(math.radians(18)) - D*.30*math.sin(math.radians(22))
    d.polygon(star_pts(D*.5 + D*.33, D*.5 - D*.10, D*.035), fill=CREAM + (255,))
    save(img, "logo-a-orbit-heart.png")


# ---- B: bear + star ----------------------------------------------------
def logo_b():
    img = canvas()
    d = ImageDraw.Draw(img)
    c = D*.5
    # ears
    disc(d, c-D*.17, c-D*.20, D*.10, GOLD+(255,))
    disc(d, c+D*.17, c-D*.20, D*.10, GOLD+(255,))
    disc(d, c-D*.17, c-D*.20, D*.05, (222,178,112,255))
    disc(d, c+D*.17, c-D*.20, D*.05, (222,178,112,255))
    # head
    disc(d, c, c, D*.24, GOLD+(255,))
    # muzzle
    d.ellipse([c-D*.11, c+D*.02, c+D*.11, c+D*.16], fill=CREAM+(255,))
    d.polygon([(c-D*.035, c+D*.045), (c+D*.035, c+D*.045), (c, c+D*.085)], fill=(60,45,35,255))
    disc(d, c-D*.085, c-D*.05, D*.022, (60,45,35,255))
    disc(d, c+D*.085, c-D*.05, D*.022, (60,45,35,255))
    # star held below
    d.polygon(star_pts(c, c+D*.30, D*.075), fill=TEAL+(255,))
    save(img, "logo-b-bear-star.png")


# ---- C: vale + star ----------------------------------------------------
def logo_c():
    img = canvas()
    d = ImageDraw.Draw(img)
    # rounded badge
    d.rounded_rectangle([D*.08, D*.08, D*.92, D*.92], radius=int(D*.20), fill=DEEP+(255,),
                        outline=TEAL+(160,), width=int(D*.012))
    # star
    d.polygon(star_pts(D*.5, D*.42, D*.13), fill=CREAM+(255,))
    d.polygon(star_pts(D*.5, D*.42, D*.055), fill=(DEEP[0],DEEP[1],DEEP[2],255))
    # hills (vale)
    d.polygon([(D*.16,D*.74),(D*.36,D*.55),(D*.5,D*.68),(D*.66,D*.52),(D*.84,D*.74),(D*.84,D*.84),(D*.16,D*.84)],
              fill=TEAL+(255,))
    d.ellipse([D*.30, D*.73, D*.44, D*.83], fill=BLUE+(255,))
    save(img, "logo-c-vale-star.png")


# ---- D: monogram C + orbit --------------------------------------------
def logo_d():
    img = canvas()
    d = ImageDraw.Draw(img)
    c = D*.5
    ring = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse([c-D*.40, c-D*.13, c+D*.40, c+D*.13], outline=GOLD+(230,), width=int(D*.022))
    ring = ring.rotate(-22, resample=Image.BICUBIC, center=(c, c))
    # C
    d.ellipse([c-D*.28, c-D*.28, c+D*.28, c+D*.28], outline=TEAL+(255,), width=int(D*.075))
    img.alpha_composite(ring)
    d.ellipse([c-D*.30, c-D*.30, c+D*.30, c+D*.30], outline=TEAL+(0,), width=0)
    # mask the right side of C with background to open it
    d.rectangle([c-D*.02, c-D*.30, c+D*.30, c+D*.30], fill=(0,0,0,0))
    # redraw C properly with an arc
    img = canvas()
    d = ImageDraw.Draw(img)
    d.arc([c-D*.28, c-D*.28, c+D*.28, c+D*.28], start=38, end=322, fill=TEAL+(255,), width=int(D*.075))
    ring2 = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    r2 = ImageDraw.Draw(ring2)
    r2.ellipse([c-D*.40, c-D*.13, c+D*.40, c+D*.13], outline=GOLD+(230,), width=int(D*.022))
    ring2 = ring2.rotate(-22, resample=Image.BICUBIC, center=(c, c))
    img.alpha_composite(ring2)
    d = ImageDraw.Draw(img)
    d.polygon(star_pts(c+D*.33, c-D*.09, D*.045), fill=CREAM+(255,))
    save(img, "logo-d-monogram.png")


if __name__ == "__main__":
    logo_a(); logo_b(); logo_c(); logo_d()
