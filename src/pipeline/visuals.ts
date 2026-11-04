import { generateImage } from "ai"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import type { ExplainerSpec } from "../spec/schema.ts"
import { slug } from "../spec/normalize.ts"
import type { ResolvedModels } from "./models.ts"
import { componentEditPrompt, explodedEditPrompt, heroEditPrompt } from "./prompts.ts"
import { imageModel } from "./providers.ts"

function extension(mediaType: string | undefined) {
  if (mediaType?.includes("jpeg")) return "jpg"
  if (mediaType?.includes("webp")) return "webp"
  return "png"
}

function editOptions(modelId: string) {
  if (!modelId.includes("gpt-image")) return undefined
  return {
    openai: {
      background: "transparent",
      output_format: "png",
    },
  }
}

async function editPhoto(
  modelId: ReturnType<typeof imageModel>,
  modelName: string,
  text: string,
  source: Uint8Array,
) {
  const result = await generateImage({
    model: modelId,
    prompt: {
      text,
      images: [source],
    },
    aspectRatio: "1:1",
    providerOptions: editOptions(modelName),
  })
  return result.image
}

export async function generateVisuals(
  spec: ExplainerSpec,
  outDir: string,
  models: ResolvedModels,
  source: Uint8Array,
  log: (message: string) => void = () => undefined,
): Promise<ExplainerSpec> {
  if (source.byteLength === 0) {
    throw new Error("The reference photo is empty. Image edits need the uploaded photo.")
  }

  await mkdir(path.join(outDir, "images"), { recursive: true })
  const warnings = [...(spec.generation?.warnings ?? [])]
  const model = imageModel(models.image, models.mode)

  async function save(stem: string, text: string) {
    const image = await editPhoto(model, models.image, text, source)
    const relative = `images/${stem}.${extension(image.mediaType)}`
    await writeFile(path.join(outDir, relative), image.uint8Array)
    return relative
  }

  const components = []
  for (const component of spec.components) {
    log(`Edit · ${component.name}`)
    try {
      const image = await save(slug(component.id), componentEditPrompt(spec, component))
      components.push({ ...component, image, visual: undefined })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warnings.push(`${component.name}: ${message}`)
      components.push(component)
    }
  }

  let heroImage = spec.heroImage
  log("Edit · assembled hero")
  try {
    heroImage = await save("hero", heroEditPrompt(spec))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnings.push(`hero: ${message}`)
  }

  let explodedImage = spec.explodedImage
  log("Edit · exploded view")
  try {
    explodedImage = await save("exploded", explodedEditPrompt(spec))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnings.push(`exploded: ${message}`)
  }

  const withImages = components.filter((component) => component.image).length
  const visualMode = withImages === 0 ? "pending" : withImages === components.length ? "generated" : "mixed"

  return {
    ...spec,
    components,
    heroImage,
    explodedImage,
    visualMode,
    artNote:
      visualMode === "generated"
        ? "Photographs edited from the uploaded photo. Same object, studio lighting, flat background so the layers can separate."
        : "Some photographic edits failed. Those parts stay empty until the image step succeeds. See generation.warnings.",
    generation: {
      visionModel: spec.generation?.visionModel,
      researchModel: spec.generation?.researchModel,
      imageModel: models.image,
      warnings,
    },
  }
}
