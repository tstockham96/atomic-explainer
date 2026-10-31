# Understand the object before reconstructing it

Explode helps people learn how an object works through a beautiful, continuous 3D exploration. A photograph or description starts an investigation. Research determines the component assembly, geometry, materials, animation, and explanation.

## Product invariants

1. **Understand before generating.** Establish the identity and variant, examine multiple relevant views, investigate the inner mechanism, and trace how the parts interact. Use primary specifications, manuals, first-hand teardown imagery, and manufacturing evidence. A confident identification is not a complete understanding.
2. **Plan independently explorable parts.** Each component needs a function, source evidence, geometry strategy, material behavior, interfaces, hidden-surface requirements, and checks that demonstrate it can teach its lesson. Choose modeling, suitable licensed assets, or component generation according to the part.
3. **Reconstruct the component, not its occluded photograph.** Hands and their shadows do not belong in a dial texture. A reflection of a mechanism does not belong in a glass texture. When a neighboring part moves away, newly visible surfaces must exist and remain coherent.
4. **Explain relationships and mechanisms.** Showing a collection of objects is insufficient. The learner should see what stores energy, what transmits it, what regulates it, what moves, what supports it, and what protects it—as appropriate for the object.
5. **Preserve evidence boundaries.** Distinguish exact-model facts, observed appearance, family-level references, general process knowledge, and unresolved details. A source can document material without documenting exact geometry or factory process. Generated views do not count as new observations.
6. **Let research choose the tools.** The image-to-model provider is one tool. Do not simplify the explanation to fit the surfaces it happened to return. Clean mechanical layers, transparent windows, and hidden mechanisms may require separate authoring and fitting.
7. **Validate learning and appearance together.** Inspect front, back, isolated components, newly exposed surfaces, and reassembly. Validate the narrative against those renders. Cosmetic lighting corrections do not establish accurate anatomy.
8. **Choreograph after the assembly works.** Build the continuous turn, separation, component exploration, and anatomy stories around an understood, coherent object. Every camera move should reveal something the learner can explain.

## Durable artifacts

The spec's `understanding` field contains the learning goals, reference register, component claims and construction strategies, relationships, and open questions. `construction-plan.json` makes the work required by those findings explicit before calling a geometry provider.

The current single-photo Tripo adapter can execute only an explicitly scoped `exterior-draft`. If the researched plan requires component modeling, sourcing, generation, or unresolved references, it saves the plan and stops before purchasing a whole-object reconstruction. This is a capability boundary, not a user approval gate. The agent can continue with available research/modeling tools and export a finished, authored GLB using the normal `--from-spec` path.

The standalone automated component builder is not implemented yet. Do not claim that richer research prompts alone make Tripo consume or execute a construction plan. Re-enable broader unattended generation only when a component builder actually consumes the references and assembly requirements.

## Murph acceptance example

The dial is a clean thin substrate with correct markings and no baked hands or hand shadows. The hands are independent surfaces above it. Front and rear transparent windows reveal actual geometry behind them. The caseback ring is separate from its window and movement. The movement is an assembly with a defensible mechanical story, not a textured disc. Clearances, pivots, dimensions, and uncertain internal details are explicitly accounted for.

The next proof is a small, honest sequence: lift the hands from the clean dial, then rotate behind the watch and reveal a separately authored rotor through the rear window. Only then extend to the full mechanism and cinematic tour.

## Appearance review carried into construction

Consult [reconstruction cases and reusable rules](reconstruction-cases.md) before building a new object. Record newly discovered failure modes there, with object-specific evidence and uncertainties in the object's dossier. Material composition, plating and observed surface finish are separate claims.

Complete an individual material review for **every** component. Construction plans include `requiredMaterialReview` entries with references, target behavior, unknowns and required comparison views. Keep entries pending until reviewed; mark missing/deferred geometry explicitly. Compare related surfaces under matching lighting and presentation conditions, including rear glass and small fittings. Do not infer that passing the hero part approves the assembly.

Every construction plan includes `requiredVisualReview`, shared with the research prompt. Verify a complete turn for each part, physical clearance during inspection, supporting geometry beneath every marking/inlay, and coherent finishes under one fixed lighting rig. Inspect macro details against actual reference photographs, not only the upload. A part needs a truthful back and cutout walls as well as a convincing front.

For example, rotor lettering must terminate at real cutouts and respond to the same lighting as its metal. Cathedral hands need distinct metal frames and inset luminous cells, including their thickness. Those are geometry and material requirements; adding a larger photograph or stronger glare is not a substitute. The Murph implementation demonstrates reusable surface binding and inspection helpers while its inferred internal contours remain explicitly approximate.
