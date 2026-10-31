# Understanding the Murph before rebuilding it

Research checkpoint: 30 October 2026. Target: Hamilton Khaki Field Murph 42 mm, reference H70605731. This is a construction brief for an educational model, not a claim that a complete digital twin has been built.

The [structured study](murph-study.json) records 17 components, 14 references, claim-level evidence, physical relationships and individual construction checks. The [construction plan](murph-construction-plan.json) records the work the current exterior generator cannot perform.

## What a learner should understand

The watch has three different jobs that the model must make distinct: **store energy, regulate its release, and display elapsed time**. Winding supplies energy; a mainspring stores it; the wheel train transmits it; the escapement and balance regulate the release. The hands communicate the result against a stationary scale. The rotor supplies winding input rather than directly turning the hands. These are general mechanical principles, not a recovered H-10 service drawing. [FHH mechanism explanation](https://www.hautehorlogerie.org/en/watches-and-culture/library/how-does-a-mechanical-watch-work).

The continuous scene should establish those relationships. Separating a rotor from its bridges is useful when it reveals the winding mechanism below. Removing hands is useful when it exposes a clean, fixed dial. Lifting a window is useful when it distinguishes protection from the working assembly behind it.

## Reference findings that change the model

- **The dial must be rebuilt.** Inspection of Hamilton's [front photograph](https://www.hamiltonwatch.com/media/catalog/product/h/7/h70605731_new_3_1.png), [dial macro](https://www.hamiltonwatch.com/media/catalog/product/h/7/h70605731_detail1.jpg), and [laid view](https://www.hamiltonwatch.com/media/catalog/product/h/7/h70605731_detail_laidview.jpg) shows distinct hands above a clean dark surface. The current generated dial has residual hand shapes, distorted lettering, and an irregular rim. Masking those hands black does not reconstruct the surface underneath them.
- **The rear is an assembly.** The [first-hand 2019 rear photograph](https://www.fratellowatches.com/wp-content/uploads/2019/06/Hamilton-Khaki-Field-Murph.003.jpg) shows a metal ring around a transparent window, with a signed rotor and bridges behind it. The ring, window and mechanism must be independently explorable. That photograph does not reveal everything under the rotor.
- **The rotor is not the whole movement.** Hamilton's [H-10 family image](https://www.hamiltonwatch.com/media/catalog/product/caliber/H-10_H200.500.350_1.png) helps identify visible structure, but it is a family reference, not a complete specification for a particular production year. Its occluded surfaces still require evidence.
- **Material labels have limits.** Hamilton's [current listing](https://www.hamiltonwatch.com/en-us/h70605731-khaki-field-murph-auto.html) specifies front sapphire and an open back, but does not separately identify the rear window's composition. The study therefore calls it a transparent rear window, leaving its material unresolved.
- **Conflicting sources need reconciliation.** The [2019 review](https://www.fratellowatches.com/hamilton-murph/) lists 23 jewels, while its own rear photograph reads 25. Its movement-subtype statement is not accepted as verified. Its 52 mm lug-to-lug measurement also differs from the current catalog's 53 mm. Select a target specimen/version before using these as exact geometry constraints.

The reviewed image set comprises the manufacturer front, rolled input, laid view and macro, a first-hand exact-model rear image, and the manufacturer's H-10 family image. Images remain local reference material; they are not relicensed as open-source assets. No image was called a teardown merely because it shows a caseback. An ETA document candidate could not be retrieved or verified and is excluded from the evidence register.

## Component construction decisions

| Assembly | Construction decision | Observable proof |
| --- | --- | --- |
| Dial | Clean planar substrate; independently rebuilt markings; no projected full-watch photograph | Remove all three hands and inspect every marking and the formerly occluded areas |
| Hands | Separate meshes and concentric pivots; metal and luminous fill remain distinct | Move each hand independently; inspect thickness and clearances from the side |
| Front crystal | Independent optical solid with thickness, edges and transmission | Reflections move with lighting; dial printing stays on the dial when glass lifts |
| Case | Smooth exterior and a genuine inner cavity with provisional interfaces | Empty case can be inspected from both ends; it does not contain a solid silver stand-in for the movement |
| Rear ring/window | Two parts, with the rotor physically behind the window | Window lifts independently; rotor motion produces real parallax through it |
| Movement plates/rotor | Source suitable geometry or author it against matched views; expose real surfaces below the rotor | Rotor turns on its own bearing while bridges remain fixed |
| Winding train, barrel, train, escapement, balance | Obtain matched technical/teardown evidence; use explicitly illustrative cutaways only where appropriate | Power and regulation paths connect; motion illustrates function instead of animating random gears |
| Seals/attachments | Retain in the research inventory; investigate before claiming exact shapes | Every shown closure or connection has an explained interface |
| Strap/buckle | Reconstruct continuous strap halves and a functional attachment | No arbitrary fragments; lining, edges and attachment remain coherent when rotated |

The executable component study now lives in `tools/murph-study/`, using `src/authoring/murph.ts` and `src/authoring/h10.ts`. It lifts independent hands from a clean dial, reveals an independent rotor through a transmitting rear window, lifts the bridge pack, and exports a multipart GLB. The preferred generated exterior is aligned and hollowed, then fitted with authored internal components. This demonstrates component independence, not exact mechanical fidelity.

Additional [SJX first-hand Murph macros](https://watchesbysjx.com/2020/02/hamilton-khaki-field-murph.html) show different rotor positions. The visible topology changed the model: broad overlapping curved bridges replace the generic exposed gear layout; the balance cock has a prominent round setting; the rotor has its characteristic cutouts, peripheral weight, four-point mark and circular inscription. The inscription follows the photographed 25-jewel specimen. Article assertions about the exact ETA subtype/escapement remain unverified and are not adopted. Positions and contours are estimated from images, not calibrated measurements; concealed gears remain educational approximations.

## Making stories: what is and is not supported

Synthetic sapphire can be grown from alumina and shaped into optical components; Comadur describes crystal growth, machining and surface treatments. This supports an explanation of **how sapphire components can be made**, not a claim that the Murph uses a particular supplier or growth process. [Comadur](https://www.comadur.ch/produits/?lang=en).

A visit to Universo describes stamping and finishing watch hands. RC Tritec describes applying luminous pigment/varnish mixtures. These support general making stories; they do not establish Hamilton's exact tooling, luminous grade, or supplier. [Blancpain/Universo visit](https://lettresdubrassus.blancpain.com/en/issue-16/hands), [RC Tritec](https://www.rctritec.com/en/superluminova/accessories-for-application).

Swatch Group documents Nivachron as a titanium-based balance-spring alloy. This supports the material explanation for catalog-listed Nivachron, not an assumption about every historical Murph or an exact spring shape. The spring regulates rhythm; it is distinct from the mainspring that stores energy. [Swatch Group](https://www.swatchgroup.com/en/services/archive/2018/swatch-group-again-innovator).

General movement manufacturing includes shaping components, finishing surfaces and assembling the winding, train and regulating systems. Exact H-10 manufacturing operations and dimensions remain undocumented in this study. [Swiss watch industry assembly overview](https://www.watch.swiss/eng/assembling.html).

## Unresolved before an accurate internal reconstruction

We still need a matched movement variant, rotor-removed and dial-side views, critical dimensions/clearances, documented interfaces and the rear-window specification. The current study establishes functions and a defensible asset plan; it does not supply missing CAD. Stronger research narrows the modeling problem but does not automatically recover invisible geometry.
