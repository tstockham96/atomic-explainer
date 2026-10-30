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

  const seek = (progress: number) => {
    const trigger = triggerRef.current
    if (!trigger) return
    lenisRef.current?.scrollTo(trigger.start + (trigger.end - trigger.start) * progress, { immediate: true })
  }

  const jump = (id: string) => {
    const lenis = lenisRef.current
    const trigger = triggerRef.current
    if ((id === "@turn" || id === "@burst") && trigger && lenis) {
      lenis.scrollTo(trigger.start + (trigger.end - trigger.start) * progressForPhase(id === "@turn" ? "turn" : "burst", components.length), { duration: 1.2 })
      return
    }
    if ((id === "film" || id === "intro") && trigger && lenis) {
      lenis.scrollTo(trigger.start, { duration: 1.05 })
      return
    }
    const part = components.findIndex((component) => component.id === id)
    if (part >= 0 && trigger && lenis) {
      const progress = progressForPhase(part, components.length)
      lenis.scrollTo(trigger.start + (trigger.end - trigger.start) * progress, { duration: 1.05 })
      return
    }
    const node = document.getElementById(id === "intro" ? "film" : id)
    if (!node) return
    if (id.startsWith("detail-")) {
      const detail = node.querySelector("details")
      if (detail) detail.open = true
      ScrollTrigger.refresh()
    }
    if (lenis) lenis.scrollTo(node, { duration: 1.05, offset: -90 })
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
        end: () => (window.innerWidth < 860 ? `+=${180 + count * 45}%` : `+=${200 + count * 52}%`),
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => api.current?.setProgress(self.progress),
        onRefresh: (self) => api.current?.setProgress(self.progress),
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
    { scope: rootRef, dependencies: [spec], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef} className="reel">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => jump("film")}>
          <span className="brand-symbol" aria-hidden="true">✳</span> explode<span className="brand-period">.</span>
        </button>
        <span className="brand-description">Everything has a story inside.</span>
        <nav aria-label="Page">
          <button type="button" data-nav="film" className="on" onClick={() => jump("film")}>
            The object
          </button>
          <button type="button" data-nav="parts" onClick={() => jump("parts")}>
            Anatomy
          </button>
          <button type="button" data-nav="making" onClick={() => jump("making")}>
            Field notes
          </button>
          <button type="button" data-nav="notes" onClick={() => jump("notes")}>
            Sources
          </button>
        </nav>
      </header>

      <section id="film" className="pin">
        <Reel spec={spec} api={api} onJump={jump} onSeek={seek} />
      </section>

      <Sheets spec={spec} onRestart={() => jump("film")} />
    </div>
  )
}

function Sheets({ spec, onRestart }: { spec: ExplodeSpec; onRestart?: () => void }) {
  return (
    <>
      <section id="parts" className="sheet">
        <div className="section-rule"><span>01 / Anatomy</span><span>{String(spec.components.length).padStart(2, "0")} individual stories</span></div>
        <div className="sheet-head">
          <h2>A whole world.<br /><em>In every part.</em></h2>
          <p>Look a little closer. Discover the materials, processes, and small decisions behind each component.</p>
        </div>
        <ol className="part-grid">
          {spec.components.map((component, index) => (
            <li key={component.id} id={`detail-${component.id}`}>
              <div className="part-image">
                <span className="part-number">{String(index + 1).padStart(2, "0")}</span>
                {component.image ? <img src={asset(component.image)} alt={component.name} loading="lazy" /> : <div className="empty-shot">Image unavailable</div>}
              </div>
              <p className="part-material">{component.material}</p>
              <h3>{component.name}</h3>
              <p className="part-summary">{lead(component.howItsMade)}</p>
              <details onToggle={() => ScrollTrigger.refresh()}>
                <summary>How it’s made <span aria-hidden="true">+</span></summary>
                <div className="part-detail">
                  <p>{component.howItsMade}</p>
                  {component.funFacts.map((fact) => <p key={fact}>{fact}</p>)}
                  {component.figureLabel ? <p className="figure-note">{component.figureLabel}</p> : null}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section id="making" className="essay">
        <div className="section-rule"><span>02 / Field notes</span><span>{spec.item.maker}</span></div>
        <div className="essay-layout">
          <div><p className="kicker">The bigger picture</p><h2>Considered.<br /><em>Inside and out.</em></h2></div>
          <div><p className="essay-intro">{spec.item.summary}</p><p className="essay-body">{spec.closing}</p></div>
        </div>
        <dl>
          {spec.facts.map((fact) => (
            <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl>
      </section>

      <section id="notes" className="notes">
        <div className="section-rule"><span>03 / Sources & image notes</span><span>Curiosity, with context.</span></div>
        <div className="notes-layout">
          <div><h2>Behind the study.</h2>{spec.artNote ? <p>{spec.artNote}</p> : null}</div>
          {spec.sources.length > 0 ? <ol>{spec.sources.map((source, index) => (
            <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, "0")}</span>{source.title}<span aria-hidden="true">↗</span></a></li>
          ))}</ol> : null}
        </div>
      </section>
      <footer className="site-footer"><a className="brand" href="#film" onClick={onRestart ? (event) => { event.preventDefault(); onRestart() } : undefined}>✳ explode.</a><p>For the endlessly curious.</p><a href="https://github.com/tstockham96/explode" target="_blank" rel="noreferrer">Explore the project ↗</a></footer>
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
