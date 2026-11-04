import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { layoutFor } from "../src/spec/layout.ts"
import { normalizeSpec } from "../src/spec/normalize.ts"
import { explodeSpecSchema, type ComponentSpec } from "../src/spec/schema.ts"
import { chapterAt, progressForChapter } from "../src/spec/storyboard.ts"
import { filmMap, frameIndex, phaseAt, progressForPhase } from "../src/spec/film.ts"
import { frameFile, keptFrameNumbers } from "../src/spec/frames.ts"
import { solid3d } from "../src/pipeline/solid3d.ts"

const specPath = path.join(process.cwd(), "public", "spec.json")
const murph = explodeSpecSchema.parse(JSON.parse(readFileSync(specPath, "utf8")))

describe("Murph demo spec", () => {
  it("parses and keeps the researched reference", () => {
    expect(murph.item.reference).toBe("H70605731")
    expect(murph.item.maker).toBe("Hamilton")
    expect(murph.components).toHaveLength(9)
    expect(murph.visualMode).toBe("generated")
    expect(murph.heroImage).toBe("murph/hero-916.jpg")
    expect(murph.explodedImage).toBe("murph/exploded-alt.jpg")
    expect(murph.frames?.rotation?.count).toBeGreaterThan(60)
    expect(murph.frames?.explode?.count).toBeGreaterThan(60)
    expect(murph.frames?.explode?.note).toContain("crystal")
  })

  it("does not treat 316L as the published case alloy", () => {
    const casePart = murph.components.find((component) => component.id === "case")
    expect(casePart?.material.toLowerCase()).not.toContain("316l")
    expect(casePart?.howItsMade).toContain("does not publish")
  })

  it("cites public sources", () => {
    expect(murph.sources.length).toBeGreaterThanOrEqual(4)
    for (const source of murph.sources) {
      expect(source.url.startsWith("https://")).toBe(true)
    }
  })

  it("points every part at a photograph in the manifest", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(process.cwd(), "public/murph/manifest.json"), "utf8"),
    ) as {
      components: Record<string, string>
    }
    for (const component of murph.components) {
      expect(component.image).toBe(manifest.components[component.id])
      expect(component.visual).toBeUndefined()
      expect(component.howItsMade.length).toBeGreaterThan(80)
    }
  })
})

describe("storyboard", () => {
  const count = 9

  it("maps the ends and the middle of each chapter", () => {
    expect(chapterAt(0, count)).toBe(-1)
    expect(chapterAt(1, count)).toBe(count)
    expect(chapterAt(progressForChapter(-1, count), count)).toBe(-1)
    expect(chapterAt(progressForChapter(0, count), count)).toBe(0)
    expect(chapterAt(progressForChapter(4, count), count)).toBe(4)
    expect(chapterAt(progressForChapter(count, count), count)).toBe(count)
  })
})

describe("film sequence", () => {
  it("plays a turn, then the explosion, then one slice per part", () => {
    const map = filmMap(9)
    expect(phaseAt(0, 9).phase).toBe("title")
    expect(phaseAt(map.turn + 0.01, 9).phase).toBe("turn")
    expect(phaseAt(map.burst + 0.01, 9).phase).toBe("burst")
    expect(phaseAt(map.parts + 0.001, 9)).toMatchObject({ phase: "part", partIndex: 0 })
    expect(phaseAt(0.999, 9).partIndex).toBe(8)
    expect(phaseAt(progressForPhase(3, 9), 9).partIndex).toBe(3)
    expect(frameIndex(0, 121)).toBe(0)
    expect(frameIndex(1, 121)).toBe(120)
  })

  it("rushes a bad source range down to a couple of frames", () => {
    const kept = keptFrameNumbers(120, 12, [{ start: 4.55, end: 5.65, keep: 2 }])
    const dropped = 120 - kept.length
    expect(dropped).toBeGreaterThan(8)
    expect(kept).toHaveLength(120 - dropped)
    expect(frameFile({ dir: "murph/frames/rotation", ext: "webp", pad: 4, start: 1 }, 0)).toBe(
      "murph/frames/rotation/0001.webp",
    )
  })
})

describe("layout", () => {
  it("stacks parts from top to bottom when the model omits coordinates", () => {
    const part = { placement: "stack" } as ComponentSpec
    const top = layoutFor(
      { ...part, id: "a", name: "A", material: "m", howItsMade: "h", funFacts: ["f"], order: 0 },
      0,
      5,
    )
    const bottom = layoutFor(
      { ...part, id: "b", name: "B", material: "m", howItsMade: "h", funFacts: ["f"], order: 4 },
      4,
      5,
    )
    expect(top.y).toBeLessThan(0)
    expect(bottom.y).toBeGreaterThan(0)
  })

  it("keeps an authored offset", () => {
    const crystal = murph.components[0]
    expect(crystal).toBeDefined()
    expect(layoutFor(crystal!, 0, murph.components.length).y).toBeLessThan(0)
  })
})

describe("normalizeSpec", () => {
  it("renumbers order after a sort", () => {
    const spec = normalizeSpec({
      ...murph,
      components: [...murph.components].reverse().map((component, index) => ({ ...component, order: index })),
    })
    expect(spec.components.map((component) => component.order)).toEqual(
      spec.components.map((_, index) => index),
    )
    expect(new Set(spec.components.map((component) => component.id)).size).toBe(spec.components.length)
  })
})

describe("solid 3D provider", () => {
  it("has an implemented reconstruction entry point", () => {
    expect(solid3d.available).toBe(true)
    expect(typeof solid3d.reconstruct).toBe("function")
  })
})
