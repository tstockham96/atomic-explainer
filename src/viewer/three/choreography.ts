import { inspectionTurn } from "./optics.ts"
import { inspectionDistance } from "./inspection.ts"
import * as THREE from "three"
import { modelStops, stopParts, stopBounds } from "./model.ts"
import type { ExplodableModel } from "./model.ts"
import { sampleScene, ease } from "./timeline.ts"

const up = new THREE.Vector3(0, 1, 0)
const hero = new THREE.Vector3(0.38, 0.23, 1).normalize()
const overview = new THREE.Vector3(1, 0.48, 0.55).normalize()
export const STORY_FOV = 32

export function corners(box: THREE.Box3) {
  return [0, 1, 2, 3, 4, 5, 6, 7].map(
    (bits) =>
      new THREE.Vector3(
        bits & 1 ? box.max.x : box.min.x,
        bits & 2 ? box.max.y : box.min.y,
        bits & 4 ? box.max.z : box.min.z,
      ),
  )
}

/** Frame actual geometry in camera space; portrait and landscape use the same scene. */
export function frameBox(
  box: THREE.Box3,
  direction: THREE.Vector3,
  aspect: number,
  coverage: [number, number] = [0.83, 0.69],
) {
  const backward = direction.clone().normalize()
  const right = new THREE.Vector3().crossVectors(up, backward).normalize()
  const cameraUp = new THREE.Vector3().crossVectors(backward, right).normalize()
  const target = box.getCenter(new THREE.Vector3())
  const tangent = Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2))
  let distance = 1
  for (const point of corners(box)) {
    point.sub(target)
    distance = Math.max(
      distance,
      point.dot(backward) +
        Math.max(
          Math.abs(point.dot(right)) / (tangent * aspect * coverage[0]),
          Math.abs(point.dot(cameraUp)) / (tangent * coverage[1]),
        ),
    )
  }
  return {
    position: target.clone().addScaledVector(backward, distance),
    target,
    right,
    up: cameraUp,
    distance,
  }
}

export function poseModel(model: ExplodableModel, progress: number) {
  const sample = sampleScene(progress, modelStops(model).length)
  // One assembled turn; parts retain their orientation when the assembly opens.
  model.root.rotation.set(-0.04, sample.turn * Math.PI * 2, -0.1)
  model.root.position.set(0, 0, 0)
  for (const part of model.parts) {
    part.group.position.lerpVectors(part.home, part.opened, sample.separation)
    part.group.quaternion.copy(part.orientation)
  }
  model.root.updateMatrixWorld(true)
  // Measure the unparked assembly so departing context never pushes the camera back.
  model.overviewBounds = new THREE.Box3().setFromObject(model.root)
  if (sample.index >= 0 && sample.focus > 0) {
    const clearance = model.overviewBounds.getSize(new THREE.Vector3()).length() * 2.5
    const selected = new Set(stopParts(model, sample.index))
    const gap = modelStops(model)[sample.index]?.gap
    if (gap !== undefined && selected.size > 1) {
      // Pack an authored set along its existing separation axis. Positions are
      // derived afresh from opened poses each frame, so reverse scroll retraces
      // exactly and the original assembly inventory/offsets are untouched.
      const members = [...selected],
        axis = members.at(-1)!.opened.clone().sub(members[0]!.opened).normalize()
      if (axis.lengthSq() < 0.5) axis.set(1, 0, 0)
      const worldAxis = axis.clone().applyQuaternion(model.root.quaternion)
      const spans = members
        .map((part) => {
          const points = corners(new THREE.Box3().setFromObject(part.group)).map((p) => p.dot(worldAxis))
          const lo = Math.min(...points),
            hi = Math.max(...points)
          return { part, center: (lo + hi) / 2, width: hi - lo }
        })
        .sort((a, b) => a.center - b.center)
      const length = spans.reduce((sum, s) => sum + s.width, 0) + gap * (spans.length - 1)
      let cursor = spans.reduce((sum, s) => sum + s.center, 0) / spans.length - length / 2
      for (const s of spans) {
        s.part.group.position.addScaledVector(axis, (cursor + s.width / 2 - s.center) * sample.focus)
        cursor += s.width + gap
      }
    }
    for (let i = 0; i < model.parts.length; i++) {
      if (!selected.has(model.parts[i]!)) model.parts[i]!.group.position.y -= clearance * sample.focus
    }
    model.root.updateMatrixWorld(true)
  }
  return sample
}

export function cameraShot(model: ExplodableModel, progress: number, aspect: number) {
  const sample = sampleScene(progress, modelStops(model).length)
  const narrow = aspect < 0.85
  const direction = hero.clone().lerp(overview, ease(sample.separation)).normalize()
  const bounds = model.overviewBounds ?? new THREE.Box3().setFromObject(model.root)
  const shot = frameBox(
    bounds,
    direction,
    aspect,
    narrow
      ? [0.85, THREE.MathUtils.lerp(0.4, 0.55, sample.separation)]
      : [0.85, THREE.MathUtils.lerp(0.52, 0.68, sample.separation)],
  )
  const lift = shot.up
    .clone()
    .multiplyScalar(
      -shot.distance * Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2)) * 0.16 * (1 - sample.separation),
    )
  shot.target.add(lift)
  shot.position.add(lift)
  const selected = stopParts(model, sample.index)[0]
  if (selected && sample.focus > 0) {
    const partBox = stopBounds(model, sample.index)
    const from = new THREE.Vector3(...(selected.shot?.from ?? [0.55, 0.15, 1]))
    const orbit = from.normalize().applyAxisAngle(up, inspectionTurn(sample.local, 0.28, 0.72))
    const coverage: [number, number] = narrow ? [0.76, 0.39] : [0.49, 0.72]
    const focus = frameBox(partBox, orbit, aspect, coverage)
    focus.distance = Math.max(selected.distance, inspectionDistance(partBox, STORY_FOV, aspect, coverage))
    focus.position.copy(focus.target).addScaledVector(orbit, focus.distance)
    const tangent = Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2))
    const offset = narrow
      ? focus.up.multiplyScalar(-focus.distance * tangent * 0.35)
      : focus.right.multiplyScalar(focus.distance * tangent * aspect * 0.37)
    focus.target.add(offset)
    focus.position.add(offset)
    shot.position.lerp(focus.position, sample.focus)
    shot.target.lerp(focus.target, sample.focus)
  }
  return shot
}
