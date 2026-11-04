export type ProviderMode = "gateway" | "openai"

export interface ResolvedModels {
  mode: ProviderMode
  vision: string
  research: string
  image: string
}

export type VideoProvider = "gateway" | "fal"

export interface ResolvedVideo {
  provider: VideoProvider
  model: string
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
      vision: env.ATOMIC_EXPLAINER_VISION_MODEL?.trim() || GATEWAY_DEFAULTS.vision,
      research: env.ATOMIC_EXPLAINER_RESEARCH_MODEL?.trim() || GATEWAY_DEFAULTS.research,
      image: env.ATOMIC_EXPLAINER_IMAGE_MODEL?.trim() || GATEWAY_DEFAULTS.image,
    }
  }

  return {
    mode: "openai",
    vision: stripProvider(env.ATOMIC_EXPLAINER_VISION_MODEL, OPENAI_DEFAULTS.vision),
    research: stripProvider(env.ATOMIC_EXPLAINER_RESEARCH_MODEL, OPENAI_DEFAULTS.research),
    image: stripProvider(env.ATOMIC_EXPLAINER_IMAGE_MODEL, OPENAI_DEFAULTS.image),
  }
}

/** Image-to-video. Gateway ids: Kling, Veo, Seedance. Fal when ATOMIC_EXPLAINER_VIDEO_PROVIDER=fal. */
export const GATEWAY_VIDEO_DEFAULT = "klingai/kling-v2.6-i2v"
export const FAL_VIDEO_DEFAULT = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video"

export const VIDEO_PRESETS = {
  kling: GATEWAY_VIDEO_DEFAULT,
  veo: "google/veo-3.1-fast-generate-001",
  seedance: "bytedance/seedance-v1.5-pro",
} as const

export function resolveVideo(env: NodeJS.ProcessEnv = process.env): ResolvedVideo | { error: string } {
  const requested = env.ATOMIC_EXPLAINER_VIDEO_PROVIDER?.trim().toLowerCase()
  const provider: VideoProvider =
    requested === "fal" || (!requested && env.FAL_KEY?.trim() && !env.AI_GATEWAY_API_KEY?.trim())
      ? "fal"
      : "gateway"
  if (requested && requested !== "fal" && requested !== "gateway") {
    return { error: `Unknown ATOMIC_EXPLAINER_VIDEO_PROVIDER "${requested}". Use gateway or fal.` }
  }

  if (provider === "fal") {
    if (!env.FAL_KEY?.trim()) {
      return { error: "FAL_KEY is required when ATOMIC_EXPLAINER_VIDEO_PROVIDER=fal." }
    }
    return { provider, model: env.ATOMIC_EXPLAINER_VIDEO_MODEL?.trim() || FAL_VIDEO_DEFAULT }
  }

  if (!env.AI_GATEWAY_API_KEY?.trim()) {
    return {
      error:
        "AI_GATEWAY_API_KEY is required for gateway video. Or set ATOMIC_EXPLAINER_VIDEO_PROVIDER=fal and FAL_KEY.",
    }
  }
  return { provider, model: env.ATOMIC_EXPLAINER_VIDEO_MODEL?.trim() || GATEWAY_VIDEO_DEFAULT }
}

export function assertModels(env: NodeJS.ProcessEnv = process.env): ResolvedModels {
  const resolved = resolveModels(env)
  if ("error" in resolved) {
    const error = new Error(resolved.error)
    error.name = "ExplainerConfigError"
    throw error
  }
  return resolved
}
