import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile, rename } from "node:fs/promises"
import path from "node:path"

const API = "https://openapi.tripo3d.ai/v3"
export const TRIPO_MODEL = "v3.1-20260211"
export interface MeshProvider {
  id: string
  generate(photo: Uint8Array, mime: string, directory: string, log: (message: string) => void): Promise<Uint8Array>
}
type Checkpoint = { hash: string; upload?: string; generation?: string; segmentation?: string; submitting?: string }
type Task = { status: string; progress?: number; output?: { model_url?: string }; error_code?: number }

/** Paid POSTs are never automatically retried. Saved task IDs make later polling resumable. */
export function createTripoProvider(options: {
  apiKey: string
  /** Opt-in asset study: 8K textures, de-lighting, denser geometry and connected parts. */
  quality?: "default" | "fidelity"
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  maxPolls?: number
}): MeshProvider {
  if (!options.apiKey.trim()) throw new Error("Set TRIPO_API_KEY in .env to generate 3D geometry.")
  const request = options.fetch ?? fetch
  const fidelity = options.quality === "fidelity"
  const generationSettings = {
    texture_quality: fidelity ? "extreme" : "detailed", geometry_quality: "detailed",
    face_limit: fidelity ? 300_000 : 100_000,
    ...(fidelity ? { texture_version: "v3.5-20260815", delight: true, texture_alignment: "original_image", orientation: "align_image" } : {}),
  }
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)))
  async function api<T>(endpoint: string, body?: BodyInit, json = false): Promise<T> {
    const response = await request(`${API}${endpoint}`, {
      method: body ? "POST" : "GET", body,
      headers: { Authorization: `Bearer ${options.apiKey}`, ...(json ? { "Content-Type": "application/json" } : {}) },
      signal: AbortSignal.timeout(60_000), redirect: "error",
    })
    if (!response.ok) throw new Error(`Tripo request failed (HTTP ${response.status}). Check the account and saved task before retrying.`)
    const result = await response.json() as { code: number; data: T }
    if (result.code !== 0 || !result.data) throw new Error(`Tripo rejected the request (code ${result.code}).`)
    return result.data
  }
  async function poll(id: string, log: (message: string) => void) {
    for (let attempt = 0; attempt < (options.maxPolls ?? 240); attempt++) {
      const task = await api<Task>(`/tasks/${encodeURIComponent(id)}`)
      if (task.status === "success") {
        if (!task.output?.model_url) throw new Error("Tripo completed without a model URL.")
        return task.output.model_url
      }
      if (["failed", "cancelled", "canceled", "banned", "expired"].includes(task.status)) {
        throw new Error(`Tripo task ${id} ${task.status}${task.error_code ? ` (${task.error_code})` : ""}. No replacement was submitted.`)
      }
      log(`3D · ${task.status} · ${task.progress ?? 0}%`)
      await sleep(5_000)
    }
    throw new Error(`Still processing task ${id}. Run again with the same output folder to resume; no new generation is needed.`)
  }
  return {
    id: "tripo",
    async generate(photo, mime, directory, log) {
      if (!["image/jpeg", "image/png"].includes(mime)) throw new Error("3D upload accepts PNG or JPEG photos.")
      if (!photo.length || photo.length > 20 * 1024 * 1024) throw new Error("Photo must be between 1 byte and 20 MB.")
      await mkdir(directory, { recursive: true })
      const statePath = path.join(directory, "tripo-tasks.json")
      const fingerprint = createHash("sha256").update(photo).update(TRIPO_MODEL)
      // Preserve old default checkpoints; changed quality must never reuse a paid task silently.
      if (fidelity) fingerprint.update(JSON.stringify(generationSettings)).update("connected-segmentation-v2")
      const hash = fingerprint.digest("hex")
      let state: Checkpoint = { hash }
      try { state = JSON.parse(await readFile(statePath, "utf8")) as Checkpoint }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error }
      if (state.hash !== hash) throw new Error("This folder contains tasks for a different photo or quality setting. Choose a new output folder.")
      if (state.submitting) throw new Error(`The previous ${state.submitting} submission has an unknown outcome. Check the Tripo account and restore its task ID in tripo-tasks.json before resuming. No duplicate submitted.`)
      const save = async () => {
        await writeFile(`${statePath}.tmp`, JSON.stringify(state, null, 2))
        await rename(`${statePath}.tmp`, statePath)
      }
      if (!state.upload) {
        log("Uploading photo to Tripo")
        const form = new FormData()
        form.append("file", new Blob([new Uint8Array(photo)], { type: mime }), mime === "image/png" ? "source.png" : "source.jpg")
        state.upload = (await api<{ file_token: string }>("/files", form)).file_token
        if (!state.upload) throw new Error("Tripo upload returned no file token.")
        await save()
      }
      async function submit(stage: "generation" | "segmentation", endpoint: string, payload: object) {
        state.submitting = stage
        await save()
        const result = await api<{ task_id: string }>(endpoint, JSON.stringify(payload), true)
        if (!result.task_id) throw new Error("Tripo submission returned no task ID; check the account before retrying.")
        state[stage] = result.task_id
        delete state.submitting
        await save()
        return result.task_id
      }
      log("Generating textured 3D geometry")
      const generated = state.generation ?? await submit("generation", "/generation/image-to-model", {
        input: state.upload, model: TRIPO_MODEL, texture: true, pbr: true,
        ...generationSettings,
      })
      await poll(generated, log)
      log("Separating the model into semantic parts")
      const segmented = state.segmentation ?? await submit("segmentation", "/mesh/segment", {
        input: generated, model: "v2.0-20260430", segmentation_granularity: "balanced", split_by_connectivity: fidelity,
      })
      const url = new URL(await poll(segmented, log))
      if (url.protocol !== "https:" || !(url.hostname.endsWith(".tripo3d.ai") || url.hostname.endsWith(".tripo3d.com"))) {
        throw new Error("Model download host is not a recognized Tripo CDN. Review the saved task output.")
      }
      // CDN requests deliberately carry no provider credentials and do not follow redirects.
      const response = await request(url, { signal: AbortSignal.timeout(120_000), redirect: "error" })
      if (!response.ok || !response.body) throw new Error(`Model download failed (HTTP ${response.status}).`)
      const chunks: Uint8Array[] = []; let size = 0
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        size += chunk.byteLength
        if (size > 150 * 1024 * 1024) throw new Error("Generated model exceeds the 150 MB limit.")
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    },
  }
}
