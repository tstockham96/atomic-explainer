import { it, expect } from "vitest"
import { renderBudget } from "../src/viewer/three/renderBudget.ts"
it("uses bounded raster work on software devices without substituting geometry", () => {
  for (const driver of ["ANGLE (Google, Vulkan SwiftShader Device)", "llvmpipe (LLVM)"])
    expect(renderBudget(driver, 2)).toEqual({
      software: true,
      pixelRatio: 1,
      transmissionScale: 0.5,
      postprocessing: false,
    })
})
it("preserves normal rendering on hardware and masked drivers", () => {
  for (const driver of ["Apple M4 Pro", "WebKit WebGL", ""])
    expect(renderBudget(driver, 1)).toEqual({
      software: false,
      pixelRatio: 1,
      transmissionScale: 1,
      postprocessing: true,
    })
})
