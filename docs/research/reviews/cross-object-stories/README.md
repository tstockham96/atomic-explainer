# Cross-object assembly-story review — 2026-11-02

The real Porsche and local iPhone previously retained the old outside-in exploded tour despite the reusable story contract. Their spec builders now load researched scripts from `docs/research/`, preserving the story on every rebuild.

- Porsche: 29 physical groups, 26 component lessons, four subsystem milestones. Matching crankcase halves, cylinder banks and heads remain paired. The path follows rotation, support, valve timing, breathing, ignition, cooling and lubrication before enclosure covers close.
- iPhone: 28 physical groups, 28 component lessons, four subsystem milestones. The path follows stored energy, computation, power/data connections, imaging, sensing/feedback, structure and protection. Distinct board layers and edge controls remain individual lessons.
- Both begin assembled, reveal a core, inspect real geometry through a full turn, accumulate each part, and finish assembled. Milestones reuse previously taught meshes without adding inventory or replacing lessons. Detailed anatomy uses the original research and declared pairs.

The actual GLBs were rebuilt from the existing geometry/material sources. This is not a new Tripo generation or a new Blender product reconstruction. Source-image fidelity, hidden geometry and material uncertainties are unchanged; the scripts explicitly describe educational order rather than manufacturing/service procedure. The iPhone's old exterior-only copy incorrectly described an empty interior and missing coil; it now describes the actual combined study and its limitations.

Review also found and corrected two shared problems: menu jumps bypassed Lenis and could be overwritten by continuing wheel momentum; and center-only visibility probes missed hollow/disconnected geometry. Navigation now uses the active scroll driver, while visibility probes include real mesh surface points. Review snapshots no longer mutate the displayed pose.

Public screenshots in this folder show the project-authored engine. Local phone screenshots stay in ignored browser results because the sourced model has no established redistribution permission. This review does not give a new fidelity or release-quality score and does not demonstrate unattended photo-to-internals reconstruction.

## Validation

- All 161 unit/integration regressions passed; TypeScript passed. Lint completed with 17 existing warnings.
- Six hardware-Chrome browser checks passed: both actual studies at 1440×900 and 390×844, plus the separate imported-model fixture at both sizes. Each real study visits every chapter at three rotation positions and then verifies cumulative seating. The runs also cover public selection, wheel reversal and a whole-object reset during remaining wheel momentum.
- Both exported `story-review.json` files report complete lesson coverage, four milestones, and `ready: false`. Structural success does not certify fidelity.
- `node --import tsx tools/evals/run.ts` completed. Existing quality reviews remain not-ready; their review/spec/asset freshness failures are retained rather than replacing old fidelity scores with an unearned pass.
- All-history and staged-change Gitleaks scans found zero secrets. The release remains private and the PR remains a draft.

The desktop engine pass was completed separately; the mobile engine and both phone passes completed in a second run. Two shared-fixture checks completed in a third run. Intermediate failing checks exposed the hollow-part visibility and scroll-momentum bugs described above; those checks passed after correction.
