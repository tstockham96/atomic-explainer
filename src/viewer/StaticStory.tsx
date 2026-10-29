import { useMemo, useState } from "react"
import type { ExplodeSpec } from "../spec/schema.ts"
import { layoutFor } from "../spec/layout.ts"
import { LayerArt } from "../visuals/registry.tsx"
import { ComponentCopy, IntroCopy, OutroCopy } from "./copy.tsx"
import { Frame } from "./Frame.tsx"

export function StaticStory({ spec }: { spec: ExplodeSpec }) {
  const components = useMemo(
    () => [...spec.components].sort((a, b) => a.order - b.order),
    [spec],
  )
  const ordered = { ...spec, components }
  const [chapter, setChapter] = useState(-1)
  const count = components.length
  const active = chapter >= 0 && chapter < count ? chapter : null

  const jump = (index: number) => {
    setChapter(index)
    const id = index < 0 ? "intro" : index >= count ? "end" : components[index]?.id
    if (id) history.replaceState(null, "", `#${id}`)
  }

  return (
    <Frame
      spec={ordered}
      chapter={chapter}
      onJump={jump}
      variant="static"
      art={
        <div className="camera-rig">
          <div className="camera is-static">
            {components.map((component, index) => {
              const layout = layoutFor(component, index, count)
              const dim = active !== null && active !== index
              return (
                <div
                  key={component.id}
                  className="layer"
                  style={{
                    zIndex: component.zIndex ?? 80 - component.order,
                    transform: `translate3d(${layout.x * 42}%, ${layout.y * 38}%, 0)`,
                    opacity: dim ? 0.2 : 1,
                  }}
                >
                  <LayerArt component={component} />
                </div>
              )
            })}
          </div>
        </div>
      }
      panel={
        <div className="static-copy">
          {chapter < 0 ? <IntroCopy spec={ordered} /> : null}
          {active !== null && components[active] ? (
            <ComponentCopy component={components[active]} index={active} count={count} />
          ) : null}
          {chapter >= count ? <OutroCopy spec={ordered} /> : null}
          <div className="mt-8 flex gap-3">
            <button type="button" className="text-btn" onClick={() => jump(chapter < 0 ? 0 : Math.min(count, chapter + 1))}>
              {chapter >= count - 1 && chapter >= 0 ? "Finish" : "Next part"}
            </button>
            <button type="button" className="text-btn" onClick={() => jump(count)}>
              Specs
            </button>
          </div>
        </div>
      }
    />
  )
}
