import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { explodeSpecSchema } from "../src/spec/schema.ts"
import { scenePartIds } from "../src/spec/scene3d.ts"
import { sampleScene, THREE_TIMING } from "../src/viewer/three/timeline.ts"

const spec = explodeSpecSchema.parse(JSON.parse(readFileSync("public/spec.json", "utf8")))

describe("three-dimensional story", () => {
  it("completes one revolution before separating the meshes", () => {
    expect(sampleScene(0, 9)).toMatchObject({ turn: 0, separation: 0, index: -1 })
    expect(sampleScene(THREE_TIMING.explode, 9)).toMatchObject({ turn: 1, separation: 0, index: -1 })
    expect(sampleScene(THREE_TIMING.inspect, 9)).toMatchObject({ turn: 1, separation: 1, index: 0, focus: 0 })
  })

  it("returns to the exploded overview between all nine component explorations", () => {
    const count = scenePartIds(spec).length
    expect(count).toBe(9)
    for (let i = 0; i < count; i++) {
      const start = THREE_TIMING.inspect + (i * (THREE_TIMING.reassemble - THREE_TIMING.inspect)) / count
      expect(sampleScene(start + 0.000001, count).focus).toBeCloseTo(0, 6)
      expect(sampleScene(start - 0.000001, count).focus).toBeCloseTo(0, 6)
      const middle = start + ((THREE_TIMING.reassemble - THREE_TIMING.inspect) / count) * 0.5
      expect(sampleScene(middle, count)).toMatchObject({ index: i, focus: 1, separation: 1 })
    }
    expect(sampleScene(1, count).focus).toBeCloseTo(0, 6)
    expect(sampleScene(1, count)).toMatchObject({ separation: 0, index: -1, focus: 0 })
  })

  it("closes continuously after the last part, then holds the complete assembly", () => {
    const start = THREE_TIMING.reassemble
    expect(sampleScene(start - 1e-7, 28).focus).toBeCloseTo(0)
    expect(sampleScene(start, 28)).toMatchObject({ index: -1, separation: 1, focus: 0 })
    let last = 1
    for (let p = start; p <= 1; p += 0.001) {
      const next = sampleScene(p, 28)
      expect(next.separation).toBeLessThanOrEqual(last)
      expect(next.index).toBe(-1)
      last = next.separation
    }
    expect(sampleScene(THREE_TIMING.settled, 28).separation).toBe(0)
    expect(sampleScene(1, 0).separation).toBe(0)
  })

  it("never leaves the camera focused when entering anatomy, including reverse scrolling", () => {
    const values = [0, 0.1, 0.3, 0.45, 0.6, 0.8, 0.999, 1]
    const forward = values.map((value) => sampleScene(value, 9))
    expect(
      [...values]
        .reverse()
        .map((value) => sampleScene(value, 9))
        .reverse(),
    ).toEqual(forward)
    expect(sampleScene(1.2, 9)).toEqual(sampleScene(1, 9))
    expect(sampleScene(-0.2, 9)).toEqual(sampleScene(0, 9))
  })

  it("can target a different object's named model nodes without watch-specific IDs", () => {
    const generic = explodeSpecSchema.parse({
      ...spec,
      scene3d: {
        kind: "gltf",
        url: "models/camera.glb",
        parts: [
          { componentId: "lens", node: "Optics", offset: [0, 2, 0], distance: 4 },
          { componentId: "housing", node: "Shell", offset: [0, -2, 0] },
        ],
      },
    })
    expect(scenePartIds(generic)).toEqual(["lens", "housing"])
    expect(scenePartIds({ ...spec, scene3d: undefined })).toEqual([])
  })
})

it("validates a generic assembly story against the entire imported inventory", () => {
  const base = {
    ...spec,
    scene3d: {
      kind: "gltf",
      url: "camera.glb",
      parts: [
        { componentId: "lens", node: "Lens", offset: [0, 0, 1] },
        { componentId: "housing", node: "Case", offset: [0, 0, -1] },
      ],
      assemblyStory: {
        title: "Build a camera",
        note: "Educational order",
        closing: { title: "Ready", description: "Together" },
        chapters: [
          {
            id: "optics",
            componentIds: ["lens"],
            title: "Gather light",
            description: "Lens",
            joined: "Focus",
          },
          {
            id: "housing",
            componentIds: ["housing"],
            title: "Protect",
            description: "Case",
            joined: "Ready",
          },
        ],
      },
    },
  }
  expect(explodeSpecSchema.safeParse(base).success).toBe(true)
  expect(
    explodeSpecSchema.safeParse({
      ...base,
      scene3d: {
        ...base.scene3d,
        assemblyStory: {
          ...base.scene3d.assemblyStory,
          chapters: base.scene3d.assemblyStory.chapters.slice(1),
        },
      },
    }).success,
  ).toBe(false)
})

it("preserves detailed anatomy when a narrative adds a subsystem milestone", async () => {
  const { anatomyComponents, storyComponents } = await import("../src/spec/scene3d.ts")
  const base = JSON.parse(readFileSync("examples/porsche-911-engine/research.json", "utf8"))
  const chapters = base.scene3d.parts.map((p: { componentId: string }) => ({
    id: p.componentId,
    componentIds: [p.componentId],
    title: p.componentId,
    description: "Individual lesson",
    joined: "Connected",
  }))
  chapters.push({
    id: "engine-system",
    kind: "milestone",
    componentIds: base.scene3d.parts.map((p: { componentId: string }) => p.componentId),
    title: "Engine system",
    description: "A system lesson",
    joined: "Complete",
  })
  base.scene3d.assemblyStory = {
    title: "Build",
    note: "Educational",
    closing: { title: "Together", description: "Whole" },
    chapters,
  }
  const parsed = explodeSpecSchema.parse(base)
  expect(storyComponents(parsed)).toHaveLength(30)
  const anatomy = anatomyComponents(parsed)
  expect(anatomy).toHaveLength(26) // Existing true pairs stay paired, not hidden inside a milestone.
  expect(anatomy.find((c) => c.id === "crankshaft")?.howItsMade).toBe(
    base.components.find((c: { id: string }) => c.id === "crankshaft").howItsMade,
  )
  expect(anatomy.some((c) => c.id === "engine-system")).toBe(false)
})
