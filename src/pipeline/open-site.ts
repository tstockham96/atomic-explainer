import { spawn } from "node:child_process"
import { access } from "node:fs/promises"
import path from "node:path"

/** Plain-JS static server run in a detached Node process, so the caller (a CLI run or
 * an agent's shell) can exit while the page stays up. It stops after 30 idle minutes. */
const SERVER = String.raw`
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = fs.realpathSync(process.argv[1]), idleMs = Number(process.argv[2])
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".hdr": "application/octet-stream", ".ktx2": "image/ktx2", ".mp4": "video/mp4" }
let timer
const idle = () => { clearTimeout(timer); timer = setTimeout(() => process.exit(0), idleMs) }
const server = http.createServer((req, res) => {
  idle()
  let file
  try {
    const name = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
    file = fs.realpathSync(path.join(root, name.endsWith("/") ? name + "index.html" : name))
  } catch { res.writeHead(404); return res.end("Not found") }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end("Forbidden") }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end("Not found") }
    res.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream" })
    res.end(data)
  })
})
server.listen(0, "127.0.0.1", () => { idle(); process.stdout.write("http://127.0.0.1:" + server.address().port + "/\n") })
`

export function shouldAutoOpen(env: NodeJS.ProcessEnv = process.env) {
  return !env.CI && !env.VITEST && env.ATOMIC_EXPLAINER_NO_OPEN !== "1"
}

/** Opens a URL in the user's default browser. Resolves false if no opener ran. */
export function openInBrowser(url: string) {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]]
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, args, { stdio: "ignore", detached: true })
    child.on("error", () => resolve(false))
    child.on("spawn", () => {
      child.unref()
      resolve(true)
    })
  })
}

/** Serves a built explainer folder on a free local port and opens it. A GLB scene cannot
 * load from file://, so a server is required. Returns the URL whether or not a browser opened. */
export async function openSite(dir: string, options: { idleMinutes?: number; open?: boolean } = {}) {
  const root = path.resolve(dir)
  await access(path.join(root, "index.html"))
  const child = spawn(process.execPath, ["-e", SERVER, root, String((options.idleMinutes ?? 30) * 60_000)], {
    detached: true,
    stdio: ["ignore", "pipe", "ignore"],
  })
  const url = await new Promise<string>((resolve, reject) => {
    let text = ""
    const timeout = setTimeout(() => reject(Error("The local preview server did not start.")), 10_000)
    child.on("error", reject)
    child.stdout!.on("data", (chunk: Buffer) => {
      text += chunk.toString()
      const line = text.split("\n")[0]!
      if (text.includes("\n")) {
        clearTimeout(timeout)
        resolve(line.trim() + "index.html")
      }
    })
    child.on("exit", (code) => reject(Error(`The local preview server exited (${code}).`)))
  })
  child.stdout!.destroy()
  child.removeAllListeners("exit")
  child.unref()
  const opened = options.open === false ? false : await openInBrowser(url)
  return { url, opened, pid: child.pid }
}
