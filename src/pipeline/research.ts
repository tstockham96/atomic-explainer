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
      visualMode: "illustrated",
      artNote:
        "No layer images yet. Parts use a generic stand-in until the image step runs. Pass --skip-images to keep it this way.",
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
