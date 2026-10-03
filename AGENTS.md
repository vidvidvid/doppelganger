# doppelgänger development and release flow

## Canonical files

- Develop the plugin in `plugin/`. `plugin/build.py` and `plugin/live_build.py` generate the main device and Master Feed companion.
- `version.json` is the release version authority.
- `CHANGELOG.md` is the release-notes authority. Keep newest releases first, with headings exactly `## <version> — YYYY-MM-DD`.
- `plugin/GUIDE.html` and `plugin/guide-images/` are the guide authority. The build copies them to the website; do not edit the website copy independently.
- `website/dist/index.html` is the landing page. Its version, date, ZIP size and checksum come from generated release metadata.
- Legacy `outputs/` and `work/` are private local history, not source or deployment inputs. Do not publish or force-add them.

## For each user-visible plugin change

1. Implement the change in `plugin/`, including builders and dependencies when needed. Update both devices if their protocol changes.
2. Bump `version.json` for a numbered release. Add a dated CHANGELOG entry explaining behavior, upgrade steps, and limitations. Do not claim unperformed Ableton/Windows tests.
3. Update `plugin/GUIDE.html`: version label, controls, setup, and accurate limitations. Refresh affected screenshots or explicitly identify their older version.
4. Update the landing page if the advertised features or requirements changed. Keep the plugin, release notes, guide and website description consistent.
5. Run `sh scripts/build-release.sh` from the repo root with Python 3 and Node 22. This checks documentation/version consistency, runs tests, builds both devices, creates the allowlisted ZIP, and prepares website metadata.
6. Inspect the Git diff and staged file list for privacy. Never commit or package personal tracks, captures, Live Sets, reference-library databases, real-track analysis fixtures, workstation paths, credentials or private deployment configuration. Use synthetic tests. Do not broaden package or Docker allowlists casually.
7. Commit the complete source/docs change together. Push to `main` when deployment is authorized. Branch/PR checks do not deploy.
8. Wait for GitHub checks and Railway deployment. Verify `/health`, the public guide/release notes, and `/release.json`: `sourceCommit` must equal the pushed commit. Download `/download/latest` and confirm its SHA256 matches release metadata and that both devices, guide and CHANGELOG are present.
9. Only report publication complete after live verification. A Git push alone is not proof. If the build fails, fix it and push; the previous healthy release should remain live.

## Automatic deployment

The Railway download service is connected to `vidvidvid/doppelganger`, branch `main`. Every push triggers the root Dockerfile. That build runs the same release script as GitHub Actions, so failed tests/builds prevent publication even without Railway's separate Wait for CI option. No Railway token is stored in GitHub.

The image serves one generated release bundle: website, guide, CHANGELOG, metadata and ZIP from the same commit. Do not replace `/download/latest` separately or upload an older local ZIP after an automatic deployment. `sourceCommit` is public provenance; credentials and private service identifiers are not needed in Git.

For documentation-only or infrastructure-only changes, a version bump is optional, but the existing version must have release notes. Every deployment still records its commit. Use the established Railway project; do not create another service/site. The local manual deployment script is a fallback, not the regular release path.

## Checks and limits

Automated math, UI/state, platform-path and live-capture tests do not substitute for real multi-device Ableton playback or Windows testing. Preserve that distinction in release notes and user replies. No continuous Follow mode exists. Master Feed sends analysis, not audio; master guidance cannot isolate instruments or guarantee the final master match.
