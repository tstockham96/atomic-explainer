import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { openSite, shouldAutoOpen } from "../src/pipeline/open-site.ts"
import { parseFlags } from "../src/cli.ts"

describe("opening a finished site", () => {
  it("serves the folder from a detached local server", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "atomic-explainer-open-"))
    await mkdir(path.join(dir, "models"))
    await writeFile(path.join(dir, "index.html"), "<h1>ready</h1>")
    await writeFile(path.join(dir, "models", "a.glb"), "glTF")
    const { url, opened, pid } = await openSite(dir, { open: false, idleMinutes: 1 })
    try {
      expect(opened).toBe(false)
      expect(url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/index\.html$/)
      const page = await fetch(url)
      expect(page.status).toBe(200)
      expect(await page.text()).toBe("<h1>ready</h1>")
      const model = await fetch(new URL("models/a.glb", url))
      expect(model.headers.get("content-type")).toBe("model/gltf-binary")
      expect((await fetch(new URL("/%2e%2e/%2e%2e/etc/hosts", url))).status).toBeGreaterThanOrEqual(403)
    } finally {
      if (pid) process.kill(pid)
    }
  })

  it("refuses a folder without a built page", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "atomic-explainer-open-"))
    await expect(openSite(dir, { open: false })).rejects.toThrow()
  })

  it("stays closed in CI, tests, on request, and for --no-open", () => {
    expect(shouldAutoOpen({})).toBe(true)
    expect(shouldAutoOpen({ CI: "true" })).toBe(false)
    expect(shouldAutoOpen({ VITEST: "true" })).toBe(false)
    expect(shouldAutoOpen({ ATOMIC_EXPLAINER_NO_OPEN: "1" })).toBe(false)
    expect(parseFlags(["--from-spec", "a.json", "--no-open"]).open).toBe(false)
    expect(parseFlags(["--preview", "./site"]).preview).toBe("./site")
  })
})
