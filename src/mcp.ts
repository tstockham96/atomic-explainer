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
import { generateVisuals } from "./pipeline/visuals.ts"
import { normalizeSpec } from "./spec/normalize.ts"

function text(value: unknown) {
  return { content: [{ type: "text" as const, text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] }
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
      description: "Generate a hero image and one top-down image per component into outDir/images, and return the updated spec.",
      inputSchema: {
        specPath: z.string().describe("Path to an explode spec JSON"),
        outDir: z.string().describe("Folder that will receive images/"),
      },
    },
    async ({ specPath, outDir }) => {
      try {
        const models = assertModels()
        const raw = JSON.parse(await readFile(specPath, "utf8")) as unknown
        const spec = normalizeSpec(explodeSpecSchema.parse(raw))
        const next = await generateVisuals(spec, path.resolve(outDir), models)
        return text(next)
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
      },
    },
    async ({ specPath, outDir }) => {
      try {
        const raw = JSON.parse(await readFile(specPath, "utf8")) as unknown
        const spec = normalizeSpec(explodeSpecSchema.parse(raw))
        const index = await renderSite(spec, outDir)
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
      },
    },
    async ({ imagePath, outDir, skipImages }) => {
      try {
        const destination = outDir ?? "./explode-out"
        const spec = await runExplode({
          photo: imagePath,
          outDir: destination,
          skipImages: skipImages ?? false,
        })
        return text({
          outDir: path.resolve(destination),
          index: path.resolve(destination, "index.html"),
          item: spec.item,
          components: spec.components.map((component) => component.name),
          warnings: spec.generation?.warnings ?? [],
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
