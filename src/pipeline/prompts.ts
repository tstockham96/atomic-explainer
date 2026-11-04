import type { ComponentSpec, ExplainerSpec } from "../spec/schema.ts"
import { COMPONENT_QUALITY_REQUIREMENTS } from "./quality.ts"

export const IDENTIFY_PROMPT = `You identify a physical product in a photograph.
Return the maker (brand), the model or family, a short category such as "wristwatch" or "sneaker", and the common full name.
If the brand or model is not legible, say what you can actually see and lower confidence.
Confidence is from 0 to 1.
Do not invent a model number that the photo does not support. A family name plus an honest note is better than a guessed reference.`

export const RESEARCH_PROMPT = `You research a physical object so a person can learn how it works through a 3D exploration.
Research determines the assembly and construction plan, not just captions attached to a generated exterior.
Rules:
- Use widely documented facts. If a measurement is not published by the maker or a hands-on review, leave it out.
- Do not invent alloy grades, jewel counts, or factory claims. Say when the maker does not publish a detail.
- Use as many meaningful components as the explanation requires (up to 64), including hidden mechanisms, seals and connections when relevant. Use stable lowercase hyphenated IDs. order 0 is the front or outermost part a person sees first. Increase order toward parts that sit underneath or behind.
- placement is "stack" for parts that separate along the main assembly axis, "side" for a crown, knob, or handle, "strap" for anything that hangs off the body.
- You may omit layout. The site spaces the parts and draws the labels.
- howItsMade is 2 to 4 sentences of process: materials, forming, finishing. No slogan pile-up.
- funFacts are specific, one sentence each, at most two.
- visualHint describes the isolated component from all available evidence, including shape, color and excluded neighboring parts. Do not treat the uploaded exterior as its only reference.
- understanding is a first-class research dossier: identity/variant scope, learning goals, references with exact-model/family/general scope, component functions and claim-level evidence, relationships and unresolved questions.
- Every component ID must have one construction plan with shape, material behavior, hidden-surface requirements, excluded occluders, input references and observable acceptance checks. Relationship endpoints must be real component IDs.
- Use model-part for precise layers/transparent parts/clean dials, source-model for suitable licensed geometry, generate-part for referenced organic or complex parts, and defer when evidence is missing. Use exterior-draft only for an explicit exterior study; it cannot represent an inner mechanism or a clean surface hidden by another part.
- A reference URL is not proof of visual inspection. Mark claims observed only if the supplied research actually inspected the image. Keep unknowns explicit and distinguish general manufacturing methods from this maker's documented process.
- sources are real https URLs you are confident about. Fewer is better than a guessed link.
- closing is two or three sentences that put the object back together after the teardown.
- version must be 1.
Component construction and acceptance requirements:
${COMPONENT_QUALITY_REQUIREMENTS.map((rule) => `- ${rule.check}`).join("\n")}`

function studioLine(spec: ExplainerSpec) {
  if (spec.studio === "dark") {
    return "Dark navy gradient studio background, because the object is dark."
  }
  return "Clean white to light-gray studio background."
}

const NO_TYPE =
  "Do not illustrate. Do not bake in labels, numbers, leader lines, captions, titles, or watermarks. The page draws those."

export function heroEditPrompt(spec: ExplainerSpec) {
  return [
    `Use the uploaded ${spec.item.name} image as reference.`,
    "Turn it into a clean Photorealistic assembled product photograph of that exact object, front view, centered, accurate proportions.",
    "Soft studio lighting, subtle shadow under the object, crisp details.",
    studioLine(spec),
    NO_TYPE,
  ].join(" ")
}

export function explodedEditPrompt(spec: ExplainerSpec) {
  const names = spec.components.map((component) => component.name).join(", ")
  return [
    `Use the uploaded ${spec.item.name} image as reference.`,
    `Turn it into a clean Photorealistic exploded-view component breakdown, separating each layer along its natural assembly axis: ${names}.`,
    "Clean studio background, soft studio lighting, subtle shadows under each floating part, crisp details, accurate proportions.",
    studioLine(spec),
    NO_TYPE,
  ].join(" ")
}

export function rotationMotionPrompt(spec: ExplainerSpec) {
  return [
    `Photoreal studio product film of the exact ${spec.item.name} in the first frame.`,
    "The object rotates smoothly through one full turn on a locked camera. Soft even light, subtle contact shadow, no zoom, no cut.",
    studioLine(spec),
    "No people, no hands, no text, no labels, no watermark.",
  ].join(" ")
}

export function explodeMotionPrompt(spec: ExplainerSpec) {
  const names = spec.components.map((component) => component.name).join(", ")
  return [
    `Photoreal studio film of the exact ${spec.item.name}.`,
    "The first frame is the assembled object. The last frame is the exploded view.",
    `Parts separate in one continuous motion along the assembly axis: ${names}.`,
    "Camera locked, soft even light, subtle shadow under each floating part.",
    studioLine(spec),
    "No cut, no text, no labels, no leader lines, no watermark.",
  ].join(" ")
}

export function componentEditPrompt(spec: ExplainerSpec, component: ComponentSpec) {
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
