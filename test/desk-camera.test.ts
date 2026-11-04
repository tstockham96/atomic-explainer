import { describe, it, expect } from "vitest"
import * as T from "three"
import { deskShot, deskWide, DESK_DIRECTION } from "../src/viewer/three/deskCamera.ts"

describe("seated workshop camera", () => {
  it("transfers arbitrary orbit views to the object without changing component-local poses", () => {
    for (const position of [
      new T.Vector3(40, 22, 80),
      new T.Vector3(-60, 10, -20),
      new T.Vector3(0, -50, 30),
    ]) {
      const root = new T.Group(),
        part = new T.Object3D()
      part.position.set(4, 6, 8)
      root.add(part)
      root.position.set(2, 3, 4)
      root.rotation.set(0.1, 0.2, 0.3)
      const target = new T.Vector3(5, 2, 1),
        oldCamera = new T.PerspectiveCamera()
      oldCamera.position.copy(position)
      oldCamera.lookAt(target)
      oldCamera.updateMatrixWorld(true)
      root.updateMatrixWorld(true)
      const before = part.getWorldPosition(new T.Vector3()).applyMatrix4(oldCamera.matrixWorldInverse)
      const shot = deskShot(root, { position, target }, 0.4),
        camera = new T.PerspectiveCamera()
      camera.position.copy(shot.position)
      camera.lookAt(shot.target)
      camera.updateMatrixWorld(true)
      const after = part.getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse)
      expect(after.x).toBeCloseTo(before.x, 8)
      expect(after.y).toBeCloseTo(before.y, 8)
      expect(part.position.toArray()).toEqual([4, 6, 8])
      expect(shot.position.clone().normalize().distanceTo(DESK_DIRECTION)).toBeLessThan(1e-10)
    }
  })
  it("pulls back continuously at the finish and retraces on reverse scroll", () => {
    expect(deskWide(false, 0, 0.94)).toBe(0)
    expect(deskWide(false, 0, 0.940001)).toBeLessThan(0.00001)
    expect(deskWide(false, 0, 1)).toBe(1)
    const samples = Array.from({ length: 101 }, (_, i) => i / 100)
    expect(samples.map((p) => deskWide(false, 0, p))).toEqual(
      [...samples]
        .reverse()
        .map((p) => deskWide(false, 0, p))
        .reverse(),
    )
    expect(deskWide(true, 0, 0)).toBe(1)
    expect(deskWide(true, 1, 0.1)).toBe(0)
  })
})
