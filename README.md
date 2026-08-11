# Setia Air-Cond & Electrical — Website Mockups

Two website proposals for **Setia Air-Cond and Electrical Sdn Bhd**, a Daikin air
conditioning and electrical contractor serving KL & Selangor since 1990.

Both are fully static multi-page sites — plain HTML, CSS, and vanilla JavaScript,
no build step and no framework.

## What's inside

```
setia-aircond/
├── setiaaircond/      Proposal v1 (AXN-015)
└── setiaaircondv2/    Proposal v2 (AXN-015-V2)
```

### `setiaaircond/` — v1

A premium redesign that reinterprets the brand green as deep emerald, with the
bright green demoted to a precise accent, on a cool, airy, restrained type system
(Georgia / Hanken Grotesk / Space Mono). It opens with a cinematic, scroll-scrubbed
video intro — an AC unit powers on, the room cools from 33° to 24°, and the
headline forms out of the air — then reveals the marketing site: a deep-emerald
hero with a climate-instrument panel, a stat ribbon, services, an about section
with a 1990 heritage badge, featured-Daikin rows, a premium brands roster, and a
contact band. Reduced-motion and mobile fallbacks are included for the intro.

### `setiaaircondv2/` — v2

The second proposal, built on one thesis: **one brand, two registers**. It answers
client feedback on v1 (the intro "reads residential"; the homepage should "start
with something wow"; other pages should be "simple and direct"; there must be
"one consistency throughout all the pages"):

- `index.html` — the wow: a sticky night-building hero in native scroll, where the
  SETIA wordmark expands from the loading screen and the scroll walks it into the
  page's only header, while the argument arrives in three beats (promise, proof,
  action) as the readout settles from 33° to 24°. No WebGL, no video — three
  parallax layers at three speeds.
- `corporate.html` — the quiet register: dense, fast, crawlable capability content
  for procurement, with JSON-LD and the SEO weight.
- A shared **mastbar** header and a **mint air-thread** run through every page as
  the consistency device.

v2 has its own detailed [README](setiaaircondv2/README.md) covering the hero
choreography, the fallback ladder, asset derivation, and known placeholders
(registration numbers, some project-table columns) still awaiting client input.

## Pages

Both versions ship the same page set — home, about, services, electrical,
projects, brands, certifications, clientele, enquiry, and contact — plus a
`showcase.html` device-frame view. v2 adds `corporate.html`.

## Viewing locally

Each version is self-contained. Serve either folder with any static server:

```sh
cd setiaaircond      # or setiaaircondv2
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from the file
system also works, though the scroll choreography behaves best over HTTP.

---

Designed and built by [Axel Nova](https://axelnovaventures.com).
