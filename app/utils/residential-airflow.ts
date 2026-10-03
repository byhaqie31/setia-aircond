import * as THREE from 'three'

// One draw call for soft, camera-facing trails. UV.x follows the air away
// from the vent; UV.y feathers both sides without hard tube silhouettes.
export function createResidentialAirflow() {
  const positions: number[] = []
  const tangents: number[] = []
  const uvs: number[] = []
  const phases: number[] = []
  const indices: number[] = []
  const streams = 14
  const segments = 48
  for (let stream = 0; stream < streams; stream++) {
    const x = -1.42 + stream / (streams - 1) * 2.84
    const phase = (stream * .381966) % 1
    const length = 2.15 + Math.sin(stream * 1.7) * .24
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, -.39, .5),
      new THREE.Vector3(x * 1.03, -.57, .88),
      new THREE.Vector3(x * 1.12, -.87, 1.5),
      new THREE.Vector3(x * 1.22, -1.04 - phase * .16, length),
    ])
    const offset = positions.length / 3
    for (let segment = 0; segment <= segments; segment++) {
      const t = segment / segments
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)
      for (const side of [-1, 1]) {
        positions.push(point.x, point.y, point.z)
        tangents.push(tangent.x, tangent.y, tangent.z)
        uvs.push(t, side)
        phases.push(phase)
      }
      if (segment < segments) {
        const a = offset + segment * 2
        indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('flowTangent', new THREE.Float32BufferAttribute(tangents, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1))
  geometry.setIndex(indices)
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      time: { value: 0 }, strength: { value: 0 },
      tint: { value: new THREE.Color('#c4e6d7') },
    },
    vertexShader: `
      uniform float time;
      attribute vec3 flowTangent;
      attribute float phase;
      varying vec2 flowUv;
      varying float flowPhase;
      void main() {
        flowUv = uv;
        flowPhase = phase;
        vec3 point = position;
        point.x += sin(uv.x * 7.0 - time * 1.8 + phase * 6.283) * 0.026 * uv.x * uv.x;
        vec4 viewPoint = modelViewMatrix * vec4(point, 1.0);
        vec3 tangent = mat3(modelViewMatrix) * flowTangent;
        vec2 side = vec2(-tangent.y, tangent.x);
        side /= max(length(side), 0.001);
        float width = (0.009 + 0.052 * uv.x) * (0.8 + phase * 0.4);
        viewPoint.xy += side * uv.y * width;
        gl_Position = projectionMatrix * viewPoint;
      }`,
    fragmentShader: `
      uniform float time;
      uniform float strength;
      uniform vec3 tint;
      varying vec2 flowUv;
      varying float flowPhase;
      void main() {
        float distance = flowUv.x;
        float feather = exp(-flowUv.y * flowUv.y * 5.5);
        float ends = smoothstep(0.0, 0.075, distance) * (1.0 - smoothstep(0.4, 1.0, distance));
        float travel = fract(distance * 1.12 - time * 0.43 + flowPhase);
        float trail = smoothstep(0.0, 0.16, travel) * (1.0 - smoothstep(0.24, 0.62, travel));
        float alpha = strength * feather * ends * trail * 0.48;
        gl_FragColor = vec4(tint, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'airflow-wisps'
  mesh.frustumCulled = false
  return { mesh, material }
}
