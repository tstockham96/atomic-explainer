import {assemblySample,assemblyProgress} from './three/assemblyTimeline.ts'
import { useEffect, useRef, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import type { ReelHandle } from "./Reel.tsx"
import { windowOpacity } from "../spec/film.ts"
import { inspectionStops, storyComponents } from "../spec/scene3d.ts"
import { componentLesson } from "./three/learning.ts"
import { THREE_TIMING, sampleScene } from "./three/timeline.ts"
import type { Atmosphere, SceneHandle } from "./three/scene.ts"

declare global { interface Window { __explodeAssemblyReview?: { inspect: (id: string, local?: number) => void; snapshot: SceneHandle['snapshot'] } } }

export function ObjectScene({ spec, api, onImages }: { spec: ExplodeSpec; api: { current: ReelHandle | null }; onImages?: (images: Record<string, string>) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLDivElement>(null)
  const closing = useRef<HTMLDivElement>(null)
  const labels = useRef<Record<string, HTMLDivElement | null>>({})
  const captions = useRef<Array<HTMLDivElement | null>>([])
  const handle = useRef<SceneHandle | null>(null)
  const progress = useRef(0)
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("daylight")
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState("assembly")
  const [stage, setStage] = useState("01 / 04 · Rotate")
  const story=spec.scene3d?.kind==='gltf'?spec.scene3d.assemblyStory:undefined
  const stops = inspectionStops(spec)
  const ids = stops.map(s=>s.id)
  const components = storyComponents(spec)
  const update = (value: number) => {
    progress.current = value
    handle.current?.setProgress(value)
    const sample = sampleScene(value, components.length)
    const assembly=story?assemblySample(value,story.chapters.length):undefined
    setSelected(sample.index >= 0 ? ids[sample.index]! : sample.separation > .5 ? "exploded" : "assembly")
    setStage(value >= THREE_TIMING.reassemble ? "04 / 04 · Together again" : sample.index >= 0 ? "03 / 04 · Explore" : sample.separation > 0 ? "02 / 04 · Explode" : "01 / 04 · Rotate")
    if(assembly){setSelected(assembly.opening?'assembly':assembly.complete?'complete':`chapter:${ids[assembly.index]!}`);setStage(assembly.opening?'The whole object':assembly.complete?'Together again':`${assembly.index+1} / ${components.length} · ${assembly.local>=.76?'Building together':'How it’s made'}`)}
    const show = (node: HTMLElement | null, opacity: number) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.visibility = opacity > 0.02 ? "visible" : "hidden"
      node.setAttribute("aria-hidden", String(opacity <= 0.02))
      node.style.translate = `0 ${(1 - opacity) * 12}px`
    }
    if(assembly){
     show(title.current,assembly.opening?1-assembly.reveal:0);show(closing.current,assembly.complete?1:0)
     captions.current.forEach((node,index)=>{show(node,!assembly.opening&&!assembly.complete&&assembly.index===index?1:0);const description=node?.querySelector('.mesh-description');if(description)description.textContent=assembly.local>=.76?story!.chapters[index]!.joined:story!.chapters[index]!.description});return
    }
    show(title.current, windowOpacity(value, 0, 0.025, 0.02))
    show(closing.current, value > THREE_TIMING.reassemble ? Math.min(1, (value - THREE_TIMING.reassemble) / .05) : 0)
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
        const occupied: {left:number;right:number;top:number;bottom:number}[] = []
        for (const position of positions) {
          const label = labels.current[position.id]
          if (!label) continue
          label.style.left = `${position.x}px`
          label.style.top = `${position.y}px`
          // Dense assemblies should not turn the overview into overlapping text.
          // Only labels are culled; every physical component stays in the scene.
          const r = label.getBoundingClientRect()
          const rect = {left:r.left-8,right:r.right+8,top:r.top-5,bottom:r.top+32}
          const visible = ids.length <= 12 && position.visible && !occupied.some(o => rect.left<o.right && rect.right>o.left && rect.top<o.bottom && rect.bottom>o.top)
          if(visible) occupied.push(rect)
          label.style.opacity = visible ? "1" : "0"
          label.setAttribute("aria-hidden", String(!visible))
        }
      }, (images) => { if (!cancelled) onImages?.(images) })
    }).then((scene) => {
      if (!scene) return
      if (cancelled) { scene.dispose(); return }
      handle.current = scene
      scene.setProgress(progress.current)
      setReady(true)
      if (new URLSearchParams(window.location.search).has('eval')) window.__explodeAssemblyReview = {
        inspect: (id, local = .5) => { const i = stops.findIndex(s=>s.id===id||s.componentIds.includes(id)); updateRef.current(i < 0 ? 0 : story?assemblyProgress(i,local,ids.length):THREE_TIMING.inspect + (i + local) * (THREE_TIMING.reassemble - THREE_TIMING.inspect) / ids.length) },
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
        const index = ids.indexOf(story?event.target.value.replace(/^chapter:/,''):event.target.value)
        const value = story?(event.target.value==='complete'?1:index<0?0:assemblyProgress(index,.2,ids.length)):event.target.value === 'exploded' ? THREE_TIMING.inspect - .001 : index < 0 ? 0 : THREE_TIMING.inspect + (index + .5) * (THREE_TIMING.reassemble - THREE_TIMING.inspect) / ids.length
        navigate(value)
      }}><option value="assembly">Whole object</option>{story?<option value="complete">Complete build</option>:<option value="exploded">Exploded overview</option>}{components.map(c => c && <option key={c.id} value={story?`chapter:${c.id}`:c.id}>{c.name}</option>)}</select></label></div>
      <p className="mesh-stage" role="status">{stage}</p>
      <div className="atmosphere-switch" aria-label="Atmosphere">
        <button type="button" aria-pressed={atmosphere === "daylight"} onClick={() => setAtmosphere("daylight")}><span aria-hidden="true">☼</span> Daylight</button>
        <button type="button" aria-pressed={atmosphere === "midnight"} onClick={() => setAtmosphere("midnight")}><span aria-hidden="true">☾</span> Midnight</button>
      </div>
      <div ref={title} className="mesh-title">
        <p>{spec.item.maker}</p>
        <h1>{spec.item.model}</h1>
        <span>{ready ? story?story.opening.description:"Scroll to rotate, explode and explore." : "Loading the object…"}</span>
        <button className="mesh-explode" disabled={!ready} onClick={() => navigate(story?assemblyProgress(0,.2,ids.length):THREE_TIMING.inspect - .001)}>{story?'Discover how it’s made ↓':'Explode the object ↓'}</button>
      </div>
      <div ref={closing} className="mesh-title mesh-closing" aria-hidden="true" style={{opacity:0,visibility:"hidden"}}><p>Every part has a purpose.</p><h2>{story?.closing.title??'Together again.'}</h2><span>{story?.closing.description??'One object. Now you know what makes it work.'}</span><a href="#parts">Explore the individual stories ↓</a></div>
      <div className="mesh-labels">{components.map((component, index) => component ? <div className="mesh-part-label" key={component.id} ref={(node) => { labels.current[component.id] = node }} aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span>{component.name}</div> : null)}</div>
      {components.map((component, index) => component ? (
        <div key={component.id} ref={(node) => { captions.current[index] = node }} className="mesh-caption" aria-hidden="true">
          <p className="mesh-counter">{String(index + 1).padStart(2, "0")} <span>/ {String(components.length).padStart(2, "0")}</span></p>
          <h2>{component.name}</h2>
          <p className="mesh-material">{component.material}</p>
          <p className="mesh-description">{componentLesson(spec, component.id)?.overview ?? component.howItsMade}
          {componentLesson(spec, component.id)?.connections[0] && <span className="mesh-connection">{componentLesson(spec, component.id)?.connections[0]}</span>}</p>
        </div>
      ) : null)}
      {error ? <div className="mesh-error" role="alert"><h2>The 3D scene couldn’t open.</h2><p>{error}</p><a href="#parts">Read the anatomy below ↓</a></div> : null}
      <div className="mesh-bottom"><span>{spec.modelNotice ?? (spec.scene3d?.kind === "procedural-watch" ? "Illustrative 3D model · not manufacturer CAD" : "Interactive 3D study")}</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Resume motion" : "Pause motion"}</button></div>
    </div>
  )
}
