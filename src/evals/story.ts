import { assemblyStorySchema } from "../spec/assembly-story.ts"

/** Coverage of lessons is separate from coverage of mesh IDs. A single chapter
 * containing every mesh can pass inventory checks while teaching almost nothing. */
export function auditStory(input: unknown, partIds: string[], groups: { componentIds: string[] }[] = []) {
  const story = assemblyStorySchema.parse(input),
    parts = story.chapters.filter((c) => c.kind !== "milestone"),
    milestones = story.chapters.filter((c) => c.kind === "milestone"),
    issues: string[] = []
  const components = partIds.map((id) => {
    const chapter = parts.find((c) => c.componentIds.includes(id))
    const paired =
      chapter &&
      groups.some(
        (g) =>
          g.componentIds.length === chapter.componentIds.length &&
          g.componentIds.every((id) => chapter.componentIds.includes(id)),
      )
    const coverage = !chapter
      ? "missing"
      : chapter.componentIds.length === 1
        ? "individual"
        : paired
          ? "declared-group"
          : "bundled-without-individual-lesson"
    if (coverage === "missing" || coverage === "bundled-without-individual-lesson")
      issues.push(`${id}: ${coverage}`)
    return {
      id,
      chapterId: chapter?.id ?? null,
      coverage,
      milestones: milestones.filter((c) => c.componentIds.includes(id)).map((c) => c.id),
    }
  })
  for (const c of parts)
    for (const id of c.componentIds) if (!partIds.includes(id)) issues.push(`${id}: no mapped geometry`)
  return {
    version: 1,
    status: issues.length ? "issues-found" : "lesson-coverage-passed",
    ready: false,
    issues,
    components,
    milestones: milestones.map((c) => ({ id: c.id, componentIds: c.componentIds })),
    note: "Coverage does not prove learning quality. Milestones summarize previously explored systems; they never replace component lessons. Declared true pairs may share a lesson. Review the explanation, geometry and evidence together.",
  }
}
