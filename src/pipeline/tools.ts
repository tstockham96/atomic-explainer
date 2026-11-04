import { execFile } from "node:child_process"
import { access, readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)

/** Blender's location: ATOMIC_EXPLAINER_BLENDER, PATH, then the standard install folders. */
export async function findBlender(env: NodeJS.ProcessEnv = process.env) {
  const candidates = [
    env.ATOMIC_EXPLAINER_BLENDER,
    "blender",
    "/Applications/Blender.app/Contents/MacOS/Blender",
    path.join(env.HOME ?? "", "Applications/Blender.app/Contents/MacOS/Blender"),
    "/snap/bin/blender",
    "C:\\Program Files\\Blender Foundation\\Blender\\blender.exe",
  ].filter((c): c is string => Boolean(c))
  for (const binary of candidates) {
    try {
      const { stdout } = await run(binary, ["--background", "--version"], { timeout: 30_000 })
      const version = /Blender (\d+\.\d+(?:\.\d+)?)/.exec(stdout)?.[1]
      if (version) return { binary, version }
    } catch {
      // Try the next location.
    }
  }
  return undefined
}

/** How Blender is installed on this platform, or undefined where it needs a manual download. */
export function blenderInstallCommand(platform = process.platform): [string, string[]] | undefined {
  if (platform === "darwin") return ["brew", ["install", "--cask", "blender"]]
  if (platform === "win32")
    return ["winget", ["install", "-e", "--id", "BlenderFoundation.Blender", "--accept-source-agreements"]]
  return undefined
}

/** Reads a key from the environment or the checkout's .env without exposing its value. */
export async function hasKey(name: string, root = process.cwd(), env: NodeJS.ProcessEnv = process.env) {
  if (env[name]?.trim()) return true
  try {
    const text = await readFile(path.join(root, ".env"), "utf8")
    return new RegExp(`^[ \\t]*${name}[ \\t]*=[ \\t]*[^\\s#]`, "m").test(text)
  } catch {
    return false
  }
}

export async function exists(file: string) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}
