# Murph component material review

Working record for H70605731. The [dossier](murph-study.json) supplies claim-level evidence and the [construction plan](murph-construction-plan.json) supplies review obligations. This table tracks remaining work as well as corrections; it is not a declaration that every component meets the fidelity target.

## Review conditions

Compare assembled, isolated front, oblique and reverse views under fixed lighting. Related glass uses the same optical environment, neutral color, transmission and surface roughness, and the same dark inspection backdrop. Keep geometry differences supported by photos: the curved front and flat rear should not have identical reflection shapes. The rear's assumed IOR of 1.5 is an optical approximation, not evidence of mineral glass. Front sapphire uses 1.76; coating is unverified.

## Coverage

| Component | Current treatment / evidence boundary | Remaining work or exception |
| --- | --- | --- |
| Front crystal | Documented sapphire; photo-informed curved solid with rounded edge, clear transmission and restrained reflections. | Exact curvature, thickness and anti-reflection coating are not measured/verified. |
| Rear window | Observed transparent window; now uses the same rounded optical-solid builder and inspection backdrop as the front, with a flat profile. | Composition, coating, dimensions and IOR remain assumptions. Do not call it sapphire or copy the front dome. |
| Hands | Distinct metal frames and nonmetallic luminous inlays; photo-informed contours. | Exact metal/plating and microscopic finish unresolved; profile and fine markings still reconstructed. |
| Dial | Matte nonmetallic appearance; cleaned independent artwork without hands. | Generated artwork contains small print inaccuracies; substrate and manufacturing process unresolved. |
| Case | Stainless steel documented; generated exterior retained for its preferred silhouette, with fitted open cavity. | Retained texture may contain baked lighting; needs cleaner color/roughness separation and reference comparison. |
| Crown | Knurled geometry and reflective metal, continuous with case lighting. | Material and proportions approximate; cap marking and machining detail need better reference fit. |
| Caseback ring | Separate metal ring and rear window; brushed/polished regions. | Finish boundaries, engraving and tool recesses approximate. |
| Seals | Dark, rough, illustrative elastomer rings. | Exact material, dimensions, profiles and hidden sealing arrangement unverified. |
| Rotor | Straight brushed face, radial peripheral band, surface-bound engraving; three portable finish materials, shared scene lighting. | Alloy/plating, measured grain, reverse finish and mass distribution unverified. |
| Movement plates / bridges | Photo-informed broad metal plates, screws and jewel regions. | Generic plate brushing and alloy-colored presets remain approximate; no manufacturer CAD or measured surface data. |
| Winding train | Separate metal-colored wheel/pivot geometry. | Hidden topology and finish not fully observed; educational approximation. |
| Mainspring barrel | Separate barrel and illustrative spring. | Hidden surfaces, materials, spring dimensions and finish not verified. |
| Wheel train | Distinct wheel and pivot geometry with metal-colored finishes. | Exact alloys, coatings and hidden layout unresolved; do not promote brass-colored appearance to a brass claim. |
| Escapement | Small separate mechanical geometry. | Exact variant, material and hidden contours unresolved; illustrative. |
| Balance and spring | Fine wheel/spring geometry and visible setting; current catalog lists Nivachron. | Catalog material claim does not establish every historical specimen or precise geometry/finish. |
| Strap | Catalog cow leather; retained generated grain/stitching/lining with nonmetallic rendering. | Baked shading and reverse texture still need closer source comparison; material layers not independently reconstructed. |
| Buckle | Research record exists; construction method remains deferred. | No independent authored buckle/inspection stop. This remains missing work, not a passed material review. |

## Reproducible visual record

Run the study capture with `turns=1` for three labeled sheets covering all 16 currently authored component groups: front, oblique and reverse. `component-material-inventory.json` records the actual material channels used by every authored group. These complement the 17 research review entries; the missing independent buckle is explicit above.

Use `materials=1` to inspect the exported rotor and both optical solids, and `optics=1` to check transmission of both window profiles against a contrast chart. Results prove render behavior and export coverage, not exact material chemistry or photorealistic reconstruction.

Saved v17 review: [front](reviews/murph-v17/component-review-20.png), [oblique](reviews/murph-v17/component-review-37.png), [reverse](reviews/murph-v17/component-review-50.png), [material inventory](reviews/murph-v17/component-material-inventory.json). The review confirms clearer distinction between rotor face/rim and consistent glass presentation. It also exposes simplified movement undersides, uniform gear faces, and retained generated case/strap appearance; these remain fidelity work.

Validation: 80 component views remain in frame with surrounding parts clear; both window profiles retain at least 92.6% of the contrast-chart difference across the tested IORs/angles. Export readback preserves two transmitting optical solids and three mapped rotor finishes. All 74 tests pass. These are scoped checks, not an automatic visual-quality approval of all 17 researched components.

## Overall quality audit

The current [evaluation report](../../evals/reports/murph-current.json) supersedes the v17 aggregate counts above. All 16 exported assemblies now have captured front/oblique/reverse views, and the hands have metal backing beneath their luminous cells. These fixes do not establish exact geometry or material fidelity. The buckle, inferred movement details and existing surface mismatches keep the reconstruction below the quality bar.
