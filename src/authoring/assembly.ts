import * as THREE from "three"
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js"
import { understandingIssues } from "../pipeline/understanding.ts"
import type { AssemblyRecipe } from "../spec/assembly.ts"
import type { ExplodeSpec } from "../spec/schema.ts"

function rounded(width: number, height: number, radius: number) {
  const p = new THREE.Shape(),
    x = -width / 2,
    y = -height / 2,
    r = radius
  p.moveTo(x + r, y)
  p.lineTo(x + width - r, y)
  p.quadraticCurveTo(x + width, y, x + width, y + r)
  p.lineTo(x + width, y + height - r)
  p.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  p.lineTo(x + r, y + height)
  p.quadraticCurveTo(x, y + height, x, y + height - r)
  p.lineTo(x, y + r)
  p.quadraticCurveTo(x, y, x + r, y)
  return p
}

export function validateAssemblyEvidence(spec: ExplodeSpec, recipe: AssemblyRecipe) {
  if (!spec.understanding) throw Error("Research is required before building an assembly.")
  const issues = understandingIssues(spec)
  if (issues.length) throw Error(issues.join(" "))
  if (new Set(spec.components.map((p) => p.id)).size !== spec.components.length)
    throw Error("Research contains duplicate component IDs.")
  const known = new Set(spec.components.map((p) => p.id)),
    refs = new Set(spec.understanding.references.map((r) => r.id))
  for (const part of recipe.parts) {
    if (!known.has(part.componentId)) throw Error(`Unknown component: ${part.componentId}`)
    for (const ref of part.referenceIds) if (!refs.has(ref)) throw Error(`Unknown reference: ${ref}`)
    const plan = spec.understanding.components.find((p) => p.componentId === part.componentId)
    if (!plan) throw Error(`Missing construction research: ${part.componentId}`)
    if (plan.reconstruction.method === "defer")
      throw Error(`Resolve or explicitly scope the deferred component before building: ${part.componentId}`)
  }
  const present = new Set(recipe.parts.map((p) => p.componentId))
  const missing = spec.components.filter((p) => !present.has(p.id)).map((p) => p.id)
  if (missing.length) throw Error(`Assembly is missing researched components: ${missing.join(", ")}`)
}

/** Shared dimensional authoring. No product names, inferred textures or painted lighting. */
export function buildAssembly(recipe: AssemblyRecipe) {
  const root = new THREE.Group()
  root.name = "assembly"
  const materials = new Map(
    Object.entries(recipe.materials).map(([name, settings]) => {
      const m = new THREE.MeshPhysicalMaterial({ ...settings, color: settings.color })
      m.name = name
      return [name, m]
    }),
  )
  const geometries = new Map<string, THREE.BufferGeometry>()
  for (const part of recipe.parts) {
    const group = new THREE.Group()
    group.name = part.componentId
    group.userData = {
      componentId: part.componentId,
      fidelity: part.fidelity,
      referenceIds: part.referenceIds,
      limitations: part.limitations,
    }
    for (const [index, entry] of part.shapes.entries()) {
      const g = entry.geometry
      let profile: THREE.Shape
      if (g.kind === "plate") {
        profile = rounded(g.width, g.height, g.radius)
        if (g.rim)
          profile.holes.push(
            rounded(g.width - g.rim * 2, g.height - g.rim * 2, Math.max(0, g.radius - g.rim)),
          )
      } else {
        profile = new THREE.Shape()
        profile.absarc(0, 0, g.radius, 0, Math.PI * 2, false)
        if (g.bore) {
          const hole = new THREE.Path()
          hole.absarc(0, 0, g.bore, 0, Math.PI * 2, true)
          profile.holes.push(hole)
        }
      }
      const bevel = Math.min(g.depth * 0.12, 0.08)
      // Bevel stays inside the declared depth, so flush layers do not intersect.
      const geometry = new THREE.ExtrudeGeometry(profile, {
        depth: g.depth - 2 * bevel,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0,
        bevelThickness: bevel,
        curveSegments: 24,
      })
      geometry.translate(0, 0, -g.depth / 2 + bevel)
      const key = JSON.stringify(g)
      if (!geometries.has(key)) geometries.set(key, mergeVertices(geometry))
      geometry.dispose()
      const mesh = new THREE.Mesh(geometries.get(key), materials.get(entry.material))
      mesh.name = `${part.componentId}_${index}`
      mesh.position.fromArray(entry.position)
      if (entry.rotation) mesh.rotation.set(...entry.rotation)
      group.add(mesh)
    }
    root.add(group)
  }
  root.updateMatrixWorld(true)
  return root
}
