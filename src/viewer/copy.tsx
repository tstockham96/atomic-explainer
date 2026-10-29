import type { ComponentSpec, ExplodeSpec } from "../spec/schema.ts"
import { asset } from "./asset.ts"

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function Title({ model, emphasis }: { model: string; emphasis?: string }) {
  if (!emphasis || !model.includes(emphasis)) {
    return (
      <h1 className="mt-2 font-serif text-[clamp(2.15rem,7vw,5rem)] leading-[0.9] font-medium tracking-[-0.03em] text-paper">
        {model}
      </h1>
    )
  }
  const [before, after] = model.split(emphasis)
  const trailing = model.trimEnd().endsWith(emphasis)
  return (
    <h1 className="mt-2 font-serif text-[clamp(2.15rem,7vw,5rem)] leading-[0.9] font-medium tracking-[-0.03em] text-paper">
      {before}
      <span className={trailing ? "mt-1 block font-normal text-brass italic" : "font-normal text-brass italic"}>{emphasis}</span>
      {after}
    </h1>
  )
}

export function IntroCopy({ spec }: { spec: ExplodeSpec }) {
  return (
    <div className="flex h-full flex-col">
      <p className="font-mono text-[0.72rem] tracking-[0.22em] text-brass uppercase">{spec.item.category} teardown</p>
      <p className="mt-6 font-mono text-[0.72rem] tracking-[0.18em] text-muted uppercase">{spec.item.maker}</p>
      <Title model={spec.item.model} emphasis={spec.item.emphasis} />
      <p className="mt-6 max-w-[38ch] text-[1.05rem] leading-relaxed font-light text-paper/90">{spec.item.summary}</p>
      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
        {spec.facts.slice(0, 4).map((fact) => (
          <div key={fact.label} className="border-t border-line pt-2">
            <dt className="font-mono text-[0.65rem] tracking-[0.16em] text-muted uppercase">{fact.label}</dt>
            <dd className="mt-1 text-[0.95rem] text-paper">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto pt-8 font-mono text-[0.72rem] tracking-[0.18em] text-muted uppercase">Scroll to take it apart</p>
    </div>
  )
}

export function ComponentCopy({
  component,
  index,
  count,
}: {
  component: ComponentSpec
  index: number
  count: number
}) {
  return (
    <div className="flex h-full flex-col pr-1">
      <p className="font-mono text-[0.72rem] tracking-[0.22em] text-brass uppercase">
        {pad(index + 1)} <span className="text-muted">/ {pad(count)}</span>
      </p>
      <h2 className="mt-4 font-serif text-[clamp(2.4rem,4vw,3.6rem)] leading-[0.95] font-medium tracking-[-0.03em] text-paper">
        {component.name}
      </h2>
      {component.figureLabel ? <p className="mt-3 text-sm text-brass/90 italic">{component.figureLabel}</p> : null}
      <p className="mt-8 font-mono text-[0.65rem] tracking-[0.18em] text-muted uppercase">Material</p>
      <p className="mt-2 max-w-[40ch] text-[1.02rem] leading-snug text-paper">{component.material}</p>
      <p className="mt-6 font-mono text-[0.65rem] tracking-[0.18em] text-muted uppercase">How it's made</p>
      <p className="mt-2 max-w-[46ch] text-[1.02rem] leading-relaxed font-light text-paper/90">{component.howItsMade}</p>
      <ul className="mt-6 space-y-3">
        {component.funFacts.map((fact) => (
          <li key={fact} className="border-l border-brass/70 pl-3 text-[0.95rem] leading-relaxed text-muted">
            {fact}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OutroCopy({ spec }: { spec: ExplodeSpec }) {
  return (
    <div className="flex h-full flex-col">
      <p className="font-mono text-[0.72rem] tracking-[0.22em] text-brass uppercase">Back on the wrist</p>
      <h2 className="mt-4 font-serif text-[clamp(2.5rem,4.4vw,3.8rem)] leading-[0.95] font-medium tracking-[-0.03em] text-paper">
        Put back together
      </h2>
      <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed font-light text-paper/90">
        {spec.closing ?? spec.item.summary}
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3">
        {spec.facts.map((fact) => (
          <div key={fact.label} className="border-t border-line pt-2">
            <dt className="font-mono text-[0.62rem] tracking-[0.14em] text-muted uppercase">{fact.label}</dt>
            <dd className="mt-1 text-sm text-paper">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {spec.heroImage ? (
        <img src={asset(spec.heroImage)} alt="" className="mt-5 h-28 w-full object-cover object-center opacity-80" />
      ) : null}
      {spec.sources.length > 0 ? (
        <ul className="mt-5 space-y-1">
          {spec.sources.map((source) => (
            <li key={source.url}>
              <a
                className="text-sm text-muted underline decoration-brass/40 underline-offset-4 hover:text-paper"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
