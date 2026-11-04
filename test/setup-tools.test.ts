import { chmod, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { blenderInstallCommand, findBlender, hasKey } from "../src/pipeline/tools.ts"

describe("agent setup checks", () => {
  it("finds Blender from ATOMIC_EXPLAINER_BLENDER and reads its version", async () => {
    if (process.platform === "win32") return
    const dir = await mkdtemp(path.join(tmpdir(), "atomic-explainer-blender-"))
    const fake = path.join(dir, "blender")
    await writeFile(fake, '#!/bin/sh\necho "Blender 4.2.3 LTS"\n')
    await chmod(fake, 0o755)
    expect(await findBlender({ ATOMIC_EXPLAINER_BLENDER: fake, PATH: "" })).toEqual({
      binary: fake,
      version: "4.2.3",
    })
  })

  it("installs Blender through the platform package manager where one exists", () => {
    expect(blenderInstallCommand("darwin")).toEqual(["brew", ["install", "--cask", "blender"]])
    expect(blenderInstallCommand("win32")?.[0]).toBe("winget")
    expect(blenderInstallCommand("linux")).toBeUndefined()
  })

  it("detects a Tripo key in the environment or .env without reading it back", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "atomic-explainer-env-"))
    expect(await hasKey("TRIPO_API_KEY", dir, {})).toBe(false)
    await writeFile(path.join(dir, ".env"), "TRIPO_API_KEY=\nOTHER=1\n")
    expect(await hasKey("TRIPO_API_KEY", dir, {})).toBe(false)
    await writeFile(path.join(dir, ".env"), "TRIPO_API_KEY=tsk_example\n")
    expect(await hasKey("TRIPO_API_KEY", dir, {})).toBe(true)
    expect(await hasKey("TRIPO_API_KEY", path.join(dir, "none"), { TRIPO_API_KEY: "x" })).toBe(true)
  })
})
