import { generateObject } from "ai"
import { explodeSpecSchema, researchedSpecSchema, type ExplodeSpec, type Identity } from "../spec/schema.ts"
import { normalizeSpec } from "../spec/normalize.ts"
import type { ResolvedModels } from "./models.ts"
import { RESEARCH_PROMPT } from "./prompts.ts"
import { languageModel } from "./providers.ts"

export async function researchItem(identity: Identity, models: ResolvedModels): Promise<ExplodeSpec> {
  const { object } = await generateObject({
    model: languageModel(models.research, models.mode),
    schema: researchedSpecSchema,
    prompt: `${RESEARCH_PROMPT}

Object:
${JSON.stringify(identity, null, 2)}`,
  })

  return normalizeSpec(
    explodeSpecSchema.parse({
      ...object,
      visualMode: "pending",
      artNote:
        "No photographs yet. The image step edits the uploaded photo into a hero, an exploded view, and one cutout per part.",
      identity: {
        confidence: identity.confidence,
        notes: identity.notes,
      },
      generation: {
        researchModel: models.research,
        warnings: [],
      },
    }),
  )
}
