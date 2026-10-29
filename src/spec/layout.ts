import type { ComponentSpec } from "./schema.ts"

export interface ResolvedLayout {
  x: number
  y: number
  focus: number
}

export function layoutFor(component: ComponentSpec, index: number, count: number): ResolvedLayout {
  if (component.layout) {
    return {
      x: component.layout.x,
      y: component.layout.y,
      focus: component.layout.focus ?? (component.placement === "side" ? 1.55 : 1.2),
    }
  }

  const mid = (count - 1) / 2
  const span = Math.min(0.16, 1.15 / Math.max(count, 1))

  if (component.placement === "side") {
    return { x: 0.36, y: (index - mid) * span * 0.35, focus: 1.6 }
  }

  if (component.placement === "strap") {
    return { x: 0, y: Math.abs(index - mid) * span + 0.12, focus: 1.08 }
  }

  return { x: 0, y: (index - mid) * span * 2.15, focus: 1.2 }
}
