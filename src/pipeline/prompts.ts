import type { ComponentSpec, ExplodeSpec } from "../spec/schema.ts"

export const IDENTIFY_PROMPT = `You identify a physical product in a photograph.
Return the maker (brand), the model or family, a short category such as "wristwatch" or "sneaker", and the common full name.
If the brand or model is not legible, say what you can actually see and lower confidence.
Confidence is from 0 to 1.
Do not invent a model number that the photo does not support. A family name plus an honest note is better than a guessed reference.`

export const RESEARCH_PROMPT = `You research how a physical object is made and return a teardown spec.
Rules:
- Use widely documented facts. If a measurement is not published by the maker or a hands-on review, leave it out.
- Do not invent alloy grades, jewel counts, or factory claims. Say when the maker does not publish a detail.
- 7 to 12 components. order 0 is the front or outermost part a person sees first. Increase order toward parts that sit underneath or behind.
- placement is "stack" for parts that separate along the main assembly axis, "side" for a crown, knob, or handle, "strap" for anything that hangs off the body.
- You may omit layout. The site spaces the parts and draws the labels.
- howItsMade is 2 to 4 sentences of process: materials, forming, finishing. No slogan pile-up.
- funFacts are specific, one sentence each, at most two.
- visualHint describes the isolated part for a photoreal cutout edited from the user's photo: shape, color, and what must not appear. No label text.
- sources are real https URLs you are confident about. Fewer is better than a guessed link.
- closing is two or three sentences that put the object back together after the teardown.
- version must be 1.`

function studioLine(spec: ExplodeSpec) {
  if (spec.studio === "dark") {
    return "Dark navy gradient studio background, because the object is dark."
  }
  return "Clean white to light-gray studio background."
}

const NO_TYPE = "Do not illustrate. Do not bake in labels, numbers, leader lines, captions, titles, or watermarks. The page draws those."

export function heroEditPrompt(spec: ExplodeSpec) {
  return [
    `Use the uploaded ${spec.item.name} image as reference.`,
    "Turn it into a clean Photorealistic assembled product photograph of that exact object, front view, centered, accurate proportions.",
    "Soft studio lighting, subtle shadow under the object, crisp details.",
    studioLine(spec),
    NO_TYPE,
  ].join(" ")
}

export function explodedEditPrompt(spec: ExplodeSpec) {
  const names = spec.components.map((component) => component.name).join(", ")
  return [
    `Use the uploaded ${spec.item.name} image as reference.`,
    `Turn it into a clean Photorealistic exploded-view component breakdown, separating each layer along its natural assembly axis: ${names}.`,
    "Clean studio background, soft studio lighting, subtle shadows under each floating part, crisp details, accurate proportions.",
    studioLine(spec),
    NO_TYPE,
  ].join(" ")
}

export function componentEditPrompt(spec: ExplodeSpec, component: ComponentSpec) {
  return [
    `Use the uploaded ${spec.item.name} image as reference.`,
    `Isolate only this real part, Photorealistic, floating on the same studio ground: ${component.name}.`,
    `Material: ${component.material}.`,
    component.visualHint ?? "",
    "Soft studio lighting, subtle shadow under the part, crisp details, accurate proportions.",
    studioLine(spec),
    NO_TYPE,
  ]
    .filter(Boolean)
    .join(" ")
}
