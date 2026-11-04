import type { ExplainerSpec, ComponentSpec } from "./schema.ts"

export const WATCH_PART_IDS = [
  "crystal",
  "hands",
  "dial",
  "movement",
  "crown",
  "case",
  "caseback",
  "strap",
  "buckle",
] as const

export function scenePartIds(spec: ExplainerSpec): string[] {
  if (spec.scene3d?.kind === "gltf") return spec.scene3d.parts.map((part) => part.componentId)
  if (spec.scene3d?.kind === "procedural-watch") return [...WATCH_PART_IDS]
  return []
}

/** Physical inventory remains independent of presentation grouping. No name
 * heuristics: matching functions and evidence must justify each authored group. */
export function inspectionStops(spec: ExplainerSpec) {
  if (spec.scene3d?.kind === "gltf" && spec.scene3d.assemblyStory)
    return spec.scene3d.assemblyStory.chapters.map((c) => ({
      id: c.id,
      componentIds: c.componentIds,
      name: c.title,
      description: c.description,
      material:
        c.detail ??
        c.componentIds.map((id) => spec.components.find((p) => p.id === id)?.material ?? "").join(" · "),
    }))
  const groups = spec.scene3d?.kind === "gltf" ? (spec.scene3d.inspectionGroups ?? []) : []
  const seen = new Set<string>()
  return scenePartIds(spec).flatMap((id) => {
    const group = groups.find((g) => g.componentIds.includes(id))
    const stop = group ?? { id, componentIds: [id] }
    if (seen.has(stop.id)) return []
    seen.add(stop.id)
    return [stop]
  })
}
export function storyComponents(spec: ExplainerSpec): ComponentSpec[] {
  if (!spec.scene3d) return spec.components
  return inspectionStops(spec)
    .map((stop) => {
      const members = stop.componentIds.map((id) => spec.components.find((p) => p.id === id)!)
      const first = members[0]!
      if (!("name" in stop)) return first
      return {
        ...first,
        id: stop.id,
        name: stop.name,
        material: stop.material,
        howItsMade: stop.description,
        image: undefined,
        funFacts: [...new Set(members.flatMap((m) => m.funFacts))],
        evidence: {
          basis: "inferred" as const,
          sourceUrls: [...new Set(members.flatMap((m) => m.evidence?.sourceUrls ?? []))],
          note: members
            .map((m) => m.evidence?.note)
            .filter(Boolean)
            .join(" "),
        },
      }
    })
    .filter(Boolean)
}

/** Story milestones add system explanations; they never replace the anatomy.
 * Preserve original paired inspections and also retain unmodeled research. */
export function anatomyStops(spec: ExplainerSpec) {
  return inspectionStops(
    spec.scene3d?.kind === "gltf"
      ? { ...spec, scene3d: { ...spec.scene3d, assemblyStory: undefined } }
      : spec,
  )
}
export function anatomyComponents(spec: ExplainerSpec): ComponentSpec[] {
  if (spec.scene3d?.kind !== "gltf" || !spec.scene3d.assemblyStory) return storyComponents(spec)
  const physical = new Set(scenePartIds(spec))
  return [
    ...storyComponents({ ...spec, scene3d: { ...spec.scene3d, assemblyStory: undefined } }),
    ...spec.components.filter((c) => !physical.has(c.id)),
  ]
}
