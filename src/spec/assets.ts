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
