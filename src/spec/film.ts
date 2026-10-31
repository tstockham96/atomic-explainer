export interface FilmMap {
  /** Title gives way to the turn. */
  turn: number
  /** Turn gives way to the explosion. */
  burst: number
  /** Explosion gives way to per-part callouts. */
  parts: number
  count: number
}

export type FilmPhase = "title" | "turn" | "burst" | "part"

export interface FilmSample {
  phase: FilmPhase
  /** 0–1 inside the current phase. For a part, inside that part's slice. */
  local: number
  /** -1 until the callouts. Then 0..count-1. */
  partIndex: number
  /** 0–1 across the whole pin. */
  progress: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Shares of the pinned scroll. Parts split whatever is left after the burst. */
export function filmMap(count: number): FilmMap {
  const n = Math.max(1, count)
  const turn = 0.055
  const burst = turn + 0.20
  const parts = burst + 0.20
  return { turn, burst, parts, count: n }
}

export function phaseAt(progress: number, count: number): FilmSample {
  const map = filmMap(count)
  const t = clamp(progress, 0, 1)
  if (t < map.turn) {
    return { phase: "title", local: t / map.turn, partIndex: -1, progress: t }
  }
  if (t < map.burst) {
    return { phase: "turn", local: (t - map.turn) / (map.burst - map.turn), partIndex: -1, progress: t }
  }
  if (t < map.parts) {
    return { phase: "burst", local: (t - map.burst) / (map.parts - map.burst), partIndex: -1, progress: t }
  }
  const span = (1 - map.parts) / map.count
  const index = Math.min(map.count - 1, Math.floor((t - map.parts) / span))
  const start = map.parts + index * span
  return { phase: "part", local: clamp((t - start) / span, 0, 1), partIndex: index, progress: t }
}

/** Progress that lands in the middle of a phase. A number is a part index. */
export function progressForPhase(target: FilmPhase | number, count: number) {
  const map = filmMap(count)
  if (target === "title") return map.turn * 0.35
  if (target === "turn") return (map.turn + map.burst) / 2
  if (target === "burst") return (map.burst + map.parts) / 2
  if (typeof target !== "number") return map.parts + (1 - map.parts) * 0.45
  const index = clamp(target, 0, map.count - 1)
  const span = (1 - map.parts) / map.count
  return map.parts + index * span + span * 0.45
}

export function frameIndex(local: number, count: number) {
  if (count <= 1) return 0
  return Math.round(clamp(local, 0, 1) * (count - 1))
}

/** Trapezoid fade so neighboring captions crossfade instead of popping. */
export function windowOpacity(progress: number, start: number, end: number, fade: number) {
  if (fade <= 0) return progress >= start && progress <= end ? 1 : 0
  if (progress <= start - fade || progress >= end + fade) return 0
  if (progress < start) return (progress - (start - fade)) / fade
  if (progress > end) return 1 - (progress - end) / fade
  return 1
}
