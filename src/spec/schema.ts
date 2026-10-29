import { z } from "zod"

export const layoutSchema = z.object({
  /** Exploded offset as a fraction of the stage. Negative y moves up. */
  x: z.number(),
  y: z.number(),
  /** Camera scale while this part is the subject. */
  focus: z.number().positive().optional(),
})

export const componentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  material: z.string().min(1),
  howItsMade: z.string().min(1),
  funFacts: z.array(z.string().min(1)).min(1).max(4),
  /** 0 is the front of the stack. */
  order: z.number().int(),
  zIndex: z.number().int().optional(),
  placement: z.enum(["stack", "side", "strap"]).optional(),
  /** Assembled offset before the explosion, as a fraction of the stage. */
  home: layoutSchema.optional(),
  layout: layoutSchema.optional(),
  /** Unused. Photographs come from `image`, not a drawing key. */
  visual: z.string().optional(),
  /** Relative image path, produced by the image step. */
  image: z.string().optional(),
  /** Extra direction for the image model. */
  visualHint: z.string().optional(),
  /** Short caption under the drawing, for schematics. */
  figureLabel: z.string().optional(),
})

export const factSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
})

/** Scroll-scrubbed stills. `0001.webp` lives in `dir` when `start` is 1. */
export const frameSequenceSchema = z.object({
  dir: z.string().min(1),
  count: z.number().int().nonnegative().default(0),
  ext: z.enum(["webp", "jpg", "jpeg", "png"]).default("webp"),
  pad: z.number().int().min(1).max(8).default(4),
  start: z.number().int().nonnegative().default(1),
  /** Why a sequence was retimed, when it was. */
  note: z.string().optional(),
})

export const explodeSpecSchema = z.object({
  version: z.literal(1),
  item: z.object({
    name: z.string().min(1),
    maker: z.string().min(1),
    model: z.string().min(1),
    category: z.string().min(1),
    reference: z.string().optional(),
    year: z.string().optional(),
    summary: z.string().min(1),
    /** Word inside `model` to set in italic on the title card. */
    emphasis: z.string().optional(),
  }),
  identity: z
    .object({
      confidence: z.number().min(0).max(1),
      notes: z.string().optional(),
      sourcePhoto: z.string().optional(),
    })
    .optional(),
  components: z.array(componentSchema).min(1),
  facts: z.array(factSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  /** Light studio for pale objects, dark navy for dark ones. */
  studio: z.enum(["light", "dark"]).default("light"),
  heroImage: z.string().optional(),
  explodedImage: z.string().optional(),
  /**
   * Image sequences for the pinned film. Missing or `count: 0` falls back to stills.
   * `rotation` plays first. `explode` continues from its last frame. Callouts hold the final explode frame.
   */
  frames: z
    .object({
      rotation: frameSequenceSchema.optional(),
      explode: frameSequenceSchema.optional(),
    })
    .optional(),
  visualMode: z.enum(["pending", "generated", "mixed"]).default("pending"),
  artNote: z.string().optional(),
  closing: z.string().optional(),
  generation: z
    .object({
      visionModel: z.string().optional(),
      researchModel: z.string().optional(),
      imageModel: z.string().optional(),
      videoModel: z.string().optional(),
      warnings: z.array(z.string()).default([]),
    })
    .optional(),
})

/** What the research model is asked to fill. Illustration keys stay in our hands. */
export const researchedSpecSchema = z.object({
  version: z.literal(1),
  item: explodeSpecSchema.shape.item,
  components: z
    .array(
      componentSchema.omit({
        visual: true,
        image: true,
        zIndex: true,
      }),
    )
    .min(6)
    .max(12),
  facts: z.array(factSchema).min(4).max(10),
  sources: z.array(sourceSchema).max(8),
  closing: z.string().min(1),
})

export const identitySchema = z.object({
  maker: z.string().min(1),
  model: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  notes: z.string(),
})

export type ExplodeSpec = z.infer<typeof explodeSpecSchema>
export type ComponentSpec = z.infer<typeof componentSchema>
export type FrameSequence = z.infer<typeof frameSequenceSchema>
export type Identity = z.infer<typeof identitySchema>
export type ResearchedSpec = z.infer<typeof researchedSpecSchema>
