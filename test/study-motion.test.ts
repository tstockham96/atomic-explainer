import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { bridgeOffset, orbitBetween, separation } from '../src/authoring/studyMotion.ts'
import { crystalRise, createCrystalGeometry, murphFront, murphRear } from '../src/authoring/crystal.ts'

describe('Murph study motion', () => {
  it('keeps the camera outside the object when moving between front and rear', () => {
    const a = new Vector3(7, 4, 68), b = new Vector3(-55, 25, -89)
    for (let i = 0; i <= 1000; i++) {
      const p = orbitBetween(a, b, i / 1000)
      expect(p.length()).toBeGreaterThanOrEqual(a.length() - 1e-9)
      expect(p.toArray().every(Number.isFinite)).toBe(true)
    }
    expect(orbitBetween(a, b, 1).distanceTo(b)).toBeLessThan(1e-9)
  })

  it('preserves the front and rear layer order throughout separation and seating', () => {
    for (let i = 0; i <= 2000; i++) {
      const p = i / 2000
      const crystal = murphFront.seatZ + crystalRise(16.65, murphFront.profile) + 27 * separation('crystal', p)
      const hands = murphFront.handsZ + 17 * separation('hands', p)
      const dial = murphFront.dialZ + 7 * separation('dial', p)
      const movement = -.85 - 10 * separation('movement', p)
      const rotor = -2.95 - 29 * separation('rotor', p)
      const window = -4.85 - 40 * separation('rear-window', p)
      // Longest hand's upper face must clear the curved underside, including seating.
      expect(crystal - (hands + .658)).toBeGreaterThan(.1)
      expect(hands - dial).toBeGreaterThanOrEqual(.59)
      expect(movement - rotor).toBeGreaterThanOrEqual(2.09)
      expect(rotor - window).toBeGreaterThanOrEqual(1.89)
      // Rear-facing bridge never meets the lifted rotor.
      expect(movement - bridgeOffset(p).z - rotor).toBeGreaterThanOrEqual(2.09)
    }
  })

  it('has a shallow curved sapphire with outward normals and a seated perimeter', () => {
    const geometry = createCrystalGeometry(murphFront.profile)
    geometry.computeBoundingBox()
    const size = geometry.boundingBox!.getSize(new Vector3())
    expect(size.x).toBeCloseTo(35, 5)
    expect(size.z).toBeCloseTo(1.8, 5)
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
    let upper = 0, lower = 0
    for (let i = 0; i < positions.count; i++) {
      const r = Math.hypot(positions.getX(i), positions.getY(i))
      if (r < 1) {
        if (positions.getZ(i) > .6) { expect(normals.getZ(i)).toBeGreaterThan(.99); upper++ }
        else { expect(normals.getZ(i)).toBeLessThan(-.99); lower++ }
      }
    }
    expect(upper).toBeGreaterThan(0)
    expect(lower).toBeGreaterThan(0)
    expect(murphFront.seatZ).toBeCloseTo(2.6) // fitted reference bezel, not old floating z=3.925 edge
    geometry.dispose()
  })

  it('clears the shafts before sliding the bridge, then seats it before the rotor', () => {
    for (let i = 0; i <= 2000; i++) {
      const p = i / 2000, bridge = bridgeOffset(p)
      if (Math.abs(bridge.x) > .001) expect(bridge.z).toBeCloseTo(9, 6)
      if (p >= .935) expect(bridge.length()).toBe(0)
    }
    expect(separation('rotor', .935)).toBe(1)
  })

  it('keeps the rounded rear window flat and fitted inside the retaining ring', () => {
    const geometry=createCrystalGeometry(murphRear.profile);geometry.computeBoundingBox()
    const size=geometry.boundingBox!.getSize(new Vector3())
    expect(size.x).toBeCloseTo(29.96,4);expect(size.z).toBeCloseTo(.45,4)
    const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal')
    for(let i=0;i<p.count;i++)if(Math.hypot(p.getX(i),p.getY(i))<14){
      expect(Math.abs(p.getZ(i))).toBeCloseTo(.225,4)
      expect(Math.sign(n.getZ(i))).toBe(Math.sign(p.getZ(i)))
    }
    expect(murphRear.z-.225).toBeGreaterThan(-4.45-.55-.11)
    geometry.dispose()
  })
})
