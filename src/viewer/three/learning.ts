import type { ExplainerSpec } from "../../spec/schema.ts"
import { storyComponents } from "../../spec/scene3d.ts"

/** Text remains available independently of WebGL and motion preferences. */
export function componentLesson(spec: ExplainerSpec, id: string) {
  const groups = spec.scene3d?.kind === "gltf" ? (spec.scene3d.inspectionGroups ?? []) : []
  const group = groups.find((g) => g.id === id)
  const component = group
    ? storyComponents(spec).find((p) => p.id === id)
    : spec.components.find((p) => p.id === id)
  const memberIds = new Set(group?.componentIds ?? [id])
  const studies = spec.understanding?.components.filter((p) => memberIds.has(p.componentId)) ?? []
  if (!component) return undefined
  const name = (id: string) =>
    groups.find((g) => g.componentIds.includes(id))?.name ??
    spec.components.find((p) => p.id === id)?.name ??
    id
  const connections =
    spec.understanding?.relationships
      .filter(
        (r) =>
          (memberIds.has(r.from) || memberIds.has(r.to)) &&
          !(group && memberIds.has(r.from) && memberIds.has(r.to)),
      )
      .map((r) => `${name(r.from)} → ${name(r.to)}: ${r.relationship}`) ?? []
  return {
    name: component.name,
    overview: group?.description ?? studies[0]?.function ?? component.howItsMade,
    material: component.material,
    connections: [...new Set(connections)],
    uncertainties: [...new Set(studies.flatMap((s) => s.unknowns))],
    references:
      spec.understanding?.references.filter((r) =>
        studies.some((s) => s.reconstruction.referenceIds.includes(r.id)),
      ) ?? [],
  }
}
