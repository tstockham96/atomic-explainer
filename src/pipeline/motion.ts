import { spawn } from "node:child_process"
import { copyFile, mkdir, readdir, rm, writeFile, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import type { ExplodeSpec, FrameSequence } from "../spec/schema.ts"
import { keptFrameNumbers, type SkipRange } from "../spec/frames.ts"
import type { ResolvedVideo } from "./models.ts"
import { explodeMotionPrompt, rotationMotionPrompt } from "./prompts.ts"

export interface ExtractOptions {
  fps?: number
  width?: number
  skips?: SkipRange[]
  /** Carried into index.json and the sequence note. */
  note?: string
}

export interface ExtractedSequence {
  count: number
  dir: string
  ext: "webp"
  pad: 4
  start: 1
  fps: number
  note?: string
}

const DEFAULT_FPS = 12
const DEFAULT_WIDTH = 720

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] })
    let err = ""
    child.stderr.on("data", (chunk: Buffer) => {
      err += chunk.toString()
      if (err.length > 6000) err = err.slice(-6000)
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited ${code}\n${err.trim()}`))
    })
  })
}

export function ffmpegExtractArgs(input: string, pattern: string, fps = DEFAULT_FPS, width = DEFAULT_WIDTH) {
  return [
    "-y",
    "-an",
    "-i",
    input,
    "-vf",
    `fps=${fps},scale=${width}:-1:flags=lanczos`,
    "-c:v",
    "libwebp",
    "-quality",
    "72",
    "-compression_level",
    "5",
    "-start_number",
    "1",
    pattern,
  ]
}

async function listFrames(dir: string) {
  const names = (await readdir(dir)).filter((name) => name.endsWith(".webp")).sort()
  return names
}

/**
 * Pull a WebP sequence from a clip. Optional skip ranges drop or rush a bad patch
 * (the Murph explode clip flashes a second crystal around 4.5–5.6s).
 */
export async function extractFrames(
  videoPath: string,
  outDir: string,
  options: ExtractOptions = {},
): Promise<ExtractedSequence> {
  const fps = options.fps ?? DEFAULT_FPS
  const width = options.width ?? DEFAULT_WIDTH
  const input = path.resolve(videoPath)
  const destination = path.resolve(outDir)
  const scratch = path.join(tmpdir(), `explode-frames-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  await mkdir(scratch, { recursive: true })
  await mkdir(destination, { recursive: true })

  try {
    await run("ffmpeg", ffmpegExtractArgs(input, path.join(scratch, "%04d.webp"), fps, width))
    const names = await listFrames(scratch)
    if (names.length < 2) throw new Error(`ffmpeg wrote ${names.length} frames from ${input}.`)

    const kept = keptFrameNumbers(names.length, fps, options.skips ?? [])
    const previous = (await readdir(destination).catch(() => [])).filter((name) => name.endsWith(".webp"))
    await Promise.all(previous.map((name) => rm(path.join(destination, name), { force: true })))

    for (let index = 0; index < kept.length; index += 1) {
      const source = names[kept[index]! - 1]
      if (!source) throw new Error(`Missing extracted frame ${kept[index]}.`)
      const target = `${String(index + 1).padStart(4, "0")}.webp`
      await copyFile(path.join(scratch, source), path.join(destination, target))
    }

    const sequence: ExtractedSequence = {
      count: kept.length,
      dir: destination,
      ext: "webp",
      pad: 4,
      start: 1,
      fps,
      note: options.note,
    }
    await writeFile(
      path.join(destination, "index.json"),
      `${JSON.stringify({ count: sequence.count, ext: sequence.ext, pad: sequence.pad, start: sequence.start, fps, width, note: options.note ?? null }, null, 2)}\n`,
    )
    return sequence
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}

function mediaTypeOf(file: string) {
  const ext = path.extname(file).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  return "image/jpeg"
}

async function writeVideoFile(outFile: string, bytes: Uint8Array) {
  await mkdir(path.dirname(outFile), { recursive: true })
  await writeFile(outFile, bytes)
}

async function gatewayClip(options: {
  model: string
  prompt: string
  first: Uint8Array
  last?: Uint8Array
  outFile: string
}) {
  const { experimental_generateVideo: generateVideo, gateway } = await import("ai")
  const result = await generateVideo({
    model: gateway.video(options.model as never),
    prompt: options.prompt,
    aspectRatio: "9:16",
    duration: 5,
    frameImages: options.last
      ? [
          { image: options.first, frameType: "first_frame" },
          { image: options.last, frameType: "last_frame" },
        ]
      : [{ image: options.first, frameType: "first_frame" }],
    poll: { timeoutMs: 12 * 60 * 1000 },
  })
  await writeVideoFile(options.outFile, result.video.uint8Array)
  return result.warnings.map((warning) => {
    const details = "details" in warning && typeof warning.details === "string" ? warning.details : ""
    const feature = "feature" in warning && typeof warning.feature === "string" ? warning.feature : ""
    return [warning.type, feature, details].filter(Boolean).join(": ")
  })
}

async function falClip(options: {
  model: string
  prompt: string
  first: Uint8Array
  firstType: string
  last?: Uint8Array
  lastType?: string
  outFile: string
  apiKey: string
}) {
  const body: Record<string, unknown> = {
    prompt: options.prompt,
    image_url: `data:${options.firstType};base64,${Buffer.from(options.first).toString("base64")}`,
    duration: "5",
  }
  if (options.last) {
    body.tail_image_url = `data:${options.lastType ?? options.firstType};base64,${Buffer.from(options.last).toString("base64")}`
  }

  const started = await fetch(`https://queue.fal.run/${options.model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!started.ok) {
    throw new Error(`fal ${options.model} rejected the clip (${started.status}). ${await started.text()}`)
  }
  const queued = (await started.json()) as { status_url?: string; response_url?: string }
  if (!queued.status_url || !queued.response_url) throw new Error("fal did not return a queue URL.")

  const deadline = Date.now() + 12 * 60 * 1000
  let status = "IN_QUEUE"
  while (Date.now() < deadline) {
    const probe = await fetch(queued.status_url, { headers: { Authorization: `Key ${options.apiKey}` } })
    if (!probe.ok) throw new Error(`fal status failed (${probe.status}).`)
    const payload = (await probe.json()) as { status?: string; error?: string }
    status = payload.status ?? status
    if (status === "COMPLETED") break
    if (status === "FAILED") throw new Error(payload.error ?? "fal video generation failed.")
    await new Promise((resolve) => setTimeout(resolve, 4000))
  }
  if (status !== "COMPLETED") throw new Error("fal video generation timed out.")

  const result = await fetch(queued.response_url, { headers: { Authorization: `Key ${options.apiKey}` } })
  if (!result.ok) throw new Error(`fal result failed (${result.status}).`)
  const json = (await result.json()) as { video?: { url?: string } }
  const url = json.video?.url
  if (!url) throw new Error("fal result did not include a video URL.")
  const video = await fetch(url)
  if (!video.ok) throw new Error(`Could not download the fal video (${video.status}).`)
  await writeVideoFile(options.outFile, new Uint8Array(await video.arrayBuffer()))
  return [] as string[]
}

export async function generateClip(options: {
  video: ResolvedVideo
  prompt: string
  firstFrame: Uint8Array
  firstType?: string
  lastFrame?: Uint8Array
  lastType?: string
  outFile: string
  apiKey?: string
}) {
  if (options.video.provider === "fal") {
    const apiKey = options.apiKey ?? process.env.FAL_KEY
    if (!apiKey) throw new Error("FAL_KEY is required when EXPLODE_VIDEO_PROVIDER=fal.")
    return falClip({
      model: options.video.model,
      prompt: options.prompt,
      first: options.firstFrame,
      firstType: options.firstType ?? "image/jpeg",
      last: options.lastFrame,
      lastType: options.lastType,
      outFile: options.outFile,
      apiKey,
    })
  }
  return gatewayClip({
    model: options.video.model,
    prompt: options.prompt,
    first: options.firstFrame,
    last: options.lastFrame,
    outFile: options.outFile,
  })
}

function sequenceFromExtract(relativeDir: string, extracted: ExtractedSequence): FrameSequence {
  return {
    dir: relativeDir,
    count: extracted.count,
    ext: "webp",
    pad: 4,
    start: 1,
    note: extracted.note,
  }
}

/**
 * Hero photo → rotation clip. Hero + exploded still as first/last frames → explode clip.
 * Both clips are extracted to WebP sequences under `frames/`.
 */
export async function generateMotion(
  spec: ExplodeSpec,
  outDir: string,
  video: ResolvedVideo,
  log: (message: string) => void = () => undefined,
  options: { skips?: SkipRange[]; fps?: number } = {},
): Promise<ExplodeSpec> {
  if (!spec.heroImage) throw new Error("Motion needs a hero image on the spec.")
  if (!spec.explodedImage) throw new Error("Motion needs an exploded image on the spec.")

  const root = path.resolve(outDir)
  const heroPath = path.join(root, spec.heroImage)
  const explodedPath = path.join(root, spec.explodedImage)
  const hero = await readFile(heroPath)
  const exploded = await readFile(explodedPath)
  const rotationVideo = path.join(root, "frames", "rotation.mp4")
  const explodeVideo = path.join(root, "frames", "explode.mp4")

  log(`Motion · ${video.provider} ${video.model}`)
  log("Rotation clip")
  const rotationWarnings = await generateClip({
    video,
    prompt: rotationMotionPrompt(spec),
    firstFrame: hero,
    firstType: mediaTypeOf(heroPath),
    outFile: rotationVideo,
  })
  log("Explode clip")
  const explodeWarnings = await generateClip({
    video,
    prompt: explodeMotionPrompt(spec),
    firstFrame: hero,
    firstType: mediaTypeOf(heroPath),
    lastFrame: exploded,
    lastType: mediaTypeOf(explodedPath),
    outFile: explodeVideo,
  })

  log("Extract rotation frames")
  const rotation = await extractFrames(rotationVideo, path.join(root, "frames", "rotation"), {
    fps: options.fps,
  })
  log("Extract explode frames")
  const burst = await extractFrames(explodeVideo, path.join(root, "frames", "explode"), {
    fps: options.fps,
    skips: options.skips,
  })

  return {
    ...spec,
    frames: {
      rotation: sequenceFromExtract("frames/rotation", rotation),
      explode: sequenceFromExtract("frames/explode", burst),
    },
    generation: {
      visionModel: spec.generation?.visionModel,
      researchModel: spec.generation?.researchModel,
      imageModel: spec.generation?.imageModel,
      videoModel: `${video.provider}:${video.model}`,
      warnings: [...(spec.generation?.warnings ?? []), ...rotationWarnings, ...explodeWarnings],
    },
  }
}
