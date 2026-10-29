import { generateImage } from "ai"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import type { ComponentSpec, ExplodeSpec } from "../spec/schema.ts"
import { slug } from "../spec/normalize.ts"
import type { ResolvedModels } from "./models.ts"
import { imageModel } from "./providers.ts"

function extension(mediaType: string | undefined) {
  if (mediaType?.includes("jpeg")) return "jpg"
  if (mediaType?.includes("webp")) return "webp"
  return "png"
}

function componentPrompt(spec: ExplodeSpec, component: ComponentSpec) {
  return [
    `Isolated product photograph of one part from a ${spec.item.name}: ${component.name}.`,
    `Material: ${component.material}.`,
    component.visualHint ?? "",
    "Straight top-down view, centered, the part filling about 70 percent of the frame.",
    "Background is a perfectly flat solid color #0c0d0b, no gradient, no floor, no shadow blob, no text, no watermark, no logo other than one that is physically part of the object.",
    "Photoreal, crisp edges, one object only.",
  ]
    .filter(Boolean)
    .join(" ")
}

function heroPrompt(spec: ExplodeSpec) {
  const names = spec.components.map((component) => component.name).join(", ")
  return [
    `Cinematic exploded product photograph of a ${spec.item.name}.`,
    `Parts separated vertically in a neat column: ${names}.`,
    "Dark studio, solid background #0c0d0b, no text, no watermark, photoreal.",
  ].join(" ")
}

async function writeGenerated(outDir: string, stem: string, modelId: ReturnType<typeof imageModel>, prompt: string) {
  const result = await generateImage({
    model: modelId,
    prompt,
    aspectRatio: "1:1",
  })
  const ext = extension(result.image.mediaType)
  const relative = `images/${stem}.${ext}`
  await writeFile(path.join(outDir, relative), result.image.uint8Array)
  return relative
}

export async function generateVisuals(
  spec: ExplodeSpec,
  outDir: string,
  models: ResolvedModels,
  log: (message: string) => void = () => undefined,
): Promise<ExplodeSpec> {
  await mkdir(path.join(outDir, "images"), { recursive: true })
  const warnings = [...(spec.generation?.warnings ?? [])]
  const model = imageModel(models.image, models.mode)
  const components: ComponentSpec[] = []

  for (const component of spec.components) {
    log(`Image · ${component.name}`)
    try {
      const image = await writeGenerated(outDir, slug(component.id), model, componentPrompt(spec, component))
      components.push({ ...component, image })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      warnings.push(`${component.name}: ${message}`)
      components.push(component)
    }
  }

  let heroImage = spec.heroImage
  log("Image · exploded hero")
  try {
    heroImage = await writeGenerated(outDir, "hero", model, heroPrompt(spec))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnings.push(`hero: ${message}`)
  }

  const withImages = components.filter((component) => component.image).length
  const visualMode = withImages === 0 ? spec.visualMode : withImages === components.length ? "generated" : "mixed"

  return {
    ...spec,
    components,
    heroImage,
    visualMode,
    artNote:
      visualMode === "generated"
        ? "Layer photography generated for this teardown. Backgrounds are prompted to match the page."
        : spec.artNote,
    generation: {
      visionModel: spec.generation?.visionModel,
      researchModel: spec.generation?.researchModel,
      imageModel: models.image,
      warnings,
    },
  }
}
