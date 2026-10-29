import "dotenv/config"
import { parseArgs } from "node:util"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { runExplode } from "./pipeline/run.ts"

interface Flags {
  help: boolean
  json: boolean
  out: string
  fromSpec?: string
  skipImages: boolean
  images: boolean
  photo?: string
}

export function formatHelp() {
  return `explode — a photo in, a how-it's-made scroll site out

Usage
  explode ./photo.jpg
  explode ./photo.jpg --out ./site
  explode --from-spec public/spec.json --out ./site
  explode ./photo.jpg --from-spec public/spec.json --images --out ./site

Options
  -o, --out <dir>         Output folder (default: ./explode-out)
      --from-spec <file>  Render a spec JSON instead of calling models
      --skip-images       Research and build, but do not call an image model
      --images            With --from-spec, also generate layer images
      --json              Print the spec JSON to stdout
  -h, --help

Environment
  AI_GATEWAY_API_KEY      Vercel AI Gateway (preferred)
  OPENAI_API_KEY          Direct OpenAI, used only if the gateway key is unset
  EXPLODE_VISION_MODEL    Default google/gemini-2.5-flash
  EXPLODE_RESEARCH_MODEL  Default anthropic/claude-sonnet-4.5
  EXPLODE_IMAGE_MODEL     Default google/gemini-2.5-flash-image
                          Also: bfl/flux-kontext-pro, bfl/flux-3-image, openai/gpt-image-1

The committed Murph demo does not need a key:
  npm run dev
`
}

export function parseFlags(argv: string[]): Flags {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o", default: "./explode-out" },
      "from-spec": { type: "string" },
      "skip-images": { type: "boolean", default: false },
      images: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      "model-vision": { type: "string" },
      "model-research": { type: "string" },
      "model-image": { type: "string" },
    },
  })

  if (values["model-vision"]) process.env.EXPLODE_VISION_MODEL = values["model-vision"]
  if (values["model-research"]) process.env.EXPLODE_RESEARCH_MODEL = values["model-research"]
  if (values["model-image"]) process.env.EXPLODE_IMAGE_MODEL = values["model-image"]

  return {
    help: values.help,
    json: values.json,
    out: values.out ?? "./explode-out",
    fromSpec: values["from-spec"],
    skipImages: values["skip-images"],
    images: values.images,
    photo: positionals[0],
  }
}

export async function main(argv: string[]) {
  const flags = parseFlags(argv)
  if (flags.help) {
    console.log(formatHelp())
    return 0
  }

  if (!flags.photo && !flags.fromSpec) {
    console.error(formatHelp())
    return 1
  }

  try {
    const spec = await runExplode({
      photo: flags.photo,
      specPath: flags.fromSpec,
      outDir: flags.out,
      skipImages: flags.images ? false : flags.fromSpec ? true : flags.skipImages,
      log: (message) => {
        if (!flags.json) console.error(message)
      },
    })

    if (flags.json) {
      console.log(JSON.stringify(spec, null, 2))
    } else {
      const index = path.resolve(flags.out, "index.html")
      console.error("")
      console.error(`  ${spec.item.name}`)
      console.error(`  ${spec.components.length} parts`)
      console.error(`  ${index}`)
      console.error("")
      console.error("  Serve it with:  npx serve " + path.resolve(flags.out))
    }
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    return error instanceof Error && error.name === "ExplodeConfigError" ? 2 : 1
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : ""
const self = path.resolve(fileURLToPath(import.meta.url))
if (entry && (entry === self || entry.endsWith(`${path.sep}cli.js`) || entry.endsWith(`${path.sep}cli.ts`))) {
  main(process.argv.slice(2)).then((code) => {
    process.exit(code)
  })
}
