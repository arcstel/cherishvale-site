#!/usr/bin/env python3
"""Generate the SEO landing pages for cherishvale.com from a shared shell.

Focused, intent-matching pages rank better than one mega page, so each target
query gets its own URL with a real H1, honest copy, screenshots and internal
links. Regenerate with:  python3 make_landing_pages.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://cherishvale.com"

SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/assets/logo/favicon-64.png">
<link rel="apple-touch-icon" href="/assets/logo/apple-touch-icon.png">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/assets/screens/{shot}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{schema}</script>
<style>
  :root{{--bg:#04040c;--panel:#0a1120;--line:#1a2233;--ink:#dfe6ff;--dim:#93a7c6;--teal:#35d0e0;--blue:#4f8cff}}
  *{{box-sizing:border-box}}
  html,body{{margin:0;background:var(--bg) url("/assets/backdrop.jpg") center top / cover no-repeat fixed;color:var(--ink);
    font-family:ui-monospace,"SFMono-Regular","JetBrains Mono",Menlo,Consolas,monospace;line-height:1.7}}
  a{{color:var(--teal);text-decoration:none}} a:hover{{text-decoration:underline}}
  nav{{display:flex;align-items:center;gap:16px;height:64px;border-bottom:1px solid var(--line);
    max-width:1000px;margin:0 auto;padding:0 20px}}
  nav .brand{{display:flex;align-items:center;gap:10px}}
  nav .brand-mark{{height:30px}}
  nav .spacer{{margin-left:auto}}
  nav a{{color:var(--dim);font-size:13px}} nav a:hover{{color:var(--ink)}}
  main{{max-width:760px;margin:0 auto;padding:48px 20px 24px}}
  h1{{font-size:clamp(26px,5vw,42px);line-height:1.2;margin:0 0 12px}}
  .lead{{color:var(--dim);font-size:clamp(15px,2.4vw,18px);margin:0 0 24px}}
  h2{{font-size:20px;margin:34px 0 10px}}
  h3{{font-size:15px;margin:22px 0 6px;color:var(--teal)}}
  ul{{color:var(--dim)}} li{{margin:5px 0}}
  .cta{{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:10px 20px;
    color:var(--teal);background:var(--panel);margin:8px 8px 8px 0}}
  .shot{{width:100%;border:1px solid var(--line);border-radius:12px;margin:18px 0}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:16px 0}}
  .card{{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}}
  .card b{{color:var(--teal)}}
  .card p{{margin:6px 0 0;color:var(--dim);font-size:13.5px}}
  table{{border-collapse:collapse;width:100%;font-size:13.5px;margin:14px 0}}
  th,td{{border:1px solid var(--line);padding:8px 10px;text-align:left;color:var(--dim)}}
  th{{color:var(--ink);background:var(--panel)}}
  footer{{border-top:1px solid var(--line);margin-top:50px;padding:24px 20px;color:var(--dim);
    font-size:12.5px;max-width:1000px;margin-left:auto;margin-right:auto}}
  footer a{{margin-right:14px}}
</style>
</head>
<body>
<nav>
  <a class="brand" href="/"><img class="brand-mark" src="/assets/logo/mark-transparent.png" alt=""> Cherishvale</a>
  <span class="spacer"></span>
  <a href="/planetary-explorer">Planetary Explorer</a>
  <a href="/#apps">Apps</a>
</nav>
<main>
{body}
</main>
<footer>
  <a href="/planetary-explorer">Planetary Explorer</a>
  <a href="/offline-planetarium">Offline planetarium</a>
  <a href="/astrology-app-offline">Astrology</a>
  <a href="/telescope-app-android">Telescope control</a>
  <a href="/planetarium-for-teachers">For teachers</a>
  <a href="/skysafari-alternative">Compare</a>
  <a href="/privacy">Privacy</a>
</footer>
</body>
</html>
"""


def app_schema(name, desc, url):
    import json
    return json.dumps({
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        "name": name, "applicationCategory": "EducationApplication",
        "applicationSubCategory": "Astronomy", "operatingSystem": "Android 7.0+",
        "url": url, "description": desc,
        "offers": {"@type": "Offer", "price": "7.99", "priceCurrency": "USD"},
        "author": {"@type": "Organization", "name": "Cherishvale", "url": SITE}
    })


def write(slug, title, desc, body, shot="deepsky.jpg", schema=None):
    import json
    url = "%s/%s" % (SITE, slug)
    html = SHELL.format(title=title, desc=desc, url=url, site=SITE, shot=shot,
                        body=body, schema=schema or app_schema("Planetary Explorer", desc, url))
    path = os.path.join(HERE, slug + ".html")
    with open(path, "w") as f:
        f.write(html)
    print("wrote", path)


CTA = ('<a class="cta" href="/planetary-explorer">See Planetary Explorer →</a>'
       '<a class="cta" href="https://arcstel.github.io/planetary-explorer-live/">▶ Try it in your browser</a>')

PAGES = {
 "offline-planetarium": dict(
   title="Offline Planetarium for Android — No Internet Required | Cherishvale",
   desc="Planetary Explorer is an offline planetarium for Android: a 41,411-star chart, all 88 constellations, a 1,900-object deep-sky catalogue and a Tonight planner — with no internet, no ads and no account.",
   shot="deepsky.jpg",
   body="""
<h1>An offline planetarium for Android</h1>
<p class="lead">Most planetarium apps assume you have a signal. Planetary Explorer assumes you don't —
at a dark-sky site, on a plane, in a classroom with no Wi-Fi. Everything is bundled on the device.</p>
<img class="shot" src="/assets/screens/deepsky.jpg" alt="Offline star chart with 41,411 stars and all 88 constellations">
{cta}
<h2>What "offline" actually means here</h2>
<ul>
  <li><b>41,411 stars</b> and all <b>88 constellations</b>, with figures and IAU boundaries</li>
  <li><b>1,900 deep-sky objects</b> — every Messier and Caldwell, plus bright NGC/IC galaxies, nebulae and clusters</li>
  <li>A <b>Tonight planner</b>: rise, transit, set and a 24-hour altitude curve for any object</li>
  <li>Sky events, eclipses, oppositions and meteor showers, computed on the device</li>
  <li>20 worlds with NASA/USGS imagery, and a 244,625-place Earth gazetteer</li>
</ul>
<h2>Why it matters</h2>
<p>An app that needs a connection fails exactly when you need it: at the eyepiece, in a field, on a mountain.
Because the catalogue ships inside the app, the sky is always there.</p>
<h2>No ads, no accounts, no tracking</h2>
<p>The app contains no advertising and collects nothing. The one optional online feature — refreshing the
Sun's active regions from NOAA — is off unless you turn it on.</p>
<h2>Also in the app</h2>
<div class="grid">
  <div class="card"><b>Astrology</b><p>Birth charts, houses, aspects, synastry, transits and progressions — offline.</p></div>
  <div class="card"><b>Teacher mode</b><p>Lesson tours, an offline quiz and printable worksheets for classrooms.</p></div>
  <div class="card"><b>Telescope control</b><p>ASCOM Alpaca mounts on your own network: GoTo, Sync, abort, park.</p></div>
</div>
{cta}
""".format(cta=CTA)),

 "astrology-app-offline": dict(
   title="Offline Astrology App — Birth Charts With No Ads or Account | Cherishvale",
   desc="A full offline astrology app: birth charts with Placidus, whole-sign, equal and Porphyry houses, aspects, synastry, transits, progressions, lunar nodes, Chiron, midpoints and Arabic parts. No ads, no accounts.",
   shot="astrology.jpg",
   body="""
<h1>An offline astrology app — no ads, no account</h1>
<p class="lead">Planetary Explorer computes a complete birth chart on your device. Nothing is uploaded,
nothing is sold, and there is no sign-up.</p>
<img class="shot" src="/assets/screens/astrology.jpg" alt="Birth chart with houses, aspects and element balance">
{cta}
<h2>What the chart engine does</h2>
<ul>
  <li>Ascendant, Midheaven and twelve house cusps in <b>Placidus, whole sign, equal or Porphyry</b></li>
  <li>All planets with sign, degree and <b>retrograde</b> state, plus the <b>lunar nodes</b> and <b>Chiron</b></li>
  <li>Aspects, an aspect grid, and <b>aspect patterns</b> (Grand Trine, T-Square, Grand Cross, Yod)</li>
  <li><b>Element and modality balance</b>, hemispheres, chart shape and essential dignities</li>
  <li><b>Fixed-star contacts</b>, <b>midpoints</b> and the classical <b>Arabic parts</b></li>
  <li><b>Synastry</b> (two charts), <b>transits</b>, <b>progressions</b> and the <b>solar return</b></li>
  <li>Tropical, sidereal (five ayanamsas), Vedic nakshatras and Chinese zodiacs</li>
</ul>
<h2>Why offline matters for astrology</h2>
<p>Birth data is personal. An app that computes locally does not need to hold your date, time and place on a
server — because it never leaves your device.</p>
<h2>And it is a planetarium too</h2>
<p>The same app charts the real sky: 41,411 stars, all 88 constellations, a deep-sky catalogue, sky events,
telescope control and a classroom mode.</p>
{cta}
""".format(cta=CTA)),

 "telescope-app-android": dict(
   title="Telescope Control App for Android — ASCOM Alpaca &amp; INDI | Cherishvale",
   desc="Control your telescope from Android with ASCOM Alpaca: connect to a mount on your network and GoTo or Sync any object from a 1,900-object catalogue. INDI supported via an Alpaca bridge.",
   shot="planet-watch.jpg",
   body="""
<h1>Control your telescope from Android</h1>
<p class="lead">Planetary Explorer connects to an <b>ASCOM Alpaca</b> mount on your own network and slews to
whatever object you pick from the chart.</p>
<img class="shot" src="/assets/screens/planet-watch.jpg" alt="Sky tracker with telescope controls">
{cta}
<h2>How it works</h2>
<ul>
  <li>Put the phone on the same Wi-Fi as the mount computer</li>
  <li>Run an Alpaca server — ASCOM Remote, the Alpaca Simulator, or <b>indi-alpaca-bridge</b> for INDI mounts</li>
  <li>Enter <code>host:port</code> in the app and connect</li>
  <li>Pick an object and press <b>GoTo</b> (or <b>Sync</b>), with <b>Abort</b> and <b>Park</b></li>
</ul>
<h2>No cloud in the middle</h2>
<p>The app talks only to the address you type. There is no account, no vendor server, and nothing is sent
anywhere else.</p>
<h2>Everything else you need at the eyepiece</h2>
<ul>
  <li><b>Tonight planner</b> — rise, transit, set and altitude curves</li>
  <li><b>Live space weather</b> — active regions, flare risk and the solar wind</li>
  <li><b>Jupiter's moons</b> with transits and shadows; <b>Saturn's rings</b> with their tilt</li>
  <li><b>Observing lists</b> you can build, reorder and export</li>
</ul>
{cta}
""".format(cta=CTA)),

 "planetarium-for-teachers": dict(
   title="Planetarium for Teachers — Offline Classroom Lessons | Cherishvale",
   desc="An offline planetarium built for classrooms: guided lessons at three levels (Earth Science, High School, College), an offline quiz and printable worksheets. No Wi-Fi, no ads, no accounts.",
   shot="setup-help.jpg",
   body="""
<h1>A planetarium you can teach with</h1>
<p class="lead">Planetary Explorer includes a <b>Teacher mode</b> designed for a projector, a classroom tablet,
and a room with no Wi-Fi.</p>
<img class="shot" src="/assets/screens/setup-help.jpg" alt="Teacher mode setup">
{cta}
<h2>Teacher mode</h2>
<ul>
  <li><b>Guided lessons</b> that move the view and show one line to read aloud</li>
  <li><b>Three levels</b>: Earth Science (intro), High School, and College / Higher Ed — each with its own lessons and questions</li>
  <li>An <b>offline quiz</b> with tap-to-answer and a score</li>
  <li>A <b>printable worksheet</b>, labelled with the class level</li>
</ul>
<h2>Built for the realities of a classroom</h2>
<ul>
  <li><b>No Wi-Fi needed</b> — every map, star and label is on the device</li>
  <li><b>No ads and no accounts</b> — safe for school networks and shared devices</li>
  <li><b>Larger labels and high contrast</b> for projectors</li>
  <li><b>Freeze the date</b> so a whole class sees the same sky</li>
</ul>
<h2>Lesson topics</h2>
<div class="grid">
  <div class="card"><b>The Solar System</b><p>Planets in order, scale, and the inner/outer divide.</p></div>
  <div class="card"><b>Moon &amp; Phases</b><p>Why the Moon changes shape, and tides.</p></div>
  <div class="card"><b>Seasons</b><p>Axial tilt, day length and insolation.</p></div>
  <div class="card"><b>The Night Sky</b><p>Stars, constellations and coordinates.</p></div>
  <div class="card"><b>Eclipses</b><p>Shadows and the Moon's nodes.</p></div>
</div>
{cta}
""".format(cta=CTA)),

 "skysafari-alternative": dict(
   title="A SkySafari Alternative That Works Offline | Cherishvale",
   desc="Looking for a SkySafari alternative? Planetary Explorer is an offline planetarium and astrology app for Android — a one-time price, no subscription, no ads, and it runs with no internet.",
   shot="deepsky.jpg",
   body="""
<h1>An honest SkySafari alternative</h1>
<p class="lead">SkySafari is excellent. If you need millions of objects and a huge image library, it is the
right tool. Planetary Explorer is for a different job: a calm, offline app that also does astrology, events
and classroom teaching — for a one-time price.</p>
<img class="shot" src="/assets/screens/deepsky.jpg" alt="Planetary Explorer star chart">
{cta}
<h2>What is the same</h2>
<ul>
  <li>A real star chart with constellations and deep-sky objects</li>
  <li>Telescope control (ASCOM Alpaca)</li>
  <li>A Tonight planner with rise/transit/set and altitude curves</li>
  <li>Works on Android</li>
</ul>
<h2>Where Planetary Explorer differs</h2>
<table>
  <tr><th></th><th>Planetary Explorer</th><th>Typical premium planetarium</th></tr>
  <tr><td>Price</td><td>One-time, ~$7.99</td><td>Often $20–50</td></tr>
  <tr><td>Offline</td><td>Everything bundled</td><td>Large downloads; some features online</td></tr>
  <tr><td>Ads / accounts</td><td>None</td><td>Varies</td></tr>
  <tr><td>Astrology</td><td>Full birth-chart engine</td><td>Usually not included</td></tr>
  <tr><td>Classroom</td><td>Teacher mode with lessons and worksheets</td><td>Usually not included</td></tr>
  <tr><td>Catalogue depth</td><td>41,411 stars, 1,900 deep-sky</td><td>Up to millions of objects</td></tr>
</table>
<p>If catalogue depth is your priority, choose the bigger app. If you want <b>offline, no ads, astrology,
events and teaching</b> in one dependable package at a fraction of the price, this is it.</p>
{cta}
""".format(cta=CTA)),
}

if __name__ == "__main__":
    os.chdir(HERE)
    for slug, p in PAGES.items():
        write(slug, p["title"], p["desc"], p["body"], shot=p.get("shot", "deepsky.jpg"))
    print("done:", len(PAGES), "landing pages")
