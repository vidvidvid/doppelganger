# doppelgänger

A Max for Live reference-matching EQ and dynamics device for tracks, groups and the master.

[Download the latest build](https://download-production-14fa.up.railway.app/) · [Illustrated controls guide](https://download-production-14fa.up.railway.app/guide)

## Live source workflow (v0.3.0)

1. Insert `doppelgänger.amxd` and load a reference track.
2. Select **Live**, play a representative passage, and click **Learn**.
3. Capture finishes after 20 seconds, or click **Hold** after at least 3 seconds.
4. Select Precision or Filters to apply correction. Advice passes dry audio.

For master-guided correction of a track/group, insert the included **Master Feed** companion last on the master device chain, select **Master** in the processing instance, and enable the desired regions in Analysis. Keep one active companion per Set. The companion passes audio unchanged and exchanges only analysis messages. Its tap is before the master fader.

The master spectrum cannot identify which instrument caused a mismatch. Master mode provides guidance, not a predicted final master match. Switching to Master resets regional amounts to zero, clears custom points and disables dynamics. Use one correcting instance at a time and verify the actual master output. Continuous Follow is not implemented.

## Source layout

- `plugin/`: DSP, Max JavaScript UI, patch generators and synthetic tests.
- `website/`: Node download server, illustrated guide and Railway deployment scripts.
- `scripts/package.py`: builds a clean distributable from an explicit file list.

The local legacy `outputs/` and `work/` folders are deliberately excluded from Git. Continue development in `plugin/` and `website/`.

## Build and test

Requires Python 3 and Node.js 22. The build is self-contained and works on Linux, macOS and Windows. The generated device and companion files are intended for both macOS and Windows.

```sh
python3 plugin/build.py
node plugin/test_core.js
node plugin/test_fresh_start.js
node plugin/test_interaction.js
node plugin/test_platform.js
node plugin/test_live.js
python3 scripts/package.py
```

Unzip the complete release folder and keep all companion files together. Requires Max for Live. FFmpeg is optional for library imports and additional loudness scans; it is not bundled.

Native Max capture and automated state/UI tests have passed on macOS. Full multi-device Ableton playback and Windows testing for the new live modes remain pending. Live 11 compatibility is not verified.

## Website

```sh
cd website
node scripts/prepare-release.mjs '../dist/doppelgänger-share.zip' 0.3.0
node server.mjs
```

Deploy using `node scripts/publish.mjs '../dist/doppelgänger-share.zip' 0.3.0` after setting `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID` and `RAILWAY_PUBLIC_URL` and authenticating the Railway CLI. No account credentials or private deployment configuration are committed.

## Privacy

This repository contains no personal audio, Live Sets, captured audio, reference-library database, original track-analysis fixtures, account credentials or workstation paths. Test profiles are generated mathematically. Source audio stays local; learned profiles are stored with the Live Set. The reference library stores original file paths and analysis rather than duplicating audio.

## Automatic deployment

Pushes to `main` trigger Railway through its GitHub connection. The root Dockerfile runs the tests, builds both devices, packages the ZIP and prepares the website before deployment. Failed builds do not replace the running site. Pull requests run the same checks in GitHub Actions without deploying. No Railway credentials are stored in this repository or GitHub Actions.

Update `version.json` when making a numbered release. Every deployment includes its source commit in `/release.json`, even when the version number stays the same. Develop in `plugin/` and `website/`; ignored legacy working directories are not deployed.

To confirm a push reached production, compare the `sourceCommit` field at [release.json](https://download-production-14fa.up.railway.app/release.json) with the commit SHA on GitHub. The website and downloadable ZIP are deployed together.

See [AGENTS.md](AGENTS.md) for the required development/release workflow and [CHANGELOG.md](CHANGELOG.md) for versioned release notes. The build validates the current version and copies the canonical guide and release notes into the website and download.
