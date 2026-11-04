import { explainerSpecSchema, type ExplainerSpec } from "./schema.ts"

export function slug(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return cleaned || "part"
}

export function normalizeSpec(input: ExplainerSpec): ExplainerSpec {
  const parsed = explainerSpecSchema.parse(input)
  const sorted = [...parsed.components].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  const seen = new Set<string>()

  const components = sorted.map((component, index) => {
    let id = slug(component.id || component.name)
    while (seen.has(id)) id = `${id}-${index + 1}`
    if (parsed.understanding && id !== component.id)
      throw new Error(
        "Researched assemblies require unique lowercase hyphenated component IDs so evidence and relationships remain attached.",
      )
    seen.add(id)
    return { ...component, id, order: index }
  })

  return { ...parsed, components }
}
