import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js"
import { buildEngine } from "./model.ts"
const root = buildEngine()
Object.assign(window, {
  ready: true,
  exportModel: async () => {
    const bytes = (await new GLTFExporter().parseAsync(root, {
      binary: true,
      maxTextureSize: 1024,
    })) as ArrayBuffer
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([bytes], { type: "model/gltf-binary" }))
    a.download = "engine.glb"
    a.click()
    return bytes.byteLength
  },
})
