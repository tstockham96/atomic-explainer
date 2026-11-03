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
