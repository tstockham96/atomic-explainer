import type { ExplainerSpec } from "./schema.ts"

export interface CameraPose {
  x: number
  y: number
  scale: number
  /** How far the camera has left the full-object view. */
  focus: number
}

const overview: CameraPose = { x: 0.5, y: 0.5, scale: 1, focus: 0 }

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/** Arrive, hold long enough to read, then pull all the way back before the next part. */
export function focusEnvelope(local: number) {
  return smooth(local / 0.28) * (1 - smooth((local - 0.72) / 0.28))
}

export function cameraAt(local: number, target?: { x: number; y: number; scale: number }): CameraPose {
  if (!target) return overview
  const focus = focusEnvelope(local)
  return {
    x: 0.5 + (target.x - 0.5) * focus,
    y: 0.5 + (target.y - 0.5) * focus,
    scale: 1 + (target.scale - 1) * focus,
    focus,
  }
}

/** Only authored, visible targets belong in the film. Other parts stay in Anatomy. */
export function focusTour(spec: ExplainerSpec) {
  return (spec.film?.focus ?? []).flatMap((target) => {
    const component = spec.components.find((part) => part.id === target.componentId)
    return component ? [{ ...target, component }] : []
  })
}
