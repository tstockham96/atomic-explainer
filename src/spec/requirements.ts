import { z } from 'zod'
/** Keep this separate from asset-specific specs: an imported shell cannot redefine
 * the research scope simply by listing only the surfaces it happens to contain. */
export const assemblyRequirementsSchema = z.object({
  version: z.literal(1), identity: z.string().min(1), objective: z.string().min(1),
  components: z.array(z.object({
    id: z.string().min(1), name: z.string().min(1), system: z.string().min(1),
    purpose: z.string().min(1), sourceUrls: z.array(z.string().url()).min(1),
  })).min(1),
}).superRefine((value, context) => {
  if (new Set(value.components.map(c => c.id)).size !== value.components.length) context.addIssue({code:'custom',message:'Requirement component IDs must be unique.'})
})
export type AssemblyRequirements = z.infer<typeof assemblyRequirementsSchema>
