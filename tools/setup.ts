/** One-time setup for building explainers with a coding agent (Claude Code or similar).
 *
 *   npm run setup             check, install what can be installed, ask for the Tripo key
 *   npm run setup -- --check  report only; exit 1 if something the agent needs is missing
 *   npm run setup -- --json   machine-readable report for the agent
 *
 * An agent runs this itself; the person never has to. When the Tripo key is missing and
 * there is no terminal to type into, setup opens the Tripo key page and a native password
 * window, and writes the answer to .env, so the key never passes through the agent.
 * Tripo is optional: without it the agent models visible parts in Blender.
 * The agent does its own research and writing, so no OpenAI or AI Gateway key is needed. */
import { chromium } from "@playwright/test"
import { spawn } from "node:child_process"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { parseArgs } from "node:util"
import { openInBrowser, shouldAutoOpen } from "../src/pipeline/open-site.ts"
import {
  askSecretInWindow,
  blenderInstallCommand,
  exists,
  findBlender,
  hasKey,
  writeEnvKey,
} from "../src/pipeline/tools.ts"

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

type Check = { name: string; ok: boolean; detail: string; fix?: string; optional?: boolean }
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

// Tripo: per-component image-to-3D generation. Optional; Blender covers modeling without it.
const TRIPO_KEYS = "https://platform.tripo3d.ai/"
let tripo = await hasKey("TRIPO_API_KEY", root)
if (!tripo && install) {
  let key: string | undefined
  if (process.stdin.isTTY && !values.json) {
    const prompt = createInterface({ input: process.stdin, output: process.stderr })
    say("\n  Tripo generates component geometry from reference photos (optional).")
    say(`  Create a key at ${TRIPO_KEYS} (API keys). Leave blank to skip and model in Blender.`)
    key = (await prompt.question("  TRIPO_API_KEY: ")).trim()
    prompt.close()
  } else if (shouldAutoOpen()) {
    say("  Opening the Tripo key page and a password window for TRIPO_API_KEY…")
    openInBrowser(TRIPO_KEYS)
    key = await askSecretInWindow(
      "Paste your Tripo API key (platform.tripo3d.ai, API Keys; that page just opened in your browser). " +
        "It is saved to .env in this checkout and is not shown to the agent. Skip to model in Blender only.",
    )
  }
  if (key) {
    await writeEnvKey("TRIPO_API_KEY", key, root)
    tripo = true
  }
}
checks.push({
  name: "tripo key",
  ok: tripo,
  optional: true,
  detail: tripo ? "TRIPO_API_KEY set" : "not set (optional: visible parts are modeled in Blender)",
  fix: "Run npm run setup again to reopen the key window, or add TRIPO_API_KEY=... to .env.",
})

const ok = checks.every((c) => c.ok || c.optional)
if (values.json)
  console.log(JSON.stringify({ ok, checks, notNeeded: ["OPENAI_API_KEY", "AI_GATEWAY_API_KEY"] }, null, 2))
else {
  say("\nAtomic Explainer setup")
  for (const c of checks)
    say(
      `  ${c.ok ? "✓" : c.optional ? "○" : "✗"} ${c.name.padEnd(13)} ${c.detail}${c.ok ? "" : `\n      fix: ${c.fix}`}`,
    )
  say("  · OpenAI / AI Gateway keys are not needed when an agent builds the explainer.")
  say(ok ? "\nReady." : "\nNot ready: fix the items marked ✗, then run npm run setup again.")
}
process.exitCode = ok ? 0 : 1
