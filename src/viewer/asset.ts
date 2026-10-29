export function asset(src: string) {
  if (/^(https?:|data:)/.test(src)) return src
  const base = import.meta.env.BASE_URL || "./"
  return `${base}${src.replace(/^\//, "")}`
}
