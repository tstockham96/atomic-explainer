import { it, expect } from "vitest"
import { readFileSync } from "node:fs"
import * as THREE from "three"
import { explainerSpecSchema } from "../src/spec/schema.ts"
import { prepareModel } from "../src/viewer/three/loadModel.ts"

function fixture() {
  const base = JSON.parse(readFileSync("public/chronograph.json", "utf8"))
  const scene = new THREE.Group()
  for (const name of ["surface", "helper"]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshStandardMaterial())
    mesh.name = name
    scene.add(mesh)
  }
  const spec = explainerSpecSchema.parse({
    ...base,
    scene3d: {
      kind: "gltf",
      url: "model.glb",
      requireCompleteMapping: true,
      parts: [{ componentId: base.components[0].id, node: "surface", offset: [0, 0, 3] }],
    },
  })
  if (spec.scene3d?.kind !== "gltf") throw new Error("fixture")
  return { spec, definition: spec.scene3d, loaded: { scene, animations: [] } }
}

it("rejects silent unmapped surfaces in a complete assembly", () => {
  const { spec, loaded } = fixture()
  expect(() => prepareModel(spec, loaded)).toThrow("Unmapped model surfaces: helper")
})

it("excludes only documented non-component helpers and preserves the actual part", () => {
  const { spec, definition, loaded } = fixture()
  definition.omittedNodes = [{ node: "helper", reason: "Source render occluder, not a physical component." }]
  const model = prepareModel(spec, loaded)
  expect(model.root.getObjectByName("helper")).toBeUndefined()
  expect(model.root.getObjectByName("surface")).toBeDefined()
  expect(model.parts).toHaveLength(1)
  model.dispose()
})

it("rejects an attempt to omit a mapped part", () => {
  const { spec, definition, loaded } = fixture()
  definition.omittedNodes = [{ node: "surface", reason: "Invalid omission" }]
  expect(() => prepareModel(spec, loaded)).toThrow("A mapped component cannot also be omitted")
})

it("keeps illustrative reverse surfaces untextured and never backs transmissive glass", () => {
  for (const glass of [false, true]) {
    const { spec, definition, loaded } = fixture()
    definition.omittedNodes = [{ node: "helper", reason: "Rendering helper" }]
    definition.parts[0]!.reverseSurface = {
      color: "#171a1c",
      roughness: 0.7,
      note: "Unverified reverse visualization.",
    }
    const original = loaded.scene.getObjectByName("surface") as THREE.Mesh
    const map = new THREE.Texture()
    original.material = new THREE.MeshPhysicalMaterial({ map, transmission: glass ? 1 : 0 })
    const model = prepareModel(spec, loaded)
    const reverse = model.root.getObjectByName("surface_unverified_reverse") as THREE.Mesh | undefined
    if (glass) expect(reverse).toBeUndefined()
    else {
      expect(reverse?.userData.evidence).toBe("unverified")
      const material = reverse!.material as THREE.MeshStandardMaterial
      expect(material.map).toBeNull()
      expect(material.side).toBe(THREE.BackSide)
    }
    expect((original.material as THREE.MeshPhysicalMaterial).map).toBe(map)
    model.dispose()
  }
})
