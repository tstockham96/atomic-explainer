import { createHash } from "node:crypto"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import type { ExplodeSpec } from "../spec/schema.ts"
import { assemblyRequirementsSchema, type AssemblyRequirements } from "../spec/requirements.ts"
import { glbComponentIds } from "../evals/inventory.ts"

export function auditCompleteness(
  requirements: AssemblyRequirements,
  spec: ExplodeSpec,
  geometryIds: string[],
) {
  const geometry = new Set(geometryIds),
    story = new Set(spec.components.map((c) => c.id))
  const mappings = new Set(spec.scene3d?.kind === "gltf" ? spec.scene3d.parts.map((p) => p.componentId) : [])
  const research = new Set(spec.understanding?.components.map((c) => c.componentId) ?? [])
  const parts = requirements.components.map((c) => ({
    ...c,
    research: research.has(c.id),
    geometry: geometry.has(c.id),
    story: story.has(c.id) && mappings.has(c.id),
  }))
  const remaining = parts
    .filter((c) => !c.research || !c.geometry || !c.story)
    .map((c) => ({
      componentId: c.id,
      name: c.name,
      next: !c.research ? "research" : !c.geometry ? "source-or-build" : "connect-to-story",
    }))
  return {
    version: 1,
    status: remaining.length ? "incomplete" : "coverage-complete",
    ready: false,
    parts,
    remaining,
    note: "Coverage is measured against the original requirements and exported geometry. It does not prove fidelity, fit, material accuracy or learning effectiveness. Visual and learning review remains required.",
  }
}
export async function writeCompleteness(
  requirementsPath: string,
  spec: ExplodeSpec,
  modelPath: string,
  outDir: string,
) {
  const bytes = await readFile(requirementsPath),
    requirements = assemblyRequirementsSchema.parse(JSON.parse(bytes.toString()))
  const model = await readFile(modelPath),
    report = {
      ...auditCompleteness(requirements, spec, glbComponentIds(model)),
      requirementsSha256: createHash("sha256").update(bytes).digest("hex"),
      modelSha256: createHash("sha256").update(model).digest("hex"),
    }
  await mkdir(outDir, { recursive: true })
  // Never silently reduce the original scope during a resumed build.
  const saved = path.join(outDir, "assembly-requirements.json")
  try {
    const previous = assemblyRequirementsSchema.parse(JSON.parse(await readFile(saved, "utf8")))
    const removed = previous.components.filter((c) => !requirements.components.some((n) => n.id === c.id))
    if (removed.length)
      throw Error(
        `The build would drop required components: ${removed.map((c) => c.id).join(", ")}. Preserve the original scope.`,
      )
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e
  }
  await writeFile(saved, bytes)
  await writeFile(path.join(outDir, "assembly-completeness.json"), JSON.stringify(report, null, 2))
  return report
}
