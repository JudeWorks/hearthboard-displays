# Publishing and releases

## Public/private boundary

Only this dedicated repository may be pushed to `JudeWorks/hearthboard-displays`. Never initialize a public Git repository in the shared parent workspace or push a private app repository. No submodules, private source downloads, secrets, signing stores, backups, user screenshots, internal notes, or application runtime data belong here.

The source-boundary check rejects app-source extensions, credentials, unapproved top-level files, and accidental private paths. It is an additional check, not a substitute for reviewing `git diff --cached` before publication. Use an explicit release file list; never upload a whole build folder or source archive.

## Cloudflare Pages

The project is a **Direct Upload** Pages project with production branch `main`. `npm run deploy` validates, builds, and publishes with an existing local Wrangler login. Run the generated-link check before deployment as well. Cloudflare's git integration cannot be enabled on a Direct Upload project later without creating a different project; the optional GitHub Actions deployment workflow provides CI-based uploads instead.

For a fresh account:

```sh
npx wrangler login
npx wrangler pages project create hearthboard-displays --production-branch main --force
npm run deploy
```

Use the Free plan. This site does not create Workers, R2, databases, or other metered services. Pages limits still apply. Domain registration and renewal are separate if a custom domain is used.

The optional manual GitHub deployment workflow needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets in the `production` environment. Use a narrowly scoped Pages-edit token. Never put the local Wrangler OAuth token into the repository or workflow secrets. Local publishing works without creating another token.

If Cloudflare returns a pages.dev hostname different from the configured one, update `site` in `astro.config.mjs`, the sitemap line in `public/robots.txt`, and the website link in README.md, then rebuild.

## First application releases

No old local APK or unverified firmware was published with the website. Before the first public binary:

### Frame

1. Build from the intended private source revision and record its full commit hash. Run that project's required tests and verify the complete signed release on a compatible physical frame.
2. Replace the explicitly marked **test update key** with a real production public key. Keep its private signing material outside both repositories. Preserve the existing production APK certificate if an existing release must update in place.
3. Verify `com.judeworks.hearthboard`, non-debuggable release settings, minimum Android version, version name, increasing versionCode, and APK certificate. Test clean install, update-in-place without data loss, pairing, feeds, network recovery, and reboot startup. Verify HTTPS downloads on the oldest supported Android firmware.
4. The public brand is Hearthboard Frame. Existing app builds may still show Hearthboard Frame (beta); the site does not modify the private app's name or source.
5. Prepare public release notes and complete bundled third-party notices. Document unsupported hardware features and that in-app updates remain unavailable until their separate end-to-end release work is complete.

### Ink

1. Use a verified release build for **Seeed EE04 / XIAO ESP32-S3 Plus**, not a development-console image or another panel. Record its full private source commit. Ensure the image contains no credentials or user data.
2. Run the firmware's required host checks and verify the image on the intended physical board. Check first boot, Wi-Fi setup, pairing, a basic dashboard, buttons, wake/sleep, and recovery.
3. Produce one **merged ESP32-S3 image** using that build's `flasher_args.json`: bootloader at `0x0`, partition table at `0x8000`, application at `0x10000`; flash settings DIO, 16 MB, 80 MHz for the current EE04 layout. Do not use the generic original-ESP32 bootloader offset `0x1000`.
4. Use ESP-IDF's installed esptool and `merge-bin` / `merge_bin` syntax appropriate to that version. Keep temporary package output under your system temporary directory. Do not copy NVS, identity keys, credentials, or a whole-device flash dump.
5. The initial browser install is a fresh installation and can erase data. The image uses the factory application layout; it does not provide OTA. Do not enable irreversible eFuse settings as part of preparing a website release.
6. Browser-flash the image through the site from desktop Chrome or Edge and complete Wi-Fi/pairing before marking its release verified. A passing static website build is not a hardware flash test.

## Stage a verified release

Create public notes and notices outside the app source trees; no private customer data. Use a temporary output directory outside this checkout. Do not set `--verification passed` until the above checks actually pass.

```sh
npm run prepare:release -- \
  --product ink \
  --version 1.0.0-beta.1 \
  --file /path/to/verified-merged-image.bin \
  --source-commit FULL_40_CHARACTER_COMMIT \
  --notes-file /path/to/public-release-notes.md \
  --notices-file /path/to/complete-third-party-notices.txt \
  --verification passed \
  --output /path/to/temporary-release-assets
```

For Frame, use `--product frame`, the APK file, and `--aapt /path/to/build-tools/aapt --apksigner /path/to/build-tools/apksigner`. The script reads package metadata from the signed APK, refuses debug packages and the known test update key, and checks versionCode increases. The APK certificate still requires the maintainer's expected-certificate comparison; signature validity alone cannot identify the intended publisher.

The script stages only a named binary, SHA256SUMS, notices, release notes, and catalog metadata. The Ink image and manifest are copied to a versioned same-origin path, avoiding cross-origin browser downloads. APKs stay in GitHub Releases.

## Publish in this order

1. Run `npm run check`, `npm test`, `npm run build`, and `npm run check:links`.
2. Review staged website changes. Verify the intended APK certificate or firmware provenance and complete hardware/browser checks above.
3. Create a GitHub release tagged `ink-vVERSION` or `frame-vVERSION`. Mark beta versions as prereleases. Upload **only** the named binary, `SHA256SUMS`, and `THIRD_PARTY_NOTICES.txt`; use `RELEASE_NOTES.md` as the release body. Never pass a build-folder wildcard to `gh release create`.
4. Verify the public asset downloads and its checksum. The catalog's download URL must resolve before the site exposes it.
5. Commit/push only this website repository, then run `npm run deploy`. Verify the live product page and release catalog. Keep manifests revalidated and versioned binary assets immutable.
6. Remove temporary release exports when finished. Never overwrite a published binary under an existing version; cut a new version instead.

The website's product catalog is not an Android signed-update manifest. Do not point an existing app updater at it. Production app-update signing, version comparison, and installation behavior require their own end-to-end verification in the private application.
