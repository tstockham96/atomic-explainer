export type ProviderMode = "gateway" | "openai"

export interface ResolvedModels {
  mode: ProviderMode
  vision: string
  research: string
  image: string
}

export type ModelResolution = ResolvedModels | { error: string }

const GATEWAY_DEFAULTS = {
  vision: "google/gemini-2.5-flash",
  research: "anthropic/claude-sonnet-4.5",
  image: "google/gemini-2.5-flash-image",
}

const OPENAI_DEFAULTS = {
  vision: "gpt-4o",
  research: "gpt-4o",
  image: "gpt-image-1",
}

function stripProvider(value: string | undefined, fallback: string) {
  const raw = value?.trim()
  if (!raw) return fallback
  const parts = raw.split("/")
  return parts.length > 1 ? (parts.at(-1) ?? fallback) : raw
}

export function resolveModels(env: NodeJS.ProcessEnv = process.env): ModelResolution {
  const gateway = env.AI_GATEWAY_API_KEY?.trim()
  const openai = env.OPENAI_API_KEY?.trim()

  if (!gateway && !openai) {
    return {
      error:
        "No model credentials. Set AI_GATEWAY_API_KEY for Vercel AI Gateway, or OPENAI_API_KEY for direct OpenAI. See .env.example.",
    }
  }

  if (gateway) {
    return {
      mode: "gateway",
      vision: env.EXPLODE_VISION_MODEL?.trim() || GATEWAY_DEFAULTS.vision,
      research: env.EXPLODE_RESEARCH_MODEL?.trim() || GATEWAY_DEFAULTS.research,
      image: env.EXPLODE_IMAGE_MODEL?.trim() || GATEWAY_DEFAULTS.image,
    }
  }

  return {
    mode: "openai",
    vision: stripProvider(env.EXPLODE_VISION_MODEL, OPENAI_DEFAULTS.vision),
    research: stripProvider(env.EXPLODE_RESEARCH_MODEL, OPENAI_DEFAULTS.research),
    image: stripProvider(env.EXPLODE_IMAGE_MODEL, OPENAI_DEFAULTS.image),
  }
}

export function assertModels(env: NodeJS.ProcessEnv = process.env): ResolvedModels {
  const resolved = resolveModels(env)
  if ("error" in resolved) {
    const error = new Error(resolved.error)
    error.name = "ExplodeConfigError"
    throw error
  }
  return resolved
}
