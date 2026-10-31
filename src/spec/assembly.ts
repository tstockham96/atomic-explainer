import { z } from 'zod'

const vector = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()])
const positive = z.number().positive().max(10000)
const shape = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('plate'), width: positive, height: positive, depth: positive, radius: z.number().nonnegative(), rim: positive.optional() }),
  z.object({ kind: z.literal('cylinder'), radius: positive, depth: positive, bore: positive.optional() }),
])
const material = z.object({
  color: z.string().regex(/^#[0-9a-f]{6}$/i), metalness: z.number().min(0).max(1), roughness: z.number().min(0).max(1),
  transmission: z.number().min(0).max(1).default(0), ior: z.number().min(1).max(2.5).default(1.5),
  thickness: z.number().nonnegative().default(0), clearcoat: z.number().min(0).max(1).default(0),
})
/** An agent-authored construction recipe, never a claim of automatic reconstruction. */
export const assemblySchema = z.object({
  version: z.literal(1), units: z.literal('mm'),
  materials: z.record(z.string(), material),
  parts: z.array(z.object({
    componentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    fidelity: z.enum(['schematic', 'approximate', 'reference-matched']),
    referenceIds: z.array(z.string()).min(1), limitations: z.array(z.string().min(1)).min(1),
    offset: vector,
    shapes: z.array(z.object({ geometry: shape, material: z.string(), position: vector, rotation: vector.optional() })).min(1).max(256),
  })).min(1).max(64),
}).superRefine((recipe, ctx) => {
  if (recipe.parts.reduce((n, p) => n + p.shapes.length, 0) > 1024) ctx.addIssue({ code: "custom", message: "Assembly exceeds the 1024 shape budget" })
  const ids = new Set<string>()
  recipe.parts.forEach((part, i) => {
    if (ids.has(part.componentId)) ctx.addIssue({ code: 'custom', path: ['parts', i], message: 'Duplicate component ID' })
    ids.add(part.componentId)
    part.shapes.forEach((mesh, j) => {
      const g = mesh.geometry, at = ['parts', i, 'shapes', j]
      if (!Object.hasOwn(recipe.materials, mesh.material)) ctx.addIssue({ code: 'custom', path: at, message: 'Unknown material' })
      if (g.kind === 'plate' && (g.radius > Math.min(g.width, g.height) / 2 || (g.rim !== undefined && (g.rim * 2 >= Math.min(g.width, g.height) || g.rim > g.radius)))) ctx.addIssue({ code: 'custom', path: at, message: 'Invalid rounded plate or opening dimensions' })
      if (g.kind === 'cylinder' && g.bore !== undefined && g.bore >= g.radius) ctx.addIssue({ code: 'custom', path: at, message: 'Bore must be smaller than the outer radius' })
    })
  })
})
export type AssemblyRecipe = z.infer<typeof assemblySchema>
