import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { chapterAt, progressForChapter, storyboard } from "../spec/storyboard.ts"
import { ExplodePoster } from "./ExplodePoster.tsx"

gsap.registerPlugin(ScrollTrigger, useGSAP)

function hashFor(spec: ExplodeSpec, index: number) {
  if (index < 0) return "intro"
  if (index >= spec.components.length) return "end"
  return spec.components[index]?.id ?? "intro"
}

export function ScrollStory({ spec }: { spec: ExplodeSpec }) {
  const components = useMemo(
    () => [...spec.components].sort((a, b) => a.order - b.order),
    [spec],
  )
  const ordered = useMemo(() => ({ ...spec, components }), [spec, components])
  const count = components.length
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const chapterRef = useRef(-1)
  const [chapter, setChapter] = useState(-1)

  const jump = (index: number) => {
    const trigger = triggerRef.current
    const id = hashFor(ordered, index)
    const nextHash = `#${id}`
    if (window.location.hash !== nextHash) history.replaceState(null, "", nextHash)
    if (!trigger) {
      setChapter(index)
      return
    }
    const progress = progressForChapter(index, count)
    const top = trigger.start + (trigger.end - trigger.start) * progress
    window.scrollTo({ top, behavior: "smooth" })
  }

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const board = storyboard(count)
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * board.total * 0.42)}`,
        pin: true,
        scrub: 0.35,
        anticipatePin: 1,
        onUpdate: (self) => {
          const next = chapterAt(self.progress, count)
          if (next !== chapterRef.current) {
            chapterRef.current = next
            setChapter(next)
          }
        },
      })
      triggerRef.current = trigger
      return () => {
        triggerRef.current = null
      }
    },
    { scope: rootRef, dependencies: [ordered] },
  )

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (!hash || hash === "intro") return
    let frame = 0
    let raf = 0
    const tick = () => {
      const trigger = triggerRef.current
      frame += 1
      if (trigger && trigger.end > trigger.start) {
        const index = hash === "end" ? count : components.findIndex((component) => component.id === hash)
        if (index >= 0) {
          const progress = progressForChapter(index, count)
          window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: "auto" })
        }
        return
      }
      if (frame < 40) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [components, count])

  return (
    <div ref={rootRef}>
      <ExplodePoster spec={ordered} chapter={chapter} onJump={jump} />
    </div>
  )
}
