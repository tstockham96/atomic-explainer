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
- `generateVisuals(spec, outDir, models)`
- `renderSite(spec, outDir)`
- `solid3d` — interface only. `available` is `false`. Calling `reconstruct` throws `TODO(explode-3d)`.

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
| `explode_visualize` | Hero plus one image per part | Yes |
| `explode_build_site` | Static scroll site from a spec file | No |
| `explode_run` | All of the above | Yes |

`explode_build_site` is the one to use on the committed Murph spec when you only want a site folder.

The scroll page reads `window.__EXPLODE_SPEC__` when the CLI injects it, and otherwise fetches `spec.json`. Image paths in the spec are relative to that folder (`images/crystal.png`).
