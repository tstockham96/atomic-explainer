import { openai } from "@ai-sdk/openai"
import type { ProviderMode } from "./models.ts"

export function languageModel(id: string, mode: ProviderMode) {
  if (mode === "gateway") return id
  return openai(id)
}

export function imageModel(id: string, mode: ProviderMode) {
  if (mode === "gateway") return id
  return openai.image(id)
}
