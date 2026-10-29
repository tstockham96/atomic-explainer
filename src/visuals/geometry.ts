export const VB = "0 0 800 800"
export const CX = 400
export const CY = 400

export function polar(index: number, radius: number, steps = 12) {
  const angle = (index / steps) * Math.PI * 2 - Math.PI / 2
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius] as const
}

/** Even-odd donut centered on the watch. */
export function donut(cx: number, cy: number, outer: number, inner: number) {
  return [
    `M ${cx - outer} ${cy}`,
    `a ${outer} ${outer} 0 1 0 ${outer * 2} 0`,
    `a ${outer} ${outer} 0 1 0 ${-outer * 2} 0`,
    `M ${cx - inner} ${cy}`,
    `a ${inner} ${inner} 0 1 1 ${inner * 2} 0`,
    `a ${inner} ${inner} 0 1 1 ${-inner * 2} 0`,
  ].join(" ")
}
