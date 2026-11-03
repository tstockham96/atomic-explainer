# Open-source release preparation — 2026-11-02

Explode's own code is MIT licensed. Third-party software and assets retain their separately documented terms in `THIRD_PARTY.md` and the accompanying asset notices. Public availability is distinct from verified reconstruction quality: the current project should be described as an experimental, agent-assisted research and authoring tool.

## Repository review

- GitHub repository: `tstockham96/explode`. Visibility was PRIVATE when inspected.
- Default branch: `main`. The current implementation is on `design/editorial-explainer`, draft PR #1. Publishing the repository alone does not merge that work into the default branch.
- Gitleaks v8.30.1, downloaded from its official release with SHA-256 checksum verification, scanned all reachable local Git refs (26 commits at the time of the initial audit) with zero findings. Reports were redacted. A clean scan is evidence, not a guarantee that no sensitive information exists.
- The staged release/story changes also passed a redacted Gitleaks scan with zero findings.
- Git history path review found `.env.example` only; no `.env` secrets, `assets.local` directories, `apple-reference.glb`, `internal-study.glb`, or `source.jpg` inputs were committed.
- The manufacturer iPhone asset and its combined derivative remain local and ignored. Public exports use a source-review page; the construction fixture is not presented as a finished reconstruction.
- Existing committed images in `evals/reports/iphone-assembly/` were checked: they show the project-authored construction fixture, not the manufacturer asset.
- Workshop CC0 source notices, Chronograph CC BY attribution, Murph provenance and HDR attribution, and engine authorship notices accompany the included assets. MIT does not grant trademark rights or third-party model rights.

## Publication boundary

The completed story changes should be reviewed in the existing PR. Making the repository public exposes its Git history, not just the latest files. Do not change visibility or merge solely because a preview passes. The owner chooses the publication timing; the planned fresh-object test remains outstanding. API provider access, optional Blender authoring, and separately licensed source assets are not bundled with the MIT application.

No package publication, hosted public deployment, automatic provider spending, or repository visibility change is performed by this preparation.

## Final release preparation

The owner explicitly authorized merging and public visibility on 2026-11-02 after the checks below. The proposed fresh-object holdout remains a future quality evaluation, not a prerequisite imposed on publication.

- Fetched both remote branches and rescanned all 27 existing commits with Gitleaks: zero findings. No credentials were opened or copied into release artifacts.
- A fresh Git archive installed dependencies and built all public examples with provider variables unset. The archive contains no ignored local assets; its iPhone route is a source review and contains no GLB. The existing private local preview was preserved.
- The dependency audit reported zero known vulnerabilities. All 161 regression tests and TypeScript checks passed. Existing lint warnings remain documented.
- Development and preview servers now bind to localhost, matching the studio. Added a security reporting/use policy and a checksum-verified Gitleaks workflow that scans history on every push/PR.
- The old CI job consistently exceeded its 15-minute budget on software graphics. Browser checks now run across eight independent shards, with explicit software-renderer time budgets. No test cases or quality assertions were removed.
- Scroll/camera easing now follows elapsed wall time on slow renderers; hidden story labels no longer recalculate every component's bounds each frame. The previously failing desktop generic-story check passed locally under software rendering after this fix.

The repository's open-source publication is separate from npm publishing or a hosted deployment; neither is included in this release.

Software-runner follow-up: review hooks expose whether the actual render/camera has settled. Browser checks wait on that state instead of fixed sleeps; pause checks wait through the final queued redraw. The exhaustive 144-position handoff review has an explicit longer budget. Assertions and component coverage are unchanged.
