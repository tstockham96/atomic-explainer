import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { formatHelp } from "../src/cli.ts"
import { componentEditPrompt, explodedEditPrompt, heroEditPrompt } from "../src/pipeline/prompts.ts"
import { applyManifest, manifestSchema } from "../src/spec/manifest.ts"
import { resolveModels } from "../src/pipeline/models.ts"
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

    const index = await renderSite(murph, out, { templateDir: template })
    const html = await readFile(index, "utf8")
    const written = JSON.parse(await readFile(path.join(out, "spec.json"), "utf8")) as { item: { reference?: string } }
    expect(html).toContain("H70605731")
    expect(written.item.reference).toBe("H70605731")
    expect(await readFile(path.join(out, "app.js"), "utf8")).toContain("viewer")
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
