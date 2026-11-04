import { MathUtils, Spherical, Vector3 } from "three"

export const ease = (x: number) => {
  x = MathUtils.clamp(x, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

// Outside layers leave first. During assembly, inner layers seat first.
// Each channel is a pure function of scroll, so reversing scroll retraces it.
const timing: Record<string, [number, number, number, number]> = {
  crystal: [0.145, 0.18, 0.975, 1],
  hands: [0.16, 0.205, 0.96, 0.985],
  dial: [0.18, 0.23, 0.94, 0.97],
  caseback: [0.14, 0.18, 0.975, 1],
  "rear-window": [0.15, 0.19, 0.965, 0.99],
  rotor: [0.165, 0.21, 0.95, 0.98],
  crown: [0.145, 0.19, 0.965, 0.995],
  strap: [0.14, 0.19, 0.975, 1],
}
export function separation(id: string, p: number) {
  const [start, end, close, seated] = timing[id] ?? [0.185, 0.23, 0.94, 0.97]
  return ease((p - start) / (end - start)) * (1 - ease((p - close) / (seated - close)))
}

export function bridgeOffset(p: number) {
  // Lift clear of the gear shafts before sliding sideways; reverse to reseat.
  const lift = ease((p - 0.79) / 0.035) * (1 - ease((p - 0.92) / 0.015))
  const slide = ease((p - 0.825) / 0.035) * (1 - ease((p - 0.9) / 0.02))
  return new Vector3(-21 * slide, 0, 9 * lift)
}

/** Orbit around the target instead of interpolating a chord through the model. */
export function orbitBetween(a: Vector3, b: Vector3, x: number) {
  const from = new Spherical().setFromVector3(a),
    to = new Spherical().setFromVector3(b)
  const delta = MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI
  return new Vector3().setFromSpherical(
    new Spherical(
      MathUtils.lerp(from.radius, to.radius, x),
      MathUtils.lerp(from.phi, to.phi, x),
      from.theta + delta * x,
    ),
  )
}
