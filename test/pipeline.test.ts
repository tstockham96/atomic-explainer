import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { formatHelp } from "../src/cli.ts"
import {
  componentEditPrompt,
  explodedEditPrompt,
  explodeMotionPrompt,
  heroEditPrompt,
  rotationMotionPrompt,
} from "../src/pipeline/prompts.ts"
import { applyManifest, manifestSchema } from "../src/spec/manifest.ts"
import { resolveModels, resolveVideo } from "../src/pipeline/models.ts"
import { SPEC_MARKER, injectSpec, renderSite } from "../src/pipeline/render-site.ts"
import { explodeSpecSchema } from "../src/spec/schema.ts"
import { readFileSync } from "node:fs"

const murph = explodeSpecSchema.parse(JSON.parse(readFileSync("public/spec.json", "utf8")))
const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("credentials", () => {
  it("refuses to guess a provider", () => {
    const result = resolveModels({})
    expect("error" in result).toBe(true)
  })

  it("prefers the gateway and does not echo the key", () => {
    const result = resolveModels({
      AI_GATEWAY_API_KEY: "secret-gateway",
      OPENAI_API_KEY: "secret-openai",
    })
    expect(result).toMatchObject({
      mode: "gateway",
      vision: "google/gemini-2.5-flash",
      image: "google/gemini-2.5-flash-image",
    })
    expect(JSON.stringify(result)).not.toContain("secret")
  })

  it("strips a provider prefix for direct OpenAI", () => {
    const result = resolveModels({
      OPENAI_API_KEY: "secret-openai",
      EXPLODE_IMAGE_MODEL: "openai/gpt-image-1",
    })
    expect(result).toMatchObject({ mode: "openai", image: "gpt-image-1", vision: "gpt-4o" })
  })
})

describe("motion", () => {
  it("asks for a locked turn and a first-to-last explosion", () => {
    expect(rotationMotionPrompt(murph)).toContain("one full turn")
    expect(rotationMotionPrompt(murph)).toContain("No people")
    expect(explodeMotionPrompt(murph)).toContain("first frame")
    expect(explodeMotionPrompt(murph)).toContain("last frame")
    expect(explodeMotionPrompt(murph)).toContain("Sapphire crystal")
  })

  it("defaults video to gateway Kling and can switch to fal", () => {
    expect(resolveVideo({ AI_GATEWAY_API_KEY: "secret-gateway" })).toMatchObject({
      provider: "gateway",
      model: "klingai/kling-v2.6-i2v",
    })
    expect(resolveVideo({ FAL_KEY: "secret-fal", EXPLODE_VIDEO_PROVIDER: "fal" })).toMatchObject({
      provider: "fal",
    })
    expect(JSON.stringify(resolveVideo({ AI_GATEWAY_API_KEY: "secret-gateway" }))).not.toContain("secret")
  })
})

describe("site render", () => {
  it("injects the spec without letting markup break out", () => {
    const html = `<script>${SPEC_MARKER}</script>`
    const injected = injectSpec(html, {
      ...murph,
      item: { ...murph.item, summary: "</script><script>alert(1)</script>" },
    })
    expect(injected).not.toContain(SPEC_MARKER)
    expect(injected).not.toContain("</script><script>")
    expect(injected).toContain("\\u003c/script>")
  })

  it("copies a viewer template and writes spec.json", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "explode-"))
    dirs.push(root)
    const template = path.join(root, "template")
    const out = path.join(root, "site")
    await mkdir(template)
    await writeFile(path.join(template, "index.html"), `<!doctype html><script>${SPEC_MARKER}</script>`)
    await writeFile(path.join(template, "app.js"), "console.log('viewer')")
    await mkdir(path.join(template, "presentation/workshop"), { recursive: true })
    await mkdir(path.join(template, "presentation/atelier"), { recursive: true })
    await writeFile(path.join(template, "presentation/atelier/workshop.glb"), "portable baked scene")
    await writeFile(
      path.join(template, "presentation/atelier/workshop-probe.hdr"),
      "portable room reflections",
    )
    await writeFile(path.join(template, "presentation/workshop/ATTRIBUTION.md"), "CC0 provenance")

    const index = await renderSite(murph, out, { templateDir: template })
    const html = await readFile(index, "utf8")
    const written = JSON.parse(await readFile(path.join(out, "spec.json"), "utf8")) as {
      item: { reference?: string }
    }
    expect(html).toContain("H70605731")
    expect(written.item.reference).toBe("H70605731")
    expect(await readFile(path.join(out, "app.js"), "utf8")).toContain("viewer")
    expect(await readFile(path.join(out, "presentation/atelier/workshop.glb"), "utf8")).toBe(
      "portable baked scene",
    )
    expect(await readFile(path.join(out, "presentation/atelier/workshop-probe.hdr"), "utf8")).toBe(
      "portable room reflections",
    )
    expect(await readFile(path.join(out, "presentation/workshop/ATTRIBUTION.md"), "utf8")).toBe(
      "CC0 provenance",
    )
  })

  it("includes a local multipart model when exporting a portable explainer", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "explode-model-"))
    dirs.push(root)
    const templateDir = path.join(root, "template")
    const assetRoot = path.join(root, "assets")
    const out = path.join(root, "site")
    await mkdir(templateDir)
    await mkdir(path.join(assetRoot, "models"), { recursive: true })
    await writeFile(path.join(templateDir, "index.html"), `<script>${SPEC_MARKER}</script>`)
    const json = Buffer.from(JSON.stringify({ asset: { version: "2.0" }, scenes: [{ nodes: [] }], scene: 0 }))
    const length = Math.ceil(json.length / 4) * 4
    const bytes = Buffer.alloc(20 + length, 32)
    bytes.writeUInt32LE(0x46546c67, 0)
    bytes.writeUInt32LE(2, 4)
    bytes.writeUInt32LE(bytes.length, 8)
    bytes.writeUInt32LE(length, 12)
    bytes.writeUInt32LE(0x4e4f534a, 16)
    json.copy(bytes, 20)
    await writeFile(path.join(assetRoot, "models", "object.glb"), bytes)
    const spec = explodeSpecSchema.parse({
      ...murph,
      scene3d: {
        kind: "gltf",
        url: "models/object.glb",
        parts: [{ componentId: "crystal", node: "Glass", offset: [0, 2, 0] }],
      },
    })
    await renderSite(spec, out, { templateDir, assetRoot })
    expect(await readFile(path.join(out, "models", "object.glb"))).toEqual(bytes)
    const materialReview = JSON.parse(await readFile(path.join(out, "material-review.json"), "utf8"))
    expect(materialReview.ready).toBe(false)
    expect(materialReview.modelSha256).toHaveLength(64)
    expect(JSON.parse(await readFile(path.join(out, "spec.json"), "utf8")).scene3d).toEqual(spec.scene3d)

    await expect(
      renderSite(
        { ...spec, scene3d: { ...spec.scene3d!, kind: "gltf", url: "../outside.glb", parts: [] } },
        out,
        { templateDir, assetRoot },
      ),
    ).rejects.toThrow("must stay inside")
  })

  it("reports a missing local model instead of exporting a broken scene", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "explode-missing-model-"))
    dirs.push(root)
    const templateDir = path.join(root, "template")
    await mkdir(templateDir)
    await writeFile(path.join(templateDir, "index.html"), `<script>${SPEC_MARKER}</script>`)
    const spec = explodeSpecSchema.parse({
      ...murph,
      scene3d: {
        kind: "gltf",
        url: "models/missing.glb",
        parts: [{ componentId: "crystal", node: "Glass", offset: [0, 2, 0] }],
      },
    })
    await expect(renderSite(spec, path.join(root, "site"), { templateDir })).rejects.toThrow(
      "3D model is missing",
    )
  })
})

describe("photographic edits", () => {
  it("tells the model to match the reference photo", () => {
    const hero = heroEditPrompt(murph)
    const exploded = explodedEditPrompt(murph)
    const crystal = murph.components.find((component) => component.id === "crystal")
    expect(crystal).toBeDefined()
    const closeup = componentEditPrompt(murph, crystal!)
    for (const prompt of [hero, exploded, closeup]) {
      expect(prompt).toContain("Photorealistic")
      expect(prompt).toContain("reference")
      expect(prompt).toContain("Do not illustrate")
      expect(prompt).toContain("Do not bake in labels")
    }
    expect(closeup).toContain("Sapphire crystal")
    expect(exploded).toContain("Caliber H-10")
    expect(exploded).toContain("assembly axis")
    expect(exploded).toContain("subtle shadows")
  })

  it("applies a manifest onto the spec", () => {
    const manifest = manifestSchema.parse({
      hero: "shots/hero.png",
      exploded: "shots/exploded.png",
      components: { crystal: "shots/crystal.png" },
    })
    const next = applyManifest(murph, manifest)
    expect(next.heroImage).toBe("shots/hero.png")
    expect(next.explodedImage).toBe("shots/exploded.png")
    expect(next.components.find((component) => component.id === "crystal")?.image).toBe("shots/crystal.png")
    expect(next.components.find((component) => component.id === "dial")?.image).toBe("murph/dial.jpg")
  })
})

describe("cli help", () => {
  it("documents the spec shortcut and the gateway key", () => {
    const help = formatHelp()
    expect(help).toContain("--from-spec")
    expect(help).toContain("AI_GATEWAY_API_KEY")
  })
})
