import * as THREE from "three"

export function createClouds() {
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: `
      uniform float uTime;
      uniform float uNight;
      uniform vec2 uResolution;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      float fbm(vec2 p) {
        float sum = 0.0, amp = 0.5;
        for (int i = 0; i < 5; i++) { sum += noise(p) * amp; p = p * 2.03 + 17.7; amp *= 0.5; }
        return sum;
      }
      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0);
        float drift = uTime * 0.006;
        float n = fbm(p * 2.0 + vec2(drift, -drift * 0.2));
        float wisps = fbm(p * 3.0 + vec2(-drift * 0.4, drift) + n * 1.8);
        float cloud = smoothstep(0.40, 0.72, n * 0.75 + wisps * 0.45);
        float glow = exp(-length((uv - vec2(0.27,0.78)) * vec2(1.1,1.0)) * 3.0);
        vec3 daylight = mix(vec3(0.90,0.93,0.95), vec3(0.75,0.82,0.87), uv.y);
        daylight = mix(daylight, vec3(0.97,0.965,0.93), cloud * 0.6);
        daylight += glow * vec3(0.12,0.105,0.075);
        vec3 night = mix(vec3(0.022,0.029,0.048), vec3(0.055,0.08,0.12), uv.y);
        night += cloud * vec3(0.055,0.06,0.09) + glow * vec3(0.04,0.055,0.075);
        vec3 color = mix(daylight, night, uNight);
        float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.006;
        gl_FragColor = vec4(pow(max(color + grain, vec3(0.0)), vec3(2.2)), 1.0);
      }
    `,
  })
  material.toneMapped = false
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  mesh.renderOrder = -10
  mesh.frustumCulled = false
  return { mesh, material }
}
