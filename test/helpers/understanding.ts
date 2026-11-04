import type { ExplodeSpec } from "../../src/spec/schema.ts"

/** An explicit exterior-only fixture, never a factual assertion about the sample watch. */
export function exteriorStudy(spec: ExplodeSpec): ExplodeSpec {
  const source = { title: "Fixture reference", url: "https://example.com/fixture" }
  return {
    ...spec,
    sources: [...spec.sources, source],
    understanding: {
      version: 1,
      identityScope: "Test-only exterior draft",
      learningGoals: ["Inspect an exterior draft"],
      references: [
        {
          id: "fixture",
          ...source,
          kind: "photograph",
          scope: "general",
          observation: "Test fixture only",
          limitations: "No real evidence",
        },
      ],
      components: spec.components.map((part) => ({
        componentId: part.id,
        function: "Fixture function",
        claims: [{ statement: "Fixture hypothesis", basis: "inferred", referenceIds: ["fixture"] }],
        reconstruction: {
          method: "exterior-draft",
          referenceIds: ["fixture"],
          shape: "Fixture surface",
          materialBehavior: "Unverified",
          hiddenSurfaces: "Not part of this exterior study",
          exclude: [],
          acceptanceChecks: ["Review the mesh"],
        },
        unknowns: [],
      })),
      relationships: [],
      unresolved: [],
    },
  }
}
