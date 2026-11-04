import { applyManifest, manifestSchema } from "../spec/manifest.ts"
import { explainerSpecSchema, type ExplainerSpec } from "../spec/schema.ts"
import { asset } from "./asset.ts"

declare global {
  interface Window {
    __ATOMIC_EXPLAINER_SPEC__?: unknown
  }
}

export async function loadSpec(): Promise<ExplainerSpec> {
  const injected = window.__ATOMIC_EXPLAINER_SPEC__
  const spec = injected ? explainerSpecSchema.parse(injected) : await fetchSpec()

  if (injected || spec.item.reference !== "H70605731") return spec

  try {
    const response = await fetch(asset("murph/manifest.json"))
    if (!response.ok) return spec
    return applyManifest(spec, manifestSchema.parse(await response.json()))
  } catch {
    return spec
  }
}

async function fetchSpec() {
  const demo = new URLSearchParams(window.location.search).get("demo")
  const response = await fetch(asset(demo === "murph" ? "spec.json" : "chronograph.json"))
  if (!response.ok) {
    throw new Error(`Could not load spec.json (${response.status}).`)
  }
  return explainerSpecSchema.parse(await response.json())
}
