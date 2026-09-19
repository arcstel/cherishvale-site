#!/usr/bin/env python3
"""Refined Cherishvale logo concepts (original artwork). Outputs 1024px PNGs
and a 2x2 concept sheet."""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

S = 1024
SS = 2
D = S * SS
OUT = os.path.dirname(os.path.abspath(__file__))

TEAL = (53, 208, 224)
BLUE = (79, 140, 255)
GOLD = (232, 194, 122)
GOLD_DK = (208, 166, 96)
CREAM = (248, 242, 228)
DEEP = (8, 13, 26)
INK = (223, 230, 255)


def canvas(bg=None):
    return Image.new("RGBA", (D, D), (0, 0, 0, 0) if bg is None else bg + (255,))


def star_pts(cx, cy, r, inner=0.42, rot=-90, n=5):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 180 / n)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def heart_pts(cx, cy, scale, n=360):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * scale, cy - y * scale))
    return pts


def ring_layer(color, rx, ry, width, rot):
    L = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    d.ellipse([D*.5-rx, D*.5-ry, D*.5+rx, D*.5+ry], outline=color, width=width)
    return L.rotate(rot, resample=Image.BICUBIC, center=(D*.5, D*.5))


def front_arc(color, rx, ry, width, rot, start, end):
    L = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    d.arc([D*.5-rx, D*.5-ry, D*.5+rx, D*.5+ry], start, end, fill=color, width=width)
    return L.rotate(rot, resample=Image.BICUBIC, center=(D*.5, D*.5))


def glow(img, cx, cy, r, color, alpha=60):
    L = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    for i in range(18, 0, -1):
        rr = r * (1 + i * 0.05)
        d.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], fill=color + (int(alpha * (1 - i / 18) ** 2),))
    L = L.filter(ImageFilter.GaussianBlur(D * 0.012))
    img.alpha_composite(L)


def save(img, name):
    img.resize((S, S), Image.LANCZOS).save(os.path.join(OUT, name))
    print("wrote", name)


def logo_a():
    img = canvas()
    glow(img, D*.5, D*.5, D*.34, TEAL, 45)
    img.alpha_composite(ring_layer(TEAL + (235,), D*.40, D*.125, int(D*.026), -22))
    d = ImageDraw.Draw(img)
    hp = heart_pts(D*.5, D*.49, D*.0122)
    d.polygon(hp, fill=GOLD + (255,))
    d.line(hp + [hp[0]], fill=(255, 248, 232, 255), width=int(D*.005), joint="curve")
    # soft sheen (composited layer, not a raw fill, so it blends)
    hl = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([D*.37, D*.29, D*.52, D*.43], fill=(255, 250, 235, 90))
    hl = hl.filter(ImageFilter.GaussianBlur(D * 0.022))
    img.alpha_composite(hl)
    # front pass of the ring over the heart's lower area
    img.alpha_composite(front_arc(TEAL + (235,), D*.40, D*.125, int(D*.026), -22, 20, 160))
    d = ImageDraw.Draw(img)
    d.polygon(star_pts(D*.80, D*.36, D*.040), fill=CREAM + (255,))
    save(img, "logo-a-orbit-heart.png")


def logo_b():
    img = canvas()
    glow(img, D*.5, D*.52, D*.34, GOLD, 40)
    d = ImageDraw.Draw(img)
    c = D*.5
    disc = lambda cx, cy, r, f: d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=f)
    # ears
    disc(c-D*.165, c-D*.185, D*.095, GOLD + (255,))
    disc(c+D*.165, c-D*.185, D*.095, GOLD + (255,))
    disc(c-D*.165, c-D*.185, D*.048, GOLD_DK + (255,))
    disc(c+D*.165, c-D*.185, D*.048, GOLD_DK + (255,))
    # head + cheeks
    disc(c, c, D*.235, GOLD + (255,))
    # muzzle
    d.ellipse([c-D*.115, c+D*.015, c+D*.115, c+D*.155], fill=CREAM + (255,))
    d.polygon([(c-D*.034, c+D*.05), (c+D*.034, c+D*.05), (c, c+D*.088)], fill=(64,48,38,255))
    d.arc([c-D*.05, c+D*.075, c+D*.05, c+D*.125], 20, 160, fill=(64,48,38,255), width=int(D*.007))
    disc(c-D*.088, c-D*.055, D*.020, (64,48,38,255))
    disc(c+D*.088, c-D*.055, D*.020, (64,48,38,255))
    # paws holding a star
    disc(c-D*.10, c+D*.275, D*.052, GOLD_DK + (255,))
    disc(c+D*.10, c+D*.275, D*.052, GOLD_DK + (255,))
    d.polygon(star_pts(c, c+D*.275, D*.085), fill=TEAL + (255,))
    d.polygon(star_pts(c, c+D*.275, D*.085), outline=(255, 255, 255, 120))
    save(img, "logo-b-bear-star.png")


def logo_c():
    img = canvas()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([D*.09, D*.09, D*.91, D*.91], radius=int(D*.20), fill=DEEP + (255,),
                        outline=TEAL + (150,), width=int(D*.012))
    glow(img, D*.5, D*.42, D*.16, CREAM, 45)
    d = ImageDraw.Draw(img)
    d.polygon(star_pts(D*.5, D*.40, D*.115), fill=CREAM + (255,))
    # back hills
    d.polygon([(D*.15, D*.82), (D*.34, D*.60), (D*.50, D*.76), (D*.68, D*.55), (D*.85, D*.82)], fill=(38, 96, 140, 255))
    # front hills
    d.polygon([(D*.15, D*.82), (D*.40, D*.66), (D*.58, D*.80), (D*.74, D*.64), (D*.85, D*.82),
               (D*.85, D*.86), (D*.15, D*.86)], fill=TEAL + (255,))
    save(img, "logo-c-vale-star.png")


def logo_d():
    img = canvas()
    c = D*.5
    d = ImageDraw.Draw(img)
    # orbit behind
    img.alpha_composite(ring_layer(GOLD + (235,), D*.40, D*.125, int(D*.022), -22))
    d = ImageDraw.Draw(img)
    # C with round caps
    r = D*.275
    d.arc([c-r, c-r, c+r, c+r], 40, 320, fill=TEAL + (255,), width=int(D*.078))
    for ang in (40, 320):
        a = math.radians(ang)
        ex, ey = c + r*math.cos(a), c + r*math.sin(a)
        d.ellipse([ex-int(D*.039), ey-int(D*.039), ex+int(D*.039), ey+int(D*.039)], fill=TEAL + (255,))
    # orbit front pass
    img.alpha_composite(front_arc(GOLD + (235,), D*.40, D*.125, int(D*.022), -22, 20, 160))
    d = ImageDraw.Draw(img)
    d.polygon(star_pts(D*.78, D*.37, D*.042), fill=CREAM + (255,))
    save(img, "logo-d-monogram.png")


def wordmark(mark, text="CHERISHVALE", name="lockup.png"):
    W, H = 1600, 520
    img = Image.new("RGB", (W, H), DEEP)
    d = ImageDraw.Draw(img)
    m = Image.open(os.path.join(OUT, mark)).convert("RGBA").resize((380, 380), Image.LANCZOS)
    img.paste(m, (90, 70), m)
    try:
        f = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf", 92)
    except Exception:
        f = ImageFont.load_default()
    d.text((520, 220), text, font=f, fill=INK)
    d.line([(524, 330), (520 + d.textlength(text, font=f), 330)], fill=TEAL, width=6)
    img.save(os.path.join(OUT, name))
    print("wrote", name)


if __name__ == "__main__":
    logo_a(); logo_b(); logo_c(); logo_d()
    wordmark("logo-a-orbit-heart.png", name="lockup-a.png")
    wordmark("logo-d-monogram.png", name="lockup-d.png")
    # concept sheet
    names = ["logo-a-orbit-heart.png", "logo-b-bear-star.png", "logo-c-vale-star.png", "logo-d-monogram.png"]
    labels = ["A  Orbiting Heart", "B  Bear & Star", "C  Vale & Star", "D  Monogram C + Orbit"]
    cell, pad = 520, 24
    sheet = Image.new("RGB", (cell*2 + pad*3, cell*2 + pad*3 + 30), (5, 7, 14))
    ds = ImageDraw.Draw(sheet)
    try:
        fl = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf", 22)
    except Exception:
        fl = ImageFont.load_default()
    for i, (n, l) in enumerate(zip(names, labels)):
        im = Image.open(os.path.join(OUT, n)).convert("RGBA").resize((cell, cell), Image.LANCZOS)
        bg = Image.new("RGBA", (cell, cell), (10, 17, 32, 255)); bg.alpha_composite(im)
        x = pad + (i % 2) * (cell + pad); y = pad + (i // 2) * (cell + pad)
        sheet.paste(bg.convert("RGB"), (x, y))
        ds.text((x, y + cell + 2), l, font=fl, fill=(223, 230, 255))
    sheet.save(os.path.join(OUT, "concepts.png"))
    print("wrote concepts.png")
