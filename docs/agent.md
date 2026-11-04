# Using Atomic Explainer from an agent

The pipeline is one function and nine MCP tools. Both call the same code.

## Function

```ts
import { runExplainer } from "./src/pipeline/run.ts"

const spec = await runExplainer({
  photo: "./photo.jpg",
  outDir: "./site",
  skipImages: false,
  log: (message) => console.error(message),
})
```

`runExplainer` returns the spec and writes `outDir/index.html`. A missing `AI_GATEWAY_API_KEY` and `OPENAI_API_KEY` throws `ExplainerConfigError` before any request.

Pieces, if you want to stop between steps:

- `identifyPhoto(path, models)`
- `researchItem(identity, models)`
- `generateVisuals(spec, outDir, models, sourcePhotoBytes)` edits the uploaded photo. It does not invent a new object.
- `generateMotion(spec, outDir, video)` makes the rotation and explode clips, then extracts frames.
- `extractFrames(videoPath, outDir, { fps, skips })` is ffmpeg only.
- `renderSite(spec, outDir)`
- `solid3d` — Tripo image-to-model and semantic segmentation adapter. `reconstruct` takes `spec`, `sourcePhoto`, and `outDir`; returns a draft scene spec and writes geometry plus coverage reports. Live visual quality is not yet validated. `atomic_explainer_run` accepts `three: true`. See [photo-to-3D details](photo-to-3d.md).

## MCP

Build the server, then point your client at it:

```bash
npm run build:cli
```

```json
{
  "mcpServers": {
    "atomic-explainer": {
      "command": "node",
      "args": ["dist/mcp.js"],
      "env": {
        "AI_GATEWAY_API_KEY": "your key"
      }
    }
  }
}
```

During development, `npm run mcp` runs the TypeScript entry over stdio.

| Tool | What it does | Needs a key |
| --- | --- | --- |
| `atomic_explainer_identify` | Maker, model, category from a photo path | Yes |
| `atomic_explainer_research` | Components, materials, process, spec JSON | Yes |
| `atomic_explainer_visualize` | Edit the uploaded photo into a hero, an exploded view, and one cutout per part | Yes |
| `atomic_explainer_motion` | Rotation clip from the hero, explode clip from hero + exploded still, then WebP frames | Yes |
| `atomic_explainer_extract_frames` | ffmpeg a clip into a numbered WebP sequence. No model call | No |
| `atomic_explainer_build_site` | Static scroll site from a spec file | No |
| `atomic_explainer_run` | Identify, research, images, site. Pass `motion: true` to add clips | Yes |
| `atomic_explainer_prepare_asset` | Import a sourced GLB or generate a researched component with Tripo. Omit `componentId` to advance every required component | Tripo generation only |
| `atomic_explainer_assemble` | Build an agent-authored assembly recipe into a multipart GLB, review checklist, and explainer | No |

`atomic_explainer_build_site` is the one to use on the committed Murph spec when you only want a site folder.

The scroll page reads `window.__ATOMIC_EXPLAINER_SPEC__` when the CLI injects it, and otherwise fetches `spec.json`. Image paths in the spec are relative to that folder (`images/crystal.png`).
