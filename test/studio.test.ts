import { afterEach, expect, it, vi } from "vitest"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { createStudioServer } from "../src/studio/server.ts"
import type { ExplodeSpec } from "../src/spec/schema.ts"
const cleanups: (() => Promise<unknown>)[] = []
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup() })

it("serves upload, progress, resume and plan handoff while rejecting cross-origin submissions", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "explode-studio-"))
  cleanups.push(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, "dist-site")); await writeFile(path.join(root, "dist-site/index.html"), "Studio")
  let release: () => void = () => undefined
  const gate = new Promise<void>(resolve => { release = resolve })
  const run = vi.fn(async (options: { outDir: string; log?: (s: string) => void }) => {
    options.log?.("Generating geometry"); await gate
    await mkdir(options.outDir, { recursive: true }); await writeFile(path.join(options.outDir, "construction-plan.json"), "Research plan")
    return {} as ExplodeSpec
  })
  const server = createStudioServer({ root, run, env: { OPENAI_API_KEY: "private-key", TRIPO_API_KEY: "private-tripo" } })
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  cleanups.push(() => new Promise<void>(resolve => server.close(() => resolve())))
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  expect(await (await fetch(`${base}/create`)).text()).toBe("Studio")
  const configText = await (await fetch(`${base}/api/config`)).text()
  expect(configText).not.toContain("private-")
  const config = JSON.parse(configText)
  const photo = Buffer.from([137,80,78,71,13,10,26,10,0])
  const headers = { "Content-Type": "image/png", "X-Explode-Token": config.token }
  expect((await fetch(`${base}/api/jobs`, { method: "POST", body: photo, headers: { ...headers, Origin: "https://unrelated.example" } })).status).toBe(403)
  expect((await fetch(`${base}/api/jobs`, { method: "POST", body: photo })).status).toBe(403)
  const response = await fetch(`${base}/api/jobs`, { method: "POST", body: photo, headers })
  expect(response.status).toBe(202)
  const job = await response.json()
  expect((await fetch(`${base}/api/jobs`, { method: "POST", body: photo, headers })).status).toBe(409)
  release()
  await vi.waitFor(async () => {
    const status = await (await fetch(`${base}/api/jobs/${job.id}`)).json()
    expect(status.status).toBe("plan-ready")
    expect(status.plan).toBe(`/jobs/${job.id}/construction-plan.json`); expect(status.preview).toBeUndefined()
  })
  expect(await (await fetch(`${base}/jobs/${job.id}/construction-plan.json`)).text()).toBe("Research plan")
  expect((await fetch(`${base}/api/jobs/${job.id}/resume`, { method: "POST", headers })).status).toBe(409)
  expect(run).toHaveBeenCalledTimes(1); expect(run).toHaveBeenCalledWith(expect.objectContaining({planOnly:true}))
  expect(await readFile(path.join(root, ".explode-jobs", job.id, "source.png"))).toEqual(photo)
})

it("refuses generation before any provider call when credentials are missing", async () => {
  const run = vi.fn()
  const server = createStudioServer({ run, env: {} })
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  cleanups.push(() => new Promise<void>(resolve => server.close(() => resolve())))
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  const config = await (await fetch(`${base}/api/config`)).json()
  expect(config.missing).toEqual(["OPENAI_API_KEY"])
  expect((await fetch(`${base}/api/jobs`, { method: "POST", headers: { "X-Explode-Token": config.token } })).status).toBe(503)
  expect(run).not.toHaveBeenCalled()
})

it("recovers an interrupted job using saved research and the original photo", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "explode-resume-"))
  cleanups.push(() => rm(root, { recursive: true, force: true }))
  const id = randomUUID(); const directory = path.join(root, ".explode-jobs", id)
  await mkdir(path.join(directory, "site"), { recursive: true })
  await writeFile(path.join(directory, "job.json"), JSON.stringify({ id, status: "running", stage: "Generating", log: [] }))
  await writeFile(path.join(directory, "source.jpg"), "fixture")
  await writeFile(path.join(directory, "site/research.json"), "{}")
  const run = vi.fn(async () => ({} as ExplodeSpec))
  const server = createStudioServer({ root, run, env: { OPENAI_API_KEY: "test", TRIPO_API_KEY: "test" } })
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  cleanups.push(() => new Promise<void>(resolve => server.close(() => resolve())))
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  expect((await (await fetch(`${base}/api/jobs/${id}`)).json()).status).toBe("interrupted")
  const { token } = await (await fetch(`${base}/api/config`)).json()
  expect((await fetch(`${base}/api/jobs/${id}/resume`, { method: "POST", headers: { "X-Explode-Token": token } })).status).toBe(202)
  await vi.waitFor(() => expect(run).toHaveBeenCalledWith(expect.objectContaining({ photo: path.join(directory, "source.jpg"), specPath: path.join(directory, "site/research.json"), planOnly: true })))
})
