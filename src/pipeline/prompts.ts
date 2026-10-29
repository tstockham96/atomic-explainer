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
- placement is "stack" for parts that separate vertically, "side" for a crown, knob, or handle, "strap" for anything that hangs off the body.
- You may omit layout. The site spaces the stack itself.
- howItsMade is 2 to 4 sentences of process: materials, forming, finishing. No slogan pile-up.
- funFacts are specific, one sentence each, at most two.
- visualHint describes the isolated part for a photoreal cutout edited from the user's photo: shape, color, and what must not appear.
- sources are real https URLs you are confident about. Fewer is better than a guessed link.
- closing is two or three sentences that put the object back together after the teardown.
- version must be 1.`

/** Shared look for every edit. The reference photo is the subject, not a style hint. */
export const STUDIO_LOOK = [
  "Photorealistic studio product photography of the exact object in the reference image.",
  "Match that object: same item, same color, same wear, same proportions, same logos that are physically on it.",
  "Do not invent a different model. Do not illustrate, paint, or stylize.",
  "Medium-format look, 90mm, soft key light from the upper left, faint rim light, shallow-to-moderate depth of field.",
  "Seamless solid background #0c0d0b, no gradient, no floor seam, no text, no watermark, no extra props.",
].join(" ")

export function heroEditPrompt(spec: ExplodeSpec) {
  return [
    "Edit the reference photo into a hero product photograph of that same object, fully assembled.",
    "Center it, three-quarter view, the object filling most of the frame.",
    spec.item.name,
    STUDIO_LOOK,
  ].join(" ")
}

export function explodedEditPrompt(spec: ExplodeSpec) {
  const names = spec.components.map((component) => component.name).join(", ")
  return [
    "Edit the reference photo into a photoreal exploded view of that same object.",
    "Separate its real parts along a vertical axis with even gaps. Every part must still belong to the reference, not a generic stand-in.",
    `Parts, front to back: ${names}.`,
    STUDIO_LOOK,
  ].join(" ")
}

export function componentEditPrompt(spec: ExplodeSpec, component: ComponentSpec) {
  return [
    `Edit the reference photo so the frame contains only this real part of that exact ${spec.item.name}: ${component.name}.`,
    `Material: ${component.material}.`,
    component.visualHint ?? "",
    "Close-up, centered, the part filling about 70 percent of the frame.",
    "Cut the rest of the object away. Do not redesign the part.",
    STUDIO_LOOK,
  ]
    .filter(Boolean)
    .join(" ")
}
