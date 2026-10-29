import { explodeSpecSchema, type ExplodeSpec } from "../spec/schema.ts"
import { asset } from "./asset.ts"

declare global {
  interface Window {
    __EXPLODE_SPEC__?: unknown
  }
}

export async function loadSpec(): Promise<ExplodeSpec> {
  const injected = window.__EXPLODE_SPEC__
  if (injected) return explodeSpecSchema.parse(injected)

  const response = await fetch(asset("spec.json"))
  if (!response.ok) {
    throw new Error(`Could not load spec.json (${response.status}).`)
  }
  return explodeSpecSchema.parse(await response.json())
}
