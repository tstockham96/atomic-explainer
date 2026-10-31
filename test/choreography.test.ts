import { beforeAll, afterAll, describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import * as THREE from "three"
import { explodeSpecSchema } from "../src/spec/schema.ts"
import { prepareModel } from "../src/viewer/three/loadModel.ts"
import type { ExplodableModel } from "../src/viewer/three/model.ts"
import { cameraShot, poseModel, corners, STORY_FOV } from "../src/viewer/three/choreography.ts"
import { THREE_TIMING } from "../src/viewer/three/timeline.ts"
import { loadWatchGeometry } from "./helpers/load-watch.ts"

const spec = explodeSpecSchema.parse(JSON.parse(readFileSync("public/chronograph.json", "utf8")))
let model: ExplodableModel
beforeAll(async () => { model = prepareModel(spec, await loadWatchGeometry()) })
afterAll(() => model?.dispose())
function rect(box: THREE.Box3, camera: THREE.Camera) {
  const points = corners(box).map((point) => point.project(camera))
  return { left: Math.min(...points.map((p) => p.x)), right: Math.max(...points.map((p) => p.x)), top: Math.max(...points.map((p) => p.y)), bottom: Math.min(...points.map((p) => p.y)) }
}
function cameraAt(progress: number, aspect: number) {
  poseModel(model, progress)
  const shot = cameraShot(model, progress, aspect)
  const camera = new THREE.PerspectiveCamera(STORY_FOV, aspect, 0.05, 300)
  camera.position.copy(shot.position); camera.lookAt(shot.target); camera.updateMatrixWorld()
  return camera
}

describe("production asset and framing", () => {
  it("maps all source meshes to six independently explorable assemblies", () => {
    expect(model.parts.map((p) => p.id)).toEqual(["glass", "hands", "dial", "bezel", "backplate", "bracelet"])
    let mapped = 0, total = 0
    for (const part of model.parts) part.group.traverse((node) => { if (node instanceof THREE.Mesh) mapped++ })
    model.root.traverse((node) => { if (node instanceof THREE.Mesh) total++ })
    expect(mapped).toBe(total)
    expect(total).toBeGreaterThan(12)
  })

  it("plays the source second-hand animation after regrouping", () => {
    const hand = model.root.getObjectByName("Hand_Seconds")!
    model.animate(0)
    const start = hand.quaternion.clone()
    model.animate(1.1)
    expect(start.angleTo(hand.quaternion)).toBeGreaterThan(0.05)
  })

  it.each([16 / 9, 390 / 844])("keeps every exploded assembly separate on screen at aspect %s", (aspect) => {
    const camera = cameraAt(THREE_TIMING.inspect, aspect)
    const boxes = model.parts.map((part) => rect(new THREE.Box3().setFromObject(part.group), camera))
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]!
      expect(box.left).toBeGreaterThan(-0.91)
      expect(box.right).toBeLessThan(0.91)
      expect(box.top).toBeLessThan(0.85)
      expect(box.bottom).toBeGreaterThan(-0.85)
      for (let j = i + 1; j < boxes.length; j++) {
        const other = boxes[j]!
        const overlap = Math.min(box.right, other.right) - Math.max(box.left, other.left) > 0 && Math.min(box.top, other.top) - Math.max(box.bottom, other.bottom) > 0
        expect(overlap, `${model.parts[i]!.id} overlaps ${model.parts[j]!.id}`).toBe(false)
      }
    }
  })

  it.each([16 / 9, 390 / 844])("frames each close-up clear of caption space at aspect %s", (aspect) => {
    model.parts.forEach((part, i) => {
      const progress = THREE_TIMING.inspect + (i + 0.5) / model.parts.length * (THREE_TIMING.reassemble - THREE_TIMING.inspect)
      const camera = cameraAt(progress, aspect)
      const box = rect(new THREE.Box3().setFromObject(part.group), camera)
      expect(box.left).toBeGreaterThan(-0.98)
      expect(box.right).toBeLessThan(aspect > 0.85 ? 0.25 : 0.98)
      expect(box.top).toBeLessThan(0.98)
      expect(box.bottom).toBeGreaterThan(aspect < 0.85 ? -0.15 : -0.98)
    })
  })

  it("restores assembled transforms exactly when scrolling backward", () => {
    poseModel(model, 0)
    const matrices = model.parts.map((p) => p.group.matrixWorld.clone())
    poseModel(model, 1); poseModel(model, 0)
    model.parts.forEach((p, i) => expect(p.group.matrixWorld.elements).toEqual(matrices[i]!.elements))
  })

  it('seats every component again before the anatomy and reverses without drift', () => {
    poseModel(model, 0)
    const homes = model.parts.map(p => p.group.position.clone())
    for(const progress of [.43, .77, .91, .96, 1, .96, .91, .77, .43, 0]) {
      poseModel(model, progress)
      if(progress === 0 || progress === 1) model.parts.forEach((p,i) => {
        expect(p.group.position.distanceTo(homes[i]!)).toBeLessThan(1e-9)
        expect(p.group.visible).toBe(true)
      })
    }
  })

  it('frames the entire turn of every component, including opaque parts',()=>{
    for(const aspect of [16/9,390/844])for(let i=0;i<model.parts.length;i++){
      const directions:THREE.Vector3[]=[]
      for(const local of [.28,.39,.5,.61,.72]){
        const p=THREE_TIMING.inspect+(i+local)/model.parts.length*(THREE_TIMING.reassemble-THREE_TIMING.inspect)
        const camera=cameraAt(p,aspect),box=new THREE.Box3().setFromObject(model.parts[i]!.group),r=rect(box,camera)
        expect(Math.max(Math.abs(r.left),Math.abs(r.right),Math.abs(r.top),Math.abs(r.bottom))).toBeLessThan(1)
        directions.push(camera.getWorldDirection(new THREE.Vector3()))
      }
      expect(directions[0]!.distanceTo(directions[4]!)).toBeLessThan(1e-6)
      expect(directions[0]!.dot(directions[2]!)).toBeLessThan(-.5)
    }
  })

  it('moves context outside the close-up without hiding parts or changing their materials', () => {
    const materials = new Map<THREE.Material, [number, boolean, boolean]>()
    model.root.traverse(node => {
      if (node instanceof THREE.Mesh) for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.set(material, [material.opacity, material.transparent, material.alphaHash])
      }
    })
    for (let i = 0; i < model.parts.length; i++) {
      const p = THREE_TIMING.inspect + (i + .5) / model.parts.length * (THREE_TIMING.reassemble - THREE_TIMING.inspect)
      const camera = cameraAt(p, 16 / 9)
      for (let j = 0; j < model.parts.length; j++) {
        const part = model.parts[j]!
        expect(part.group.visible).toBe(true)
        if (i !== j) {
          // During a full orbit, parked parts may be behind the camera. Projected
          // AABB corners spanning w=0 do not describe their visible screen area.
          const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse))
          expect(frustum.intersectsBox(new THREE.Box3().setFromObject(part.group)),`selected ${model.parts[i]!.id}, context ${part.id}`).toBe(false)
        }
      }
    }
    for (const [material, original] of materials) expect([material.opacity, material.transparent, material.alphaHash]).toEqual(original)
  })
})
