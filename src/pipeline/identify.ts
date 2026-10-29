import { generateObject } from "ai"
import { identitySchema, type Identity } from "../spec/schema.ts"
import type { ResolvedModels } from "./models.ts"
import { readPhoto } from "./photo.ts"
import { IDENTIFY_PROMPT } from "./prompts.ts"
import { languageModel } from "./providers.ts"

export async function identifyPhoto(photoPath: string, models: ResolvedModels): Promise<Identity> {
  const photo = await readPhoto(photoPath)
  const { object } = await generateObject({
    model: languageModel(models.vision, models.mode),
    schema: identitySchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: IDENTIFY_PROMPT },
          { type: "image", image: photo.bytes, mediaType: photo.mediaType },
        ],
      },
    ],
  })
  return object
}
