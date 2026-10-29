import { z } from "zod"
import type { ExplodeSpec } from "./schema.ts"

export const manifestSchema = z.object({
  hero: z.string().min(1).optional(),
  exploded: z.string().min(1).optional(),
  components: z.record(z.string(), z.string().min(1)),
})

export type ImageManifest = z.infer<typeof manifestSchema>

/** Point a spec at photograph files. Paths are relative to the site root. */
export function applyManifest(spec: ExplodeSpec, manifest: ImageManifest): ExplodeSpec {
  return {
    ...spec,
    heroImage: manifest.hero ?? spec.heroImage,
    explodedImage: manifest.exploded ?? spec.explodedImage,
    visualMode: spec.visualMode === "generated" ? "generated" : "pending",
    components: spec.components.map((component) => {
      const image = manifest.components[component.id]
      return image ? { ...component, image, visual: undefined } : component
    }),
  }
}
