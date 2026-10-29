import { useState } from "react"
import { asset } from "./asset.ts"

export function PhotoLayer({ src, label }: { src?: string; label: string }) {
  const [missing, setMissing] = useState(!src)

  if (!src || missing) {
    return (
      <div className="photo-slot">
        <p>{label}</p>
        <p className="photo-file">{src ?? "not in manifest"}</p>
      </div>
    )
  }

  return (
    <img
      src={asset(src)}
      alt=""
      className="photo-cutout"
      draggable={false}
      onError={() => setMissing(true)}
    />
  )
}
