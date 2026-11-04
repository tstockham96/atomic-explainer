import { useEffect, useState } from "react"
import type { ExplainerSpec } from "../spec/schema.ts"
import { Film } from "./Film.tsx"

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

export function Teardown({ spec }: { spec: ExplainerSpec }) {
  const reduce = usePrefersReducedMotion()
  useEffect(() => {
    document.title = `Atomic Explainer — ${spec.item.name}`
  }, [spec.item.name])

  if (reduce) return <Film spec={spec} reduced />
  return <Film spec={spec} />
}
