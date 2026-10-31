# Porsche 911 engine study

An original 29-assembly reconstruction of the early 1965 Type 901/01 air-cooled flat-six. The source builder, model, research dossier and independent functional inventory are included; no API key or proprietary model is required to open this example.

```sh
npm install
npm run build
npm run studio
```

Open `http://127.0.0.1:4319/porsche-study/index.html`. The tour rotates the engine, separates its assemblies, inspects every group through a full orbit, and reassembles it before the written anatomy.

To rebuild the authored model (Chrome required):

```sh
PLAYWRIGHT_CHANNEL=chrome npm run build:porsche
```

Geometry is original code-generated work under the repository's MIT license. Reference photographs and Porsche diagrams are not redistributed. Porsche names identify the subject; this is not an official Porsche product.

## Evidence and limits

`research.json` records the variant, reference observations, every component's function and material uncertainty, relationships, and reconstruction compromises. `requirements.json` remains independent of the available mesh. `asset-plan.json` records the source search and the handoff from the provider adapter to the authored builder. Exported `assembly-completeness.json` checks actual geometry coverage; it does not certify fidelity.

The assembly contains six cylinders/pistons/rods, separate case halves, heads, camshafts and valve gear, chains, fan/alternator/belt, intake and ignition, oil pump/cooler/lines, exhaust and flywheel. Castings, ports, clearances and finishes are approximate. The vehicle oil tank, fuel supply, clutch/transmission and vehicle wiring are outside this engine-mounted study. Internal alternator windings, filter media, detailed carburetor passages, heat exchangers and muffler baffles are not reconstructed. This is an educational assembly, not service CAD or a running-engine simulation.

The model was manually authored with agent tools. It is a cross-object test of the shared research, scene, inspection and export contracts, not proof that arbitrary photo uploads now produce comparable assemblies automatically.

Surface finishes use the shared millimetre-scaled authoring library in `src/authoring/finishes.ts`; cast, machined, coated and rubber surfaces are distinct, approximate finish families. The preview uses neutral lighting. `surface-review.json` records the latest material pass, exact export hash, inspected views and remaining limitations; the older `review.json` is historical evidence for its recorded model hash. Every freshly rendered site also receives an automated `material-review.json`. See `docs/evaluations.md` to reproduce component captures for any object.
