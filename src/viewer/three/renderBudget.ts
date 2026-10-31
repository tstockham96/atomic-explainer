import type {WebGLRenderer} from 'three'

/** Preserve geometry/materials on software graphics; reduce raster work instead.
 * This is a device capability policy, not a test-only rendering override. */
export function renderBudget(rendererName:string,pixelRatio:number){
 const software=/swiftshader|llvmpipe|softpipe|software rasterizer/i.test(rendererName)
 return {software,pixelRatio:Math.min(pixelRatio,software?.75:1.75),transmissionScale:software?.5:1,postprocessing:!software}
}
export function configureRenderBudget(renderer:WebGLRenderer){
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info')
 const name=String(debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER))
 const budget=renderBudget(name,globalThis.devicePixelRatio||1)
 renderer.setPixelRatio(budget.pixelRatio)
 renderer.transmissionResolutionScale=budget.transmissionScale
 return budget
}
