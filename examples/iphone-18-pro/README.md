# iPhone assembly prototype

This is original, agent-authored demonstration geometry. No Apple CAD, reference photograph textures or generated provider mesh is redistributed here. Source links and uncertainty are recorded in `research.json`.

The specimen tests whether the common assembly exporter and viewer can handle a different product shape and material mix. It has 12 independent groups, including separate cover glass and OLED display. The enclosure envelope uses published dimensions; internal placement, thicknesses, finishes, camera geometry and reverse surfaces are schematic. Fasteners, antennas, charging coils, seals and thermal assemblies are omitted. It does not establish a phone's exact construction or demonstrate a successful unattended photo reconstruction.

Run `npm run build:eval` and open `/iphone-study/index.html` in the local studio after copying/serving that output, or use `npm run build && npm run studio` for the packaged route. `assembly-project.json` in the built preview can be imported through **Open agent-built project** without an API key.

Replace recipe parts with better evidence-matched geometry before a fidelity review. For shapes outside the recipe vocabulary, use the engine's existing multipart GLB path. Keep each component ID attached to its research and learning function. Structural tests passing must never upgrade the visual verdict.
