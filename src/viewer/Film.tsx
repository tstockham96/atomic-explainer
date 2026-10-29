import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ComponentSpec, ExplodeSpec } from "../spec/schema.ts"
import { ExplodePoster } from "./ExplodePoster.tsx"
import { PhotoLayer } from "./PhotoLayer.tsx"

gsap.registerPlugin(ScrollTrigger, useGSAP)

function firstStat(component: ComponentSpec) {
  for (const line of [...component.funFacts, component.material]) {
    const match = line.match(/(?:^|[^\w.-])(\d[\d,]*(?:\.\d+)?)(?![\w.-])/)
    const raw = match?.[1]
    if (!match || match.index == null || !raw) continue
    const start = match.index + match[0].length - raw.length
    const target = Number(raw.replace(/,/g, ""))
    if (!Number.isFinite(target)) continue
    return {
      prefix: line.slice(0, start),
      suffix: line.slice(start + raw.length),
      target,
      decimals: raw.includes(".") ? (raw.split(".")[1]?.length ?? 1) : 0,
    }
  }
  return null
}

function StatLine({
  component,
  play,
  reduced,
}: {
  component: ComponentSpec
  play: boolean
  reduced: boolean
}) {
  const stat = useMemo(() => firstStat(component), [component])
  const [value, setValue] = useState(() => firstStat(component)?.target ?? 0)

  useEffect(() => {
    if (!stat) return
    if (!play || reduced) {
      setValue(stat.target)
      return
    }
    const start = performance.now()
    let frame = 0
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100)
      const eased = 1 - (1 - t) ** 3
      setValue(from + (stat.target - from) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    setValue(0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [play, reduced, stat])

  if (!stat) return null
  const shown = stat.decimals > 0 ? value.toFixed(stat.decimals) : Math.round(value).toLocaleString("en-US")
  return (
    <p className="stat-line">
      {stat.prefix}
      <strong>{shown}</strong>
      {stat.suffix}
    </p>
  )
}

export function Film({ spec, reduced = false }: { spec: ExplodeSpec; reduced?: boolean }) {
  const components = useMemo(
    () => [...spec.components].sort((a, b) => a.order - b.order),
    [spec],
  )
  const ordered = useMemo(() => ({ ...spec, components }), [spec, components])
  const studio = ordered.studio ?? "light"
  const rootRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const [activeId, setActiveId] = useState<string>("intro")

  const go = (id: string) => {
    const node = document.getElementById(id)
    if (!node) return
    history.replaceState(null, "", `#${id}`)
    if (lenisRef.current) lenisRef.current.scrollTo(node, { duration: 1.15, offset: 0 })
    else node.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
  }

  useGSAP(
    () => {
      if (reduced) return
      const root = rootRef.current
      if (!root) return

      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        autoRaf: false,
        anchors: false,
      })
      lenis.on("scroll", ScrollTrigger.update)
      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      lenisRef.current = lenis

      const hero = root.querySelector<HTMLElement>("[data-scene='hero']")
      const heroPhoto = hero?.querySelector(".hero-photo")
      if (hero && heroPhoto) {
        gsap.fromTo(
          heroPhoto,
          { scale: 0.84, rotateY: -18, rotateX: 8 },
          {
            scale: 1,
            rotateY: 0,
            rotateX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "+=90%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
              onToggle: (self) => {
                if (self.isActive) setActiveId("intro")
              },
            },
          },
        )
        gsap.from(hero.querySelectorAll(".hero-copy > *"), {
          y: 28,
          autoAlpha: 0,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: hero, start: "top 80%", toggleActions: "play none none reverse" },
        })
      }

      const explode = root.querySelector<HTMLElement>("[data-scene='explode']")
      const cols = explode ? [...explode.querySelectorAll<HTMLElement>(".part-col")] : []
      if (explode && cols.length > 0) {
        const mid = (cols.length - 1) / 2
        const gather = Math.min(42, window.innerWidth / 32)
        gsap.set(cols, {
          x: (index) => (index - mid) * -gather,
          filter: "blur(3px)",
        })
        gsap.set(explode.querySelectorAll(".callout, .stem, .insets, .poster-head"), { autoAlpha: 0, y: 16 })
        const timeline = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: explode,
            start: "top top",
            end: "+=130%",
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            onToggle: (self) => {
              if (self.isActive) setActiveId("explode")
            },
          },
        })
        timeline.to(cols, { x: 0, filter: "blur(0px)", duration: 0.7 }, 0)
        timeline.to(explode.querySelector(".poster-head"), { autoAlpha: 1, y: 0, duration: 0.35 }, 0.05)
        timeline.to(explode.querySelectorAll(".callout, .stem"), { autoAlpha: 1, y: 0, duration: 0.4 }, 0.35)
        timeline.to(explode.querySelector(".insets"), { autoAlpha: 1, y: 0, duration: 0.3 }, 0.62)
      }

      root.querySelectorAll<HTMLElement>("[data-scene='part']").forEach((scene) => {
        const photo = scene.querySelector(".chapter-photo")
        const copy = scene.querySelector(".chapter-copy")
        const id = scene.id
        gsap.fromTo(
          photo,
          { scale: 0.96, filter: "blur(2px)" },
          {
            scale: 1.03,
            filter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: scene,
              start: "top top",
              end: "+=85%",
              pin: true,
              scrub: 0.55,
              anticipatePin: 1,
              onToggle: (self) => {
                if (self.isActive) setActiveId(id)
              },
            },
          },
        )
        if (copy) {
          gsap.from(copy, {
            y: 36,
            autoAlpha: 0,
            ease: "power3.out",
            scrollTrigger: { trigger: scene, start: "top 75%", toggleActions: "play none none reverse" },
          })
        }
      })

      const close = root.querySelector<HTMLElement>("[data-scene='close']")
      if (close) {
        gsap.from(close.querySelectorAll(".close-block"), {
          y: 24,
          autoAlpha: 0,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: close,
            start: "top 70%",
            toggleActions: "play none none reverse",
            onToggle: (self) => {
              if (self.isActive) setActiveId("end")
            },
          },
        })
      }

      const hash = window.location.hash.replace("#", "")
      if (hash) {
        requestAnimationFrame(() => {
          const node = document.getElementById(hash)
          if (node) lenis.scrollTo(node, { immediate: true, force: true })
        })
      }

      return () => {
        lenis.destroy()
        lenisRef.current = null
        gsap.ticker.remove(tick)
      }
    },
    { scope: rootRef, dependencies: [ordered, reduced] },
  )

  return (
    <div ref={rootRef} className={`film studio-${studio}${reduced ? " is-reduced" : ""}`}>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <nav className="progress-rail" aria-label="Chapters">
        <button type="button" className={activeId === "intro" ? "on" : ""} onClick={() => go("intro")} aria-label="Open" />
        <button type="button" className={activeId === "explode" ? "on" : ""} onClick={() => go("explode")} aria-label="Exploded view" />
        {components.map((component) => (
          <button
            key={component.id}
            type="button"
            className={activeId === component.id ? "on" : ""}
            onClick={() => go(component.id)}
            aria-label={component.name}
          />
        ))}
        <button type="button" className={activeId === "end" ? "on" : ""} onClick={() => go("end")} aria-label="Close" />
      </nav>

      <section className="scene hero-scene" id="intro" data-scene="hero">
        <div className="hero-copy">
          <p className="eyebrow">{ordered.item.maker}</p>
          <h1>{ordered.item.model}</h1>
          <p className="lede">{ordered.item.summary}</p>
        </div>
        <div className="hero-stage">
          <div className="hero-photo">
            <PhotoLayer src={ordered.heroImage} label={ordered.item.name} priority />
          </div>
        </div>
        <p className="scroll-cue">Scroll</p>
      </section>

      <section className="scene explode-scene" id="explode" data-scene="explode">
        <ExplodePoster spec={ordered} chapter={-1} onJump={(index) => go(components[index]?.id ?? "explode")} />
      </section>

      {components.map((component, index) => (
        <section className="scene chapter-scene" id={component.id} data-scene="part" data-flip={index % 2 === 1 ? "true" : "false"} key={component.id}>
          <div className="chapter-photo">
            <PhotoLayer src={component.image} label={component.name} />
          </div>
          <div className="chapter-copy">
            <p className="eyebrow">
              {String(index + 1).padStart(2, "0")} / {String(components.length).padStart(2, "0")}
            </p>
            <h2>{component.name}</h2>
            {component.figureLabel ? <p className="chapter-note">{component.figureLabel}</p> : null}
            <p className="material">{component.material}</p>
            <StatLine component={component} play={reduced || activeId === component.id} reduced={reduced} />
            <p className="story">{component.howItsMade}</p>
          </div>
        </section>
      ))}

      <section className="scene close-scene" id="end" data-scene="close">
        <div className="close-block">
          <p className="eyebrow">Whole</p>
          <h2>{ordered.item.model}</h2>
          <p className="story">{ordered.closing ?? ordered.item.summary}</p>
        </div>
        <dl className="close-facts close-block">
          {ordered.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        {ordered.artNote ? <p className="close-note close-block">{ordered.artNote}</p> : null}
        {ordered.sources.length > 0 ? (
          <ul className="close-sources close-block">
            {ordered.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
