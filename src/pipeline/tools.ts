import { execFile } from "node:child_process"
import { access, readFile, writeFile } from "node:fs/promises"
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

/** Sets one key in the checkout's .env, replacing an existing line, without touching the others. */
export async function writeEnvKey(name: string, value: string, root = process.cwd()) {
  const file = path.join(root, ".env")
  const current = (await exists(file)) ? await readFile(file, "utf8") : ""
  const entry = `${name}=${value.replace(/[\r\n]/g, "")}`
  const line = new RegExp(`^[ \\t]*${name}[ \\t]*=.*$`, "m")
  const next = line.test(current)
    ? current.replace(line, () => entry)
    : `${current}${current && !current.endsWith("\n") ? "\n" : ""}${entry}\n`
  await writeFile(file, next, { mode: 0o600 })
}

const DIALOG_TITLE = "Atomic Explainer setup"
const appleString = (text: string) => `"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`

/** Native password dialogs, so an agent running setup can collect a key the agent never sees. */
export function secretDialogCommands(message: string, platform = process.platform): [string, string[]][] {
  if (platform === "darwin")
    return [
      [
        "osascript",
        [
          "-e",
          `set r to display dialog ${appleString(message)} default answer "" with hidden answer with title ${appleString(DIALOG_TITLE)} buttons {"Skip", "Save"} default button "Save" cancel button "Skip" giving up after 900`,
          "-e",
          'if gave up of r then return ""',
          "-e",
          "return text returned of r",
        ],
      ],
    ]
  if (platform === "win32")
    return [
      [
        "powershell",
        [
          "-NoProfile",
          "-Command",
          `$c = Get-Credential -UserName 'TRIPO_API_KEY' -Message '${message.replaceAll("'", "''")}'; if ($c) { $c.GetNetworkCredential().Password }`,
        ],
      ],
    ]
  return [
    ["zenity", ["--entry", "--hide-text", "--title", DIALOG_TITLE, "--text", message]],
    ["kdialog", ["--title", DIALOG_TITLE, "--password", message]],
  ]
}

/** Shows a native password dialog; undefined when skipped, closed, or no dialog tool exists. */
export async function askSecretInWindow(message: string, platform = process.platform) {
  for (const [command, args] of secretDialogCommands(message, platform)) {
    try {
      const { stdout } = await run(command, args, { timeout: 15 * 60_000 })
      return stdout.trim() || undefined
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue
      return undefined
    }
  }
  return undefined
}

export async function exists(file: string) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}
