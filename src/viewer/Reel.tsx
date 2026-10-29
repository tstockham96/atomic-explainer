import { useEffect, useRef, useState } from "react"
import type { ExplodeSpec, FrameSequence } from "../spec/schema.ts"
import { frameIndex, filmMap, phaseAt, windowOpacity } from "../spec/film.ts"
import { frameFile } from "../spec/frames.ts"
import { asset } from "./asset.ts"
import { discoverSequence, loadFrames, nearestReady, sequenceUrls } from "./sequence.ts"

export interface ReelHandle {
  setProgress: (progress: number) => void
}

function lead(text: string) {
  const sentence = text.split(/(?<=[.!?])\s/)[0]
  return sentence ?? text
}

function Title({ model, emphasis }: { model: string; emphasis?: string }) {
  if (!emphasis) return model
  const at = model.indexOf(emphasis)
  if (at < 0) return model
  return (
    <>
      {model.slice(0, at)}
      <em>{emphasis}</em>
      {model.slice(at + emphasis.length)}
    </>
  )
}

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

export function Reel({
  spec,
  api,
  onJump,
}: {
  spec: ExplodeSpec
  api: { current: ReelHandle | null }
  onJump: (id: string) => void
}) {
  const components = spec.components
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLImageElement>(null)
  const explodedRef = useRef<HTMLImageElement>(null)
  const partRefs = useRef<Array<HTMLImageElement | null>>([])
  const captionRefs = useRef<Array<HTMLElement | null>>([])
  const railRefs = useRef<Array<HTMLButtonElement | null>>([])
  const barRef = useRef<HTMLSpanElement>(null)
  const plusRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef<"frames" | "stills">("stills")
  const rotationRef = useRef<Array<HTMLImageElement | null>>([])
  const explodeRef = useRef<Array<HTMLImageElement | null>>([])
  const rotationCount = useRef(0)
  const explodeCount = useRef(0)
  const progressRef = useRef(0)
  const activeRef = useRef(-2)
  const [active, setActive] = useState(-1)
  const [ready, setReady] = useState(false)
  const [live, setLive] = useState(false)

  const paint = (image: HTMLImageElement | null) => {
    const canvas = canvasRef.current
    const box = frameRef.current
    if (!canvas || !box || !image) return false
    const ctx = canvas.getContext("2d")
    if (!ctx) return false
    const rect = box.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(rect.width * dpr))
    const height = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    ctx.drawImage(image, 0, 0, width, height)
    return true
  }

  const apply = (progress: number) => {
    progressRef.current = progress
    const count = components.length
    const sample = phaseAt(progress, count)
    const map = filmMap(count)
    const fade = 0.012

    const title = windowOpacity(progress, 0, map.turn - fade, fade)
    const turn = windowOpacity(progress, map.turn + fade, map.burst - fade, fade)
    const burst = windowOpacity(progress, map.burst + fade, map.parts - fade, fade)
    const span = (1 - map.parts) / map.count
    const edge = span * 0.16

    const captions = captionRefs.current
    const setCaption = (node: HTMLElement | null, opacity: number) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.visibility = opacity > 0.04 ? "visible" : "hidden"
      node.setAttribute("aria-hidden", opacity > 0.04 ? "false" : "true")
      node.style.transform = `translateY(calc(-50% + ${(1 - opacity) * 12}px))`
    }
    setCaption(captions[0] ?? null, title)
    setCaption(captions[1] ?? null, turn)
    setCaption(captions[2] ?? null, burst)
    components.forEach((_, index) => {
      const start = map.parts + index * span
      const end = start + span
      const opacity = windowOpacity(progress, start + edge, end - edge, edge)
      setCaption(captions[index + 3] ?? null, opacity)
    })

    railRefs.current.forEach((button, index) => {
      if (!button) return
      const on = sample.phase === "part" && sample.partIndex === index
      button.classList.toggle("on", on)
      button.style.opacity = sample.phase === "title" ? "0.35" : "1"
    })

    if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
    if (plusRef.current) {
      const show = sample.phase === "burst" ? smooth(sample.local) * (1 - Math.max(0, sample.local - 0.82) / 0.18) : sample.phase === "part" ? 0.35 : 0
      plusRef.current.style.opacity = String(show)
    }

    if (sample.partIndex !== activeRef.current) {
      activeRef.current = sample.partIndex
      setActive(sample.partIndex)
    }

    if (modeRef.current === "frames") {
      const turnLocal = sample.phase === "title" ? 0 : sample.phase === "turn" ? sample.local : 1
      const burstLocal = sample.phase === "title" || sample.phase === "turn" ? 0 : sample.phase === "burst" ? sample.local : 1
      const rotationFrame = frameIndex(turnLocal, rotationCount.current)
      const explodeFrame = frameIndex(burstLocal, explodeCount.current)
      const image =
        burstLocal > 0
          ? nearestReady(explodeRef.current, explodeFrame)
          : nearestReady(rotationRef.current, rotationFrame)
      if (paint(image)) frameRef.current?.setAttribute("data-painted", "true")
      return
    }

    const burstLocal = sample.phase === "burst" ? sample.local : sample.phase === "part" ? 1 : 0
    const burstEase = smooth(burstLocal)
    if (heroRef.current) {
      const spin = sample.phase === "turn" ? sample.local : sample.phase === "title" ? 0 : 1
      heroRef.current.style.opacity = String(1 - burstEase)
      heroRef.current.style.transform = `perspective(1100px) rotateY(${(-30 + spin * 62).toFixed(2)}deg) translateY(${(16 - spin * 22).toFixed(1)}px) scale(${(0.94 + spin * 0.06).toFixed(3)})`
    }
    if (explodedRef.current) {
      const hold = sample.phase === "part" ? 1 - smooth(Math.min(1, sample.local * 1.4)) * 0.55 : 1
      explodedRef.current.style.opacity = String(burstEase * hold)
      explodedRef.current.style.transform = `translateY(${((1 - burstEase) * 36).toFixed(1)}px) scale(${(0.97 + burstEase * 0.03).toFixed(3)})`
    }
    partRefs.current.forEach((node, index) => {
      if (!node) return
      const on = sample.phase === "part" && sample.partIndex === index ? windowOpacity(sample.local, 0.12, 0.88, 0.12) : 0
      node.style.opacity = String(on)
      node.style.transform = `scale(${(0.94 + on * 0.06).toFixed(3)})`
    })
  }

  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
  })
  useEffect(() => {
    api.current = { setProgress: (progress) => applyRef.current(progress) }
    applyRef.current(progressRef.current)
    return () => {
      api.current = null
    }
  }, [api])

  useEffect(() => {
    const box = frameRef.current
    if (!box) return
    const observer = new ResizeObserver(() => applyRef.current(progressRef.current))
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancel = false
    const stops: Array<() => void> = []
    modeRef.current = "stills"
    rotationRef.current = []
    explodeRef.current = []
    setLive(false)
    setReady(false)

    const arm = (kind: "rotation" | "explode", sequence: FrameSequence) => {
      const images: Array<HTMLImageElement | null> = Array.from({ length: sequence.count }, () => null)
      if (kind === "rotation") {
        rotationRef.current = images
        rotationCount.current = sequence.count
      } else {
        explodeRef.current = images
        explodeCount.current = sequence.count
      }
      const stop = loadFrames(sequenceUrls(sequence), (index, image) => {
        images[index] = image
        if (!cancel && index === 0 && kind === "rotation") {
          modeRef.current = "frames"
          setLive(true)
          setReady(true)
          applyRef.current(progressRef.current)
        }
        if (!cancel && modeRef.current === "frames") applyRef.current(progressRef.current)
      })
      stops.push(stop)
    }

    void (async () => {
      const [rotation, explode] = await Promise.all([
        discoverSequence(spec.frames?.rotation),
        discoverSequence(spec.frames?.explode),
      ])
      if (cancel) return
      if (rotation && explode) {
        arm("rotation", rotation)
        arm("explode", explode)
      } else {
        modeRef.current = "stills"
        setReady(true)
      }
    })()

    const giveUp = window.setTimeout(() => {
      if (cancel || modeRef.current === "frames") return
      modeRef.current = "stills"
      setLive(false)
      setReady(true)
      applyRef.current(progressRef.current)
    }, 2500)

    return () => {
      cancel = true
      window.clearTimeout(giveUp)
      for (const stop of stops) stop()
    }
  }, [spec])

  const heroSrc = spec.heroImage ? asset(spec.heroImage) : undefined
  const explodedSrc = spec.explodedImage ? asset(spec.explodedImage) : undefined
  const poster =
    spec.frames?.rotation && spec.frames.rotation.count > 1 ? asset(frameFile(spec.frames.rotation, 0)) : heroSrc

  return (
    <div className="sticky-stage">
      <div className="caption-col">
        <div className="caption" ref={(node) => { captionRefs.current[0] = node }} data-caption="title">
          <p className="kicker">{spec.item.maker}</p>
          <h1>
            <Title model={spec.item.model} emphasis={spec.item.emphasis} />
          </h1>
          <p className="sub">
            {spec.item.reference ? `Reference ${spec.item.reference}. ` : ""}
            {spec.item.year ?? "Scroll to turn it."}
          </p>
        </div>
        <div className="caption" ref={(node) => { captionRefs.current[1] = node }} data-caption="turn">
          <p className="kicker">Turn</p>
          <h2>One full revolution.</h2>
          <p className="sub">Scroll is the turntable. The last frame is where it comes apart.</p>
        </div>
        <div className="caption" ref={(node) => { captionRefs.current[2] = node }} data-caption="burst">
          <p className="kicker">Open</p>
          <h2>Along the stack.</h2>
          <p className="sub">
            {components
              .slice(0, 4)
              .map((component) => component.name)
              .join(", ")}
            . One continuous motion.
          </p>
        </div>
        {components.map((component, index) => (
          <div className="caption" key={component.id} ref={(node) => { captionRefs.current[index + 3] = node }} data-caption={component.id}>
            <p className="kicker">
              {String(index + 1).padStart(2, "0")} / {String(components.length).padStart(2, "0")}
            </p>
            <h2>{component.name}</h2>
            <p className="material">{component.material}</p>
            <p className="sub">{lead(component.howItsMade)}</p>
            {active === index ? <Stat component={component} /> : null}
          </div>
        ))}
      </div>

      <div className="canvas-col">
        <div className={`canvas-frame${live ? " is-live" : ""}`} ref={frameRef}>
          <canvas ref={canvasRef} aria-label={`${spec.item.name}, scroll to turn and open`} />
          {poster ? <img className="poster" src={poster} alt="" /> : null}
          <img ref={heroRef} className="still still-hero" src={heroSrc} alt="" />
          <img ref={explodedRef} className="still still-explode" src={explodedSrc} alt="" />
          {components.map((component, index) => (
            <img
              key={component.id}
              ref={(node) => { partRefs.current[index] = node }}
              className="still still-part"
              src={component.image ? asset(component.image) : undefined}
              alt=""
            />
          ))}
          <div className="pluses" ref={plusRef} aria-hidden="true">
            <span /><span /><span /><span />
          </div>
          <div className="edge-fade" />
        </div>
        <p className="scrub-label">{ready ? "Scroll" : "Loading frames"}</p>
        <div className="scrub-bar" aria-hidden="true">
          <span ref={barRef} />
        </div>
      </div>

      <ol className="part-rail">
        {components.map((component, index) => (
          <li key={component.id}>
            <button
              type="button"
              ref={(node) => { railRefs.current[index] = node }}
              onClick={() => onJump(component.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {component.name}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Stat({ component }: { component: ExplodeSpec["components"][number] }) {
  const line = component.funFacts[0]
  if (!line) return null
  return <p className="fact-line">{line}</p>
}
