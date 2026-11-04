import { it, expect } from "vitest"
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { explodeSpecSchema } from "../src/spec/schema.ts"
import { assemblyRequirementsSchema } from "../src/spec/requirements.ts"
import { auditCompleteness, writeCompleteness } from "../src/pipeline/completeness.ts"
const requirements = assemblyRequirementsSchema.parse(
  JSON.parse(await readFile("examples/iphone-18-pro/requirements.json", "utf8")),
)
const exterior = explodeSpecSchema.parse(
  JSON.parse(await readFile("examples/iphone-18-pro/exterior-study.json", "utf8")),
)
const internal = explodeSpecSchema.parse(
  JSON.parse(await readFile("examples/iphone-18-pro/internal-study.json", "utf8")),
)
it("an immaculate exterior cannot erase the required internals", () => {
  const report = auditCompleteness(
    requirements,
    exterior,
    exterior.components.map((c) => c.id),
  )
  expect(report.status).toBe("incomplete")
  for (const id of ["battery", "logic-board", "processor", "memory", "storage", "cooling", "microphones"])
    expect(report.remaining.some((r) => r.componentId === id)).toBe(true)
})
it("captions and mappings cannot substitute for actual geometry", () => {
  const report = auditCompleteness(requirements, internal, ["display", "enclosure"])
  expect(report.remaining.find((r) => r.componentId === "battery")?.next).toBe("source-or-build")
})
it("structural coverage never grants visual approval", () => {
  const report = auditCompleteness(
    requirements,
    internal,
    internal.components.map((c) => c.id),
  )
  expect(report.status).toBe("coverage-complete")
  expect(report.remaining).toEqual([])
  expect(report.ready).toBe(false)
})
it("a resumed export cannot silently shrink the requirement inventory", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "explode-scope-"))
  try {
    await writeFile(path.join(dir, "assembly-requirements.json"), JSON.stringify(requirements))
    const file = path.join(dir, "reduced.json")
    await writeFile(
      file,
      JSON.stringify({ ...requirements, components: requirements.components.slice(0, 2) }),
    )
    await expect(
      writeCompleteness(file, internal, "public/models/chronograph/watch.glb", dir),
    ).rejects.toThrow("drop required components")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
