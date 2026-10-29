import type { FrameSequence } from "../spec/schema.ts"
import { frameFile } from "../spec/frames.ts"
import { asset } from "./asset.ts"

export function loadFrames(urls: string[], onFrame: (index: number, image: HTMLImageElement) => void) {
  let cancelled = false
  let cursor = 0
  let inflight = 0
  const concurrency = 6

  const pump = () => {
    if (cancelled) return
    while (cursor < urls.length && inflight < concurrency) {
      const index = cursor
      cursor += 1
      inflight += 1
      const image = new Image()
      image.decoding = "async"
      const done = () => {
        inflight -= 1
        pump()
      }
      image.onload = () => {
        if (!cancelled) onFrame(index, image)
        done()
      }
      image.onerror = done
      image.src = urls[index] ?? ""
    }
  }

  pump()
  return () => {
    cancelled = true
  }
}

export function nearestReady(images: Array<HTMLImageElement | null>, index: number) {
  const direct = images[index]
  if (direct && direct.complete && direct.naturalWidth > 0) return direct
  for (let distance = 1; distance < images.length; distance += 1) {
    const before = images[index - distance]
    if (before && before.complete && before.naturalWidth > 0) return before
    const after = images[index + distance]
    if (after && after.complete && after.naturalWidth > 0) return after
  }
  return null
}

export async function discoverSequence(sequence: FrameSequence | undefined): Promise<FrameSequence | null> {
  if (!sequence) return null
  if (sequence.count > 1) return sequence
  try {
    const response = await fetch(asset(`${sequence.dir.replace(/\/$/, "")}/index.json`))
    if (!response.ok) return null
    const body = (await response.json()) as { count?: number; ext?: FrameSequence["ext"]; pad?: number; start?: number; note?: string }
    if (!body.count || body.count < 2) return null
    return {
      ...sequence,
      count: body.count,
      ext: body.ext ?? sequence.ext,
      pad: body.pad ?? sequence.pad,
      start: body.start ?? sequence.start,
      note: body.note ?? sequence.note,
    }
  } catch {
    return null
  }
}

export function sequenceUrls(sequence: FrameSequence) {
  return Array.from({ length: sequence.count }, (_, index) => asset(frameFile(sequence, index)))
}
