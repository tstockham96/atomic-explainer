import { MathUtils, Spherical, Vector3 } from 'three'

export const ease = (x: number) => {
  x = MathUtils.clamp(x, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

// Outside layers leave first. During assembly, inner layers seat first.
// Each channel is a pure function of scroll, so reversing scroll retraces it.
const timing: Record<string, [number, number, number, number]> = {
  crystal: [.145, .18, .975, 1],
  hands: [.16, .205, .96, .985],
  dial: [.18, .23, .94, .97],
  caseback: [.14, .18, .975, 1],
  'rear-window': [.15, .19, .965, .99],
  rotor: [.165, .21, .95, .98],
  crown: [.145, .19, .965, .995],
  strap: [.14, .19, .975, 1],
}
export function separation(id: string, p: number) {
  const [start, end, close, seated] = timing[id] ?? [.185, .23, .94, .97]
  return ease((p - start) / (end - start)) * (1 - ease((p - close) / (seated - close)))
}

export function bridgeOffset(p: number) {
  // Lift clear of the gear shafts before sliding sideways; reverse to reseat.
  const lift = ease((p - .79) / .035) * (1 - ease((p - .92) / .015))
  const slide = ease((p - .825) / .035) * (1 - ease((p - .90) / .02))
  return new Vector3(-21 * slide, 0, 9 * lift)
}

/** Orbit around the target instead of interpolating a chord through the model. */
export function orbitBetween(a: Vector3, b: Vector3, x: number) {
  const from = new Spherical().setFromVector3(a), to = new Spherical().setFromVector3(b)
  const delta = MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI
  return new Vector3().setFromSpherical(new Spherical(
    MathUtils.lerp(from.radius, to.radius, x),
    MathUtils.lerp(from.phi, to.phi, x),
    from.theta + delta * x,
  ))
}
