import { describe, it, expect } from 'vitest'
import * as T from 'three'
import { createClearGlass, hasOptics, inspectionTurn } from '../src/viewer/three/optics.ts'

describe('shared glass presentation', () => {
  it.each([1.5, 1.76])('never changes the optical properties of glass with IOR %s', ior => {
    const glass = createClearGlass(ior)
    {
      expect(glass.transmission).toBe(1)
      expect(glass.metalness).toBe(0)
      expect(glass.ior).toBe(ior)
      expect(glass.transparent).toBe(false)
      expect(glass.color.getHexString()).toBe('ffffff')
    }
  })

  it('recognizes optics by their materials, including unnamed imported primitives', () => {
    const part = new T.Group()
    part.add(new T.Mesh(new T.BoxGeometry(), [new T.MeshStandardMaterial(), createClearGlass()]))
    expect(hasOptics(part)).toBe(true)
    const angles = Array.from({length: 101}, (_, i) => inspectionTurn(i / 100))
    expect(angles[0]).toBe(0)
    expect(angles[100]).toBeCloseTo(Math.PI * 2)
    expect(angles.every((a, i) => !i || a >= angles[i - 1]!)).toBe(true)
  })
})
