import { focusEnvelope } from "../../spec/camera.ts"

export const THREE_TIMING = { turn: 0.045, explode: 0.235, inspect: 0.43, reassemble: 0.9, settled: 0.98 }
export function ease(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}
export function sampleScene(progress: number, count: number) {
  const p = Math.min(1, Math.max(0, progress))
  const turn = ease((p - THREE_TIMING.turn) / (THREE_TIMING.explode - THREE_TIMING.turn))
  const opening = ease((p - THREE_TIMING.explode) / (THREE_TIMING.inspect - THREE_TIMING.explode))
  const closing = ease((p - THREE_TIMING.reassemble) / (THREE_TIMING.settled - THREE_TIMING.reassemble))
  const separation = opening * (1 - closing)
  if (p < THREE_TIMING.inspect || p >= THREE_TIMING.reassemble || count === 0)
    return { turn, separation, index: -1, local: 0, focus: 0 }
  const slice = (THREE_TIMING.reassemble - THREE_TIMING.inspect) / count
  const index = Math.min(count - 1, Math.floor((p - THREE_TIMING.inspect) / slice))
  const local = Math.min(1, Math.max(0, (p - THREE_TIMING.inspect - index * slice) / slice))
  return { turn, separation, index, local, focus: focusEnvelope(local) }
}
