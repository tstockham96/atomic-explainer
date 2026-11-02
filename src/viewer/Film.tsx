import {assemblyScrollVh} from './three/assemblyTimeline.ts'
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { useMemo, useRef, useState } from "react"
import * as Scrollytelling from "@bsmnt/scrollytelling"
import type { ExplodeSpec } from "../spec/schema.ts"
import { frameFile, sequenceReady } from "../spec/frames.ts"
import { focusTour } from "../spec/camera.ts"
import { asset } from "./asset.ts"
import { Reel, type ReelHandle } from "./Reel.tsx"
import { inspectionStops, anatomyComponents } from "../spec/scene3d.ts"
import { ObjectScene } from "./ObjectScene.tsx"

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
  const api = useRef<ReelHandle | null>(null)
  const [images, setImages] = useState<Record<string, string>>({})
  const driver = useRef({ progress: 0 })
  const tween = useMemo(() => ({ start: 0, end: 100, target: driver.current, fromTo: [
    { progress: 0 }, { progress: 1, ease: "none", onUpdate: () => api.current?.setProgress(driver.current.progress) },
  ] as [gsap.TweenVars, gsap.TweenVars] }), [])
  const callbacks = useMemo(() => ({ onRefresh: (self: ScrollTrigger) => api.current?.setProgress(self.progress) }), [])
  const tourLength = spec.scene3d ? inspectionStops(spec).length : focusTour(spec).length

  useGSAP(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: false, anchors: true })
    lenis.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    return () => {
      lenis.destroy()
      gsap.ticker.remove(tick)
    }
  }, { scope: rootRef, dependencies: [spec], revertOnUpdate: true })

  return (
    <main ref={rootRef} className="reel continuous-reel">
      <a className="skip-film" href="#parts">Skip motion and read the anatomy</a>
      <Scrollytelling.Root callbacks={callbacks}>
        <Scrollytelling.Pin childHeight="100svh" pinSpacerHeight={`${spec.scene3d?.kind==='gltf'&&spec.scene3d.assemblyStory?assemblyScrollVh(tourLength):(4+tourLength*1.15)*100}svh`}>
          <Scrollytelling.Animation tween={tween} />
          <section id="film" className="pin" aria-label={`${spec.item.name}: rotate, explode, and explore`}>
            {spec.scene3d ? <ObjectScene spec={spec} api={api} onImages={setImages} /> : <Reel spec={spec} api={api} />}
          </section>
        </Scrollytelling.Pin>
      </Scrollytelling.Root>
      <Sheets spec={spec} images={images} />
    </main>
  )
}

function Sheets({ spec, images = {} }: { spec: ExplodeSpec; images?: Record<string, string> }) {
  const components=anatomyComponents(spec)
  return (
    <>
      <section id="parts" className="sheet">
        <div className="section-rule"><span>01 / Anatomy</span><span>{String(components.length).padStart(2, "0")} individual stories</span></div>
        <div className="sheet-head">
          <h2>A whole world.<br /><em>In every part.</em></h2>
          <p>Look a little closer. Discover the materials, processes, and small decisions behind each component.</p>
        </div>
        <ol className="part-grid">
          {components.map((component, index) => (
            <li key={component.id} id={`detail-${component.id}`}>
              <div className="part-image">
                <span className="part-number">{String(index + 1).padStart(2, "0")}</span>
                {images[component.id] || component.image ? <img src={images[component.id] ?? asset(component.image!)} alt={component.name} loading="lazy" /> : <div className="empty-shot">{component.name}</div>}
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
                  {component.evidence && <div className="figure-note"><p>{component.evidence.basis === "documented" ? "Documented construction" : "Inferred construction"} · {component.evidence.note}</p>{component.evidence.sourceUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">Source {i + 1} ↗ </a>)}</div>}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section id="notes" className="notes">
        <div className="section-rule"><span>Sources & image notes</span></div>
        <div className="notes-layout">
          <div><h2>Behind the study.</h2>{spec.scene3d?.kind === "procedural-watch" ? <p>The interactive watch is an illustrative procedural model, not Hamilton CAD. Its movement demonstrates the idea of a mechanical watch and does not reproduce the H-10 mechanism.</p> : null}{spec.artNote ? <p>{spec.artNote}</p> : null}</div>
          {spec.sources.length > 0 ? <ol>{spec.sources.map((source, index) => (
            <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, "0")}</span>{source.title}<span aria-hidden="true">↗</span></a></li>
          ))}</ol> : null}
        </div>
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
