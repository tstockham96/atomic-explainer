import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createTripoProvider } from "../src/pipeline/three/tripo.ts"
import { indexMeshNodes } from "../src/pipeline/three/glb.ts"
import { buildGeneratedScene, reconstruct } from "../src/pipeline/solid3d.ts"
import { groundComponents } from "../src/pipeline/research.ts"
import { explodeSpecSchema } from "../src/spec/schema.ts"
import { renderSite, SPEC_MARKER } from "../src/pipeline/render-site.ts"
import { mkdir } from "node:fs/promises"
import { exteriorStudy } from "./helpers/understanding.ts"

const directories: string[] = []
async function temp() { const dir = await mkdtemp(path.join(tmpdir(), "explode-generate-")); directories.push(dir); return dir }
afterEach(async () => { await Promise.all(directories.splice(0).map(dir => rm(dir, { force: true, recursive: true }))) })
const spec = explodeSpecSchema.parse(JSON.parse(await readFile("public/chronograph.json", "utf8")))
const original = await readFile("public/models/chronograph/watch.glb")
const ok = (data: unknown) => new Response(JSON.stringify({ code: 0, data }))
const photo = new Uint8Array([137, 80, 78, 71])

describe("Tripo generation contract", () => {
  it("uploads, generates, segments, downloads without leaking credentials, and resumes without extra purchases", async () => {
    const dir = await temp(); const posts: string[] = []; const bodies: Record<string, unknown>[] = []
    const request = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input)
      if (init?.method === "POST") {
        posts.push(url)
        if (url.endsWith("/files")) return ok({ file_token: "file_token" })
        bodies.push(JSON.parse(init.body as string))
        return ok({ task_id: url.includes("/generation/") ? "generated" : "segmented" })
      }
      if (url.includes("/tasks/")) return ok({ status: "success", output: { model_url: "https://cdn.tripo3d.ai/model.glb" } })
      expect(init?.headers).toBeUndefined()
      return new Response(original)
    })
    const provider = createTripoProvider({ apiKey: "secret", fetch: request, sleep: async () => undefined })
    expect(Buffer.from(await provider.generate(photo, "image/png", dir, () => undefined)).equals(original)).toBe(true)
    await provider.generate(photo, "image/png", dir, () => undefined)
    expect(posts).toHaveLength(3)
    expect(bodies[0]).toMatchObject({ texture: true, pbr: true, model: "v3.1-20260211" })
    expect(bodies[0]).not.toHaveProperty("generate_parts")
    expect(bodies[1]).toMatchObject({ input: "generated", model: "v2.0-20260430" })
    expect(await readFile(path.join(dir, "tripo-tasks.json"), "utf8")).not.toContain("secret")
    await expect(provider.generate(new Uint8Array([0]), "image/png", dir, () => undefined)).rejects.toThrow("different photo")
  })
  it("does not retry a paid submission with an unknown outcome", async () => {
    const dir = await temp()
    const request = vi.fn<typeof fetch>(async input => {
      if (String(input).endsWith("/files")) return ok({ file_token: "photo" })
      throw new Error("Connection lost")
    })
    const provider = createTripoProvider({ apiKey: "secret", fetch: request })
    await expect(provider.generate(photo, "image/png", dir, () => undefined)).rejects.toThrow("Connection lost")
    await expect(provider.generate(photo, "image/png", dir, () => undefined)).rejects.toThrow("unknown outcome")
    expect(request).toHaveBeenCalledTimes(2)
  })
  it("separates fidelity checkpoints from default purchases and resumes fidelity without buying again", async () => {
    const dir = await temp(); const payloads: Record<string, unknown>[] = []
    const request = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input)
      if (url.endsWith("/files")) return ok({ file_token: "photo" })
      if (init?.method === "POST") {
        payloads.push(JSON.parse(init.body as string))
        return ok({ task_id: url.includes("/generation/") ? "generated" : "segmented" })
      }
      if (url.includes("/tasks/")) return ok({ status: "success", output: { model_url: "https://cdn.tripo3d.ai/model.glb" } })
      return new Response(original)
    })
    const provider = createTripoProvider({ apiKey: "secret", quality: "fidelity", fetch: request })
    await provider.generate(photo, "image/png", dir, () => undefined)
    await provider.generate(photo, "image/png", dir, () => undefined)
    expect(payloads).toHaveLength(2)
    expect(payloads[0]).toMatchObject({ texture_quality: "extreme", texture_version: "v3.5-20260815", delight: true, face_limit: 300_000 })
    expect(payloads[1]).toMatchObject({ split_by_connectivity: true })
    const callsBefore = request.mock.calls.length
    await expect(createTripoProvider({ apiKey: "secret", fetch: request }).generate(photo, "image/png", dir, () => undefined)).rejects.toThrow("quality setting")
    expect(request).toHaveBeenCalledTimes(callsBefore)
  })
  it("bounds polling and resumes the same generation task", async () => {
    const dir = await temp()
    const request = vi.fn<typeof fetch>(async input => {
      const url = String(input)
      if (url.endsWith("/files")) return ok({ file_token: "photo" })
      if (url.includes("/generation/")) return ok({ task_id: "slow" })
      return ok({ status: "running", progress: 12 })
    })
    const provider = createTripoProvider({ apiKey: "secret", fetch: request, maxPolls: 2, sleep: async () => undefined })
    await expect(provider.generate(photo, "image/png", dir, () => undefined)).rejects.toThrow("same output folder")
    await expect(provider.generate(photo, "image/png", dir, () => undefined)).rejects.toThrow("same output folder")
    expect(request.mock.calls.filter(([url]) => String(url).includes("/generation/"))).toHaveLength(1)
  })
  it("treats failed tasks as terminal", async () => {
    const request = vi.fn<typeof fetch>(async input => String(input).endsWith("/files") ? ok({ file_token: "p" }) : String(input).includes("/generation/") ? ok({ task_id: "bad" }) : ok({ status: "failed", error_code: 42 }))
    await expect(createTripoProvider({ apiKey: "secret", fetch: request }).generate(photo, "image/png", await temp(), () => undefined)).rejects.toThrow("bad failed (42)")
    expect(request.mock.calls.some(([url]) => String(url).includes("/mesh/segment"))).toBe(false)
  })
})

describe("generated model handoff", () => {
  it("indexes real geometry with stable unique mesh addresses and preserves the binary payload", () => {
    const result = indexMeshNodes(original)
    const oldJSON = original.readUInt32LE(12), newJSON = result.bytes.readUInt32LE(12)
    expect(result.bytes.subarray(20 + newJSON).equals(original.subarray(20 + oldJSON))).toBe(true)
    expect(new Set(result.entries.map(item => item.node)).size).toBe(result.entries.length)
    expect(result.entries.length).toBeGreaterThan(6)
    expect(() => indexMeshNodes(new Uint8Array([1, 2]))).toThrow("valid GLB")
  })
  it("keeps unidentified meshes separate and explicitly reports missing components", () => {
    const entries = [{ node: "glass", label: "Glass" }, { node: "unknown", label: "mesh_0" }]
    const result = buildGeneratedScene(spec, entries, [{ node: "glass", componentId: spec.components[0]!.id, confidence: 0.98, reason: "Semantic label" }])
    expect(result.report.unassigned).toEqual(["unknown"])
    expect(result.report.missing).toHaveLength(spec.components.length - 1)
    expect(result.spec.components.map(part => part.id)).toContain("unidentified-surfaces")
    expect(result.spec.scene3d?.kind).toBe("gltf")
    expect(() => buildGeneratedScene(spec, entries, [{ node: "invented", componentId: null, confidence: 0, reason: "" }])).toThrow("unknown")
  })
  it("exports a provider result as an actual self-contained 3D explainer", async () => {
    const directory = await temp(); const sourcePhoto = path.join(directory, "source.png")
    await writeFile(sourcePhoto, photo)
    const outDir = path.join(directory, "site")
    const next = await reconstruct({ spec: exteriorStudy(spec), sourcePhoto, outDir,
      provider: { id: "fixture", generate: async () => original },
      mapParts: async entries => entries.map((entry, index) => ({ node: entry.node, componentId: spec.components[index % spec.components.length]!.id, confidence: 1, reason: "Test fixture assignment only" })),
    })
    expect(explodeSpecSchema.safeParse(next).success).toBe(true)
    const templateDir = path.join(directory, "template"); await mkdir(templateDir)
    await writeFile(path.join(templateDir, "index.html"), `<script>${SPEC_MARKER}</script>`)
    await renderSite(next, outDir, { templateDir, assetRoot: outDir })
    expect(await readFile(path.join(outDir, "index.html"), "utf8")).toContain("models/generated.glb")
    const coverage = JSON.parse(await readFile(path.join(outDir, "coverage.json"), "utf8"))
    expect(coverage.needsReview).toBe(true)
    expect(coverage.missing).toEqual([])
    expect((await readFile(path.join(outDir, "models/generated.glb"))).length).toBeGreaterThan(1000)
  })
  it("will not turn an invented URL into documented evidence", () => {
    const component = { ...spec.components[0]!, evidence: { basis: "documented" as const, sourceUrls: ["https://invented.invalid/claim"], note: "Model claim" } }
    expect(groundComponents([component], spec.sources)[0]?.evidence).toMatchObject({ basis: "inferred", sourceUrls: [] })
  })
})
