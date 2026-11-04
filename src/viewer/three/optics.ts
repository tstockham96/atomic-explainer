import * as THREE from "three"

/** Clear dielectric defaults. Visibility comes from Fresnel reflections and real
 * geometry, never a milky tint, metalness, or a change of opacity at a story stop. */
export function createClearGlass(ior = 1.5) {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    opacity: 1,
    transparent: false,
    thickness: 0,
    ior,
    envMapIntensity: 0.7,
  })
}

export function isTransmitting(material: THREE.Material): material is THREE.MeshPhysicalMaterial {
  return material instanceof THREE.MeshPhysicalMaterial && material.transmission > 0
}

export function hasOptics(object: THREE.Object3D) {
  let found = false
  object.traverse((node) => {
    if (node instanceof THREE.Mesh)
      found ||= (Array.isArray(node.material) ? node.material : [node.material]).some(isTransmitting)
  })
  return found
}

export function materialState(material: THREE.Material) {
  return {
    material,
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
    alphaHash: material.alphaHash,
  }
}

/** One complete turn during the settled middle of an inspection; reversible. */
export function inspectionTurn(local: number, start = 0.2, end = 0.8) {
  const x = THREE.MathUtils.clamp((local - start) / (end - start), 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10) * Math.PI * 2
}

/** Render the backdrop through the same linear-light/tone-mapping path as objects.
 * A renderer clear-color bypasses tone mapping, but its transmitted copy does not;
 * that mismatch otherwise paints a dark disc into perfectly clear glass. */
export function createOpticalBackdrop(background: THREE.Color | THREE.Texture) {
  const material = new THREE.MeshBasicMaterial({
    color: background instanceof THREE.Color ? background : "#ffffff",
    map: background instanceof THREE.Texture ? background : null,
    depthTest: false,
    depthWrite: false,
    toneMapped: true,
  })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      "gl_Position = vec4(position.xy, 0.99999, 1.0);",
    )
  }
  material.customProgramCacheKey = () => "optical-backdrop-v1"
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  mesh.name = "optical_backdrop"
  mesh.userData.opticalBackdrop = true
  mesh.frustumCulled = false
  mesh.renderOrder = -10000
  return mesh
}
