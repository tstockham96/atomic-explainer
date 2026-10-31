import { spawnSync } from "node:child_process"
import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises"
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
  options: { templateDir?: string; assetRoot?: string; log?: (message: string) => void } = {},
) {
  const log = options.log ?? (() => undefined)
  const destination = path.resolve(outDir)
  const templateDir = options.templateDir ?? (await ensureViewerTemplate(packageRoot(), log))
  if (path.resolve(templateDir) === destination) {
    throw new Error("Refusing to render a site on top of the viewer template. Pick another --out directory.")
  }

  await mkdir(destination, { recursive: true })
  const referenced = [spec.heroImage, spec.explodedImage, ...spec.components.map(p => p.image), spec.frames?.rotation?.dir, spec.frames?.explode?.dir, spec.scene3d?.kind === 'gltf' ? spec.scene3d.url : undefined]
    .filter((value): value is string => Boolean(value) && !/^(https?:|data:)/.test(value!))
    .map(value => value.replace(/^\//, ''))
  // A new object must not silently ship every other specimen in the template.
  const include = (source: string) => {
    const relative = path.relative(templateDir, source).split(path.sep).join('/')
    if (!relative || relative === 'assets' || relative.startsWith('assets/')) return true
    if (!relative.includes('/') && /\.(html|js|css|woff2?|txt)$/.test(relative)) return true
    return referenced.some(file => relative === file || relative.startsWith(`${file}/`) || file.startsWith(`${relative}/`))
  }
  for (const name of await readdir(templateDir)) {
    const source = path.join(templateDir, name)
    if (include(source)) await cp(source, path.join(destination, name), { recursive: true, force: true, filter: include })
  }

  // Self-contained local GLB files travel with exported explainers.
  if (spec.scene3d?.kind === "gltf" && !/^(https?:|data:)/.test(spec.scene3d.url)) {
    const relative = spec.scene3d.url
    const inside = (root: string, file: string) => {
      const resolved = path.resolve(root, file)
      const fromRoot = path.relative(path.resolve(root), resolved)
      if (!fromRoot || fromRoot === ".." || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
        throw new Error("The 3D model path must stay inside the asset directory.")
      }
      return resolved
    }
    if (!relative.toLowerCase().endsWith(".glb")) throw new Error("Local 3D exports require a self-contained .glb file.")
    const target = inside(destination, relative)
    if (options.assetRoot) {
      const source = inside(options.assetRoot, relative)
      if (source !== target) {
        await mkdir(path.dirname(target), { recursive: true })
        await cp(source, target)
      }
    } else if (!existsSync(target)) {
      throw new Error("The 3D model is missing. Supply assetRoot or place the GLB in the viewer's public assets.")
    }
  }

  const indexPath = path.join(destination, "index.html")
  const html = await readFile(indexPath, "utf8")
  await writeFile(indexPath, injectSpec(html, spec))
  await writeFile(path.join(destination, "spec.json"), `${JSON.stringify(spec, null, 2)}\n`)
  log(`Wrote ${indexPath}`)
  return indexPath
}
