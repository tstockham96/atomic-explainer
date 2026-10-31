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
      const start = THREE_TIMING.inspect + i * (1 - THREE_TIMING.inspect) / count
      expect(sampleScene(start + 0.000001, count).focus).toBeCloseTo(0, 6)
      expect(sampleScene(start - 0.000001, count).focus).toBeCloseTo(0, 6)
      const middle = start + (1 - THREE_TIMING.inspect) / count * 0.5
      expect(sampleScene(middle, count)).toMatchObject({ index: i, focus: 1, separation: 1 })
    }
    expect(sampleScene(1, count).focus).toBeCloseTo(0, 6)
    expect(sampleScene(1, count).separation).toBe(1)
  })

  it("never leaves the camera focused when entering anatomy, including reverse scrolling", () => {
    const values = [0, 0.1, 0.3, 0.45, 0.6, 0.8, 0.999, 1]
    const forward = values.map((value) => sampleScene(value, 9))
    expect([...values].reverse().map((value) => sampleScene(value, 9)).reverse()).toEqual(forward)
    expect(sampleScene(1.2, 9)).toEqual(sampleScene(1, 9))
    expect(sampleScene(-0.2, 9)).toEqual(sampleScene(0, 9))
  })

  it("can target a different object's named model nodes without watch-specific IDs", () => {
    const generic = explodeSpecSchema.parse({ ...spec, scene3d: {
      kind: "gltf", url: "models/camera.glb", parts: [
        { componentId: "lens", node: "Optics", offset: [0, 2, 0], distance: 4 },
        { componentId: "housing", node: "Shell", offset: [0, -2, 0] },
      ],
    } })
    expect(scenePartIds(generic)).toEqual(["lens", "housing"])
    expect(scenePartIds({ ...spec, scene3d: undefined })).toEqual([])
  })
})
