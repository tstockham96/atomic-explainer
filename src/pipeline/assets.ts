import { createHash } from "node:crypto"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { assetPlanSchema, type AssetPlan } from "../spec/assets.ts"
import { explodeSpecSchema, type ExplodeSpec } from "../spec/schema.ts"
import { understandingIssues } from "./understanding.ts"
import { createTripoProvider, type AssetMeshProvider } from "./three/tripo.ts"
import { readPhoto } from "./photo.ts"
import { renderAssetReview } from "./asset-review-site.ts"

const hash = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex")

/** File-level inspection. Counts are diagnostic, never a visual quality score. */
export function inspectAsset(bytes: Uint8Array) {
  const b = Buffer.from(bytes)
  if (
    b.length < 20 ||
    b.readUInt32LE(0) !== 0x46546c67 ||
    b.readUInt32LE(4) !== 2 ||
    b.readUInt32LE(8) !== b.length ||
    b.readUInt32LE(16) !== 0x4e4f534a ||
    20 + b.readUInt32LE(12) > b.length
  )
    throw Error("Choose a self-contained GLB 2.0 model.")
  const d = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString("utf8"))
  if (
    [...(d.buffers ?? []), ...(d.images ?? [])].some(
      (r: { uri?: string }) => r.uri && !r.uri.startsWith("data:"),
    )
  )
    throw Error("External model resources must be embedded before import.")
  if (
    d.extensionsRequired?.some((name: string) =>
      ["KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_texture_basisu"].includes(name),
    )
  )
    throw Error("Decode compressed geometry and textures before review.")
  const meshes = (d.meshes ?? []).map(
    (
      m: {
        name?: string
        primitives: {
          attributes: { POSITION?: number }
          indices?: number
          material?: number
          mode?: number
        }[]
      },
      index: number,
    ) => ({
      index,
      name: m.name ?? `mesh_${index}`,
      vertices: m.primitives.reduce(
        (sum, p) => sum + (d.accessors?.[p.attributes.POSITION ?? -1]?.count ?? 0),
        0,
      ),
      triangles: m.primitives.reduce(
        (sum, p) =>
          sum +
          ((p.mode ?? 4) === 4
            ? (d.accessors?.[p.indices ?? p.attributes.POSITION ?? -1]?.count ?? 0) / 3
            : 0),
        0,
      ),
      materials: [...new Set(m.primitives.map((p) => p.material).filter((i) => i !== undefined))],
    }),
  )
  if (!meshes.length || meshes.every((m: { vertices: number }) => m.vertices === 0))
    throw Error("The file contains no renderable geometry.")
  return {
    sha256: hash(bytes),
    bytes: bytes.length,
    meshes,
    materials: (d.materials ?? []).map(
      (
        m: {
          name?: string
          pbrMetallicRoughness?: { baseColorTexture?: unknown; metallicRoughnessTexture?: unknown }
          normalTexture?: unknown
        },
        index: number,
      ) => ({
        index,
        name: m.name ?? `material_${index}`,
        colorTexture: !!m.pbrMetallicRoughness?.baseColorTexture,
        surfaceTexture: !!m.pbrMetallicRoughness?.metallicRoughnessTexture,
        normalTexture: !!m.normalTexture,
      }),
    ),
    textureCount: d.textures?.length ?? 0,
    warnings:
      meshes.reduce((n: number, m: { triangles: number }) => n + m.triangles, 0) <= 4
        ? [
            "This is a plane/billboard candidate, not established product geometry. Reject for volumetric product reconstruction.",
          ]
        : [],
  }
}

export function assetPlanIssues(spec: ExplodeSpec, plan: AssetPlan, componentId: string) {
  const issues = understandingIssues(spec)
  if (plan.identity !== spec.understanding?.identityScope)
    issues.push("Asset plan identity must match the researched variant exactly.")
  for (const [label, rows] of [
    ["candidate", plan.candidates],
    ["observation", plan.observations],
    ["task", plan.tasks.map((t) => ({ id: t.componentId }))],
  ] as const) {
    if (new Set(rows.map((r) => r.id)).size !== rows.length) issues.push(`Duplicate ${label} IDs.`)
  }
  const task = plan.tasks.find((t) => t.componentId === componentId)
  const part = spec.understanding?.components.find((c) => c.componentId === componentId)
  if (!task || !part) return [...issues, `Missing researched asset task for ${componentId}.`]
  const references = new Set(part.reconstruction.referenceIds)
  const observations = task.observationIds.map((id) => plan.observations.find((o) => o.id === id))
  for (const observation of observations) {
    if (!observation || observation.componentId !== componentId || !references.has(observation.referenceId))
      issues.push(
        `${componentId}: observation must identify this component and one of its construction references.`,
      )
  }
  if (!observations.some((o) => o && o.origin !== "generated"))
    issues.push("Generated images cannot be the only evidence for construction.")
  if (task.strategy.kind === "source") {
    const candidateId = task.strategy.candidateId
    const candidate = plan.candidates.find((c) => c.id === candidateId)
    if (!candidate || !candidate.exactVariant || candidate.decision !== "selected")
      issues.push("Choose an inspected exact-variant candidate before importing.")
    if (candidate?.coverage === "unknown") issues.push("Establish asset coverage before importing.")
  }
  if (task.strategy.kind === "multiview") {
    const views = task.strategy.views
    if (!views.some((v) => v.view === "front") || new Set(views.map((v) => v.view)).size !== views.length)
      issues.push("Multi-view input needs a front image and distinct additional orientations.")
    for (const v of views) {
      const o = observations.find((o) => o?.id === v.observationId)
      if (!o || o.view !== v.view)
        issues.push(
          "Each provider view must map to an inspected image of this component with that orientation.",
        )
    }
  }
  return issues
}

/** Executes ONE researched asset task; never publishes an unreviewed explainer. */
export async function prepareAsset(input: {
  specPath: string
  planPath: string
  componentId: string
  outDir: string
  provider?: AssetMeshProvider
  templateDir?: string
  requirementsPath?: string
  log?: (message: string) => void
}) {
  const spec = explodeSpecSchema.parse(JSON.parse(await readFile(input.specPath, "utf8")))
  const plan = assetPlanSchema.parse(JSON.parse(await readFile(input.planPath, "utf8")))
  const issues = assetPlanIssues(spec, plan, input.componentId)
  if (issues.length) throw Error(`Asset research is incomplete. ${issues.join(" ")} No generation purchased.`)
  const task = plan.tasks.find((t) => t.componentId === input.componentId)!
  if (task.strategy.kind === "defer") throw Error(`Component deferred: ${task.strategy.reason}`)
  const base = path.dirname(path.resolve(input.planPath))
  const observations = await Promise.all(
    task.observationIds.map(async (id) => {
      const observation = plan.observations.find((o) => o.id === id)!
      const photo = await readPhoto(path.resolve(base, observation.imagePath))
      return { ...observation, sha256: hash(photo.bytes), photo }
    }),
  )
  const construction = spec.understanding!.components.find((c) => c.componentId === input.componentId)!
  const sourcedBytes =
    task.strategy.kind === "source" ? await readFile(path.resolve(base, task.strategy.modelPath)) : undefined
  if (sourcedBytes && sourcedBytes.length > 150 * 1024 * 1024)
    throw Error("Source model exceeds the 150 MB review limit.")
  const brief = {
    sourceHash: sourcedBytes ? hash(sourcedBytes) : undefined,
    identity: plan.identity,
    component: construction,
    task,
    candidates: plan.candidates,
    searches: plan.searches,
    observations: observations.map(({ photo: _photo, ...o }) => o),
  }
  const researchHash = hash(JSON.stringify(brief))
  await mkdir(input.outDir, { recursive: true })
  const briefPath = path.join(input.outDir, "asset-brief.json")
  // Checkpoints, saved inputs and a model always describe the same research revision.
  try {
    const previous = JSON.parse(await readFile(briefPath, "utf8"))
    if (previous.researchHash !== researchHash)
      throw Error(
        "This folder belongs to different research or reference images. Choose a new output folder.",
      )
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e
  }
  await writeFile(briefPath, JSON.stringify({ ...brief, researchHash }, null, 2))
  const log = input.log ?? (() => undefined)
  let bytes: Uint8Array
  if (task.strategy.kind === "source") bytes = sourcedBytes!
  else {
    const provider =
      input.provider ?? createTripoProvider({ apiKey: process.env.TRIPO_API_KEY ?? "", quality: "fidelity" })
    bytes = await provider.generateAsset(
      task.strategy.kind === "text"
        ? {
            mode: "text",
            prompt: task.strategy.prompt,
            negativePrompt: task.strategy.negativePrompt,
            researchHash,
          }
        : {
            mode: "multiview",
            researchHash,
            views: task.strategy.views.map((v) => {
              const o = observations.find((o) => o.id === v.observationId)!
              return { view: v.view, bytes: o.photo.bytes, mime: o.photo.mediaType }
            }),
          },
      input.outDir,
      log,
    )
  }
  // Preserve paid output even when file validation fails.
  await writeFile(path.join(input.outDir, "model.glb"), bytes)
  const inventory = inspectAsset(bytes)
  const sourceId = task.strategy.kind === "source" ? task.strategy.candidateId : undefined
  const source = plan.candidates.find((c) => c.id === sourceId)
  const review = {
    status: inventory.warnings.length ? "rejected" : "needs-visual-review",
    componentId: input.componentId,
    researchHash,
    modelHash: inventory.sha256,
    inventory,
    redistribution: source?.license.redistribution ?? "unknown",
    coverage: source?.coverage ?? "component",
    requiredChecks: construction.reconstruction.acceptanceChecks,
    views: ["front", "oblique", "back", "assembled", "exported"].map((view) => ({
      view,
      verdict: "pending",
      capture: null,
      mismatches: [],
    })),
    note: "No quality pass from polygon count, source reputation or successful generation. Compare actual rendered surfaces to inspected evidence. Do not narrate absent internals or export restricted assets.",
  }
  await writeFile(path.join(input.outDir, "asset-review.json"), JSON.stringify(review, null, 2))
  await renderAssetReview(
    input.outDir,
    {
      title: spec.components.find((c) => c.id === input.componentId)!.name,
      description: construction.function,
      model: "model.glb",
      source: source ? { label: "Source model", url: source.url } : undefined,
      limitations: [
        review.note,
        ...construction.unknowns,
        ...inventory.warnings,
        `Coverage: ${review.coverage}. Redistribution: ${review.redistribution}.`,
      ],
    },
    input.templateDir,
  )
  return review
}

/** Advance every researched component, retaining failures and missing tasks in a
 * durable queue. A successful asset import never means the assembly is done. */
export async function prepareAssets(input: Omit<Parameters<typeof prepareAsset>[0], "componentId">) {
  const spec = explodeSpecSchema.parse(JSON.parse(await readFile(input.specPath, "utf8")))
  const plan = assetPlanSchema.parse(JSON.parse(await readFile(input.planPath, "utf8")))
  const requirements = input.requirementsPath
    ? (await import("../spec/requirements.ts")).assemblyRequirementsSchema.parse(
        JSON.parse(await readFile(input.requirementsPath, "utf8")),
      )
    : undefined
  const required = requirements?.components ?? spec.components.map((c) => ({ id: c.id, name: c.name }))
  const results: { componentId: string; stage: string; detail: string }[] = []
  await mkdir(input.outDir, { recursive: true })
  const save = async () =>
    writeFile(
      path.join(input.outDir, "assembly-progress.json"),
      JSON.stringify(
        {
          status: "incomplete",
          ready: false,
          identity: plan.identity,
          requiredComponentIds: required.map((c) => c.id),
          results,
          remaining: required.map((c) => ({
            componentId: c.id,
            next: results.find((r) => r.componentId === c.id)?.stage ?? "prepare-asset",
          })),
          nextStep:
            "Resolve missing/rejected assets, fit all components into one assembly, export and audit against original requirements, then inspect the actual rendered story.",
        },
        null,
        2,
      ),
    )
  for (const component of required) {
    const task = plan.tasks.find((t) => t.componentId === component.id)
    if (!task) {
      results.push({
        componentId: component.id,
        stage: "research-and-plan",
        detail: "Required component has no asset task.",
      })
      await save()
      continue
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(component.id)) throw Error("Batch component IDs must be safe folder names.")
    try {
      const review = await prepareAsset({
        ...input,
        componentId: component.id,
        outDir: path.join(input.outDir, component.id),
      })
      results.push({
        componentId: component.id,
        stage: review.status === "rejected" ? "replace-asset" : "visual-review-and-fit",
        detail: review.note,
      })
    } catch (error) {
      results.push({
        componentId: component.id,
        stage: "resolve-asset",
        detail: error instanceof Error ? error.message : String(error),
      })
    }
    await save()
  }
  return { status: "incomplete", results, progress: path.join(input.outDir, "assembly-progress.json") }
}
