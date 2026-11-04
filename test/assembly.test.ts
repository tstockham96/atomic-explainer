import { describe, it, expect, afterEach } from "vitest"
import { readFile, mkdtemp, writeFile, mkdir, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { assemblySchema } from "../src/spec/assembly.ts"
import { explainerSpecSchema } from "../src/spec/schema.ts"
import { buildAssembly, validateAssemblyEvidence } from "../src/authoring/assembly.ts"
import { assembleStudy } from "../src/pipeline/assemble.ts"
import { prepareModel } from "../src/viewer/three/loadModel.ts"
import { glbComponentIds } from "../src/evals/inventory.ts"
import { SPEC_MARKER } from "../src/pipeline/render-site.ts"
import { disposeObject } from "../src/viewer/three/model.ts"
const recipe = assemblySchema.parse(
  JSON.parse(await readFile("examples/iphone-18-pro/assembly.json", "utf8")),
)
const spec = explainerSpecSchema.parse(
  JSON.parse(await readFile("examples/iphone-18-pro/research.json", "utf8")),
)
const dirs: string[] = []
afterEach(async () => {
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true })
})

describe("agent-authored assemblies", () => {
  it("blocks missing parts, invented evidence and unresolved deferred construction", () => {
    expect(() => validateAssemblyEvidence(spec, { ...recipe, parts: recipe.parts.slice(1) })).toThrow(
      "missing researched components",
    )
    const invented = structuredClone(recipe)
    invented.parts[0]!.referenceIds = ["made-up"]
    expect(() => validateAssemblyEvidence(spec, invented)).toThrow("Unknown reference")
    const deferred = structuredClone(spec)
    deferred.understanding!.components[0]!.reconstruction.method = "defer"
    expect(() => validateAssemblyEvidence(deferred, recipe)).toThrow("deferred component")
  })
  it("rejects duplicate parts, unknown materials and impossible openings", () => {
    expect(assemblySchema.safeParse({ ...recipe, parts: [...recipe.parts, recipe.parts[0]] }).success).toBe(
      false,
    )
    const bad = structuredClone(recipe)
    bad.parts[0]!.shapes[0]!.material = "unknown"
    expect(assemblySchema.safeParse(bad).success).toBe(false)
    bad.parts[0]!.shapes[0]!.material = "glass"
    bad.parts[0]!.shapes[0]!.geometry = { kind: "cylinder", radius: 2, depth: 1, bore: 3 }
    expect(assemblySchema.safeParse(bad).success).toBe(false)
  })
  it("builds real open frame geometry and physically different glass/display surfaces", () => {
    const root = buildAssembly(recipe)
    const frame = root.getObjectByName("enclosure_0") as THREE.Mesh
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 100), new THREE.Vector3(0, 0, -1))
    expect(ray.intersectObject(frame)).toHaveLength(0)
    const glass = (root.getObjectByName("front-glass_0") as THREE.Mesh).material as THREE.MeshPhysicalMaterial
    const display = (root.getObjectByName("display_1") as THREE.Mesh).material as THREE.MeshPhysicalMaterial
    expect(glass.transmission).toBeGreaterThan(0.9)
    expect(display.transmission).toBe(0)
    const size = new THREE.Box3().setFromObject(frame).getSize(new THREE.Vector3())
    expect(size.x).toBeCloseTo(71.9, 3)
    expect(size.y).toBeCloseTo(150, 3)
    expect(size.z).toBeCloseTo(8.75, 3)
    disposeObject(root)
  })
  it("exports and reopens all parts, preserving provenance and optics without copying another study", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "atomic-explainer-assembly-"))
    dirs.push(root)
    const template = path.join(root, "template"),
      output = path.join(template, "phone")
    await mkdir(path.join(template, "murph-study"), { recursive: true })
    await writeFile(path.join(template, "murph-study", "private-reference.txt"), "unrelated")
    await writeFile(path.join(template, "index.html"), `<script>${SPEC_MARKER}</script>`)
    const built = await assembleStudy(
      "examples/iphone-18-pro/research.json",
      "examples/iphone-18-pro/assembly.json",
      output,
      template,
    )
    const bytes = await readFile(path.join(output, "assembly.glb"))
    expect(glbComponentIds(bytes).sort()).toEqual(spec.components.map((p) => p.id).sort())
    expect(await readdir(output)).not.toContain("murph-study")
    expect(await readdir(output)).not.toContain("phone")
    const loaded = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    )
    const glass = loaded.scene.getObjectByName("front-glass")!
    expect(glass.userData.fidelity).toBe("approximate")
    const mesh = loaded.scene.getObjectByName("front-glass_0") as THREE.Mesh
    expect((mesh.material as THREE.MeshPhysicalMaterial).transmission).toBeGreaterThan(0.9)
    const model = prepareModel(built, loaded)
    expect(model.parts).toHaveLength(12)
    expect(model.parts.every((p) => new THREE.Box3().setFromObject(p.group).isEmpty() === false)).toBe(true)
    expect(JSON.parse(await readFile(path.join(output, "assembly-review.json"), "utf8")).status).toBe(
      "unreviewed",
    )
    model.dispose()
  })
})
