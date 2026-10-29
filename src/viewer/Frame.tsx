import type { ReactNode, RefObject } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"

function artNote(spec: ExplodeSpec) {
  if (spec.artNote) return spec.artNote
  if (spec.visualMode === "generated") return "Layer photography generated for this teardown."
  if (spec.visualMode === "mixed") return "Some layers are generated photographs. The rest are illustrated stand-ins."
  return "Illustrated stand-in. Run explode with an image model to replace these layers."
}

export function Frame({
  spec,
  chapter,
  onJump,
  art,
  panel,
  progressRef,
  variant,
}: {
  spec: ExplodeSpec
  chapter: number
  onJump: (index: number) => void
  art: ReactNode
  panel: ReactNode
  progressRef?: RefObject<HTMLSpanElement | null>
  variant: "scroll" | "static"
}) {
  const count = spec.components.length

  return (
    <div className={variant === "scroll" ? "frame" : "frame frame-static"}>
      <header className="flex items-center justify-between px-5 pt-4 pb-3 sm:px-8">
        <a href="#intro" className="font-serif text-xl tracking-tight text-paper" onClick={(event) => {
          event.preventDefault()
          onJump(-1)
        }}>
          explode
        </a>
        <p className="hidden font-mono text-[0.68rem] tracking-[0.2em] text-muted uppercase sm:block">
          {spec.item.model}
          {spec.item.reference ? ` · ${spec.item.reference}` : ""}
        </p>
        <p className="font-mono text-[0.68rem] tracking-[0.16em] text-brass uppercase">
          {chapter < 0 ? "Assembled" : chapter >= count ? "Whole" : spec.components[chapter]?.name}
        </p>
      </header>
      <div className="progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
      <div className="stage">
        <nav className="rail" aria-label="Components">
          {spec.components.map((component, index) => (
            <button
              key={component.id}
              type="button"
              className={chapter === index ? "rail-btn on" : "rail-btn"}
              aria-current={chapter === index ? "true" : undefined}
              onClick={() => onJump(index)}
            >
              <span className="dot" />
              <span className="rail-label">{component.name}</span>
            </button>
          ))}
        </nav>
        <div className="art">
          <div className="finder" aria-hidden="true" />
          <div className="ground" aria-hidden="true" />
          {art}
        </div>
        <aside className="panel">{panel}</aside>
      </div>
      <p className="footnote">{artNote(spec)}</p>
    </div>
  )
}
