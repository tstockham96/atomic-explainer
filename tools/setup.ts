/** One-time setup for building explainers with a coding agent (Claude Code or similar).
 *
 *   npm run setup             check, install what can be installed, ask for the Tripo key
 *   npm run setup -- --check  report only; exit 1 if something the agent needs is missing
 *   npm run setup -- --json   machine-readable report for the agent
 *
 * The agent does its own research and writing, so no OpenAI or AI Gateway key is needed.
 * Tripo is a hosted API; it needs only TRIPO_API_KEY in .env. */
import { chromium } from "@playwright/test"
import { spawn } from "node:child_process"
import { appendFile, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { parseArgs } from "node:util"
import { blenderInstallCommand, exists, findBlender, hasKey } from "../src/pipeline/tools.ts"

const { values } = parseArgs({
  options: { check: { type: "boolean", default: false }, json: { type: "boolean", default: false } },
})
const install = !values.check
const say = (text: string) => {
  if (!values.json) console.error(text)
}
const root = process.cwd()

function step(command: string, args: string[]) {
  say(`  $ ${command} ${args.join(" ")}`)
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, args, { stdio: values.json ? "ignore" : "inherit", cwd: root })
    child.on("error", () => resolve(false))
    child.on("exit", (code) => resolve(code === 0))
  })
}

async function browser() {
  for (const channel of [undefined, "chrome"]) {
    try {
      const b = await chromium.launch({ channel })
      await b.close()
      return channel ?? "playwright-chromium"
    } catch {
      // Try the next browser.
    }
  }
  return undefined
}

type Check = { name: string; ok: boolean; detail: string; fix?: string }
const checks: Check[] = []

// Node and dependencies.
const [major, minor] = process.versions.node.split(".").map(Number) as [number, number]
checks.push({
  name: "node",
  ok: major > 22 || (major === 22 && minor >= 12),
  detail: process.versions.node,
  fix: "Install Node.js 22.12 or newer.",
})

// Viewer build, which every site export copies.
let built = await exists(path.join(root, "dist-site/index.html"))
if (!built && install) built = await step("npm", ["run", "build"])
checks.push({
  name: "viewer build",
  ok: built,
  detail: built ? "dist-site/" : "missing",
  fix: "npm run build",
})

// A browser for fidelity sheets and authored-model exports.
let found = await browser()
if (!found && install) {
  await step("npx", ["playwright", "install", "chromium"])
  found = await browser()
}
checks.push({
  name: "browser",
  ok: Boolean(found),
  detail: found ?? "none",
  fix: "npx playwright install chromium",
})

// Blender: modeling, fitting and GLB export for visible geometry.
let blender = await findBlender()
const recipe = blenderInstallCommand()
if (!blender && install && recipe) {
  await step(...recipe)
  blender = await findBlender()
}
checks.push({
  name: "blender",
  ok: Boolean(blender),
  detail: blender ? `${blender.version} (${blender.binary})` : "not found",
  fix: recipe
    ? `${recipe[0]} ${recipe[1].join(" ")}`
    : "Install Blender 4.2+ from https://www.blender.org/download/ or set ATOMIC_EXPLAINER_BLENDER to its binary.",
})

// Tripo: per-component image-to-3D generation.
let tripo = await hasKey("TRIPO_API_KEY", root)
if (!tripo && install && process.stdin.isTTY && !values.json) {
  const prompt = createInterface({ input: process.stdin, output: process.stderr })
  say("\n  Tripo generates component geometry from your reference photos.")
  say("  Create a key at https://platform.tripo3d.ai/ (API keys). Leave blank to skip for now.")
  const key = (await prompt.question("  TRIPO_API_KEY: ")).trim()
  prompt.close()
  if (key) {
    const envFile = path.join(root, ".env")
    const current = (await exists(envFile)) ? await readFile(envFile, "utf8") : ""
    if (/^\s*TRIPO_API_KEY\s*=.*$/m.test(current))
      await writeFile(envFile, current.replace(/^\s*TRIPO_API_KEY\s*=.*$/m, `TRIPO_API_KEY=${key}`))
    else await appendFile(envFile, `${current && !current.endsWith("\n") ? "\n" : ""}TRIPO_API_KEY=${key}\n`)
    tripo = true
  }
}
checks.push({
  name: "tripo key",
  ok: tripo,
  detail: tripo ? "TRIPO_API_KEY set" : "missing",
  fix: "Run npm run setup in your own terminal to enter it, or add TRIPO_API_KEY=... to .env.",
})

const ok = checks.every((c) => c.ok)
if (values.json)
  console.log(JSON.stringify({ ok, checks, notNeeded: ["OPENAI_API_KEY", "AI_GATEWAY_API_KEY"] }, null, 2))
else {
  say("\nAtomic Explainer setup")
  for (const c of checks)
    say(`  ${c.ok ? "✓" : "✗"} ${c.name.padEnd(13)} ${c.detail}${c.ok ? "" : `\n      fix: ${c.fix}`}`)
  say("  · OpenAI / AI Gateway keys are not needed when an agent builds the explainer.")
  say(ok ? "\nReady." : "\nNot ready: fix the items marked ✗, then run npm run setup again.")
}
process.exitCode = ok ? 0 : 1
