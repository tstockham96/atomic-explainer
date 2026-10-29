import type { ReactNode } from "react"
import { VB } from "./geometry.ts"

export function WatchSvg({ id, children }: { id: string; children: ReactNode }) {
  return (
    <svg viewBox={VB} className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f6f8" />
          <stop offset="18%" stopColor="#c5cbcf" />
          <stop offset="42%" stopColor="#8e959c" />
          <stop offset="63%" stopColor="#e1e5e8" />
          <stop offset="100%" stopColor="#6a7178" />
        </linearGradient>
        <linearGradient id={`${id}-polish`} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#d5dbe0" />
          <stop offset="100%" stopColor="#8b9298" />
        </linearGradient>
        <linearGradient id={`${id}-leather`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a241e" />
          <stop offset="18%" stopColor="#0c0b0a" />
          <stop offset="50%" stopColor="#1c1814" />
          <stop offset="82%" stopColor="#090807" />
          <stop offset="100%" stopColor="#241e18" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="70%" stopColor="#d7e7f4" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#8eb4d4" stopOpacity="0.62" />
        </radialGradient>
        <radialGradient id={`${id}-ruby`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffe4e6" />
          <stop offset="42%" stopColor="#d23b4c" />
          <stop offset="100%" stopColor="#6a1520" />
        </radialGradient>
        <radialGradient id={`${id}-plate`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#e7ebef" />
          <stop offset="55%" stopColor="#b7bdc4" />
          <stop offset="100%" stopColor="#8b929a" />
        </radialGradient>
        <pattern id={`${id}-rotor`} width="7" height="8" patternUnits="userSpaceOnUse">
          <rect width="7" height="8" fill="#aeb6be" />
          <rect width="2.2" height="8" fill="#d7dde3" />
        </pattern>
      </defs>
      {children}
    </svg>
  )
}
