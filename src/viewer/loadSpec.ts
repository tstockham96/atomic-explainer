import { applyManifest, manifestSchema } from "../spec/manifest.ts"
import { explodeSpecSchema, type ExplodeSpec } from "../spec/schema.ts"
import { asset } from "./asset.ts"

declare global {
  interface Window {
    __EXPLODE_SPEC__?: unknown
  }
}

export async function loadSpec(): Promise<ExplodeSpec> {
  const injected = window.__EXPLODE_SPEC__
  const spec = injected
    ? explodeSpecSchema.parse(injected)
    : await fetchSpec()

  if (injected) return spec

  try {
    const response = await fetch(asset("murph/manifest.json"))
    if (!response.ok) return spec
    return applyManifest(spec, manifestSchema.parse(await response.json()))
  } catch {
    return spec
  }
}

async function fetchSpec() {
  const response = await fetch(asset("spec.json"))
  if (!response.ok) {
    throw new Error(`Could not load spec.json (${response.status}).`)
  }
  return explodeSpecSchema.parse(await response.json())
}
