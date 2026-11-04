import { readFile, writeFile } from "node:fs/promises"
const base = "examples/iphone-18-pro",
  spec = JSON.parse(await readFile(`${base}/exterior-study.json`, "utf8"))
const manual = "https://support.apple.com/en-us/127388",
  teardown =
    "https://www.ifixit.com/News/119329/inside-the-tiny-unfixable-eye-iphone-18-pro-and-pro-max-teardown",
  locator = "https://support.apple.com/en-us/127410"
const rows = [
  [
    "battery",
    "Battery",
    "Power",
    "A rechargeable lithium-ion cell stores chemical energy. Power-management circuits deliver that energy to the processor, display and radios. The cell and its carrier are separate parts: the carrier supports the cell; it does not store charge.",
    "Metallic cell enclosure; finish observed, alloy unverified",
    [0, 0, 5.5],
  ],
  [
    "battery-tray",
    "Battery carrier",
    "Structure",
    "The formed carrier supports the battery and provides screw attachment points. Its relief and openings let a thin sheet gain stiffness while fitting around neighboring assemblies. The cell lifts separately here to make their different jobs visible.",
    "Formed metallic carrier; alloy and thickness estimated",
    [-0.2, 0, 3.7],
  ],
  [
    "logic-board",
    "Logic board · upper layer",
    "Compute",
    "The circuit board connects the phone’s systems through conductive paths, connectors and surface-mounted electronics. The stepped outline fits around the cameras. Separate chip packages lift away to reveal their contact footprints; a circuit board is much more than a green rectangle.",
    "Dark solder mask, metallic contacts, ceramic passives",
    [-4, 1.7, 2.2],
  ],
  [
    "processor",
    "Application processor",
    "Compute",
    "The application processor runs software and coordinates graphics, camera processing and other computation. Its package connects to the board through a dense contact array. The separate cooling assembly carries away heat; the copper-colored surface shown here is a package surface, not a view of individual transistors.",
    "Observed copper-colored package surface; exact lid stack unverified",
    [-5.5, 3.8, 5],
  ],
  [
    "memory",
    "Working memory",
    "Compute",
    "Working memory holds data that active applications need quickly. It is distinct from long-term storage: its contents depend on power. This separate package illustrates that role beside the processor; its precise package outline and placement are approximated.",
    "Dark semiconductor package",
    [-3.1, 4.2, 4],
  ],
  [
    "logic-board-lower",
    "Logic board · lower layer",
    "Compute",
    "The board assembly uses more than one substrate. Connections between layers allow dense packaging within a thin phone. Separating them reveals additional electronics that an exterior model cannot show. The contact pattern is explanatory, not a repair pinout.",
    "Dark circuit laminate and metallic inter-board contacts",
    [-3.6, 1.7, -0.5],
  ],
  [
    "storage",
    "Flash storage",
    "Compute",
    "Nonvolatile flash stores apps, photographs and other data when power is off. Storage packages are shown between the board layers. They serve a different purpose from working memory, and this teaching separation is not a normal service operation.",
    "Dark molded chip packages; hidden package details approximate",
    [-5.1, -0.1, 3.5],
  ],
  [
    "radio",
    "Cellular electronics",
    "Connectivity",
    "The modem and supporting radio circuits turn digital data into signals for a cellular connection and decode incoming signals. Antennas and interconnects complete the path. Package markings here identify a teaching role; internal circuitry is not reconstructed.",
    "Semiconductor packages and metal contacts",
    [-5.1, -1.9, 2.2],
  ],
  [
    "cooling",
    "Thermal spreader",
    "Thermal",
    "Electrical computation also produces heat. A contact layer couples the processor to the cooling assembly, which spreads that heat across a larger area. A vapor chamber uses evaporation and condensation internally; its hidden wick and fluid are not depicted as visible geometry here.",
    "Metallic thermal assembly and dark contact pad; internal structure unresolved",
    [0, 0, 1.6],
  ],
  [
    "camera-modules",
    "Camera module housings",
    "Imaging",
    "The rear optical assemblies need support, alignment and connections as well as a visible lens. These housings sit beneath the sourced exterior optics. Their outlines and clearances are fitted estimates; the small stabilizer mechanisms inside have not been resolved.",
    "Metallic housings and dark optical barrels",
    [2.2, 3.2, -0.8],
  ],
  [
    "camera-sensors",
    "Image sensors",
    "Imaging",
    "A sensor converts arriving light into electrical signals. The processor turns those signals into an image. Each sensor package sits behind an optical axis; the colored sensor surface illustrates the active area, not a reconstructed microscopic pixel layout.",
    "Optical cover over semiconductor package; spectral finish approximate",
    [3.8, 4.1, 2.7],
  ],
  [
    "front-sensors",
    "Front camera and sensing",
    "Imaging",
    "The front sensing assembly combines imaging and depth-related functions. Its optical openings must remain aligned with the display’s viewing regions. The modeled packages show where sensing hardware sits; their internal optics and precise hidden construction remain approximate.",
    "Dark housings, metallic surrounds and optical windows",
    [0.3, 5.4, 2],
  ],
  [
    "wireless-charging",
    "Charging coil and alignment",
    "Power",
    "A changing magnetic field induces electrical energy in the receiving coil. Charging electronics condition that energy before it reaches the battery. The surrounding alignment elements help position the receiver. Turn the part to see the winding thickness and backing.",
    "Copper-colored winding, dark backing and metallic alignment elements",
    [0.2, -0.4, -3.3],
  ],
  [
    "haptics",
    "Taptic Engine",
    "Feedback",
    "The haptic actuator turns an electrical command into a brief mechanical vibration. Its housing transmits that motion into the enclosure so a tap can be felt. The exterior package is modeled; the concealed moving mass and suspension are not asserted as reconstructed.",
    "Metallic actuator housing and dark top surface",
    [2.1, -3.5, 2],
  ],
  [
    "speakers",
    "Acoustic assemblies",
    "Feedback",
    "The speaker assemblies turn electrical signals into pressure changes in air. Their housings direct sound toward the phone’s openings. The upper and lower packages share this chapter; the internal diaphragms and acoustic channels are not fully reconstructed.",
    "Dark molded housings, metal shields and outlet mesh",
    [-2.6, -3.8, 2.3],
  ],
  [
    "interconnects",
    "Flexible interconnects",
    "Connectivity",
    "Flexible circuits carry power and signals between modules while fitting along the edges of the enclosure. Their connectors allow assemblies to be attached separately. The routes shown here illustrate the documented connections; fine copper routing and exact bends remain approximate.",
    "Polymer-covered flexible conductors and metallic contacts",
    [-2.4, 0, -1.8],
  ],
  [
    "microphones",
    "Microphones",
    "Sensing",
    "Microphones turn pressure variations in air into electrical signals. Small package openings couple them to acoustic paths through the enclosure. The visible packages and flex are represented here; the microscopic diaphragm and exact port network remain unresolved.",
    "Metallic microphone packages and dark acoustic apertures",
    [-3.4, -4.5, 3],
  ],
  [
    "antennas",
    "Antenna interconnects",
    "Connectivity",
    "Radio electronics need conductive paths to radiating elements at the enclosure. This chapter exposes representative contacts and antenna flex routes. The exact tuned antenna geometry is not established, so this model must not be used as an RF design.",
    "Flexible conductors and metallic contacts",
    [3.2, 0.2, -2],
  ],
  [
    "depth-sensor",
    "Rear depth sensing",
    "Sensing",
    "A rear depth-sensing assembly supports spatial measurement alongside the cameras. The optical window and package are represented separately from the imaging sensors. Internal emitters, receivers and their precise optical arrangement are not reconstructed.",
    "Dark package and optical window",
    [4.2, 2.2, -2.8],
  ],
  [
    "fasteners",
    "Fasteners and mounting",
    "Structure",
    "Small fasteners hold assemblies against their locating surfaces and retain selected electrical contacts. Mounting holes constrain position; the screws supply clamping force. The displayed set is representative, not an exhaustive service screw map.",
    "Metallic fasteners; alloy and exact service dimensions unverified",
    [2.6, 0, 3.3],
  ],
  [
    "display-seal",
    "Display perimeter seal",
    "Protection",
    "A continuous perimeter interface joins the display to the enclosure and helps resist ingress. Separation exposes that otherwise hidden boundary. The strip follows the enclosure contour, but this visualization is not a prediction of sealing performance.",
    "Dark adhesive/sealing interface; formulation unverified",
    [0, 0, 7.2],
  ],
]
for (const [id, name, system, description, material, offset] of rows) {
  spec.components.push({
    id,
    name,
    material,
    howItsMade: description,
    funFacts: [description.split(". ")[0] + "."],
    order: spec.components.length,
    evidence: {
      basis: "inferred",
      sourceUrls: [manual, teardown, locator],
      note: "Component existence and relationships researched; geometry is reference-fitted and approximate.",
    },
  })
  spec.understanding.components.push({
    componentId: id,
    function: description,
    claims: [
      {
        statement: `${name} is represented as part of the internal assembly.`,
        basis: "documented",
        referenceIds: ["apple-manual"],
      },
      {
        statement: "Constructed geometry and placement are fitted estimates, not manufacturer CAD.",
        basis: "inferred",
        referenceIds: ["apple-locator", "ifixit-internals"],
      },
    ],
    reconstruction: {
      method: "model-part",
      referenceIds: ["apple-locator", "ifixit-internals"],
      shape:
        "Outlined and fitted using the component layout and isolated teardown observations; see tools/iphone-study/model.ts for explicit geometry.",
      materialBehavior: material + "; physical lighting, no photographic illumination texture.",
      hiddenSurfaces:
        "Closed or layered geometry with conservative unmarked reverse surfaces. Concealed mechanism detail remains approximate.",
      exclude: [
        "Neighboring components baked into textures",
        "Photographic shadows",
        "Unverified manufacturer tolerances",
      ],
      acceptanceChecks: [
        "Present in exported GLB under its own component ID",
        "Fits the researched assembly envelope",
        "Separate forward and backward scroll inspection",
        "Compare front, oblique and reverse against references",
      ],
    },
    unknowns: [
      "Exact internal dimensions, manufacturing tolerances and hidden interfaces are not established.",
      "Microdetail is an educational approximation and has not passed an independent fidelity review.",
    ],
  })
  spec.scene3d.parts.push({
    componentId: id,
    node: id,
    offset,
    shot: { from: [0.25, 0.16, 1], to: [0, 0, 0] },
  })
}
for (const part of spec.scene3d.parts) {
  if (part.nodes) {
    delete part.nodes
    part.node = part.componentId
  }
  if (part.componentId === "display") delete part.reverseSurface
}
spec.scene3d.url = "assets.local/internal-study.glb"
delete spec.scene3d.omittedNodes
// Axial panels move along their real opening direction; small internals fan out.
const offsets = {
  display: [0, 0, 9],
  enclosure: [0, 0, 0],
  "rear-panel": [0, 0, -5.6],
  "camera-optics": [2.2, 3.2, -3],
  connector: [0, -4, 0],
  "left-controls": [-3.5, 0, 0],
  "right-controls": [3.5, 0, 0],
}
for (const p of spec.scene3d.parts) if (offsets[p.componentId]) p.offset = offsets[p.componentId]
const order = [
  "display",
  "display-seal",
  "battery",
  "battery-tray",
  "logic-board",
  "processor",
  "memory",
  "logic-board-lower",
  "storage",
  "radio",
  "cooling",
  "camera-optics",
  "camera-modules",
  "camera-sensors",
  "front-sensors",
  "wireless-charging",
  "haptics",
  "speakers",
  "interconnects",
  "microphones",
  "antennas",
  "depth-sensor",
  "connector",
  "left-controls",
  "right-controls",
  "fasteners",
  "enclosure",
  "rear-panel",
]
spec.components.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
spec.components.forEach((c, i) => (c.order = i))
spec.scene3d.parts.sort((a, b) => order.indexOf(a.componentId) - order.indexOf(b.componentId))
for (const c of spec.components) {
  if (c.id === "camera-optics")
    c.howItsMade =
      "The sourced lens surfaces sit outside the newly modeled camera housings and sensors. Light travels through the optical system before reaching a sensor; the complete lens prescription and stabilizer mechanism are not reconstructed."
  if (c.id === "display")
    c.howItsMade =
      "The display presents the result of computation as light. Its front surface is preserved from the source model, with a separate reverse backing added so the story can open the phone and expose the electronics behind it."
}
for (const c of spec.components) {
  if (c.id === "enclosure")
    c.howItsMade =
      "The enclosure locates and supports the display, boards, battery and distributed modules. Its openings provide access for controls, connectors and acoustic paths. The sourced outer geometry surrounds reference-fitted internals; precise internal mounting interfaces remain approximate."
  if (c.id === "rear-panel")
    c.howItsMade =
      "The rear panel closes the back of the phone behind the charging and sensing hardware. Its sourced exterior surface is preserved; the underlying interfaces and adhesive construction remain approximate."
}
for (const c of spec.understanding.components) {
  const visible = spec.components.find((x) => x.id === c.componentId)
  c.function = visible.howItsMade
}
spec.understanding.identityScope =
  "Apple iPhone 18 Pro, eSIM, Burgundy; sourced exterior with research-fitted internal assembly."
spec.understanding.learningGoals = [
  "Trace energy from wired or wireless input to the battery and electronics.",
  "Distinguish processor, working memory, nonvolatile storage and radio electronics.",
  "Follow light through optics to sensors and image processing.",
  "Explain how cooling, structure, interconnects and feedback assemblies support the computing system.",
]
for (const [id, title, url, kind, observation] of [
  [
    "apple-manual",
    "Apple component repair index",
    manual,
    "manual",
    "Identifies internal assembly categories, including battery, logic board, cameras, speakers, Taptic Engine, microphone and USB-C connector.",
  ],
  [
    "apple-locator",
    "Apple eSIM logic-board locator",
    locator,
    "manual",
    "Inspected the highlighted stepped board within the enclosure and the removal view: board around camera openings, broad lower package area, flex connections and frame mounting.",
  ],
  [
    "ifixit-internals",
    "iFixit isolated internal views",
    teardown,
    "teardown",
    "Inspected cell outline and stepped notch; embossed carrier relief; board package/connector layout; separate board layers; metallic package surfaces and adjacent passives.",
  ],
]) {
  spec.understanding.references.push({
    id,
    title,
    url,
    kind,
    scope: "exact-model",
    observation,
    limitations:
      "Photographs constrain visible form; inferred dimensions, reverse details and some minor component placement remain unresolved.",
  })
  if (!spec.sources.some((s) => s.url === url)) spec.sources.push({ title, url })
}
spec.understanding.relationships = [
  ["wireless-charging", "battery", "Charging path supplies energy through conditioning electronics."],
  ["connector", "battery", "Wired power reaches battery charging electronics."],
  ["battery", "logic-board", "The battery supplies electrical energy to the electronic assembly."],
  ["processor", "memory", "The processor exchanges active data with working memory."],
  ["processor", "storage", "Software and user data are read from and written to nonvolatile storage."],
  ["processor", "cooling", "Heat passes through the thermal interface to the cooling assembly."],
  ["camera-optics", "camera-sensors", "Optics direct light onto sensor surfaces."],
  ["camera-sensors", "processor", "Sensor signals enter the image-processing path."],
  ["logic-board", "radio", "Digital data reaches the cellular subsystem."],
  ["logic-board", "display", "The electronics drive the displayed image."],
  ["logic-board", "haptics", "Control signals produce tactile feedback."],
  ["logic-board", "speakers", "Audio signals drive acoustic feedback."],
  ["interconnects", "logic-board", "Flexible circuits connect distributed modules."],
  ["battery-tray", "battery", "The carrier supports and retains the cell."],
].map(([from, to, relationship]) => ({
  from,
  to,
  relationship,
  basis: "inferred",
  referenceIds: ["apple-manual", "ifixit-internals"],
}))
spec.item.summary = "Energy, computation, light and sound—explore the systems inside a phone."
spec.modelNotice = "Research-built internals · dimensions and hidden details approximate"
spec.artNote =
  "Manufacturer exterior preserved. Internal geometry is reference-fitted, not manufacturer CAD. Package labels are educational identifiers. No teardown photographs are projected onto geometry. Fine internal mechanisms, exact pinouts, antennas and microscopic semiconductor structures remain unresolved. Separation is explanatory, not a repair procedure. Apple source asset redistribution is not established."
spec.closing =
  "A phone is a collection of connected systems: energy powers computation, sensors supply information, and displays, speakers and haptics return it to you."
spec.understanding.unresolved = [
  "Independent reference fidelity review remains outstanding.",
  "Internal dimensions and fitting are estimates; not suitable for manufacturing or repair.",
  "Exact antenna conductors, microphone internals, stabilizers, semiconductor die structures and sealing formulations remain unresolved.",
]
spec.scene3d.assemblyStory = JSON.parse(await readFile("docs/research/iphone-assembly-story.json", "utf8"))
const requirements = {
  version: 1,
  identity: spec.understanding.identityScope,
  objective:
    "Explain the complete functional assembly, preserving researched internal requirements even when an imported source contains only exterior surfaces.",
  components: spec.components.map((c) => ({
    id: c.id,
    name: c.name,
    system: rows.find((r) => r[0] === c.id)?.[2] ?? "Exterior",
    purpose: c.howItsMade,
    sourceUrls: c.evidence.sourceUrls,
  })),
}
await writeFile(`${base}/internal-study.json`, JSON.stringify(spec, null, 2) + "\n")
await writeFile(`${base}/requirements.json`, JSON.stringify(requirements, null, 2) + "\n")
console.log("Prepared", spec.components.length, "required component groups.")
