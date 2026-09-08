# Setia Air-Cond & Electrical

Production site for **Setia Air-Cond and Electrical Sdn Bhd** (setiaaircond.com.my), plus the design-proposals page that preceded it.

## Design proposals

`proposals/index.html` is the plain-HTML page that presented the two website proposals (01 — the cinematic instrument, June 2026; 02 — one brand, two registers, July 2026) and links to the live mockups at axelnova.my/setiaaircond and axelnova.my/setiaaircondv2. Open it directly in a browser; it has no build step. The mockup sources live in the `axelnova-mockups` repo.

## Production site

Ported from
the approved v2 mockup (`axelnova-mockups/mockups/setiaaircondv2`). Nuxt 4, prerendered
with `nuxt generate`; the output in `.output/public` is plain HTML, CSS, JS and images and
runs on any static host, including cPanel.

## Commands

```sh
npm install            # first time (npm may need --legacy-peer-deps on some machines)
npm run dev            # local dev server
npm run generate       # production build → .output/public
npx serve .output/public
```

Deploy by uploading the contents of `.output/public` to the web root. The folder already
contains `sitemap.xml`, `robots.txt`, an `.htaccess` with 301 redirects for the 2016 URLs,
and meta-refresh stubs for the same URLs on hosts that ignore `.htaccess`.

## Updating content (the annual refresh)

All company facts and datasets live in `content/`. Nothing in `app/` repeats them.

| File | What it holds |
|---|---|
| `content/company.json` | Name, registration, phones, email, address, brands, dealerships |
| `content/clients.json` | The clientele wall, plus which names feature in the hero and corporate strip |
| `content/projects.json` | The project register (both disciplines), with the value flags below |
| `content/certifications.json` | Certification cards and registration-number slots |
| `content/brands.json` | One card per brand on /brands |
| `content/gallery.json` | Project photographs for /projects (empty = section hidden) |
| `content/why-choose-us.json` | "Why choose us" points for /about-us (placeholders = section hidden) |
| `content/glossary.json` | Plain-language glosses used on the public view |
| `content/navigation.json` | Menu order, routes, the audience switch, legacy URL redirects |

Each file starts with a `_readme` explaining its fields. Placeholders are written as the string
`"__TODO_CLIENT__"`; the site renders those as "pending" or hides the block, never as fake data.

**Project values.** `value` is the RM figure as a number. `valueApproximate` adds the `~`.
`valuePartial` adds the `*` (the register's "does not indicate the total project worth").
`valueConfidential: true` withholds the figure and shows "Confidential**".

After editing, run `npm run generate` and upload. The build fails loudly if a JSON file is malformed.

## Where things are

- `app/assets/css/styles.css` — the mockup stylesheet, byte-for-byte except one JS-off fix (noted inline).
- `app/assets/css/port.css` — everything the port added (audience switch, dealership badges, glosses, gallery, WhatsApp block).
- `app/utils/hero-engine.js` — the landing's scroll choreography, derived from the mockup's `main.js`.
- `app/layouts/landing.vue` — the landing's three-state masthead; `app/layouts/default.vue` — every other page.
- `app/pages/` — one file per route; `app/components/` — shared blocks.

## Constraints that must hold

- No server routes, no API handlers, no runtime dependencies. The enquiry form hands its message to WhatsApp or the visitor's mail client.
- Native scroll only; no scroll hijacking. GSAP loads lazily on the landing alone. `/corporate` ships no GSAP.
- Every route must stay readable with JavaScript disabled.
- Company facts are never invented. Missing facts stay `__TODO_CLIENT__`.
