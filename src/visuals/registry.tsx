import type { ReactNode } from "react"
import type { ComponentSpec } from "../spec/schema.ts"
import { asset } from "../viewer/asset.ts"
import { GenericPlate } from "./generic.tsx"
import { Buckle, Case, Caseback, Crown, Crystal, Dial, Hands, Movement, Strap } from "./murph.tsx"

const murphLayers: Record<string, () => ReactNode> = {
  "murph-crystal": Crystal,
  "murph-hands": Hands,
  "murph-dial": Dial,
  "murph-movement": Movement,
  "murph-crown": Crown,
  "murph-case": Case,
  "murph-caseback": Caseback,
  "murph-strap": Strap,
  "murph-buckle": Buckle,
}

export function LayerArt({ component }: { component: ComponentSpec }) {
  if (component.image) {
    return (
      <img
        src={asset(component.image)}
        alt=""
        className="h-full w-full object-contain"
        draggable={false}
      />
    )
  }

  const Illustrated = component.visual ? murphLayers[component.visual] : undefined
  if (Illustrated) return <Illustrated />
  return <GenericPlate component={component} />
}
