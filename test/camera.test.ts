import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { cameraAt, focusEnvelope, focusTour } from "../src/spec/camera.ts"
import { explainerSpecSchema } from "../src/spec/schema.ts"
import { filmMap, phaseAt } from "../src/spec/film.ts"

const spec = explainerSpecSchema.parse(JSON.parse(readFileSync("public/spec.json", "utf8")))
const tour = focusTour(spec)
const overview = { x: 0.5, y: 0.5, scale: 1, focus: 0 }

describe("continuous camera tour", () => {
  it("visits the visible glass, movement, and case in that order", () => {
    expect(tour.map((target) => target.component.id)).toEqual(["crystal", "movement", "case"])
    expect(spec.components).toHaveLength(9)
  })

  it("returns to precisely the same overview between every pair of close-ups", () => {
    for (const target of tour) {
      expect(cameraAt(0, target)).toEqual(overview)
      expect(cameraAt(1, target)).toEqual(overview)
      const focused = cameraAt(0.5, target)
      expect(focused.x).toBeCloseTo(target.x)
      expect(focused.y).toBeCloseTo(target.y)
      expect(focused.scale).toBeCloseTo(target.scale)
      expect(focused.focus).toBe(1)
    }
  })

  it("has no jump at the explosion boundary or between parts", () => {
    const count = tour.length
    const map = filmMap(count)
    const pose = (progress: number) => {
      const sample = phaseAt(progress, count)
      return cameraAt(sample.local, sample.phase === "part" ? tour[sample.partIndex] : undefined)
    }
    for (let index = 0; index < count; index++) {
      const boundary = map.parts + (index * (1 - map.parts)) / count
      const before = pose(boundary - 0.000001)
      const after = pose(boundary + 0.000001)
      expect(before.x).toBeCloseTo(after.x, 6)
      expect(before.y).toBeCloseTo(after.y, 6)
      expect(before.scale).toBeCloseTo(after.scale, 6)
    }
  })

  it("holds the target for reading and retraces the same path on reverse scrolling", () => {
    expect(focusEnvelope(0.3)).toBe(1)
    expect(focusEnvelope(0.7)).toBe(1)
    for (const target of tour) {
      const forward = Array.from({ length: 101 }, (_, index) => cameraAt(index / 100, target))
      const reverse = Array.from({ length: 101 }, (_, index) =>
        cameraAt((100 - index) / 100, target),
      ).reverse()
      expect(reverse).toEqual(forward)
      expect(cameraAt(0.00001, target).scale).toBeCloseTo(1, 7)
      expect(cameraAt(0.99999, target).scale).toBeCloseTo(1, 7)
    }
  })

  it("does not invent camera targets for older or incomplete specs", () => {
    expect(focusTour({ ...spec, film: undefined })).toEqual([])
    expect(
      focusTour({ ...spec, film: { focus: [{ componentId: "missing", x: 0.5, y: 0.5, scale: 2 }] } }),
    ).toEqual([])
    expect(cameraAt(0.5)).toEqual(overview)
  })

  it("rejects targets outside the image or unusable zoom values", () => {
    for (const target of [
      { x: -0.1, y: 0.5, scale: 2 },
      { x: 0.5, y: 1.1, scale: 2 },
      { x: 0.5, y: 0.5, scale: 0 },
    ]) {
      expect(
        explainerSpecSchema.safeParse({ ...spec, film: { focus: [{ componentId: "crystal", ...target }] } })
          .success,
      ).toBe(false)
    }
  })
})
