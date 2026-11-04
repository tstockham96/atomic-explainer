import { useMemo } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { asset } from "./asset.ts"
import { PhotoLayer } from "./PhotoLayer.tsx"

export function ExplodePoster({
  spec,
  chapter,
  onJump,
}: {
  spec: ExplodeSpec
  chapter: number
  onJump: (index: number) => void
}) {
  const components = useMemo(() => [...spec.components].sort((a, b) => a.order - b.order), [spec.components])
  const studio = spec.studio ?? "light"
  const overview = chapter < 0 || chapter >= components.length
  const active = overview ? null : components[chapter]

  return (
    <div className={`poster studio-${studio}${overview ? " is-overview" : ""}`}>
      <header className="poster-head">
        <p className="poster-mark">explode</p>
        <h1>{spec.item.model}</h1>
        <p className="poster-sub">
          {spec.item.reference ? `${spec.item.reference} · ` : ""}
          Main components and how they fit together
        </p>
      </header>

      <div className="board" role="list">
        {components.map((component, index) => {
          const on = chapter === index
          const above = index % 2 === 0
          const callout = (
            <div className="callout">
              <p className="callout-name">
                {index + 1}. {component.name}
              </p>
              <p className="callout-desc">{component.material}</p>
              {component.figureLabel ? <p className="callout-note">{component.figureLabel}</p> : null}
            </div>
          )
          return (
            <div className={on ? "part-col on" : "part-col"} key={component.id} role="listitem">
              <div className="slot above">
                {above ? (
                  <>
                    {callout}
                    <div className="stem down" aria-hidden="true" />
                  </>
                ) : null}
              </div>
              <button
                type="button"
                className="part"
                aria-current={on ? "true" : undefined}
                onClick={() => onJump(index)}
              >
                <PhotoLayer src={component.image} label={component.name} />
              </button>
              <div className="slot below">
                {above ? null : (
                  <>
                    <div className="stem up" aria-hidden="true" />
                    {callout}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="insets">
        <article className="inset">
          <h2>Assembled view</h2>
          {spec.heroImage ? (
            <img src={asset(spec.heroImage)} alt="" className="inset-photo" />
          ) : (
            <p className="inset-empty">No assembled photograph yet.</p>
          )}
        </article>
        <article className="inset">
          <h2>Dimensions</h2>
          <dl className="dims">
            {spec.facts.slice(0, 6).map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className="inset inset-copy">
          <h2>{active ? active.name : "How it’s made"}</h2>
          <p>{active ? active.howItsMade : spec.item.summary}</p>
        </article>
      </div>

      {spec.artNote ? <p className="footnote">{spec.artNote}</p> : null}
    </div>
  )
}
