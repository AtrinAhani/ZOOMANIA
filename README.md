# ZOOMANIA

A bilingual (English / Arabic) cat website by **Atrin**, a Foundation Year student at Heriot-Watt University working toward Engineering Computer Science. ZOOMANIA is her first website.

- **4 main pages per language:** Home · Cat Breeds (with the Cat Care guide) · Cat Soulmate Quiz · Cats in Dubai
- **8 independent HTML pages** plus a lightweight root redirect
- **Open it without installing anything:** double-click `docs/index.html`
- Official ZOOMANIA logo, icon and favicon
- Animated SVG cats that blink, twitch their ears, sway their tails and follow the cursor
- Gentle motion: headline words rise in, paw prints drift, cards tilt, stats count up, the About timeline fills as you scroll, and the portrait ring rotates. All of it is switched off for visitors who ask for reduced motion.
- One game, the **Cat Soulmate Quiz**: 10 questions, deterministic weighted scoring, and a result card you can download, copy or share
- Accessibility target is WCAG 2.2 AA, checked automatically with axe-core
- SEO: canonical tags, hreflang, Open Graph, JSON-LD, sitemap and robots

---

## Technology

| Part | Technology |
|---|---|
| Pages | Plain **HTML5**, generated at build time by a small **Node.js** script (ES modules). No framework. |
| Styles | One hand-written **CSS3** file (`src/assets/css/main.css`) with custom properties, logical properties for right-to-left text, and media queries |
| Behaviour | **Vanilla JavaScript** (`src/assets/js/*.js`), with no runtime libraries |
| Build tools | `sharp` (logo and icon images), `opentype.js` and `@fontsource/plus-jakarta-sans` (text drawn into the social-share image) |
| Tests | `playwright` (headless Chrome) and `axe-core` (accessibility) |
| Fonts | Plus Jakarta Sans (English) and Tajawal (Arabic), loaded from Google Fonts under the SIL Open Font License |

The site is **not** built with React, Vite or Next.js. A small static generator writes every page as finished HTML from one shared content model, so the output needs no framework at runtime and works from any static host, or straight from your disk.

### Versions

- **Node.js 22 LTS** (in `.nvmrc`; any version from 20.19 upward works)
- npm 10 or later
- Exact package versions are pinned in `package.json` and locked in `package-lock.json`:

| Package | Version |
|---|---|
| sharp | 0.35.5 |
| opentype.js | 1.3.4 |
| @fontsource/plus-jakarta-sans | 5.3.0 |
| playwright | 1.65.0 |
| axe-core | 4.14.0 |

All of these are **development** tools. The published website has no npm dependencies.

---

## Run it locally

```bash
# 1. Use the right Node version (if you have nvm)
nvm use

# 2. Install exactly the locked versions
npm ci

# 3. Build the site into docs/
npm run build

# 4. Preview it at http://localhost:4173/
npm run preview
```

`npm start` does steps 3 and 4 together.

You can also open `docs/index.html` directly in a browser with no server. Every link is relative, so this works.

### Tests

```bash
npm run check          # static checks: page set, links and anchors, SEO tags, colour contrast
npm test               # build, static checks, then the browser tests
```

The browser tests open every page in English and Arabic at desktop (1366 px), tablet (820 px) and phone (390 px) widths. They check for console errors, horizontal overflow and axe accessibility violations. They also run:

- the quiz with a mouse and with the keyboard only
- the result-card download
- the breed filters and the comparison table
- the About, Mission and Cat Care anchor links
- the mobile menu
- every page under a GitHub Pages project sub-path (`/zoomania/`)

The tests use Google Chrome if it's installed. Otherwise run `npx playwright install chromium` once.

---

## Project structure

```
zoomania/
├── .github/workflows/
│   ├── deploy-pages.yml      builds and publishes to GitHub Pages on every push to main
│   └── test.yml              full test suite on pull requests
├── docs/                     ← the built website (committed; open docs/index.html)
│   ├── index.html            root redirect to en/index.html
│   ├── en/  index · breeds · quiz · dubai .html
│   ├── ar/  index · breeds · quiz · dubai .html
│   ├── assets/  css · js · brand · images
│   ├── sitemap.xml · robots.txt · site.webmanifest · .nojekyll
├── src/
│   ├── content/en.mjs, ar.mjs     all page copy, one file per language
│   ├── data/breeds.mjs            8 breeds: bilingual text, filters, trait profiles
│   ├── data/quiz.mjs              10 questions × 4 answers with weights
│   ├── lib/cat.mjs                animated SVG cat generator
│   ├── templates/layout.mjs       <head>, header, footer and language switch
│   ├── templates/pages.mjs        Home, Breeds+Care, Quiz and Dubai page bodies
│   └── assets/
│       ├── css/main.css           the design system
│       ├── js/main.js             navigation, scroll reveal, cats, motion layer
│       ├── js/breeds.js           filters and breed comparison
│       ├── js/quiz.js             quiz engine, scoring, result card, share and copy
│       ├── brand-source/          official logo, icon and favicon artwork
│       ├── images/atrin.jpg       founder portrait
│       └── photos/                optional real breed photos (see below)
├── scripts/
│   ├── build.mjs                  generator: src → docs
│   ├── serve.mjs                  zero-dependency preview server
│   ├── check.mjs                  static checks
│   └── browser-test.mjs           headless-Chrome tests
├── zoomania.config.json           public site address (siteUrl)
├── package.json · package-lock.json · .nvmrc
└── .gitignore · .gitattributes · .editorconfig
```

### Editing the site

1. Change text in `src/content/en.mjs` and `src/content/ar.mjs`, or breed and quiz data in `src/data/`.
2. Change styles in `src/assets/css/main.css` and behaviour in `src/assets/js/`.
3. Run `npm run build`. **Never edit files inside `docs/` by hand**, because the next build overwrites them.
4. Commit both `src/` and `docs/`.

### Adding real breed photos (optional)

Save openly licensed photos as `src/assets/photos/<slug>.jpg`, about 960×800 px. The slugs are `persian`, `ragdoll`, `maine-coon`, `siamese`, `bengal`, `british-shorthair`, `sphynx` and `scottish-fold`. Then rebuild. Each breed switches from its illustration to the photo automatically. If a licence requires attribution, add it on the Breeds page.

### Quiz scoring

1. Each answer gives a value from 0 to 4 on one or more of six dimensions.
2. Your score on each dimension is the average of the values your answers gave it.
3. That average is stretched ×1.5 around the midpoint and clamped to 0–4.
4. The distance to each breed is the mean absolute difference from that breed's profile.
5. The closest breed wins. Match % = 100 − distance × 25.

This is labelled as entertainment, not a psychological measure. All 1,048,576 answer combinations were tested, and every breed can come up as a result.

---

## Publish on GitHub Pages

All links and asset paths are **relative**, so the site works at `https://<username>.github.io/<repository>/` with no base-path setting. A test covers this.

### Option A — GitHub Actions (recommended)

1. Push the repository to GitHub on the `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab. "Deploy to GitHub Pages" runs automatically, or start it with **Run workflow**.
5. When it finishes, the site is live at `https://<username>.github.io/<repository>/`.

The workflow sets the correct site address for canonical URLs and the sitemap automatically.

### Option B — Deploy from the `docs/` folder (no Actions)

1. Open **Settings → Pages → Source: Deploy from a branch**.
2. Choose branch **main** and folder **/docs**, then press **Save**.
3. Set `"siteUrl"` in `zoomania.config.json` to your Pages address, run `npm run build`, and commit `docs/` again.

### Site address

`zoomania.config.json` holds the address used in SEO tags:

```json
{ "siteUrl": "https://<username>.github.io/<repository>" }
```

You can also pass it for a single build:

- macOS / Linux: `SITE_URL=https://… npm run build`
- Windows PowerShell: `$env:SITE_URL="https://…"; npm run build`

---

## Content notes

- The Dubai information was checked against Dubai Municipality and UAE sources in November 2026. Check it again before major updates and change the "last checked" line in `src/content/*.mjs`.
- Contact details are deliberately marked "not configured". Add real details only when you have them.
- The repository contains no API keys, passwords or private data.
- The founder portrait is published with the site, so only publish it with Atrin's permission.

© Atrin — ZOOMANIA, an educational university project.
