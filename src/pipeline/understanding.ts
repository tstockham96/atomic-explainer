import type { ExplodeSpec } from "../spec/schema.ts"
import type { ObjectUnderstanding } from "../spec/understanding.ts"
import { COMPONENT_QUALITY_REQUIREMENTS } from "./quality.ts"

/** Structural/evidence-link checks, not a claim that the sources prove the prose. */
export function understandingIssues(spec: ExplodeSpec): string[] {
  const study = spec.understanding
  if (!study) return ["Missing object understanding and component construction plan."]
  const issues: string[] = []
  const components = new Set(spec.components.map((part) => part.id))
  const references = new Map(study.references.map((ref) => [ref.id, ref]))
  const sourceUrls = new Set(spec.sources.map((source) => source.url))
  if (references.size !== study.references.length) issues.push("Duplicate reference IDs.")
  for (const ref of study.references)
    if (!sourceUrls.has(ref.url)) issues.push(`Reference ${ref.id} is not in the retrieved source list.`)
  const seen = new Set<string>()
  const checkRefs = (ids: string[], context: string) => {
    for (const id of ids) if (!references.has(id)) issues.push(`${context}: unknown reference ${id}.`)
  }
  for (const part of study.components) {
    if (!components.has(part.componentId) || seen.has(part.componentId))
      issues.push(`Unknown or duplicate component ${part.componentId}.`)
    seen.add(part.componentId)
    for (const claim of part.claims) {
      checkRefs(claim.referenceIds, part.componentId)
      if (["documented", "observed"].includes(claim.basis) && !claim.referenceIds.length)
        issues.push(`${part.componentId}: supported claim has no reference.`)
    }
    checkRefs(part.reconstruction.referenceIds, part.componentId)
    if (part.reconstruction.method !== "defer" && !part.reconstruction.referenceIds.length)
      issues.push(`${part.componentId}: construction has no reference.`)
  }
  for (const id of components) if (!seen.has(id)) issues.push(`Missing construction plan for ${id}.`)
  for (const link of study.relationships) {
    if (!components.has(link.from) || !components.has(link.to))
      issues.push("Relationship refers to an unknown component.")
    checkRefs(link.referenceIds, `${link.from} → ${link.to}`)
    if (link.basis !== "inferred" && !link.referenceIds.length)
      issues.push("Supported relationship has no reference.")
  }
  return issues
}

export function buildReconstructionPlan(spec: ExplodeSpec) {
  const issues = understandingIssues(spec)
  const components = spec.understanding?.components ?? []
  const work = components.filter((part) => part.reconstruction.method !== "exterior-draft")
  return {
    version: 1 as const,
    status: issues.length
      ? ("research-required" as const)
      : work.length
        ? ("component-work-required" as const)
        : ("exterior-draft-only" as const),
    issues,
    learningGoals: spec.understanding?.learningGoals ?? [],
    components,
    relationships: spec.understanding?.relationships ?? [],
    unresolved: spec.understanding?.unresolved ?? [],
    requiredComponentWork: work.map((part) => ({
      componentId: part.componentId,
      method: part.reconstruction.method,
    })),
    assetHandoff: {
      contract: "src/spec/assets.ts",
      nextStep:
        "Search existing models, inspect exact-variant candidates and reference images, then execute component tasks with --asset-plan or explode_prepare_asset.",
      requiredEvidence: [
        "Actual file geometry and material inventory",
        "Inspected component image files linked to construction references",
        "Asset coverage and redistribution terms",
        "Front, oblique, reverse, assembled and exported comparisons",
      ],
      noFallback:
        "Do not replace missing detailed assets with primitive construction fixtures in a featured preview.",
    },
    requiredVisualReview: COMPONENT_QUALITY_REQUIREMENTS,
    requiredMaterialReview: components.map((part) => ({
      componentId: part.componentId,
      status: "pending" as const,
      targetBehavior: part.reconstruction.materialBehavior,
      referenceIds: part.reconstruction.referenceIds,
      unknowns: part.unknowns,
      views: ["assembled", "isolated-front", "oblique", "reverse", "exported"] as const,
      note: "Record observed finish separately from verified substrate/coating, compare related surfaces, and record remaining mismatches. This plan entry is not a passed review.",
    })),
    note: "The single-photo Tripo adapter produces an exterior draft. It cannot execute component modeling, sourcing, or hidden-part reconstruction. An exterior draft is not a finished educational assembly.",
  }
}

/** Keep only retrieved URLs; do not promote unsupported claims into facts. */
export function groundUnderstanding(
  study: ObjectUnderstanding,
  sources: ExplodeSpec["sources"],
): ObjectUnderstanding {
  const allowed = new Set(sources.map((source) => source.url))
  const references = study.references.filter((ref) => allowed.has(ref.url))
  const ids = new Set(references.map((ref) => ref.id))
  const keep = (refs: string[]) => refs.filter((id) => ids.has(id))
  return {
    ...study,
    references,
    components: study.components.map((part) => ({
      ...part,
      claims: part.claims.map((claim) => {
        const referenceIds = keep(claim.referenceIds)
        return {
          ...claim,
          referenceIds,
          basis:
            !referenceIds.length && ["documented", "observed"].includes(claim.basis)
              ? "unknown"
              : claim.basis,
        }
      }),
      reconstruction: { ...part.reconstruction, referenceIds: keep(part.reconstruction.referenceIds) },
    })),
    relationships: study.relationships.map((link) => {
      const referenceIds = keep(link.referenceIds)
      return { ...link, referenceIds, basis: referenceIds.length ? link.basis : "inferred" }
    }),
  }
}
