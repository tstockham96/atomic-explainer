import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react"
import type { ExplodeSpec, FrameSequence } from "../spec/schema.ts"
import { filmMap, frameIndex, phaseAt, windowOpacity } from "../spec/film.ts"
import { cameraAt, focusTour, type CameraPose } from "../spec/camera.ts"
import { frameFile } from "../spec/frames.ts"
import { asset } from "./asset.ts"
import { discoverSequence, loadFrames, nearestReady, sequenceUrls } from "./sequence.ts"

export interface ReelHandle {
  setProgress: (progress: number) => void
}

/** One canvas, one world. The camera never substitutes an isolated component photo. */
export function Reel({ spec, ref }: { spec: ExplodeSpec; ref: Ref<ReelHandle> }) {
  const tour = focusTour(spec)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const captionRefs = useRef<Array<HTMLDivElement | null>>([])
  const progressRef = useRef(0)
  const rotationRef = useRef<Array<HTMLImageElement | null>>([])
  const explodeRef = useRef<Array<HTMLImageElement | null>>([])
  const stillsRef = useRef<{ hero: HTMLImageElement | null; exploded: HTMLImageElement | null }>({
    hero: null,
    exploded: null,
  })
  const spriteRef = useRef<HTMLCanvasElement | null>(null)
  const spriteImageRef = useRef<HTMLImageElement | null>(null)
  const requestRef = useRef(0)
  const [motion, setMotion] = useState<"loading" | "ready" | "still">("loading")

  // Feather only the image's outside edge; the object and all its components stay in one plane.
  const sprite = (image: HTMLImageElement) => {
    const buffer = spriteRef.current ?? document.createElement("canvas")
    spriteRef.current = buffer
    if (spriteImageRef.current === image) return buffer
    buffer.width = image.naturalWidth
    buffer.height = image.naturalHeight
    const context = buffer.getContext("2d")!
    context.drawImage(image, 0, 0)
    context.globalCompositeOperation = "destination-in"
    const horizontal = context.createLinearGradient(0, 0, buffer.width, 0)
    horizontal.addColorStop(0, "transparent")
    horizontal.addColorStop(0.1, "black")
    horizontal.addColorStop(0.9, "black")
    horizontal.addColorStop(1, "transparent")
    context.fillStyle = horizontal
    context.fillRect(0, 0, buffer.width, buffer.height)
    const vertical = context.createLinearGradient(0, 0, 0, buffer.height)
    vertical.addColorStop(0, "transparent")
    vertical.addColorStop(0.025, "black")
    vertical.addColorStop(0.975, "black")
    vertical.addColorStop(1, "transparent")
    context.fillStyle = vertical
    context.fillRect(0, 0, buffer.width, buffer.height)
    context.globalCompositeOperation = "source-over"
    spriteImageRef.current = image
    return buffer
  }

  const paint = (image: HTMLImageElement, camera: CameraPose) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.fillStyle = "#151515"
    context.fillRect(0, 0, width, height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    const fit = Math.min((width * 0.9) / image.naturalWidth, (height * 0.92) / image.naturalHeight)
    const imageWidth = image.naturalWidth * fit * camera.scale
    const imageHeight = image.naturalHeight * fit * camera.scale
    const narrow = width < 700
    const anchorX = width * (0.5 - (narrow ? 0 : 0.14) * camera.focus)
    const anchorY = height * (0.48 - (narrow ? 0.14 : 0) * camera.focus)
    context.drawImage(
      sprite(image),
      anchorX - imageWidth * camera.x,
      anchorY - imageHeight * camera.y,
      imageWidth,
      imageHeight,
    )
  }

  const apply = () => {
    const progress = progressRef.current
    // A spec without authored targets ends after the explosion instead of inventing positions.
    const sample = phaseAt(tour.length ? progress : progress * filmMap(1).parts, tour.length)
    const target = sample.phase === "part" ? tour[sample.partIndex] : undefined
    const camera = cameraAt(sample.local, target)
    const setCaption = (node: HTMLElement | null, opacity: number) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.visibility = opacity > 0.02 ? "visible" : "hidden"
      node.setAttribute("aria-hidden", String(opacity <= 0.02))
      node.style.translate = `0 ${(1 - opacity) * 12}px`
    }
    setCaption(titleRef.current, windowOpacity(progress, 0, 0.025, 0.03))
    captionRefs.current.forEach((node, index) => {
      setCaption(
        node,
        target && sample.partIndex === index ? windowOpacity(sample.local, 0.34, 0.68, 0.16) : 0,
      )
    })

    const rotation = rotationRef.current
    const explosion = explodeRef.current
    let image: HTMLImageElement | null
    if (sample.phase === "title" || sample.phase === "turn") {
      image =
        nearestReady(rotation, frameIndex(sample.phase === "title" ? 0 : sample.local, rotation.length)) ??
        stillsRef.current.hero
    } else {
      // Keep the exact final exploded frame for every camera move, including the pullbacks.
      const index =
        sample.phase === "burst" ? frameIndex(sample.local, explosion.length) : explosion.length - 1
      image = nearestReady(explosion, index) ?? stillsRef.current.exploded ?? stillsRef.current.hero
    }
    if (image) paint(image, camera)
  }

  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
  })
  const schedule = () => {
    if (requestRef.current) return
    requestRef.current = requestAnimationFrame(() => {
      requestRef.current = 0
      applyRef.current()
    })
  }
  // `schedule` only touches refs, so the first instance stays valid.
  const scheduleRef = useRef(schedule)

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (progress) => {
        progressRef.current = progress
        scheduleRef.current()
      },
    }),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const observer = new ResizeObserver(() => scheduleRef.current())
    if (canvas) observer.observe(canvas)
    scheduleRef.current()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(requestRef.current)
      requestRef.current = 0
    }
  }, [])

  // A new spec restarts loading during render rather than from an effect.
  const [loadedSpec, setLoadedSpec] = useState(spec)
  if (loadedSpec !== spec) {
    setLoadedSpec(spec)
    setMotion("loading")
  }

  useEffect(() => {
    let cancelled = false
    const stops: Array<() => void> = []
    rotationRef.current = []
    explodeRef.current = []
    stillsRef.current = { hero: null, exploded: null }

    const loadStill = (kind: "hero" | "exploded", path?: string) => {
      if (!path) return
      const image = new Image()
      image.onload = () => {
        if (cancelled) return
        stillsRef.current[kind] = image
        schedule()
      }
      image.src = asset(path)
      stops.push(() => {
        image.onload = null
      })
    }
    const rotation = spec.frames?.rotation
    const explosion = spec.frames?.explode
    loadStill("hero", rotation && rotation.count > 1 ? frameFile(rotation, 0) : spec.heroImage)
    loadStill(
      "exploded",
      explosion && explosion.count > 1 ? frameFile(explosion, explosion.count - 1) : spec.explodedImage,
    )

    const arm = (kind: "rotation" | "explode", sequence: FrameSequence) => {
      const frames: Array<HTMLImageElement | null> = Array.from({ length: sequence.count }, () => null)
      if (kind === "rotation") rotationRef.current = frames
      else explodeRef.current = frames
      stops.push(
        loadFrames(sequenceUrls(sequence), (index, image) => {
          if (cancelled) return
          frames[index] = image
          if (kind === "rotation" && index === 0) setMotion("ready")
          schedule()
        }),
      )
    }
    void (async () => {
      const [turn, burst] = await Promise.all([discoverSequence(rotation), discoverSequence(explosion)])
      if (cancelled) return
      if (turn && burst) {
        arm("rotation", turn)
        arm("explode", burst)
      } else setMotion("still")
    })()
    const timeout = window.setTimeout(() => {
      if (!cancelled && !rotationRef.current.some(Boolean)) setMotion("still")
    }, 8000)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      stops.forEach((stop) => stop())
    }
  }, [spec])

  return (
    <div className="object-film">
      <canvas
        ref={canvasRef}
        className="object-canvas"
        role="img"
        aria-label={`${spec.item.name}, rotating and separating into its components as you scroll`}
      />
      <div className="film-title" ref={titleRef}>
        <p>{spec.item.maker}</p>
        <h1>{spec.item.model}</h1>
        <span>
          {motion === "loading"
            ? "Preparing the object"
            : motion === "still"
              ? "Still-image study · scroll to explore"
              : "Scroll to look inside"}{" "}
          <span aria-hidden="true">↓</span>
        </span>
      </div>
      {tour.map((target, index) => (
        <div
          key={target.componentId}
          className="focus-caption"
          ref={(node) => {
            captionRefs.current[index] = node
          }}
          aria-hidden="true"
        >
          <p className="kicker">
            {String(index + 1).padStart(2, "0")} / {String(tour.length).padStart(2, "0")}
          </p>
          <h2>{target.component.name}</h2>
          <p className="focus-material">{target.component.material}</p>
          <p className="focus-description">
            {target.component.howItsMade
              .split(/(?<=[.!?])\s/)
              .slice(0, 2)
              .join(" ")}
          </p>
        </div>
      ))}
    </div>
  )
}
