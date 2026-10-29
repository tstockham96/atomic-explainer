import { useMemo, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { ExplodePoster } from "./ExplodePoster.tsx"

export function StaticStory({ spec }: { spec: ExplodeSpec }) {
  const components = useMemo(
    () => [...spec.components].sort((a, b) => a.order - b.order),
    [spec],
  )
  const ordered = useMemo(() => ({ ...spec, components }), [spec, components])
  const [chapter, setChapter] = useState(-1)

  return <ExplodePoster spec={ordered} chapter={chapter} onJump={setChapter} />
}
