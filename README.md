# Hearthboard Displays

The public setup website for **Hearthboard Ink** (ESP32 e-paper) and **Hearthboard Frame** (Android photo frames).

Website: https://hearthboard-displays.pages.dev

This repository contains only the website, public documentation, and explicitly selected binary release assets. The iOS, Android, and firmware source repositories remain private. Do not copy sibling projects into this repository.

## Local development

Use Node.js 22.22.0 or newer and npm.

```sh
npm ci
npm run dev
```

The website is static Astro. It has no application server, accounts, database, paid storage, or runtime API dependency. ESP Web Tools is bundled locally. The font and brand icon are served locally.

```sh
npm run check
npm test
npm run build
npm run check:links
npm run preview
```

`npm run check` verifies the public-source boundary and release metadata. `check:links` checks the generated site's internal links and anchors. See PUBLISHING.md for publishing and release requirements.

## Content

- `src/pages/`: landing, Ink, Frame, downloads, and guide pages.
- `src/data/guides.ts`: nine public setup and support guides.
- `src/data/releases.json`: current verified public releases. A `null` product shows a clear unavailable state, not a fabricated download.
- `public/firmware/`: only explicitly staged, versioned EE04 merged firmware and ESP Web Tools manifests.
- `scripts/prepare-release.mjs`: validates selected release files and stages metadata without reading private source trees.
- `.github/workflows/`: website validation and optional manual Cloudflare deployment. No private app checkout.

## Hosting

Cloudflare Pages Free serves the site and current firmware. GitHub Releases hosts Android APKs, firmware archives, checksums, and notices. The default pages.dev URL avoids purchasing a domain. A custom subdomain can be added later without changing the app-source privacy model.

The first deployment intentionally has no application binaries: existing local artifacts are not verified public releases. Publishing website source does not publish private app source. GitHub's automatically generated source archives contain this website repository only.
