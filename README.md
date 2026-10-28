# Rakibul Islam Akash — Portfolio

Zero-build personal portfolio for GitHub Pages. The site uses semantic HTML, CSS custom properties, and one deferred ES module. Project content lives in `data/projects.js` so URLs and case-study copy can be updated without searching through the page.

## File Tree

```text
.
├── 404.html
├── README.md
├── index.html
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── assets/
│   ├── apple-touch-icon.svg
│   ├── favicon.svg
│   ├── og-image.svg
│   └── resume-placeholder.txt
├── css/
│   ├── base.css
│   ├── components.css
│   ├── sections.css
│   └── tokens.css
├── data/
│   └── projects.js
└── js/
    └── main.js
```

## Local Preview

Because the project uses ES modules, serve it over HTTP rather than opening `index.html` directly.

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`.

## GitHub Pages Deploy

1. Create or use the repository `AxisAkash/My_Portfolio`.
2. Put these files at the repository root.
3. In GitHub, open **Settings → Pages**.
4. Set the source to **Deploy from a branch**, select the default branch, and select `/ (root)`.
5. Wait for Pages to publish `https://axisakash.github.io/My_Portfolio/`.

If a custom domain is added, update the canonical URL, `og:url`, social image URLs, `robots.txt`, `sitemap.xml`, the JSON-LD URL fields if added later, and the `start_url` in `site.webmanifest`. Add a `CNAME` file only when the domain is confirmed.

## Contact Form Setup

The form is wired for Formspree using `fetch`, accessible inline validation, a honeypot field, loading/disabled state, success/error state, and a `mailto:` fallback. Replace `ENDPOINT_TODO` in `index.html` with the endpoint from the Formspree form. Until then, the form intentionally opens the visitor's email client instead of pretending a message was sent.

## TODO / Placeholder Checklist

- [ ] Replace `assets/resume-placeholder.txt` with the real résumé PDF and keep the download link.
- [ ] Replace `TODO_SOFOL_GITHUB_URL` in `data/projects.js`.
- [ ] Replace `TODO_SOFOL_BACKEND_URL` in `data/projects.js`.
- [ ] Replace `TODO_CAR_RENT_LIVE_URL` in `data/projects.js`.
- [ ] Replace `TODO_CAR_RENT_GITHUB_URL` in `data/projects.js`.
- [ ] Replace `TODO_AI_CALCULATOR_LIVE_URL` in `data/projects.js`.
- [ ] Replace `TODO_AI_CALCULATOR_GITHUB_URL` in `data/projects.js`.
- [ ] Replace `ENDPOINT_TODO` in `index.html` with a real Formspree endpoint.
- [ ] Supply real project screenshots for `TODO_SCREENSHOT_SOFOL`, `TODO_SCREENSHOT_CAR_RENT`, `TODO_SCREENSHOT_AI_CALCULATOR`, and `TODO_SCREENSHOT_RENTAL_MANAGEMENT`; update the visual markup or data model when supplied.
- [ ] Export `assets/og-image.svg` to a 1200×630 `assets/og-image.png` if PNG sharing compatibility is required, then update `og:image` and `twitter:image`.
- [ ] Add raster favicon and Apple touch icon PNGs if a browser/device-specific PNG set is required.
- [ ] Confirm whether “Currently exploring: Docker, CI/CD” should be shown. It is intentionally omitted until confirmed.
- [ ] Confirm the live résumé filename and any custom domain before publishing.

## Self-Audit

| Area | Score | Notes |
| --- | ---: | --- |
| Design | 9/10 | Editorial grid, restrained jade accent, serif/neo-grotesque/mono pairing, strong hierarchy, no gradients, glow or glass cards. |
| Content | 9/10 | Internship, newest project order, role-based architecture, education, skills, honest research status, and supplied contact links are represented. Missing URLs and assets are explicit TODOs. |
| Accessibility | 8/10 | Semantic landmarks, skip link, one h1, visible focus, keyboard dialog, mobile menu focus trap, inline errors, reduced motion, and forced-colors rules are included. A real browser audit is still recommended. |
| Performance | 8/10 | No framework, no icon dependency, deferred module, small CSS/JS, generated CSS visuals, and no large images. The Google Fonts request and SVG OG asset remain external/optional costs. |
| SEO | 8/10 | Canonical, description, Open Graph, Twitter card, theme colors, sitemap, robots, manifest, favicon, and Person JSON-LD are included. A PNG OG image and PNG favicon set remain optional TODOs. |

### Not Fully Deliverable Without Supplied Inputs

Real project screenshots, project repository/demo URLs, a résumé file, and a Formspree endpoint cannot be invented. The site ships visibly marked fallbacks for each. Hindi is omitted because it was not confirmed.
