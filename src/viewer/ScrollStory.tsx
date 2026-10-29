import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { layoutFor } from "../spec/layout.ts"
import { chapterAt, progressForChapter, storyboard } from "../spec/storyboard.ts"
import { ComponentCopy, IntroCopy, OutroCopy } from "./copy.tsx"
import { PhotoLayer } from "./PhotoLayer.tsx"
import { Frame } from "./Frame.tsx"

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
  const cameraRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const layerRefs = useRef<Array<HTMLDivElement | null>>([])
  const introRef = useRef<HTMLElement>(null)
  const outroRef = useRef<HTMLElement>(null)
  const panelRefs = useRef<Array<HTMLElement | null>>([])
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const chapterRef = useRef(-1)
  const [chapter, setChapter] = useState(-1)

  const jump = (index: number) => {
    const trigger = triggerRef.current
    const id = hashFor(ordered, index)
    const nextHash = `#${id}`
    if (window.location.hash !== nextHash) history.replaceState(null, "", nextHash)
    if (!trigger) return
    const progress = progressForChapter(index, count)
    const top = trigger.start + (trigger.end - trigger.start) * progress
    window.scrollTo({ top, behavior: "smooth" })
  }

  useGSAP(
    () => {
      const root = rootRef.current
      const camera = cameraRef.current
      if (!root || !camera) return

      const board = storyboard(count)
      const layers = layerRefs.current.filter((layer): layer is HTMLDivElement => layer !== null)
      const layouts = components.map((component, index) => layoutFor(component, index, count))
      const spread = () => ({
        x: camera.clientWidth * 0.48,
        y: camera.clientHeight * 0.4,
      })

      const hero = heroRef.current
      gsap.set(camera, { x: 0, y: 0, scale: 1, rotateX: 8, transformPerspective: 1400 })
      layers.forEach((layer, index) => {
        const home = components[index]?.home
        gsap.set(layer, {
          x: () => (home?.x ?? 0) * spread().x,
          y: () => (home?.y ?? 0) * spread().y,
          z: (count - index) * 12,
          opacity: hero ? 0 : 1,
          scale: 1,
          filter: "blur(0px)",
        })
      })
      if (hero) gsap.set(hero, { opacity: 1, filter: "blur(0px)" })

      const panels = panelRefs.current.filter((panel): panel is HTMLElement => panel !== null)
      gsap.set([introRef.current, outroRef.current, ...panels], { autoAlpha: 0, y: 28 })
      gsap.set(introRef.current, { autoAlpha: 1, y: 0 })

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * board.total * 0.82)}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`
            const next = chapterAt(self.progress, count)
            if (next !== chapterRef.current) {
              chapterRef.current = next
              setChapter(next)
            }
          },
        },
      })

      timeline.to(camera, { rotateX: 16, duration: board.explode }, board.intro)
      if (hero) {
        timeline.to(hero, { opacity: 0, filter: "blur(8px)", duration: board.explode * 0.85 }, board.intro)
      }

      layers.forEach((layer, index) => {
        const layout = layouts[index]
        if (!layout) return
        timeline.to(
          layer,
          {
            x: () => layout.x * spread().x,
            y: () => layout.y * spread().y,
            z: (count - index) * 16,
            opacity: 1,
            duration: board.explode,
          },
          board.intro,
        )
      })

      timeline.to(introRef.current, { autoAlpha: 0, y: -20, duration: 0.28 }, board.intro + board.explode - 0.22)

      components.forEach((_, index) => {
        const start = board.intro + board.explode + index * board.chapter
        const layout = layouts[index]
        const layer = layers[index]
        timeline.to(panelRefs.current[index], { autoAlpha: 1, y: 0, duration: 0.22 }, start)
        timeline.to(panelRefs.current[index], { autoAlpha: 0, y: -16, duration: 0.18 }, start + board.chapter - 0.16)
        timeline.to(
          camera,
          {
            x: 0,
            y: 0,
            scale: layout?.focus ?? 1.2,
            rotateX: 12,
            duration: 0.42,
          },
          start,
        )
        if (layer) {
          timeline.to(layer, { x: 0, y: 0, opacity: 1, scale: 1.02, filter: "blur(0px)", duration: 0.28 }, start)
        }
        layers.forEach((other, otherIndex) => {
          if (otherIndex === index) return
          const otherLayout = layouts[otherIndex]
          timeline.to(
            other,
            {
              x: () => (otherLayout?.x ?? 0) * spread().x,
              y: () => (otherLayout?.y ?? 0) * spread().y,
              opacity: 0.28,
              scale: 0.96,
              filter: "blur(7px)",
              duration: 0.28,
            },
            start,
          )
        })
      })

      timeline.set({}, {}, board.total)

      const outroAt = board.intro + board.explode + count * board.chapter
      timeline.to(camera, { x: 0, y: 0, scale: 1, rotateX: 8, duration: 0.5 }, outroAt)
      if (hero) timeline.to(hero, { opacity: 1, filter: "blur(0px)", duration: 0.45 }, outroAt)
      layers.forEach((layer, index) => {
        const home = components[index]?.home
        timeline.to(
          layer,
          {
            x: () => (home?.x ?? 0) * spread().x,
            y: () => (home?.y ?? 0) * spread().y,
            opacity: hero ? 0 : 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.5,
          },
          outroAt,
        )
      })
      timeline.to(outroRef.current, { autoAlpha: 1, y: 0, duration: 0.28 }, outroAt + 0.12)

      triggerRef.current = timeline.scrollTrigger ?? null

      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => undefined)

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
          const top = trigger.start + (trigger.end - trigger.start) * progress
          window.scrollTo({ top, behavior: "auto" })
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
      <Frame
        spec={ordered}
        chapter={chapter}
        onJump={jump}
        progressRef={barRef}
        variant="scroll"
        art={
          <div className="camera-rig">
            <div ref={cameraRef} className="camera">
              {ordered.heroImage ? (
                <div ref={heroRef} className="layer hero-layer">
                  <PhotoLayer src={ordered.heroImage} label={ordered.item.name} />
                </div>
              ) : null}
              {components.map((component, index) => (
                <div
                  key={component.id}
                  ref={(node) => {
                    layerRefs.current[index] = node
                  }}
                  className="layer"
                  style={{ zIndex: component.zIndex ?? 80 - component.order }}
                >
                  <PhotoLayer src={component.image} label={component.name} />
                </div>
              ))}
            </div>
          </div>
        }
        panel={
          <div className="panel-stack">
            <article ref={introRef} className="card">
              <IntroCopy spec={ordered} />
            </article>
            {components.map((component, index) => (
              <article
                key={component.id}
                ref={(node) => {
                  panelRefs.current[index] = node
                }}
                className="card"
              >
                <ComponentCopy component={component} index={index} count={count} />
              </article>
            ))}
            <article ref={outroRef} className="card">
              <OutroCopy spec={ordered} />
            </article>
          </div>
        }
      />
    </div>
  )
}
