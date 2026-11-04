import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js"
import { assemblySchema } from "../spec/assembly.ts"
import { explodeSpecSchema } from "../spec/schema.ts"
import { buildAssembly, validateAssemblyEvidence } from "../authoring/assembly.ts"
import { disposeObject } from "../viewer/three/model.ts"
import { renderSite } from "./render-site.ts"

// GLTFExporter uses the browser FileReader API, even for texture-free binary output.
class BinaryReader {
  result: ArrayBuffer | string | null = null
  onloadend: (() => void) | null = null
  onerror: ((error: unknown) => void) | null = null
  readAsArrayBuffer(blob: Blob) {
    void blob
      .arrayBuffer()
      .then((value) => {
        this.result = value
        this.onloadend?.()
      })
      .catch((error) => this.onerror?.(error))
  }
  readAsDataURL(blob: Blob) {
    void blob
      .arrayBuffer()
      .then((value) => {
        this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`
        this.onloadend?.()
      })
      .catch((error) => this.onerror?.(error))
  }
}

let exportQueue: Promise<unknown> = Promise.resolve()

export async function assembleStudy(
  specFile: string,
  recipeFile: string,
  out: string,
  templateDir?: string,
  requirementsPath?: string,
) {
  const spec = explodeSpecSchema.parse(JSON.parse(await readFile(specFile, "utf8")))
  const recipe = assemblySchema.parse(JSON.parse(await readFile(recipeFile, "utf8")))
  validateAssemblyEvidence(spec, recipe)
  const root = buildAssembly(recipe)
  const task = exportQueue.then(async () => {
    const previous = globalThis.FileReader
    globalThis.FileReader = BinaryReader as unknown as typeof FileReader
    try {
      return (await new GLTFExporter().parseAsync(root, { binary: true })) as ArrayBuffer
    } finally {
      disposeObject(root)
      if (previous) globalThis.FileReader = previous
      else Reflect.deleteProperty(globalThis, "FileReader")
    }
  })
  exportQueue = task.catch(() => undefined)
  const bytes = await task
  await mkdir(out, { recursive: true })
  await writeFile(path.join(out, "assembly.glb"), Buffer.from(bytes))
  const assemblyStory = spec.scene3d?.kind === "gltf" ? spec.scene3d.assemblyStory : undefined
  spec.scene3d = {
    kind: "gltf",
    assemblyStory,
    url: "assembly.glb",
    parts: recipe.parts.map((p) => ({ componentId: p.componentId, node: p.componentId, offset: p.offset })),
  }
  explodeSpecSchema.parse(spec) // Revalidate narrative coverage against the actual recipe inventory.
  // All generated geometry starts unreviewed, including self-labelled reference-matched parts.
  spec.modelNotice = "Assembly prototype · approximate or unreviewed geometry"
  spec.artNote =
    "Agent-authored assembly prototype. " +
    recipe.parts.map((p) => `${p.componentId}: ${p.fidelity}; ${p.limitations.join(" ")}`).join(" ")
  spec.generation = {
    ...spec.generation,
    warnings: [
      ...new Set([
        ...(spec.generation?.warnings ?? []),
        "Geometry built from an authored recipe. Visual fidelity and learning effectiveness have not passed review.",
      ]),
    ],
  }
  await renderSite(spec, out, { templateDir, assetRoot: out, requirementsPath })
  await writeFile(
    path.join(out, "assembly-project.json"),
    JSON.stringify({ spec, assembly: recipe }, null, 2),
  )
  await writeFile(
    path.join(out, "assembly-review.json"),
    JSON.stringify(
      {
        status: "unreviewed",
        units: recipe.units,
        parts: recipe.parts.map(({ shapes: _shapes, ...p }) => ({
          ...p,
          requiredViews: ["front", "oblique", "reverse", "assembled", "exported"],
          verdict: "pending",
        })),
      },
      null,
      2,
    ),
  )
  return spec
}
