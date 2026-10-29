import type { ReactNode } from "react"
import { CX, CY, donut, polar } from "./geometry.ts"
import { fillsFor } from "./fills.ts"
import { WatchSvg } from "./WatchSvg.tsx"

const BEIGE = "#e6d3aa"
const INK = "#141210"

function Layer({ id, children }: { id: string; children: ReactNode }) {
  return <WatchSvg id={id}>{children}</WatchSvg>
}

export function Crystal() {
  const id = "crystal"
  const glass = fillsFor(id).glass
  return (
    <Layer id={id}>
      <path
        d={`M ${CX - 132} ${CY + 28} A 146 146 0 0 0 ${CX + 132} ${CY + 28}`}
        fill="none"
        stroke="rgba(176, 208, 228, 0.55)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r={144} fill={glass} />
      <circle cx={CX} cy={CY} r={144} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" />
      <circle cx={CX} cy={CY} r={134} fill="none" stroke="rgba(170, 214, 245, 0.8)" strokeWidth="5" />
      <circle cx={CX} cy={CY} r={126} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <ellipse cx={CX - 48} cy={CY - 58} rx="54" ry="16" fill="white" opacity="0.28" transform={`rotate(-32 ${CX - 48} ${CY - 58})`} />
      <ellipse cx={CX + 36} cy={CY + 48} rx="28" ry="8" fill="white" opacity="0.1" transform={`rotate(-28 ${CX + 36} ${CY + 48})`} />
    </Layer>
  )
}

export function Hands() {
  const id = "hands"
  return (
    <Layer id={id}>
      <g transform={`translate(${CX} ${CY})`}>
        <g transform="rotate(198)">
          <line x1="0" y1="26" x2="0" y2="-128" stroke={BEIGE} strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <g transform="rotate(60)">
          <path
            fill={BEIGE}
            stroke="#f6edd8"
            strokeWidth="0.6"
            fillRule="evenodd"
            d="M -2.3 18 L -2.8 -34 C -7.2 -56 -7.4 -86 -6 -108 C -4.6 -128 -2 -142 0 -150 C 2 -142 4.6 -128 6 -108 C 7.4 -86 7.2 -56 2.8 -34 L 2.3 18 Z M 0 -46 C 3.2 -58 3.3 -96 0 -118 C -3.3 -96 -3.2 -58 0 -46 Z"
          />
        </g>
        <g transform="rotate(305)">
          <path
            fill={BEIGE}
            stroke="#f6edd8"
            strokeWidth="0.6"
            fillRule="evenodd"
            d="M -3.4 16 L -4.4 -16 C -12 -38 -13.2 -60 -11 -78 C -8.8 -96 -4 -108 0 -116 C 4 -108 8.8 -96 11 -78 C 13.2 -60 12 -38 4.4 -16 L 3.4 16 Z M 0 -34 C 5.2 -46 5.4 -74 0 -92 C -5.4 -74 -5.2 -46 0 -34 Z"
          />
        </g>
        <circle r="7.5" fill="#efe6d4" />
        <circle r="3.1" fill="#2a2724" />
      </g>
    </Layer>
  )
}

export function Dial() {
  const id = "dial"
  return (
    <Layer id={id}>
      <circle cx={CX} cy={CY + 12} r={132} fill="#050505" />
      <circle cx={CX} cy={CY} r={132} fill="#0c0c0c" />
      <circle cx={CX} cy={CY} r={132} fill="url(#dial-sheen)" />
      <defs>
        <radialGradient id="dial-sheen" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#1c1c1c" />
          <stop offset="70%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={126} fill="none" stroke={BEIGE} strokeOpacity="0.85" strokeWidth="1.1" />
      <Ticks />
      {Array.from({ length: 12 }, (_, index) => {
        const [x, y] = polar(index === 0 ? 12 : index, 96)
        const label = String(index === 0 ? 12 : index)
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={BEIGE}
            fontFamily="Fraunces, serif"
            fontSize={label.length > 1 ? 20 : 24}
            fontWeight="500"
          >
            {label}
          </text>
        )
      })}
      <text
        x={CX}
        y={CY - 52}
        textAnchor="middle"
        fill={BEIGE}
        fontFamily="Fraunces, serif"
        fontSize="15"
        letterSpacing="4.5"
      >
        HAMILTON
      </text>
      <text
        x={CX}
        y={CY + 58}
        textAnchor="middle"
        fill={BEIGE}
        fontFamily="Outfit, sans-serif"
        fontSize="9"
        letterSpacing="2.4"
      >
        KHAKI AUTOMATIC
      </text>
    </Layer>
  )
}

function Ticks() {
  return (
    <g>
      {Array.from({ length: 60 }, (_, index) => {
        const [x1, y1] = point(index, index % 5 === 0 ? 112 : 118)
        const [x2, y2] = point(index, 126)
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={BEIGE}
            strokeWidth={index % 5 === 0 ? 2.15 : 0.9}
          />
        )
      })}
    </g>
  )
}

function point(index: number, radius: number) {
  const angle = (index / 60) * Math.PI * 2 - Math.PI / 2
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius] as const
}

export function Movement() {
  const id = "movement"
  const fill = fillsFor(id)
  const jewels = [
    [CX - 48, CY - 36],
    [CX + 18, CY - 58],
    [CX + 62, CY - 8],
    [CX - 20, CY + 8],
    [CX + 36, CY + 34],
    [CX - 58, CY + 28],
    [CX + 8, CY + 62],
    [CX - 30, CY - 70],
  ]
  return (
    <Layer id={id}>
      <circle cx={CX} cy={CY + 12} r={118} fill="#5e656c" />
      <circle cx={CX} cy={CY} r={118} fill={fill.plate} />
      <Perlage />
      <circle cx={CX - 34} cy={CY + 6} r="26" fill="none" stroke="#8e969e" strokeWidth="5" strokeDasharray="3.2 2.1" />
      <circle cx={CX + 28} cy={CY + 22} r="16" fill="none" stroke="#9aa2aa" strokeWidth="4" strokeDasharray="2.4 1.8" />
      <path
        d={`M ${CX - 78} ${CY - 18} h 70 v 36 h -58 z`}
        fill="#c5ccd2"
        stroke="#f7f8f8"
        strokeWidth="1"
      />
      <path
        d={`M ${CX + 8} ${CY - 78} h 54 v 48 h -40 z`}
        fill="#b7c0c7"
        stroke="#f4f6f7"
        strokeWidth="1"
      />
      <g transform={`translate(${CX + 62} ${CY - 46})`}>
        <circle r="30" fill="none" stroke="#d5dbe1" strokeWidth="3.2" />
        <circle r="22" fill="none" stroke="#8d959c" strokeWidth="1.2" />
        <path d="M 0 -18 L 4 0 L 0 18 L -4 0 Z" fill="#dfe4e8" />
        <path d="M -18 0 L 0 4 L 18 0 L 0 -4 Z" fill="#dfe4e8" />
        <circle r="4.5" fill={fill.ruby} />
        <path d="M 8 8 C 16 2 20 -8 14 -16" fill="none" stroke="#6e767e" strokeWidth="1.1" />
      </g>
      {jewels.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="5.2" fill="#8d949b" />
          <circle cx={x} cy={y} r="3.3" fill={fill.ruby} />
        </g>
      ))}
      <path d={`M ${CX - 108} ${CY + 6} A 108 108 0 0 0 ${CX + 108} ${CY + 6} Z`} fill={fill.rotor} opacity="0.96" />
      <text
        x={CX}
        y={CY + 58}
        textAnchor="middle"
        fill={INK}
        fontFamily="Fraunces, serif"
        fontSize="13"
        letterSpacing="3"
      >
        HAMILTON
      </text>
      <circle cx={CX} cy={CY + 24} r="7" fill="#8a929a" />
      <circle cx={CX} cy={CY + 24} r="2.4" fill={fill.ruby} />
    </Layer>
  )
}

function Perlage() {
  const dots = []
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const x = CX - 96 + col * 24
      const y = CY - 96 + row * 24
      const dx = x - CX
      const dy = y - CY
      if (dx * dx + dy * dy > 104 * 104) continue
      dots.push(<circle key={`${col}-${row}`} cx={x} cy={y} r="8" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.7" />)
    }
  }
  return <g>{dots}</g>
}

export function Crown() {
  const id = "crown"
  const fill = fillsFor(id)
  return (
    <Layer id={id}>
      <g transform={`translate(${CX - 23} ${CY - 18})`}>
        <rect x="0" y="10" width="46" height="36" rx="7" fill="#5c636a" />
        <rect x="0" y="0" width="46" height="36" rx="7" fill={fill.steel} />
        {Array.from({ length: 7 }, (_, index) => (
          <line key={index} x1="6" y1={5 + index * 4.4} x2="34" y2={5 + index * 4.4} stroke="rgba(30,34,38,0.35)" strokeWidth="1.1" />
        ))}
        <rect x="40" y="-2" width="12" height="40" rx="3" fill={fill.polish} />
        <text x="46" y="20" textAnchor="middle" fill="#2c3136" fontFamily="Fraunces, serif" fontSize="11" fontWeight="600">
          H
        </text>
      </g>
    </Layer>
  )
}

export function Case() {
  const id = "case"
  const fill = fillsFor(id)
  return (
    <Layer id={id}>
      <Lug x={332} y={186} fill={fill.steel} />
      <Lug x={432} y={186} fill={fill.steel} />
      <Lug x={332} y={548} fill={fill.steel} />
      <Lug x={432} y={548} fill={fill.steel} />
      <path d={donut(CX, CY + 14, 170, 136)} fill="#4e555c" fillRule="evenodd" />
      <path d={donut(CX, CY, 170, 136)} fill={fill.steel} fillRule="evenodd" />
      <path d={donut(CX, CY, 156, 138)} fill={fill.polish} fillRule="evenodd" />
      <circle cx={CX} cy={CY} r={136} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <rect x={366} y={224} width="68" height="7" rx="3" fill={fill.polish} />
      <rect x={366} y={568} width="68" height="7" rx="3" fill={fill.polish} />
    </Layer>
  )
}

function Lug({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g>
      <rect x={x} y={y + 12} width="36" height="78" rx="8" fill="#4e555c" />
      <rect x={x} y={y} width="36" height="78" rx="8" fill={fill} />
      <rect x={x + 3} y={y + 3} width="30" height="5" rx="2" fill="rgba(255,255,255,0.38)" />
    </g>
  )
}

export function Caseback() {
  const id = "caseback"
  const fill = fillsFor(id)
  const ringId = `${id}-ringtext`
  return (
    <Layer id={id}>
      <path d={donut(CX, CY + 14, 158, 108)} fill="#4e555c" fillRule="evenodd" />
      <path d={donut(CX, CY, 158, 108)} fill={fill.steel} fillRule="evenodd" />
      <circle cx={CX} cy={CY + 10} r={104} fill="rgba(150, 188, 214, 0.28)" />
      <circle cx={CX} cy={CY} r={104} fill="rgba(190, 214, 230, 0.16)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <ellipse cx={CX - 24} cy={CY - 30} rx="36" ry="12" fill="white" opacity="0.2" transform={`rotate(-24 ${CX - 24} ${CY - 30})`} />
      <path id={ringId} d={`M ${CX} ${CY - 132} a 132 132 0 1 1 -0.1 0`} fill="none" />
      <text fill="#2b3034" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="3.2">
        <textPath href={`#${ringId}`} startOffset="8%">
          HAMILTON · 100M · SWISS MADE
        </textPath>
      </text>
    </Layer>
  )
}

export function Strap() {
  const id = "strap"
  const fill = fillsFor(id)
  const stitch = "#f4efe6"
  return (
    <Layer id={id}>
      <path d="M 352 238 L 344 68 Q 400 50 456 68 L 448 238 Z" fill="#1a120e" transform="translate(0 12)" />
      <path d="M 352 238 L 344 68 Q 400 50 456 68 L 448 238 Z" fill={fill.leather} />
      <path d="M 360 228 L 354 78 Q 400 64 446 78 L 440 228" fill="none" stroke={stitch} strokeWidth="1.15" strokeDasharray="2.2 3.1" />
      <path d="M 446 572 L 468 890 Q 400 912 332 890 L 354 572 Z" fill="#1a120e" transform="translate(0 12)" />
      <path d="M 446 572 L 468 890 Q 400 912 332 890 L 354 572 Z" fill={fill.leather} />
      <path d="M 438 584 L 456 878 Q 400 894 344 878 L 362 584" fill="none" stroke={stitch} strokeWidth="1.15" strokeDasharray="2.2 3.1" />
      {[660, 712, 764, 816, 868].map((y) => (
        <g key={y}>
          <circle cx={CX} cy={y} r="5.5" fill="#0b0c0a" />
          <circle cx={CX} cy={y} r="5.5" fill="none" stroke="rgba(244,239,230,0.35)" />
        </g>
      ))}
    </Layer>
  )
}

export function Buckle() {
  const id = "buckle"
  const fill = fillsFor(id)
  return (
    <Layer id={id}>
      <g transform={`translate(${CX - 48} ${CY - 46})`}>
        <rect x="0" y="12" width="96" height="92" rx="8" fill="#3e444a" />
        <rect x="0" y="0" width="96" height="92" rx="8" fill={fill.steel} />
        <rect x="12" y="14" width="72" height="64" rx="4" fill="#0b0c0a" />
        <rect x="44" y="6" width="8" height="78" rx="2" fill={fill.polish} />
        <path d="M 48 8 L 70 22" stroke={fill.polish} strokeWidth="3" strokeLinecap="round" />
        <text x="48" y="58" textAnchor="middle" fill="#d7dbe0" fontFamily="Fraunces, serif" fontSize="11" letterSpacing="1.5">
          H
        </text>
      </g>
    </Layer>
  )
}

