import type { ComponentSpec } from "../spec/schema.ts"
import { CX, CY, VB } from "./geometry.ts"

function hue(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % 360
}

export function GenericPlate({ component }: { component: ComponentSpec }) {
  const tone = hue(component.id)
  const label = component.name.length > 22 ? `${component.name.slice(0, 20)}…` : component.name
  return (
    <svg viewBox={VB} className="h-full w-full overflow-visible" aria-hidden="true">
      <ellipse cx={CX} cy={CY + 18} rx="150" ry="46" fill="rgba(0,0,0,0.35)" />
      <circle cx={CX} cy={CY + 14} r="132" fill={`hsl(${tone} 18% 28%)`} />
      <circle cx={CX} cy={CY} r="132" fill={`hsl(${tone} 22% 46%)`} />
      <circle cx={CX} cy={CY} r="108" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        fill="#f4efe6"
        fontFamily="Fraunces, serif"
        fontSize="22"
      >
        {label}
      </text>
      <text
        x={CX}
        y={CY + 24}
        textAnchor="middle"
        fill="rgba(244,239,230,0.72)"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="11"
        letterSpacing="1.4"
      >
        STAND-IN
      </text>
    </svg>
  )
}
