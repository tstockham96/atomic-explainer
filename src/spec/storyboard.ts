export interface Storyboard {
  intro: number
  explode: number
  chapter: number
  outro: number
  total: number
  count: number
}

export function storyboard(count: number): Storyboard {
  const intro = 0.85
  const explode = 1.35
  const chapter = 1
  const outro = 1
  const total = intro + explode + count * chapter + outro
  return { intro, explode, chapter, outro, total, count }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** -1 is the assembled intro, 0..count-1 are parts, count is the outro. */
export function chapterAt(progress: number, count: number): number {
  const board = storyboard(count)
  const t = clamp(progress, 0, 1) * board.total
  const afterExplode = board.intro + board.explode
  if (t < afterExplode - 0.15) return -1
  if (t >= board.total - board.outro + 0.15) return count
  const local = t - afterExplode
  if (local < 0) return -1
  return Math.min(count - 1, Math.max(0, Math.floor(local / board.chapter)))
}

/** Scroll progress (0–1) that lands inside a chapter. Use -1 for the intro. */
export function progressForChapter(index: number, count: number): number {
  const board = storyboard(count)
  let t: number
  if (index < 0) t = board.intro * 0.4
  else if (index >= count) t = board.total - board.outro * 0.45
  else t = board.intro + board.explode + index * board.chapter + board.chapter * 0.45
  return t / board.total
}
