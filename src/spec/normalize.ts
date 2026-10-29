import { explodeSpecSchema, type ExplodeSpec } from "./schema.ts"

export function slug(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return cleaned || "part"
}

export function normalizeSpec(input: ExplodeSpec): ExplodeSpec {
  const parsed = explodeSpecSchema.parse(input)
  const sorted = [...parsed.components].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  const seen = new Set<string>()

  const components = sorted.map((component, index) => {
    let id = slug(component.id || component.name)
    while (seen.has(id)) id = `${id}-${index + 1}`
    seen.add(id)
    return { ...component, id, order: index }
  })

  return { ...parsed, components }
}
