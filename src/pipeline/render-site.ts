import { spawnSync } from "node:child_process"
import { cp, mkdir, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ExplodeSpec } from "../spec/schema.ts"

export const SPEC_MARKER = "window.__EXPLODE_SPEC__ = null;"

export function packageRoot() {
  let dir = path.dirname(fileURLToPath(import.meta.url))
  for (let hop = 0; hop < 6; hop += 1) {
    if (existsSync(path.join(dir, "package.json"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error("Could not find the explode package root.")
}

export function injectSpec(html: string, spec: ExplodeSpec) {
  if (!html.includes(SPEC_MARKER)) {
    throw new Error("Viewer template is missing the spec marker. Rebuild with npm run build:site.")
  }
  const payload = `window.__EXPLODE_SPEC__ = ${JSON.stringify(spec).replaceAll("<", "\\u003c")};`
  return html.replace(SPEC_MARKER, payload)
}

export async function ensureViewerTemplate(root = packageRoot(), log: (message: string) => void = () => undefined) {
  const indexPath = path.join(root, "dist-site", "index.html")
  if (existsSync(indexPath)) return path.join(root, "dist-site")

  log("Building the viewer template (first run)…")
  const vite = path.join(root, "node_modules", ".bin", "vite")
  const result = spawnSync(vite, ["build"], { cwd: root, stdio: "inherit" })
  if (result.status !== 0 || !existsSync(indexPath)) {
    throw new Error("The viewer template failed to build. Run npm run build:site and try again.")
  }
  return path.join(root, "dist-site")
}

export async function renderSite(
  spec: ExplodeSpec,
  outDir: string,
  options: { templateDir?: string; log?: (message: string) => void } = {},
) {
  const log = options.log ?? (() => undefined)
  const destination = path.resolve(outDir)
  const templateDir = options.templateDir ?? (await ensureViewerTemplate(packageRoot(), log))
  if (path.resolve(templateDir) === destination) {
    throw new Error("Refusing to render a site on top of the viewer template. Pick another --out directory.")
  }

  await mkdir(destination, { recursive: true })
  await cp(templateDir, destination, { recursive: true, force: true })

  const indexPath = path.join(destination, "index.html")
  const html = await readFile(indexPath, "utf8")
  await writeFile(indexPath, injectSpec(html, spec))
  await writeFile(path.join(destination, "spec.json"), `${JSON.stringify(spec, null, 2)}\n`)
  log(`Wrote ${indexPath}`)
  return indexPath
}
