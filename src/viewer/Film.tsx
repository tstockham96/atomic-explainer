import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { useMemo, useRef } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { frameFile, sequenceReady } from "../spec/frames.ts"
import { progressForPhase } from "../spec/film.ts"
import { asset } from "./asset.ts"
import { Reel, type ReelHandle } from "./Reel.tsx"

gsap.registerPlugin(ScrollTrigger, useGSAP)

function lead(text: string) {
  return text.split(/(?<=[.!?])\s/)[0] ?? text
}

export function Film({ spec, reduced = false }: { spec: ExplodeSpec; reduced?: boolean }) {
  const components = useMemo(() => [...spec.components].sort((a, b) => a.order - b.order), [spec.components])
  const ordered = useMemo(() => ({ ...spec, components }), [spec, components])
  if (reduced) return <Quiet spec={ordered} />
  return <Pinned spec={ordered} />
}

function Pinned({ spec }: { spec: ExplodeSpec }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const api = useRef<ReelHandle | null>(null)
  const components = spec.components

  const jump = (id: string) => {
    const lenis = lenisRef.current
    const trigger = triggerRef.current
    const part = components.findIndex((component) => component.id === id)
    if (part >= 0 && trigger && lenis) {
      const progress = progressForPhase(part, components.length)
      lenis.scrollTo(trigger.start + (trigger.end - trigger.start) * progress, { duration: 1.05 })
      return
    }
    const node = document.getElementById(id === "intro" ? "film" : id)
    if (!node) return
    if (lenis) lenis.scrollTo(node, { duration: 1.05, offset: 0 })
    else node.scrollIntoView({ behavior: "smooth" })
  }

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const pin = root.querySelector<HTMLElement>("#film")
      if (!pin) return

      const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: false, anchors: false })
      lenis.on("scroll", ScrollTrigger.update)
      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      lenisRef.current = lenis

      const count = components.length
      const trigger = ScrollTrigger.create({
        id: "explode-film",
        trigger: pin,
        start: "top top",
        end: () => (window.innerWidth < 860 ? `+=${110 + count * 62}%` : `+=${160 + count * 92}%`),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => api.current?.setProgress(self.progress),
      })
      triggerRef.current = trigger

      const links = [...root.querySelectorAll<HTMLButtonElement>("[data-nav]")]
      const mark = (id: string) => {
        for (const link of links) link.classList.toggle("on", link.dataset.nav === id)
      }
      ScrollTrigger.create({
        trigger: "#parts",
        start: "top 40%",
        end: "bottom 40%",
        onToggle: (self) => {
          if (self.isActive) mark("parts")
        },
        onLeaveBack: () => mark("film"),
      })
      ScrollTrigger.create({
        trigger: "#making",
        start: "top 55%",
        onEnter: () => mark("making"),
        onLeaveBack: () => mark("parts"),
      })
      ScrollTrigger.create({
        trigger: "#notes",
        start: "top 70%",
        onEnter: () => mark("notes"),
        onLeaveBack: () => mark("making"),
      })

      const hash = window.location.hash.replace("#", "")
      if (hash) {
        requestAnimationFrame(() => jump(hash))
      } else {
        api.current?.setProgress(0)
      }

      return () => {
        triggerRef.current = null
        lenis.destroy()
        lenisRef.current = null
        gsap.ticker.remove(tick)
      }
    },
    { scope: rootRef, dependencies: [spec] },
  )

  return (
    <div ref={rootRef} className="reel">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => jump("film")}>
          explode
        </button>
        <nav aria-label="Page">
          <button type="button" data-nav="film" className="on" onClick={() => jump("film")}>
            Watch
          </button>
          <button type="button" data-nav="parts" onClick={() => jump("parts")}>
            Parts
          </button>
          <button type="button" data-nav="making" onClick={() => jump("making")}>
            Making
          </button>
          <button type="button" data-nav="notes" onClick={() => jump("notes")}>
            Notes
          </button>
        </nav>
      </header>

      <section id="film" className="pin">
        <Reel spec={spec} api={api} onJump={jump} />
      </section>

      <Sheets spec={spec} />
    </div>
  )
}

function Sheets({ spec }: { spec: ExplodeSpec }) {
  return (
    <>
      <section id="parts" className="sheet">
        <div className="sheet-head">
          <p className="kicker">Parts</p>
          <h2>The stack, piece by piece.</h2>
        </div>
        <ol className="part-grid">
          {spec.components.map((component, index) => (
            <li key={component.id} id={component.id}>
              {component.image ? <img src={asset(component.image)} alt="" /> : <div className="empty-shot" />}
              <p className="kicker">{String(index + 1).padStart(2, "0")}</p>
              <h3>{component.name}</h3>
              <p>{lead(component.howItsMade)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="making" className="essay">
        <p className="kicker">{spec.item.maker}</p>
        <h2>{spec.closing ?? spec.item.summary}</h2>
        <dl>
          {spec.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="notes" className="notes">
        {spec.artNote ? <p>{spec.artNote}</p> : null}
        {spec.frames?.explode?.note ? <p>{spec.frames.explode.note}</p> : null}
        {spec.sources.length > 0 ? (
          <ul>
            {spec.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  )
}

function Quiet({ spec }: { spec: ExplodeSpec }) {
  const rotation = spec.frames?.rotation
  const explode = spec.frames?.explode
  const hero = sequenceReady(rotation) ? asset(frameFile(rotation, 0)) : spec.heroImage ? asset(spec.heroImage) : undefined
  const opened =
    sequenceReady(explode) && explode
      ? asset(frameFile(explode, explode.count - 1))
      : spec.explodedImage
        ? asset(spec.explodedImage)
        : undefined

  return (
    <div className="reel is-quiet">
      <header className="topbar">
        <span className="brand">explode</span>
      </header>
      <section className="quiet-hero" id="film">
        <p className="kicker">{spec.item.maker}</p>
        <h1>{spec.item.model}</h1>
        <p className="sub">{spec.item.summary}</p>
        {hero ? <img src={hero} alt={spec.item.name} /> : null}
      </section>
      {opened ? (
        <section className="quiet-hero">
          <h2>Opened along the stack</h2>
          <img src={opened} alt={`${spec.item.name} exploded`} />
        </section>
      ) : null}
      <Sheets spec={spec} />
    </div>
  )
}
