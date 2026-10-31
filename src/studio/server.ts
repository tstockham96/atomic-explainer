import "dotenv/config"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile, rename, realpath } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { runExplode, type RunOptions } from "../pipeline/run.ts"
import { packageRoot } from "../pipeline/render-site.ts"

export interface StudioJob { id: string; status: "running" | "review" | "plan-ready" | "failed" | "interrupted"; stage: string; log: string[]; error?: string; preview?: string; plan?: string }
const idPattern = /^[a-f0-9-]{36}$/
const mimeTypes: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" }

export function createStudioServer(options: { root?: string; siteDir?: string; jobsRoot?: string; run?: typeof runExplode; env?: NodeJS.ProcessEnv } = {}) {
  const root = options.root ?? packageRoot()
  const jobsRoot = options.jobsRoot ?? path.join(root, ".explode-jobs")
  const run = options.run ?? runExplode
  const env = options.env ?? process.env
  const token = randomUUID()
  const active = new Set<string>()
  const memory = new Map<string, StudioJob>()
  const missing = () => ["OPENAI_API_KEY"].filter(key => !env[key]?.trim())
  const json = (res: ServerResponse, status: number, value: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(value))
  }
  async function save(job: StudioJob) {
    const filename = path.join(jobsRoot, job.id, "job.json")
    await writeFile(`${filename}.tmp`, JSON.stringify(job, null, 2)); await rename(`${filename}.tmp`, filename)
  }
  async function readJob(id: string): Promise<StudioJob> {
    if (!idPattern.test(id)) throw new Error("Unknown job.")
    if (memory.has(id)) return memory.get(id)!
    const job = JSON.parse(await readFile(path.join(jobsRoot, id, "job.json"), "utf8")) as StudioJob
    if (job.status === "running") { job.status = "interrupted"; job.stage = "Server stopped. Resume the saved job." }
    return job
  }
  async function execute(job: StudioJob, photo: string, specPath?: string) {
    try {
      await save(job)
      const outDir = path.join(jobsRoot, job.id, "site")
      const args: RunOptions = { photo, specPath, outDir, planOnly: true, log: message => {
        job.stage = message; job.log = [...job.log.slice(-39), message]
      } }
      await run(args)
      await readFile(path.join(outDir, "construction-plan.json"))
      job.status = "plan-ready"; job.stage = "Research plan ready · component construction is next"; job.plan = `/jobs/${job.id}/construction-plan.json`
    } catch (error) {
      let message = error instanceof Error ? error.message : "Generation failed."
      for (const name of ["OPENAI_API_KEY", "TRIPO_API_KEY", "AI_GATEWAY_API_KEY"]) if (env[name]) message = message.replaceAll(env[name]!, "[redacted]")
      job.status = "failed"; job.error = message.slice(0, 1200); job.stage = "Generation stopped"
    } finally {
      active.delete(job.id)
      await save(job).catch(() => undefined)
    }
  }
  async function staticFile(res: ServerResponse, base: string, relative: string) {
    const safeBase = await realpath(base)
    const file = await realpath(path.resolve(base, relative))
    if (!file.startsWith(`${safeBase}${path.sep}`)) { json(res, 403, { error: "Path not allowed." }); return }
    const data = await readFile(file)
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(file)] ?? "application/octet-stream", "X-Content-Type-Options": "nosniff" }); res.end(data)
  }
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const port = (server.address() as { port: number } | null)?.port
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host ?? "")) { json(res, 403, { error: "Local requests only." }); return }
    const origin = `http://${req.headers.host}`
    if (req.headers.origin && req.headers.origin !== origin) { json(res, 403, { error: "Origin not allowed." }); return }
    const url = new URL(req.url ?? "/", origin)
    if (req.method === "POST" && req.headers["x-explode-token"] !== token) { json(res, 403, { error: "Refresh the page before submitting." }); return }
    if (url.pathname === "/api/config" && req.method === "GET") { json(res, 200, { token, missing: missing(), provider: "OpenAI research; component authoring required", capability: 'research-plan' }); return }
    if (url.pathname === "/api/jobs" && req.method === "POST") {
      if (missing().length) { json(res, 503, { error: `Configure ${missing().join(" and ")} in .env, then restart the studio.` }); return }
      if (active.size) { json(res, 409, { error: "A generation is already running. Wait for it to finish." }); return }
      const type = req.headers["content-type"]
      if (type !== "image/png" && type !== "image/jpeg") { json(res, 415, { error: "Choose a PNG or JPEG photograph." }); return }
      // Reserve before reading so concurrent requests cannot start multiple paid jobs.
      const id = randomUUID(); active.add(id)
      try {
        const chunks: Buffer[] = []; let size = 0
        for await (const chunk of req) {
          size += chunk.length
          if (size > 20 * 1024 * 1024) { json(res, 413, { error: "Photo exceeds 20 MB." }); active.delete(id); return }
          chunks.push(chunk)
        }
        const data = Buffer.concat(chunks)
        const valid = type === "image/png" ? data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : data[0] === 255 && data[1] === 216 && data[2] === 255
        if (!valid) { json(res, 415, { error: "This file is not a valid PNG or JPEG." }); active.delete(id); return }
        const directory = path.join(jobsRoot, id); await mkdir(directory, { recursive: true })
        const photo = path.join(directory, type === "image/png" ? "source.png" : "source.jpg")
        await writeFile(photo, data)
        const job: StudioJob = { id, status: "running", stage: "Identifying your object", log: [] }
        memory.set(id, job)
        void execute(job, photo)
        json(res, 202, job)
      } catch (error) { active.delete(id); throw error }
      return
    }
    const match = url.pathname.match(/^\/api\/jobs\/([a-f0-9-]{36})(\/resume)?$/)
    if (match) {
      const job = await readJob(match[1]!)
      if (req.method === "GET" && !match[2]) { json(res, 200, job); return }
      if (req.method === "POST" && match[2]) {
        if (missing().length) { json(res, 503, { error: "Generation credentials are missing." }); return }
        if (active.size || job.status === "review" || job.status === "plan-ready") { json(res, 409, { error: "This job cannot be resumed now." }); return }
        const directory = path.join(jobsRoot, job.id)
        let photo = path.join(directory, "source.png")
        try { await readFile(photo) } catch { photo = path.join(directory, "source.jpg") }
        const research = path.join(directory, "site/research.json")
        let specPath: string | undefined
        try { await readFile(research); specPath = research } catch { /* Identification did not finish. */ }
        job.status = "running"; job.stage = "Resuming saved work"; delete job.error
        active.add(job.id); memory.set(job.id, job)
        void execute(job, photo, specPath); json(res, 202, job); return
      }
    }
    if (req.method !== "GET") { json(res, 405, { error: "Method not allowed." }); return }
    const asset = url.pathname.match(/^\/jobs\/([a-f0-9-]{36})\/(.*)$/)
    if (asset) { await staticFile(res, path.join(jobsRoot, asset[1]!, "site"), decodeURIComponent(asset[2]!)); return }
    await staticFile(res, options.siteDir ?? path.join(root, "dist-site"), url.pathname === "/" || url.pathname === "/create" ? "index.html" : decodeURIComponent(url.pathname.slice(1)))
  }
  const server = createServer((req, res) => { void handler(req, res).catch(() => { if (!res.headersSent) json(res, 404, { error: "File or job not found." }); else res.end() }) })
  server.requestTimeout = 60_000
  return server
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.EXPLODE_STUDIO_PORT ?? 4319)
  createStudioServer({siteDir: process.env.EXPLODE_SITE_DIR ? path.resolve(process.env.EXPLODE_SITE_DIR) : undefined}).listen(port, "127.0.0.1", () => console.log(`Explode studio: http://127.0.0.1:${port}/create`))
}
