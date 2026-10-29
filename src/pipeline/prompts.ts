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
- visualHint describes one isolated part for a top-down product photo: shape, color, and what must NOT appear (no text overlays, no extra objects).
- sources are real https URLs you are confident about. Fewer is better than a guessed link.
- closing is two or three sentences that put the object back together after the teardown.
- version must be 1.`
