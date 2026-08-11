# Setia Air-Cond & Electrical — Design Proposals

A single landing page for **Setia Air-Cond and Electrical Sdn Bhd** — Daikin air
conditioning and electrical contractors, KL & Selangor, since 1990 — presenting
the two website design proposals and linking out to the live mockups.

Plain HTML and CSS, no build step, no JavaScript.

## What's inside

```
setia-aircond/
├── index.html               The proposals landing page
└── assets/
    ├── proposal-01.png      Preview of Proposal 01
    └── proposal-02.png      Preview of Proposal 02
```

The page is a diptych in the brand's own tokens (night ground, deep pine, mint
air-thread, Georgia / Hanken Grotesk / Space Mono): two panels split by the mint
seam, one per proposal, each linking to its live mockup. Hovering a proposal
cools its readout from 33° to 24° — the device both proposals share.

## The two proposals

| # | Live mockup | In one line |
|---|---|---|
| 01 | [axelnova.my/setiaaircond](https://axelnova.my/setiaaircond/) | The cinematic instrument — a scroll-scrubbed cooling intro into a deep-emerald site with a climate-instrument hero (June 2026) |
| 02 | [axelnova.my/setiaaircondv2](https://axelnova.my/setiaaircondv2/) | One brand, two registers — a night-building hero for the wow plus a quiet corporate page for procurement, answering feedback on 01 (July 2026) |

The full proposal sources live in the `axelnova-mockups` repo under
`mockups/setiaaircond/` and `mockups/setiaaircondv2/`.

## Viewing locally

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```

---

Designed and built by [Axel Nova](https://axelnovaventures.com).
