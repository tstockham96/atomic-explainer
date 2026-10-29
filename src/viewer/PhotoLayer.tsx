import { useState } from "react"
import { asset } from "./asset.ts"

export function PhotoLayer({
  src,
  label,
  priority = false,
}: {
  src?: string
  label: string
  priority?: boolean
}) {
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
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setMissing(true)}
    />
  )
}
