import type { FrameSequence } from "./schema.ts"

export interface SkipRange {
  /** Source time, seconds, inclusive. */
  start: number
  /** Source time, seconds, exclusive. */
  end: number
  /**
   * Frames to keep inside the range, spread through it.
   * 0 drops the range. A small keep rushes the scroll through a bad patch.
   */
  keep?: number
}

/** 1-based file index for frame `index` (0-based) in a sequence. */
export function frameNumber(sequence: Pick<FrameSequence, "start">, index: number) {
  return (sequence.start ?? 1) + index
}

export function frameFile(sequence: Pick<FrameSequence, "dir" | "ext" | "pad" | "start">, index: number) {
  const pad = sequence.pad ?? 4
  const ext = sequence.ext ?? "webp"
  const name = String(frameNumber(sequence, index)).padStart(pad, "0")
  return `${sequence.dir.replace(/\/$/, "")}/${name}.${ext}`
}

export function sequenceReady(sequence: FrameSequence | undefined | null): sequence is FrameSequence {
  return Boolean(sequence && sequence.count > 1)
}

/**
 * Which 1-based frames from a full `fps` extract survive.
 * Frame `i` is treated as source time `(i - 1) / fps`, matching ffmpeg's fps filter.
 */
export function keptFrameNumbers(count: number, fps: number, skips: SkipRange[] = []) {
  const dropped = new Set<number>()
  const rescued = new Set<number>()

  for (const skip of skips) {
    if (!(skip.end > skip.start)) continue
    const inside: number[] = []
    for (let i = 1; i <= count; i += 1) {
      const time = (i - 1) / fps
      if (time >= skip.start && time < skip.end) inside.push(i)
    }
    for (const frame of inside) dropped.add(frame)
    const keep = Math.max(0, skip.keep ?? 0)
    if (keep > 0 && inside.length > 0) {
      const picks = Math.min(keep, inside.length)
      for (let k = 0; k < picks; k += 1) {
        const slot = Math.round(((k + 0.5) / picks) * (inside.length - 1))
        const frame = inside[Math.min(inside.length - 1, slot)]
        if (frame) rescued.add(frame)
      }
    }
  }

  const kept: number[] = []
  for (let i = 1; i <= count; i += 1) {
    if (!dropped.has(i) || rescued.has(i)) kept.push(i)
  }
  return kept
}

export function parseSkip(value: string, keep = 0): SkipRange {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/)
  if (!match) throw new Error(`Skip range must look like 4.55-5.65, got "${value}".`)
  const start = Number(match[1])
  const end = Number(match[2])
  if (!(end > start)) throw new Error(`Skip range ${value} is empty.`)
  return { start, end, keep }
}
