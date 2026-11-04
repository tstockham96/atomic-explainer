import "dotenv/config"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import { identifyPhoto } from "./pipeline/identify.ts"
import { assertModels } from "./pipeline/models.ts"
import { renderSite } from "./pipeline/render-site.ts"
import { researchItem } from "./pipeline/research.ts"
import { runExplode } from "./pipeline/run.ts"
import { explodeSpecSchema } from "./spec/schema.ts"
import { readFile } from "node:fs/promises"
import { readPhoto } from "./pipeline/photo.ts"
import { generateVisuals } from "./pipeline/visuals.ts"
import { extractFrames, generateMotion } from "./pipeline/motion.ts"
import { resolveVideo } from "./pipeline/models.ts"
import { normalizeSpec } from "./spec/normalize.ts"
import { parseSkip } from "./spec/frames.ts"

function text(value: unknown) {
  return {
    content: [
      { type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) },
    ],
  }
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return { isError: true as const, content: [{ type: "text" as const, text: message }] }
}

export function createServer() {
  const server = new McpServer({
    name: "explode",
    version: "0.1.0",
  })

  server.registerTool(
    "explode_identify",
    {
      title: "Identify an object",
      description: "Identify the maker, model, and category of a physical object from a photo on disk.",
      inputSchema: {
        imagePath: z.string().describe("Path to a jpg, png, webp, or gif"),
      },
    },
    async ({ imagePath }) => {
      try {
        const identity = await identifyPhoto(imagePath, assertModels())
        return text(identity)
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_research",
    {
      title: "Research how it's made",
      description:
        "Research components, materials, and manufacturing for an identified object. Returns an explode spec JSON. Does not call an image model.",
      inputSchema: {
        maker: z.string(),
        model: z.string(),
        name: z.string(),
        category: z.string(),
        confidence: z.number().min(0).max(1),
        notes: z.string(),
      },
    },
    async (identity) => {
      try {
        const spec = await researchItem(identity, assertModels())
        return text(spec)
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_visualize",
    {
      title: "Generate teardown images",
      description:
        "Edit the uploaded photo into a photoreal hero, an exploded view, and one close-up per component. The photo is the reference, not a style hint.",
      inputSchema: {
        specPath: z.string().describe("Path to an explode spec JSON"),
        imagePath: z.string().describe("Path to the uploaded photo used as the edit reference"),
        outDir: z.string().describe("Folder that will receive images/"),
      },
    },
    async ({ specPath, imagePath, outDir }) => {
      try {
        const models = assertModels()
        const raw = JSON.parse(await readFile(specPath, "utf8")) as unknown
        const spec = normalizeSpec(explodeSpecSchema.parse(raw))
        const photo = await readPhoto(imagePath)
        const next = await generateVisuals(spec, path.resolve(outDir), models, photo.bytes)
        return text(next)
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_prepare_asset",
    {
      title: "Source or generate a researched component",
      description:
        "Omit componentId to advance every required component and save an incomplete work queue; supply it for one task. Import an existing GLB or send inspected multi-view images / an explicit construction prompt to Tripo. Requires a source search, exact variant, image observations and component research. Saves original geometry, provenance, request and pending review; never publishes an unreviewed explainer.",
      inputSchema: {
        specPath: z.string(),
        planPath: z.string(),
        componentId: z.string().optional(),
        outDir: z.string(),
        requirementsPath: z.string().optional(),
      },
    },
    async (input) => {
      try {
        const api = await import("./pipeline/assets.ts")
        if (!input.componentId) return text(await api.prepareAssets(input))
        const report = await api.prepareAsset({ ...input, componentId: input.componentId })
        return text({ ...report, index: path.resolve(input.outDir, "index.html") })
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_assemble",
    {
      title: "Build researched component geometry",
      description:
        "Build an agent-authored dimensional assembly recipe into a multipart GLB, review checklist and explainer. No paid model calls. All parts remain unreviewed until compared with references.",
      inputSchema: {
        specPath: z.string(),
        assemblyPath: z.string(),
        outDir: z.string(),
        requirementsPath: z.string().optional(),
      },
    },
    async ({ specPath, assemblyPath, outDir, requirementsPath }) => {
      try {
        const spec = await (
          await import("./pipeline/assemble.ts")
        ).assembleStudy(specPath, assemblyPath, path.resolve(outDir), undefined, requirementsPath)
        return text({
          index: path.resolve(outDir, "index.html"),
          project: path.resolve(outDir, "assembly-project.json"),
          item: spec.item.name,
          status: "unreviewed",
        })
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_build_site",
    {
      title: "Build the scroll site",
      description: "Write a static scrollytelling site from an explode spec JSON. Does not call a model.",
      inputSchema: {
        specPath: z.string(),
        outDir: z.string(),
        requirementsPath: z
          .string()
          .optional()
          .describe(
            "Original researched component inventory; prevents an exterior asset from narrowing the scope",
          ),
      },
    },
    async ({ specPath, outDir, requirementsPath }) => {
      try {
        const raw = JSON.parse(await readFile(specPath, "utf8")) as unknown
        const spec = normalizeSpec(explodeSpecSchema.parse(raw))
        const index = await renderSite(spec, outDir, {
          assetRoot: path.dirname(path.resolve(specPath)),
          requirementsPath,
        })
        return text({ index, item: spec.item.name, parts: spec.components.length })
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_run",
    {
      title: "Run the full explode pipeline",
      description:
        "Identify a photo, research how the object is made, optionally generate images, and write a static scroll-driven teardown site.",
      inputSchema: {
        imagePath: z.string(),
        outDir: z.string().optional(),
        skipImages: z.boolean().optional(),
        motion: z
          .boolean()
          .optional()
          .describe("Also generate rotation and explode clips, then extract WebP frames"),
        planOnly: z
          .boolean()
          .optional()
          .describe("Save research and a construction plan only; do not generate geometry or images"),
        three: z
          .boolean()
          .optional()
          .describe(
            "Generate a textured multipart 3D draft with Tripo instead of images; needs TRIPO_API_KEY and OPENAI_API_KEY",
          ),
      },
    },
    async ({ imagePath, outDir, skipImages, motion, three, planOnly }) => {
      try {
        const destination = outDir ?? "./explode-out"
        const spec = await runExplode({
          photo: imagePath,
          outDir: destination,
          skipImages: skipImages ?? false,
          motion: motion ?? false,
          three: three ?? false,
          planOnly: planOnly ?? false,
        })
        return text({
          outDir: path.resolve(destination),
          ...(planOnly
            ? { plan: path.resolve(destination, "construction-plan.json") }
            : { index: path.resolve(destination, "index.html") }),
          item: spec.item,
          components: spec.components.map((component) => component.name),
          warnings: spec.generation?.warnings ?? [],
        })
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_extract_frames",
    {
      title: "Extract a scroll sequence",
      description:
        "Turn a rotation or explode clip into a numbered WebP sequence with ffmpeg. Optional skip ranges rush or drop a bad patch of source time.",
      inputSchema: {
        videoPath: z.string(),
        outDir: z.string(),
        fps: z.number().positive().optional(),
        skip: z.array(z.string()).optional().describe('Source ranges like "4.55-5.65"'),
        skipKeep: z.number().int().nonnegative().optional(),
      },
    },
    async ({ videoPath, outDir, fps, skip, skipKeep }) => {
      try {
        const sequence = await extractFrames(videoPath, outDir, {
          fps,
          skips: (skip ?? []).map((range) => parseSkip(range, skipKeep ?? 0)),
        })
        return text({ count: sequence.count, dir: outDir, fps: sequence.fps })
      } catch (error) {
        return failure(error)
      }
    },
  )

  server.registerTool(
    "explode_motion",
    {
      title: "Generate rotation and explode clips",
      description:
        "Image-to-video from the hero still (a turn) and from hero plus exploded still (the teardown), then extract WebP frames onto the spec. Needs AI_GATEWAY_API_KEY or FAL_KEY.",
      inputSchema: {
        specPath: z.string(),
        outDir: z.string().describe("Folder that already contains the hero and exploded images"),
      },
    },
    async ({ specPath, outDir }) => {
      try {
        const video = resolveVideo()
        if ("error" in video) throw new Error(video.error)
        const raw = JSON.parse(await readFile(specPath, "utf8")) as unknown
        const spec = normalizeSpec(explodeSpecSchema.parse(raw))
        const next = await generateMotion(spec, outDir, video)
        return text({
          video: next.generation?.videoModel,
          rotation: next.frames?.rotation?.count ?? 0,
          explode: next.frames?.explode?.count ?? 0,
        })
      } catch (error) {
        return failure(error)
      }
    },
  )

  return server
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : ""
const self = path.resolve(fileURLToPath(import.meta.url))
if (entry && (entry === self || entry.endsWith(`${path.sep}mcp.js`) || entry.endsWith(`${path.sep}mcp.ts`))) {
  const server = createServer()
  await server.connect(new StdioServerTransport())
}
