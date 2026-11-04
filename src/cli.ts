import "dotenv/config"
import { parseArgs } from "node:util"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { extractFrames } from "./pipeline/motion.ts"
import { openSite, shouldAutoOpen } from "./pipeline/open-site.ts"
import { runExplainer } from "./pipeline/run.ts"
import { parseSkip } from "./spec/frames.ts"

interface Flags {
  help: boolean
  json: boolean
  out: string
  fromSpec?: string
  requirements?: string
  skipImages: boolean
  images: boolean
  motion: boolean
  three: boolean
  plan: boolean
  assemble?: string
  assetPlan?: string
  component?: string
  extract?: string
  framesDir?: string
  fps?: number
  skips: ReturnType<typeof parseSkip>[]
  photo?: string
  open: boolean
  preview?: string
}

export function formatHelp() {
  return `atomic-explainer — a photo in, a how-it's-made scroll site out

Usage
  atomic-explainer ./photo.jpg
  atomic-explainer ./photo.jpg --out ./site
  atomic-explainer ./photo.jpg --3d --out ./site
  atomic-explainer ./photo.jpg --plan --out ./research
  atomic-explainer --from-spec ./research.json --plan --out ./research
  atomic-explainer --from-spec public/spec.json --out ./site
  atomic-explainer --from-spec ./research.json --asset-plan ./assets.json --component battery --out ./battery-review
  atomic-explainer --from-spec ./research.json --assemble ./assembly.json --out ./site
  atomic-explainer ./photo.jpg --from-spec public/spec.json --images --out ./site
  atomic-explainer ./photo.jpg --motion --out ./site
  atomic-explainer --preview ./site
  atomic-explainer --extract ./explode.mp4 --frames-dir ./frames/explode --skip 4.55-5.65 --skip-keep 2

Options
  -o, --out <dir>         Output folder (default: ./atomic-explainer-out)
      --from-spec <file>  Render a spec JSON instead of calling models
      --requirements <file> Audit exported geometry against the original component inventory
      --skip-images       Research and build, but do not call an image model
      --images            With --from-spec, also generate layer images
      --motion            After stills, make rotation + explode clips and extract WebP frames
      --asset-plan <file> Execute a researched sourcing or generation task; saves an asset for review
      --component <id>    Prepare one component; omit to advance the whole researched asset queue
      --assemble <file>   Build an agent-authored component recipe into a GLB and reviewable site
      --plan              Save research and component construction tasks; no geometry generation
      --3d                Research, generate a textured mesh, segment parts, and build a 3D draft
      --extract <video>   Only extract a clip to WebP frames. No model call
      --frames-dir <dir>  Destination for --extract
      --fps <n>           Frame rate for extraction (default 12)
      --skip <a-b>        Source-time range to rush or drop. Repeatable
      --skip-keep <n>     Frames to keep inside each --skip (default 0 drops it)
      --json              Print the spec JSON to stdout
      --no-open           Do not open the finished site in a browser (default opens it)
      --preview <dir>     Serve an already built site locally and open it
  -h, --help

Environment
  AI_GATEWAY_API_KEY      Vercel AI Gateway (preferred)
  OPENAI_API_KEY          Direct OpenAI, used only if the gateway key is unset
                          Also required for web-backed component research
  TRIPO_API_KEY           Photo-to-3D and part segmentation with --3d
  FAL_KEY                 Used when ATOMIC_EXPLAINER_VIDEO_PROVIDER=fal
  ATOMIC_EXPLAINER_VISION_MODEL    Default google/gemini-2.5-flash
  ATOMIC_EXPLAINER_RESEARCH_MODEL  Default anthropic/claude-sonnet-4.5
  ATOMIC_EXPLAINER_IMAGE_MODEL     Default google/gemini-2.5-flash-image
                          Also: bfl/flux-kontext-pro, bfl/flux-3-image, openai/gpt-image-1
  ATOMIC_EXPLAINER_VIDEO_PROVIDER  gateway (default) or fal
  ATOMIC_EXPLAINER_VIDEO_MODEL     Default klingai/kling-v2.6-i2v
                          Also: google/veo-3.1-fast-generate-001, bytedance/seedance-v1.5-pro

The committed Murph study does not need a key:
  npm run build && npm run studio
  Open http://127.0.0.1:4319/murph-study/index.html
`
}

export function parseFlags(argv: string[]): Flags {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      out: { type: "string", short: "o", default: "./atomic-explainer-out" },
      "from-spec": { type: "string" },
      requirements: { type: "string" },
      "skip-images": { type: "boolean", default: false },
      images: { type: "boolean", default: false },
      motion: { type: "boolean", default: false },
      "3d": { type: "boolean", default: false },
      plan: { type: "boolean", default: false },
      assemble: { type: "string" },
      "asset-plan": { type: "string" },
      component: { type: "string" },
      extract: { type: "string" },
      "frames-dir": { type: "string" },
      fps: { type: "string" },
      skip: { type: "string", multiple: true },
      "skip-keep": { type: "string" },
      json: { type: "boolean", default: false },
      open: { type: "boolean", default: true },
      preview: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
      "model-vision": { type: "string" },
      "model-research": { type: "string" },
      "model-image": { type: "string" },
    },
  })

  if (values["model-vision"]) process.env.ATOMIC_EXPLAINER_VISION_MODEL = values["model-vision"]
  if (values["model-research"]) process.env.ATOMIC_EXPLAINER_RESEARCH_MODEL = values["model-research"]
  if (values["model-image"]) process.env.ATOMIC_EXPLAINER_IMAGE_MODEL = values["model-image"]

  const keep = values["skip-keep"] ? Number(values["skip-keep"]) : 0
  const skips = (values.skip ?? []).map((range) => parseSkip(range, keep))
  const fps = values.fps ? Number(values.fps) : undefined
  if (fps !== undefined && (!Number.isFinite(fps) || fps <= 0)) {
    throw new Error(`--fps must be a positive number, got "${values.fps}".`)
  }

  return {
    help: values.help,
    open: values.open && !values.json && shouldAutoOpen(),
    preview: values.preview,
    json: values.json,
    out: values.out ?? "./atomic-explainer-out",
    fromSpec: values["from-spec"],
    requirements: values.requirements,
    skipImages: values["skip-images"],
    images: values.images,
    motion: values.motion,
    three: values["3d"],
    plan: values.plan,
    assemble: values.assemble,
    assetPlan: values["asset-plan"],
    component: values.component,
    extract: values.extract,
    framesDir: values["frames-dir"],
    fps,
    skips,
    photo: positionals[0],
  }
}

export async function main(argv: string[]) {
  const flags = parseFlags(argv)
  if (flags.help) {
    console.log(formatHelp())
    return 0
  }

  if (flags.extract) {
    if (!flags.framesDir) {
      console.error("--extract needs --frames-dir.")
      return 1
    }
    try {
      const sequence = await extractFrames(flags.extract, flags.framesDir, {
        fps: flags.fps,
        skips: flags.skips,
      })
      console.error(`  ${sequence.count} frames  ${flags.framesDir}`)
      return 0
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return 1
    }
  }

  if (flags.preview) {
    try {
      const { url, opened } = await openSite(flags.preview, { open: flags.open })
      console.error(opened ? `  Opened ${url}` : `  Serving ${url}`)
      return 0
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      return 1
    }
  }

  if (!flags.photo && !flags.fromSpec) {
    console.error(formatHelp())
    return 1
  }

  try {
    if (flags.assetPlan) {
      if (!flags.fromSpec || flags.assemble || flags.three || flags.images || flags.motion || flags.plan)
        throw Error("--asset-plan requires --from-spec; cannot combine generation modes.")
      if (!flags.component) {
        const batch = await (
          await import("./pipeline/assets.ts")
        ).prepareAssets({
          specPath: flags.fromSpec,
          planPath: flags.assetPlan,
          outDir: flags.out,
          requirementsPath: flags.requirements,
          log: (message) => console.error(message),
        })
        console.log(JSON.stringify(batch, null, 2))
        return 0
      }
      const report = await (
        await import("./pipeline/assets.ts")
      ).prepareAsset({
        specPath: flags.fromSpec,
        planPath: flags.assetPlan,
        componentId: flags.component,
        outDir: flags.out,
        log: (message) => console.error(message),
      })
      console.log(
        JSON.stringify(
          {
            status: report.status,
            index: path.resolve(flags.out, "index.html"),
            review: path.resolve(flags.out, "asset-review.json"),
            model: path.resolve(flags.out, "model.glb"),
          },
          null,
          2,
        ),
      )
      return 0
    }
    if (flags.assemble && (!flags.fromSpec || flags.three || flags.plan || flags.motion || flags.images))
      throw Error("--assemble requires --from-spec and cannot be combined with generation flags.")
    const spec = flags.assemble
      ? await (
          await import("./pipeline/assemble.ts")
        ).assembleStudy(flags.fromSpec!, flags.assemble, flags.out, undefined, flags.requirements)
      : await runExplainer({
          photo: flags.photo,
          specPath: flags.fromSpec,
          requirementsPath: flags.requirements,
          outDir: flags.out,
          skipImages: flags.images ? false : flags.fromSpec ? true : flags.skipImages,
          motion: flags.motion,
          three: flags.three,
          planOnly: flags.plan,
          skips: flags.skips,
          log: (message) => {
            if (!flags.json) console.error(message)
          },
        })

    if (flags.json) {
      console.log(JSON.stringify(spec, null, 2))
    } else {
      const index = path.resolve(flags.out, flags.plan ? "construction-plan.json" : "index.html")
      console.error("")
      console.error(`  ${spec.item.name}`)
      console.error(`  ${spec.components.length} parts`)
      console.error(`  ${index}`)
      console.error("")
      if (flags.plan) console.error("  Research plan only; geometry still needs construction and review.")
      else if (flags.open) {
        const { url, opened } = await openSite(flags.out)
        console.error(opened ? `  Opened ${url}` : `  Serving ${url}`)
      } else console.error(`  Preview it with:  npx atomic-explainer --preview ${path.resolve(flags.out)}`)
    }
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    return error instanceof Error && error.name === "ExplainerConfigError" ? 2 : 1
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : ""
const self = path.resolve(fileURLToPath(import.meta.url))
if (entry && (entry === self || entry.endsWith(`${path.sep}cli.js`) || entry.endsWith(`${path.sep}cli.ts`))) {
  main(process.argv.slice(2)).then((code) => {
    process.exit(code)
  })
}
