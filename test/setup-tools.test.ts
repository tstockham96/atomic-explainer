import { chmod, mkdtemp, readFile, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  askSecretInWindow,
  blenderInstallCommand,
  findBlender,
  hasKey,
  secretDialogCommands,
  writeEnvKey,
} from "../src/pipeline/tools.ts"

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

  it("writes the key into .env, keeping other lines and literal $ signs", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "atomic-explainer-env-"))
    await writeEnvKey("TRIPO_API_KEY", "tsk_first", dir)
    expect(await readFile(path.join(dir, ".env"), "utf8")).toBe("TRIPO_API_KEY=tsk_first\n")
    if (process.platform !== "win32") expect((await stat(path.join(dir, ".env"))).mode & 0o777).toBe(0o600)
    await writeFile(path.join(dir, ".env"), "OTHER=1\nTRIPO_API_KEY=\nLAST=2")
    await writeEnvKey("TRIPO_API_KEY", "tsk_$&$1\n", dir)
    expect(await readFile(path.join(dir, ".env"), "utf8")).toBe("OTHER=1\nTRIPO_API_KEY=tsk_$&$1\nLAST=2")
  })

  it("asks for keys through a native hidden-input window on every desktop platform", () => {
    const mac = secretDialogCommands('Paste "the" key', "darwin")[0]!
    expect(mac[0]).toBe("osascript")
    expect(mac[1].join(" ")).toContain('display dialog "Paste \\"the\\" key"')
    expect(mac[1].join(" ")).toContain("with hidden answer")
    expect(secretDialogCommands("it's", "win32")[0]![1].at(-1)).toContain("-Message 'it''s'")
    expect(secretDialogCommands("x", "linux").map(([command]) => command)).toEqual(["zenity", "kdialog"])
  })

  it("returns nothing when no dialog tool exists", async () => {
    const original = process.env.PATH
    process.env.PATH = ""
    try {
      expect(await askSecretInWindow("x", "linux")).toBeUndefined()
    } finally {
      process.env.PATH = original
    }
  })
})
