# Using explode from an agent

The pipeline is one function and five MCP tools. Both call the same code.

## Function

```ts
import { runExplode } from "./src/pipeline/run.ts"

const spec = await runExplode({
  photo: "./photo.jpg",
  outDir: "./site",
  skipImages: false,
  log: (message) => console.error(message),
})
```

`runExplode` returns the spec and writes `outDir/index.html`. A missing `AI_GATEWAY_API_KEY` and `OPENAI_API_KEY` throws `ExplodeConfigError` before any request.

Pieces, if you want to stop between steps:

- `identifyPhoto(path, models)`
- `researchItem(identity, models)`
- `generateVisuals(spec, outDir, models, sourcePhotoBytes)` edits the uploaded photo. It does not invent a new object.
- `generateMotion(spec, outDir, video)` makes the rotation and explode clips, then extracts frames.
- `extractFrames(videoPath, outDir, { fps, skips })` is ffmpeg only.
- `renderSite(spec, outDir)`
- `solid3d` — Tripo image-to-model and semantic segmentation adapter. `reconstruct` takes `spec`, `sourcePhoto`, and `outDir`; returns a draft scene spec and writes geometry plus coverage reports. Live visual quality is not yet validated. `explode_run` accepts `three: true`. See [photo-to-3D details](photo-to-3d.md).

## MCP

Build the server, then point your client at it:

```bash
npm run build:cli
```

```json
{
  "mcpServers": {
    "explode": {
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
| `explode_identify` | Maker, model, category from a photo path | Yes |
| `explode_research` | Components, materials, process, spec JSON | Yes |
| `explode_visualize` | Edit the uploaded photo into a hero, an exploded view, and one cutout per part | Yes |
| `explode_motion` | Rotation clip from the hero, explode clip from hero + exploded still, then WebP frames | Yes |
| `explode_extract_frames` | ffmpeg a clip into a numbered WebP sequence. No model call | No |
| `explode_build_site` | Static scroll site from a spec file | No |
| `explode_run` | Identify, research, images, site. Pass `motion: true` to add clips | Yes |

`explode_build_site` is the one to use on the committed Murph spec when you only want a site folder.

The scroll page reads `window.__EXPLODE_SPEC__` when the CLI injects it, and otherwise fetches `spec.json`. Image paths in the spec are relative to that folder (`images/crystal.png`).
