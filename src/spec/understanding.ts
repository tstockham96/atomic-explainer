import { z } from 'zod'

/** Evidence and construction decisions precede geometry; legacy specs may omit this. */
export const understandingSchema = z.object({
  version: z.literal(1),
  identityScope: z.string().min(1),
  learningGoals: z.array(z.string().min(1)).min(1),
  references: z.array(z.object({
    id: z.string().min(1), title: z.string().min(1), url: z.string().url(),
    kind: z.enum(['specification', 'photograph', 'manual', 'teardown', 'manufacturing', 'mechanism']),
    scope: z.enum(['exact-model', 'family', 'general']),
    observation: z.string().min(1),
    limitations: z.string().min(1),
  })).min(1),
  components: z.array(z.object({
    componentId: z.string().min(1),
    function: z.string().min(1),
    claims: z.array(z.object({
      statement: z.string().min(1),
      basis: z.enum(['documented', 'observed', 'inferred', 'unknown']),
      referenceIds: z.array(z.string()),
    })).min(1),
    reconstruction: z.object({
      method: z.enum(['exterior-draft', 'model-part', 'source-model', 'generate-part', 'defer']),
      referenceIds: z.array(z.string()),
      shape: z.string().min(1),
      materialBehavior: z.string().min(1),
      hiddenSurfaces: z.string().min(1),
      exclude: z.array(z.string().min(1)),
      acceptanceChecks: z.array(z.string().min(1)).min(1),
    }),
    unknowns: z.array(z.string().min(1)),
  })).min(1),
  relationships: z.array(z.object({
    from: z.string().min(1), to: z.string().min(1),
    relationship: z.string().min(1),
    basis: z.enum(['documented', 'observed', 'inferred']),
    referenceIds: z.array(z.string()),
  })),
  unresolved: z.array(z.string().min(1)),
})
export type ObjectUnderstanding = z.infer<typeof understandingSchema>
