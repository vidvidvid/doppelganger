# Release notes

## 0.3.0 — 2026-10-03

- Added Live input and Master feed source modes alongside File analysis.
- Added Learn/Hold: capture up to 20 seconds, or Hold after at least 3 seconds. Learned profiles save in the Live Set.
- Added the Master Feed companion. Place one instance last in the master device chain; it passes audio unchanged and sends analysis messages only.
- Added a Source editor tab and compact source selector. Switching to Master starts regional amounts at zero, clears custom points and disables dynamics so users explicitly select what to correct.
- Added missing/duplicate-feed and silent-capture handling. The processing instance passes dry while learning.
- Updated the website and offline guide with setup instructions and limitations.

Upgrade: replace the entire unzipped device folder. Keep all companion files together. Existing file-based saved sessions retain File mode. For master-guided correction, choose allowed regions in Analysis before evaluating the result.

Validation: automated synthetic math/UI/state/platform tests and an isolated native Max capture test passed on macOS. Full multi-device Ableton playback and Windows validation remain pending; Live 11 is not verified. Master guidance cannot isolate instruments or predict final master matching. Learn/Hold is finite; continuous Follow is not implemented.
