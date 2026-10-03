import * as THREE from 'three'

export interface EquipmentPose {
  eye: [number, number, number]
  target: [number, number, number]
  fov: number
  shiftX: number
  shiftY: number
}

export interface EquipmentWorld<P extends EquipmentPose> {
  scene: THREE.Scene
  update: (pose: P, aspect: number, time?: number) => void
  dispose: () => void
}

export function applyEquipmentCamera(camera: THREE.PerspectiveCamera, pose: EquipmentPose, width: number, height: number) {
  camera.aspect = width / height
  camera.fov = pose.fov
  camera.position.set(...pose.eye)
  camera.lookAt(...pose.target)
  camera.setViewOffset(width, height, width * pose.shiftX, height * pose.shiftY, width, height)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
}

function createStudioReflections(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene()
  studio.background = new THREE.Color('#202722')
  const geometry = new THREE.PlaneGeometry(1, 1)
  const cards: THREE.MeshBasicMaterial[] = []
  function card(position: [number, number, number], width: number, height: number, color: string, intensity: number) {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    cards.push(material)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...position)
    mesh.scale.set(width, height, 1)
    mesh.lookAt(0, 0, 0)
    studio.add(mesh)
  }
  card([-4, 5, 3], 4, 6, '#fff5e5', 5)
  card([4, 1, 4], 1.2, 6, '#dcebe3', 3)
  card([0, 5, -3], 7, 1.2, '#eef5f0', 6)
  const generator = new THREE.PMREMGenerator(renderer)
  try {
    return generator.fromScene(studio, .04, .1, 30)
  } finally {
    geometry.dispose()
    cards.forEach(material => material.dispose())
    studio.clear()
    generator.dispose()
  }
}

export function createEquipmentRenderer<P extends EquipmentPose>(host: HTMLElement, createWorld: () => EquipmentWorld<P>, poseAt: (progress: number, aspect: number) => P) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = .95
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const camera = new THREE.PerspectiveCamera(38, 1, .08, 100)
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  let world: EquipmentWorld<P> | undefined
  let reflections: THREE.WebGLRenderTarget | undefined
  let width = 1
  let height = 1
  let progress = 0
  let time = 0
  let disposed = false
  function render(value = progress, elapsed = time) {
    if (disposed || !world) return
    progress = value
    time = elapsed
    const pose = poseAt(progress, width / height)
    applyEquipmentCamera(camera, pose, width, height)
    world.update(pose, width / height, time)
    renderer.render(world.scene, camera)
  }
  function resize() {
    if (disposed) return
    width = Math.max(1, host.clientWidth)
    height = Math.max(1, host.clientHeight)
    renderer.setSize(width, height)
    render()
  }
  function dispose() {
    if (disposed) return
    disposed = true
    if (world) world.scene.environment = null
    reflections?.dispose()
    world?.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }
  try {
    world = createWorld()
    reflections = createStudioReflections(renderer)
    world.scene.environment = reflections.texture
    host.appendChild(canvas)
    resize()
  } catch (error) { dispose(); throw error }
  return { canvas, render, resize, dispose }
}

export function createStudioBackdrop() {
  const backdropMaterial = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: {
      center: { value: new THREE.Vector2(.7, .46) },
      aspect: { value: 16 / 9 },
      edge: { value: new THREE.Color('#03150e') },
      base: { value: new THREE.Color('#0b3022') },
      glow: { value: new THREE.Color('#345d47') },
    },
    vertexShader: `varying vec2 screenUv;
      void main() { screenUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: `varying vec2 screenUv;
      uniform vec2 center; uniform float aspect;
      uniform vec3 edge; uniform vec3 base; uniform vec3 glow;
      void main() {
        vec2 delta = (screenUv - center) * vec2(aspect, 1.0);
        float halo = exp(-dot(delta, delta) * 3.8);
        vec3 color = mix(edge, base, smoothstep(0.1, 0.95, 1.0 - screenUv.y));
        color = mix(color, glow, halo * 0.65);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMaterial)
  backdrop.name = 'studio-backdrop'
  backdrop.frustumCulled = false
  backdrop.renderOrder = -1
  return { mesh: backdrop, material: backdropMaterial }
}
