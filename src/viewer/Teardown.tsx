import { useEffect, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { ScrollStory } from "./ScrollStory.tsx"
import { StaticStory } from "./StaticStory.tsx"

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReduce(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return reduce
}

export function Teardown({ spec }: { spec: ExplodeSpec }) {
  const reduce = usePrefersReducedMotion()
  useEffect(() => {
    document.title = `explode — ${spec.item.name}`
  }, [spec.item.name])

  if (reduce) return <StaticStory spec={spec} />
  return <ScrollStory spec={spec} />
}
