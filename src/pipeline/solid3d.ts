import type { ExplodeSpec } from "../spec/schema.ts"

/**
 * Future true-3D step.
 *
 * TODO(explode-3d): replace the photographic cutouts with real geometry.
 * The intended pipeline is:
 * 1. Segment the source photo, or the researched components, into parts.
 * 2. Reconstruct each part as a mesh — image-to-3D, a CAD match, or a parametric stand-in.
 * 3. Emit a glTF per component plus a scene manifest that reuses ExplodeSpec order.
 * 4. Play the same chapter timeline with a perspective camera instead of 2.5D transforms.
 *
 * The MVP does not invent mesh data. Callers should branch on `solid3d.available === false`.
 */

export interface Solid3DInput {
  spec: ExplodeSpec
  sourcePhoto?: string
}

export interface Solid3DComponent {
  id: string
  gltfPath: string
  order: number
}

export interface Solid3DScene {
  units: "meters"
  components: Solid3DComponent[]
  camera: {
    fov: number
    path: "scroll-chapters"
  }
}

export interface Solid3DProvider {
  readonly id: string
  reconstruct(input: Solid3DInput): Promise<Solid3DScene>
}

export const solid3d = {
  available: false as const,
  reason: "True 3D reconstruction is stubbed. The scroll site uses layered 2.5D art.",
  async reconstruct(_input: Solid3DInput): Promise<Solid3DScene> {
    throw new Error("TODO(explode-3d): wire an image-to-3D provider and emit glTF layers.")
  },
}
