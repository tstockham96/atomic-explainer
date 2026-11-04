import { LatheGeometry, Vector2 } from "three"

export interface CrystalProfile {
  radius: number
  rise: number
  thickness: number
  edgeRadius: number
}

/** Spherical-cap rise above the seating plane. Dimensions use the caller's units. */
export function crystalRise(radius: number, profile: CrystalProfile) {
  if (profile.rise === 0) return 0
  const aperture = profile.radius - profile.edgeRadius
  const sphere = (aperture * aperture + profile.rise * profile.rise) / (2 * profile.rise)
  return Math.sqrt(sphere * sphere - Math.min(radius, aperture) ** 2) - (sphere - profile.rise)
}

/** Closed optical solid, front +Z, pivot at the centre of its axial bounds.
 * Two curved surfaces and a rounded perimeter; no image-plane substitute.
 */
export function createCrystalGeometry(profile: CrystalProfile) {
  const { radius, rise, thickness, edgeRadius: b } = profile
  if (
    ![radius, rise, thickness, b].every(Number.isFinite) ||
    radius <= 0 ||
    rise < 0 ||
    thickness <= 0 ||
    b <= 0 ||
    b >= Math.min(radius, thickness / 2) ||
    rise >= radius - b
  ) {
    throw new Error("Invalid optical crystal profile")
  }
  const points: Vector2[] = []
  const centre = (rise + thickness) / 2
  const point = (r: number, z: number) => points.push(new Vector2(r, z - centre))
  for (let i = 0; i <= 64; i++) {
    const r = ((radius - b) * i) / 64
    point(r, crystalRise(r, profile))
  }
  for (let i = 1; i <= 8; i++) {
    const a = ((i / 8) * Math.PI) / 2
    point(radius - b + Math.sin(a) * b, b - Math.cos(a) * b)
  }
  point(radius, thickness - b)
  for (let i = 1; i <= 8; i++) {
    const a = ((i / 8) * Math.PI) / 2
    point(radius - b + Math.cos(a) * b, thickness - b + Math.sin(a) * b)
  }
  for (let i = 63; i >= 0; i--) {
    const r = ((radius - b) * i) / 64
    point(r, thickness + crystalRise(r, profile))
  }
  return new LatheGeometry(points, 192).rotateX(Math.PI / 2)
}

// Photo-informed profile and fitted seating, not unpublished manufacturer dimensions.
export const murphFront = {
  profile: { radius: 17.5, rise: 1.25, thickness: 0.55, edgeRadius: 0.045 },
  seatZ: 2.6,
  dialZ: 1.35,
  handsZ: 1.95,
}
export const murphCrystalZ = murphFront.seatZ + (murphFront.profile.rise + murphFront.profile.thickness) / 2

// Rear photographs support a flat viewing window, not a second copy of the
// domed front. Dimensions and rounded edge remain a fitted reconstruction.
export const murphRear = { profile: { radius: 14.98, rise: 0, thickness: 0.45, edgeRadius: 0.045 }, z: -4.85 }
