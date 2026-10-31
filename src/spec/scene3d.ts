import type { ExplodeSpec } from "./schema.ts"

export const WATCH_PART_IDS = ["crystal", "hands", "dial", "movement", "crown", "case", "caseback", "strap", "buckle"] as const

export function scenePartIds(spec: ExplodeSpec): string[] {
  if (spec.scene3d?.kind === "gltf") return spec.scene3d.parts.map((part) => part.componentId)
  if (spec.scene3d?.kind === "procedural-watch") return [...WATCH_PART_IDS]
  return []
}
