import { z } from "zod"
import { understandingSchema } from "./understanding.ts"

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
  evidence: z.object({
    basis: z.enum(["documented", "inferred"]),
    sourceUrls: z.array(z.string().url()),
    note: z.string(),
  }).optional(),
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
  understanding: understandingSchema.optional(),
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
  /** A reusable multipart scene. Mesh reconstruction is a separate pipeline concern. */
  scene3d: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("procedural-watch") }),
    z.object({
      kind: z.literal("gltf"),
      url: z.string().min(1),
      parts: z.array(z.object({
        componentId: z.string().min(1),
        node: z.string().min(1).optional(),
        nodes: z.array(z.string().min(1)).min(1).optional(),
        offset: z.tuple([z.number(), z.number(), z.number()]),
        distance: z.number().min(1).max(50).optional(),
        coverThickness: z.number().positive().max(1).optional(),
        doubleSided: z.boolean().optional(),
        shot: z.object({
          from: z.tuple([z.number(), z.number(), z.number()]),
          to: z.tuple([z.number(), z.number(), z.number()]),
        }).optional(),
      }).refine((part) => Boolean(part.node) !== Boolean(part.nodes), "Supply either node or nodes for each part.")).min(1),
    }),
  ]).optional(),
  /** Camera targets on the final exploded frame. Coordinates are normalized image positions. */
  film: z.object({
    focus: z.array(z.object({
      componentId: z.string().min(1),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      scale: z.number().min(1).max(6),
    })).default([]),
  }).optional(),
  visualMode: z.enum(["pending", "generated", "mixed"]).default("pending"),
  artNote: z.string().optional(),
  modelNotice: z.string().max(120).optional(),
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
  understanding: understandingSchema,
  item: explodeSpecSchema.shape.item,
  components: z
    .array(
      componentSchema.omit({
        visual: true,
        image: true,
        zIndex: true,
      }),
    )
    .min(1)
    .max(64),
  facts: z.array(factSchema).min(4).max(10),
  sources: z.array(sourceSchema).max(64),
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
