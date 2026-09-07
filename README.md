# BOUSSIAS — AI in Marketing 2026

Responsive static conference site. Production files are in `dist/`. No build or dependency installation is required.

- Ticket links open the supplied Eventora booking page.
- Speaker buttons open accessible native dialogs containing the supplied session descriptions.
- The full agenda opens the organiser’s existing agenda page.
- Sponsorship enquiries open an email draft to the supplied contact.
- Fonts, portraits, sponsor logos and venue photography are served locally.

Edit `dist/index.html`, `dist/styles.css`, and `dist/app.js`. Speaker data is preserved in `dist/speakers.json` and embedded in the page as `speaker-data`; update both when editing a session.

## Immersive blue redesign

`dist/experience.css` defines the revised art direction. `dist/motion.js` handles the hero atmosphere, pointer and scroll parallax, entrance animations, and speaker hover effects. A visible pause control and system reduced-motion preferences stop decorative animation. Animation loops suspend when the hero is offscreen or the tab is hidden. The generated glass artwork is stored locally in `dist/assets/innovation-wave.png`.

## Full content restoration

`dist/content.css` and `dist/content.js` add the source-site countdown, complete topic accordion, sponsorship benefits and enquiry form. The enquiry form validates details, reveals callback preferences, and prepares a reviewable email draft; it does not send or store personal data. The original organiser-hosted form remains linked for online submission. Native required fields and the optional, unchecked communications opt-in match the supplied form. Speaker profile links are included inside session dialogs.

See `CONTENT_AUDIT.md` for the content comparison and scope.

## Run locally

Serve the static site with `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000. No package installation or build step is needed. For static hosting, use `dist` as the publish directory.

## Deployment

`.github/workflows/deploy-pages.yml` publishes `dist/` to GitHub Pages on every push to `main`, and can also be run manually from the Actions tab. Pages must first be enabled once under Settings → Pages with **Source: GitHub Actions**; the workflow token is not permitted to enable it. The live site is served at https://maxim-constantinou-avocadots.github.io/Boussias-Landing-Page/. All asset paths are relative, so the site works correctly under that project subpath. `dist/.nojekyll` stops Pages from running Jekyll over the output.

## Wix headless deployment

`wix/` holds a Wix-managed headless Astro project that serves the same site from Wix hosting at
https://boussias-avocadots-0809.wix-site-host.com. `dist/` remains the single source of truth: the
project carries only the hand-written files, and `python3 wix/sync-from-dist.py` regenerates
everything derived from `dist/` (the `public/` assets, and the `head.html`/`body.html` fragments that
`src/pages/index.astro` injects verbatim with `set:html`, so Astro never JSX-parses the markup).

To publish a change: edit `dist/`, then

```sh
python3 wix/sync-from-dist.py
cd wix && npx @wix/cli@latest build && CI=1 npx @wix/cli@latest release
```

The enquiry form additionally posts to Wix Forms via `src/pages/api/enquiry.ts`, so submissions land
in the Wix dashboard and create a CRM contact. The existing reviewable email draft is unchanged and
still works if that call fails. Run `npx @wix/cli@latest env pull` after cloning to create
`.env.local` (gitignored — it holds the client secret).
