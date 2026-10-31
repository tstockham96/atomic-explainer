import { useEffect, useRef, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import type { ReelHandle } from "./Reel.tsx"
import { windowOpacity } from "../spec/film.ts"
import { scenePartIds } from "../spec/scene3d.ts"
import { componentLesson } from "./three/learning.ts"
import { THREE_TIMING, sampleScene } from "./three/timeline.ts"
import type { Atmosphere, SceneHandle } from "./three/scene.ts"

declare global { interface Window { __explodeAssemblyReview?: { inspect: (id: string, local?: number) => void; snapshot: SceneHandle['snapshot'] } } }

export function ObjectScene({ spec, api, onImages }: { spec: ExplodeSpec; api: { current: ReelHandle | null }; onImages?: (images: Record<string, string>) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLDivElement>(null)
  const labels = useRef<Record<string, HTMLDivElement | null>>({})
  const captions = useRef<Array<HTMLDivElement | null>>([])
  const handle = useRef<SceneHandle | null>(null)
  const progress = useRef(0)
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("daylight")
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState("assembly")
  const [stage, setStage] = useState("01 / 03 · Rotate")
  const ids = scenePartIds(spec)
  const components = ids.map((id) => spec.components.find((part) => part.id === id))
  const update = (value: number) => {
    progress.current = value
    handle.current?.setProgress(value)
    const sample = sampleScene(value, components.length)
    setSelected(sample.index >= 0 ? ids[sample.index]! : sample.separation > .5 ? "exploded" : "assembly")
    setStage(sample.index >= 0 ? "03 / 03 · Explore" : sample.separation > 0 ? "02 / 03 · Explode" : "01 / 03 · Rotate")
    const show = (node: HTMLElement | null, opacity: number) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.visibility = opacity > 0.02 ? "visible" : "hidden"
      node.setAttribute("aria-hidden", String(opacity <= 0.02))
      node.style.translate = `0 ${(1 - opacity) * 12}px`
    }
    show(title.current, windowOpacity(value, 0, 0.025, 0.02))
    captions.current.forEach((node, index) => show(node, sample.index === index ? windowOpacity(sample.local, 0.34, 0.68, 0.14) : 0))
  }
  const updateRef = useRef(update)
  useEffect(() => { updateRef.current = update })
  useEffect(() => {
    api.current = { setProgress: (value) => updateRef.current(value) }
    updateRef.current(progress.current)
    return () => { api.current = null }
  }, [api])
  useEffect(() => {
    let cancelled = false
    setReady(false); setError(null)
    void import("./three/scene.ts").then(({ createObjectScene }) => {
      if (cancelled || !host.current) return undefined
      return createObjectScene(host.current, spec, (message) => { if (!cancelled) setError(message) }, (positions) => {
        if (cancelled) return
        for (const position of positions) {
          const label = labels.current[position.id]
          if (!label) continue
          label.style.left = `${position.x}px`
          label.style.top = `${position.y}px`
          label.style.opacity = position.visible ? "1" : "0"
          label.setAttribute("aria-hidden", String(!position.visible))
        }
      }, (images) => { if (!cancelled) onImages?.(images) })
    }).then((scene) => {
      if (!scene) return
      if (cancelled) { scene.dispose(); return }
      handle.current = scene
      scene.setProgress(progress.current)
      setReady(true)
      if (new URLSearchParams(window.location.search).has('eval')) window.__explodeAssemblyReview = {
        inspect: (id, local = .5) => { const i = ids.indexOf(id); updateRef.current(i < 0 ? 0 : THREE_TIMING.inspect + (i + local) * (1 - THREE_TIMING.inspect) / ids.length) },
        snapshot: scene.snapshot,
      }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "The 3D scene could not load.")
    })
    return () => {
      cancelled = true
      handle.current?.dispose()
      handle.current = null
      delete window.__explodeAssemblyReview
    }
  }, [spec, onImages])
  useEffect(() => { handle.current?.setAtmosphere(atmosphere) }, [atmosphere, ready])
  useEffect(() => { handle.current?.setPaused(paused) }, [paused, ready])

  const navigate = (value: number) => {
    const pin = host.current?.closest('.pin')?.parentElement
    const spacer = pin?.parentElement
    if (spacer) window.scrollTo({ top: spacer.getBoundingClientRect().top + window.scrollY + value * Math.max(0, spacer.offsetHeight - window.innerHeight), behavior: 'instant' })
    updateRef.current(value)
  }

  return (
    <div className={`mesh-film is-${atmosphere}`}>
      <div ref={host} className="mesh-host" />
      <div className="mesh-navigation"><a href="/create">← Studio</a><label>Explore<select aria-label="Explore a component" value={selected} onChange={event => {
        const index = ids.indexOf(event.target.value)
        const value = event.target.value === 'exploded' ? THREE_TIMING.inspect - .001 : index < 0 ? 0 : THREE_TIMING.inspect + (index + .5) * (1 - THREE_TIMING.inspect) / ids.length
        navigate(value)
      }}><option value="assembly">Whole object</option><option value="exploded">Exploded overview</option>{components.map(c => c && <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      <p className="mesh-stage" role="status">{stage}</p>
      <div className="atmosphere-switch" aria-label="Atmosphere">
        <button type="button" aria-pressed={atmosphere === "daylight"} onClick={() => setAtmosphere("daylight")}><span aria-hidden="true">☼</span> Daylight</button>
        <button type="button" aria-pressed={atmosphere === "midnight"} onClick={() => setAtmosphere("midnight")}><span aria-hidden="true">☾</span> Midnight</button>
      </div>
      <div ref={title} className="mesh-title">
        <p>{spec.item.maker}</p>
        <h1>{spec.item.model}</h1>
        <span>{ready ? "Scroll to rotate, explode and explore." : "Loading the object…"}</span>
        <button className="mesh-explode" disabled={!ready} onClick={() => navigate(THREE_TIMING.inspect - .001)}>Explode the object ↓</button>
      </div>
      <div className="mesh-labels">{components.map((component, index) => component ? <div className="mesh-part-label" key={component.id} ref={(node) => { labels.current[component.id] = node }} aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span>{component.name}</div> : null)}</div>
      {components.map((component, index) => component ? (
        <div key={component.id} ref={(node) => { captions.current[index] = node }} className="mesh-caption" aria-hidden="true">
          <p className="mesh-counter">{String(index + 1).padStart(2, "0")} <span>/ {String(components.length).padStart(2, "0")}</span></p>
          <h2>{component.name}</h2>
          <p className="mesh-material">{component.material}</p>
          <p className="mesh-description">{componentLesson(spec, component.id)?.overview}
          {componentLesson(spec, component.id)?.connections[0] && <span className="mesh-connection">{componentLesson(spec, component.id)?.connections[0]}</span>}</p>
        </div>
      ) : null)}
      {error ? <div className="mesh-error" role="alert"><h2>The 3D scene couldn’t open.</h2><p>{error}</p><a href="#parts">Read the anatomy below ↓</a></div> : null}
      <div className="mesh-bottom"><span>{spec.modelNotice ?? (spec.scene3d?.kind === "procedural-watch" ? "Illustrative 3D model · not manufacturer CAD" : "Interactive 3D study")}</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Resume motion" : "Pause motion"}</button></div>
    </div>
  )
}
