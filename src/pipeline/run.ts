import { readFile } from "node:fs/promises"
import path from "node:path"
import { explodeSpecSchema, type ExplodeSpec, type Identity } from "../spec/schema.ts"
import { normalizeSpec } from "../spec/normalize.ts"
import { identifyPhoto } from "./identify.ts"
import { assertModels } from "./models.ts"
import { renderSite } from "./render-site.ts"
import { researchItem } from "./research.ts"
import { generateVisuals } from "./visuals.ts"

export interface RunOptions {
  photo?: string
  specPath?: string
  outDir: string
  skipImages?: boolean
  log?: (message: string) => void
}

export async function runExplode(options: RunOptions): Promise<ExplodeSpec> {
  const log = options.log ?? (() => undefined)
  let spec: ExplodeSpec

  if (options.specPath) {
    const raw = JSON.parse(await readFile(path.resolve(options.specPath), "utf8")) as unknown
    spec = normalizeSpec(explodeSpecSchema.parse(raw))
    log(`Spec · ${spec.item.name}`)
  } else if (options.photo) {
    const models = assertModels()
    log(`Identify · ${models.vision}`)
    const identity = await identifyPhoto(options.photo, models)
    log(`Research · ${identity.name} (${models.research})`)
    spec = await researchItem(identity, models)
    spec = withIdentity(spec, identity, path.resolve(options.photo), models.vision)
  } else {
    throw new Error("Provide a photo path or --from-spec.")
  }

  if (!options.skipImages) {
    const models = assertModels()
    spec = await generateVisuals(spec, path.resolve(options.outDir), models, log)
  }

  await renderSite(spec, options.outDir, { log })
  return spec
}

function withIdentity(spec: ExplodeSpec, identity: Identity, sourcePhoto: string, visionModel: string): ExplodeSpec {
  return {
    ...spec,
    identity: {
      confidence: identity.confidence,
      notes: identity.notes,
      sourcePhoto,
    },
    generation: {
      visionModel,
      researchModel: spec.generation?.researchModel,
      imageModel: spec.generation?.imageModel,
      warnings: spec.generation?.warnings ?? [],
    },
  }
}

export { identifyPhoto } from "./identify.ts"
export { researchItem } from "./research.ts"
export { generateVisuals } from "./visuals.ts"
export { renderSite } from "./render-site.ts"
export { solid3d } from "./solid3d.ts"
export { resolveModels } from "./models.ts"
