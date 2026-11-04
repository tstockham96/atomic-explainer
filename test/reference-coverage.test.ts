import { describe, expect, it } from "vitest"
import { referenceCoverage, type AssetPlan } from "../src/spec/assets.ts"

const observation = (id: string, view: AssetPlan["observations"][number]["view"]) => ({
  id,
  referenceId: "ref",
  componentId: "case",
  view,
  imagePath: `refs/${id}.jpg`,
  notes: "Inspected.",
  origin: "photograph" as const,
})
const plan = (observations: AssetPlan["observations"], tasks: AssetPlan["tasks"] = []): AssetPlan => ({
  version: 1,
  identity: "Test watch",
  searches: [{ query: "q", searchedAt: "2026-11-04T00:00:00Z", outcome: "found" }],
  candidates: [],
  observations,
  tasks,
})
const defer = (componentId: string, observationIds: string[]) => ({
  componentId,
  observationIds,
  strategy: { kind: "defer" as const, reason: "Authored." },
})

describe("reference coverage", () => {
  it("rejects a reconstruction from one front photograph shared by every part", () => {
    const report = referenceCoverage(
      plan(
        [observation("front", "front")],
        ["case", "dial", "bezel", "bracelet"].map((id) => defer(id, ["front"])),
      ),
    )
    expect(report.ok).toBe(false)
    expect(report.missingViews).toEqual(["back", "side", "oblique"])
    expect(report.issues.join(" ")).toMatch(/Only 1 inspected photograph/)
    expect(report.issues.join(" ")).toMatch(/same observations/)
  })

  it("accepts eight photographs that cover every required view", () => {
    const views = ["front", "back", "left", "right", "oblique", "front", "back", "assembled"] as const
    const report = referenceCoverage(
      plan(
        views.map((view, i) => observation(`v${i}`, view)),
        [
          defer("case", ["v1", "v2"]),
          defer("dial", ["v0"]),
          defer("bezel", ["v4"]),
          defer("bracelet", ["v3"]),
        ],
      ),
    )
    expect(report).toMatchObject({ ok: true, photographs: 8, missingViews: [] })
  })

  it("does not count generated reference views as photographs", () => {
    const generated = Array.from({ length: 8 }, (_, i) => ({
      ...observation(`g${i}`, "front"),
      origin: "generated" as const,
    }))
    expect(referenceCoverage(plan(generated)).photographs).toBe(0)
  })
})
