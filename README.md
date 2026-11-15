<div align="center">

# SULCO

**NASA Earth data, pressed into sound.**

A sonification studio for the planet. Every month of the global temperature record becomes a note;
every wildfire detection becomes a pulse. Built for the NASA Space Apps Challenge — *The Earth Information Jukebox*.

`Next.js 15` · `React 19` · `TypeScript` · `Web Audio API` · no chart libraries

</div>

---

## Why SULCO

*Sulco* is Portuguese for the groove of a record. Climate data has a groove too: a slow, physical
pattern that is hard to see in a spreadsheet and immediately obvious when you hear it.

SULCO connects three things that are usually separate:

1. **The official visualization** — NASA SVS media, embedded and credited.
2. **The scientific record** — GISTEMP v4 and FIRMS, parsed without smoothing or filling gaps.
3. **The sound** — a deterministic, documented mapping from data to pitch.

The result is a product, not a demo: bilingual (EN / PT-BR), keyboard-first, screen-reader tested,
and honest about what the data does *not* say.

## Features

- **Interactive record** — play a decade of monthly anomalies straight from the landing page.
- **Climate Spiral** — a real sonification player with spiral and line views, seek, speed and volume.
- **Wildfires (in validation)** — near-real-time VIIRS detections from NASA FIRMS, mapped to pitch and pulses.
- **Data Explorer** — filter any period, inspect every value, download the exact slice you heard as CSV.
- **Accessibility Center** — high contrast, reduced motion, text scaling, larger targets, focus ring,
  captions/transcript, live announcements and optional VLibras (Libras) support.
- **NASA APIs** — Climate queries NASA automatically with an identified local backup. Wildfires checks FIRMS product availability before querying satellite detections; the map follows the selected day.
- **Local backup** — GISTEMP is committed under `public/data/climate`; climate playback remains available when NASA cannot be reached.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # parser, player, selection and FIRMS aggregation tests
npm run build
```

Optional — refresh the climate dataset from NASA:

```bash
npm run update-data
# or use a manually downloaded file
npm run update-data -- --from-file ./GLB.Ts+dSST.csv
```

Optional — enable the wildfire experience:

```bash
cp .env.example .env.local   # then set FIRMS_MAP_KEY
```

`FIRMS_MAP_KEY` is server-only and never exposed to the browser. Without it, the experience explains
what is missing instead of showing substitute data.

## How the mapping works

| Data | Sound |
|---|---|
| Monthly temperature anomaly | one sine note, `f = 440 × 2^(anomaly / 4)` Hz |
| 0 °C anomaly | 440 Hz (A4) |
| Wildfire mean FRP per day | pitch on a log scale across the selected period |
| Detections per day | number of pulses (1–6) |

The mapping is an **artistic choice**, not a physical law. It is documented in the UI and in
[`DATA_SOURCES.md`](./DATA_SOURCES.md). Missing values are skipped, never interpolated.

## Accessibility

- WCAG 2.2 AA target; skip link, landmarks, headings, visible focus and 44px+ targets.
- Every sound event has a text equivalent; charts have text descriptions and an accessible table.
- Audio never autoplays. Motion, contrast, type size and verbosity are user-controlled and persisted.
- Bilingual EN / PT-BR with `lang` switched at runtime.

## Architecture

```
app/                 routes, metadata, NASA proxy routes
components/          UI, player, charts (SVG), accessibility dialog
lib/gistemp.ts       GISTEMP CSV parser (no gap filling)
lib/firms.ts         FIRMS CSV parser + daily aggregation
lib/audio/           AudioEngine (Web Audio), Player (sequencer), mapping
lib/eic/             experience catalog and status
public/data/climate  committed GISTEMP copy + provenance metadata
scripts/update-data  dataset refresh with SHA-256 provenance
```

Server routes proxy NASA so API keys stay server-side: `/api/nasa/gistemp`, `/api/nasa/fires`,
`/api/nasa/climate-spiral`, and `/api/nasa/fires/availability`. FIRMS returns CSV upstream; these routes expose JSON to the UI.

## Deploy

Any Node host that supports Next.js (Vercel recommended). Set `FIRMS_MAP_KEY` in the environment.
The climate dataset is committed, so a cold deploy still renders the full experience.

## Credits

Data and visualizations: **NASA GISS** (GISTEMP v4), **NASA FIRMS** (VIIRS), **NASA Scientific
Visualization Studio** (SVS 5057 / 5190 / 5113). Public data, used under NASA's media guidelines.

SULCO was created for the NASA Space Apps Challenge hackathon and its “The Earth Information Jukebox” challenge.

The former `/discover` page redirects to `/experiences`. Experiences contains the climate and wildfire tools; exploratory categories have been removed from navigation.
