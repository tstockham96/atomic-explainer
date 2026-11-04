import { z } from "zod"

const nonempty = z.string().trim().min(1)
/** A research handoff records what was actually inspected, not just a URL list. */
export const assetPlanSchema = z.object({
  version: z.literal(1),
  identity: nonempty,
  searches: z
    .array(z.object({ query: nonempty, searchedAt: z.string().datetime(), outcome: nonempty }))
    .min(1),
  candidates: z.array(
    z.object({
      id: nonempty,
      url: z.string().url(),
      exactVariant: z.boolean(),
      coverage: z.enum(["exterior", "component", "assembly", "unknown"]),
      license: z.object({
        name: nonempty,
        url: z.string().url(),
        redistribution: z.enum(["allowed", "restricted", "unknown"]),
      }),
      decision: z.enum(["selected", "rejected", "needs-inspection"]),
      reason: nonempty,
    }),
  ),
  observations: z.array(
    z.object({
      id: nonempty,
      referenceId: nonempty,
      componentId: nonempty,
      view: z.enum(["front", "left", "back", "right", "oblique", "assembled", "disassembled"]),
      imagePath: nonempty,
      notes: nonempty,
      origin: z.enum(["photograph", "drawing", "generated"]),
    }),
  ),
  tasks: z
    .array(
      z.object({
        componentId: nonempty,
        observationIds: z.array(nonempty).min(1),
        strategy: z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("source"), candidateId: nonempty, modelPath: nonempty }),
          z.object({
            kind: z.literal("multiview"),
            views: z
              .array(z.object({ view: z.enum(["front", "left", "back", "right"]), observationId: nonempty }))
              .min(2)
              .max(4),
          }),
          z.object({
            kind: z.literal("text"),
            prompt: nonempty.max(1024),
            negativePrompt: nonempty.max(255).optional(),
          }),
          z.object({ kind: z.literal("defer"), reason: nonempty }),
        ]),
      }),
    )
    .min(1),
})
export type AssetPlan = z.infer<typeof assetPlanSchema>

/** Views of the whole object every reconstruction needs before geometry is authored. */
export const REQUIRED_REFERENCE_VIEWS = ["front", "back", "side", "oblique"] as const
export const MIN_INSPECTED_PHOTOGRAPHS = 8

/** Flags a plan built from too few inspected photographs. One front product shot cannot
 * establish case sides, thickness, bracelet/strap construction or the back. */
export function referenceCoverage(plan: AssetPlan) {
  const photos = plan.observations.filter((o) => o.origin === "photograph")
  const images = new Set(photos.map((o) => o.imagePath))
  const views = new Set(
    photos.map((o) =>
      o.view === "left" || o.view === "right" ? "side" : o.view === "assembled" ? "oblique" : o.view,
    ),
  )
  const missingViews = REQUIRED_REFERENCE_VIEWS.filter((view) => !views.has(view))
  const issues: string[] = []
  if (images.size < MIN_INSPECTED_PHOTOGRAPHS)
    issues.push(
      `Only ${images.size} inspected photograph${images.size === 1 ? "" : "s"}; inspect at least ${MIN_INSPECTED_PHOTOGRAPHS} of the exact reference.`,
    )
  if (missingViews.length) issues.push(`No inspected photograph of the ${missingViews.join(", ")} view.`)
  const shared = new Map<string, number>()
  for (const task of plan.tasks) {
    const key = [...task.observationIds].sort().join(",")
    shared.set(key, (shared.get(key) ?? 0) + 1)
  }
  const largest = Math.max(0, ...shared.values())
  if (plan.tasks.length >= 4 && largest === plan.tasks.length)
    issues.push(
      `All ${plan.tasks.length} components cite the same observations; each needs its own evidence.`,
    )
  return { photographs: images.size, views: [...views].sort(), missingViews, issues, ok: issues.length === 0 }
}
