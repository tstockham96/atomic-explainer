/** Runs a Blender Python script headless with the Blender that `npm run setup` found.
 *
 *   npm run blender -- tools/my-object/model.py -- --out examples/my-object/models/model.glb
 *
 * Arguments after the second `--` reach the script via sys.argv after "--". */
import { spawn } from "node:child_process"
import { findBlender } from "../src/pipeline/tools.ts"

const [script, ...rest] = process.argv.slice(2)
if (!script) {
  console.error("Usage: npm run blender -- <script.py> [-- script args]")
  process.exit(1)
}
const blender = await findBlender()
if (!blender) {
  console.error("Blender not found. Run npm run setup.")
  process.exit(1)
}
const scriptArgs = rest[0] === "--" ? rest.slice(1) : rest
const child = spawn(
  blender.binary,
  ["--background", "--factory-startup", "--python-exit-code", "1", "--python", script, "--", ...scriptArgs],
  { stdio: "inherit" },
)
child.on("exit", (code) => process.exit(code ?? 1))
