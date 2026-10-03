import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { createEquipmentRenderer, createStudioBackdrop } from './equipment-renderer.ts'
import { disposeProductAsset } from './residential-product.ts'
import { commercialPoseAt, type CommercialPose } from './commercial-motion-path.ts'

// Unbranded equipment illustrates the source's capabilities, not a specified installation.
export function createCommercialWorld(asset?: THREE.Group) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b3022')
  scene.environmentIntensity = .85
  const { mesh: backdrop, material: backdropMaterial } = createStudioBackdrop()
  scene.add(backdrop)
  const material = {
    casing: new THREE.MeshPhysicalMaterial({ color: '#cdd4d0', metalness: .62, roughness: .3, clearcoat: .3 }),
    frame: new THREE.MeshStandardMaterial({ color: '#4c6257', metalness: .7, roughness: .32 }),
    dark: new THREE.MeshStandardMaterial({ color: '#101c15', metalness: .15, roughness: .45 }),
    fins: new THREE.MeshStandardMaterial({ color: '#8eaaa0', metalness: .88, roughness: .3 }),
    copper: new THREE.MeshStandardMaterial({ color: '#b78758', metalness: .85, roughness: .28 }),
    green: new THREE.MeshStandardMaterial({ color: '#163d2b', roughness: .34, metalness: .3 }),
    flow: new THREE.MeshStandardMaterial({ color: '#aedac1', emissive: '#75b798', emissiveIntensity: 1.8 }),
    white: new THREE.MeshStandardMaterial({ color: '#e1e6de', roughness: .4 }),
  }
  function box(name: string, size: [number, number, number], position: [number, number, number], mat: THREE.Material, parent: THREE.Object3D, radius = 0) {
    const geometry = radius ? new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v / 3))) : new THREE.BoxGeometry(...size)
    const mesh = new THREE.Mesh(geometry, mat)
    mesh.name = name
    mesh.position.set(...position)
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  function repeated(name: string, geometry: THREE.BufferGeometry, mat: THREE.Material, count: number, parent: THREE.Object3D, place: (dummy: THREE.Object3D, index: number) => void) {
    const mesh = new THREE.InstancedMesh(geometry, mat, count)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0)
      dummy.rotation.set(0, 0, 0)
      place(dummy, i)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.name = name
    parent.add(mesh)
    return mesh
  }
  function pipe(name: string, points: number[][], radius: number, mat: THREE.Material, parent: THREE.Object3D) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal')
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 8, false), mat)
    mesh.name = name
    parent.add(mesh)
    return mesh
  }
  if (asset) scene.add(asset)
  const plant = asset?.getObjectByName('cooling-plant') ?? new THREE.Group()
  plant.name = 'cooling-plant'
  plant.position.set(-1.15, 1.5, 0)
  if (!asset) scene.add(plant)
  const coil = asset?.getObjectByName('service-coil') ?? new THREE.Group()
  const roof = asset?.getObjectByName('fan-deck') ?? new THREE.Group()
  const fans: THREE.Object3D[] = asset ? [0, 1, 2].map(i => asset.getObjectByName(`plant-fan-${i}`)!) : []
  if (!asset) {
    coil.name = 'service-coil'
    coil.position.set(0, -.05, .85)
    plant.add(coil)
    roof.name = 'fan-deck'
    roof.position.y = .79
    plant.add(roof)
    box('plant-base', [4.4, .18, 1.88], [0, -.84, 0], material.frame, plant, .025)
    box('rear-coil', [4.05, 1.3, .09], [0, -.08, -.83], material.dark, plant)
    for (const side of [-1, 1]) {
      box(`plant-end-${side}`, [.13, 1.55, 1.76], [side * 2.07, -.02, 0], material.casing, plant, .025).castShadow = true
      box(`plant-foot-${side}`, [.4, .16, 1.7], [side * 1.64, -1, 0], material.dark, plant)
    }
    box('coil-panel', [3.94, 1.17, .055], [0, 0, 0], material.dark, coil)
    repeated('coil-fins', new THREE.BoxGeometry(.018, 1.12, .055), material.fins, 130, coil, (d, i) => d.position.set(-1.9 + i * .0295, 0, .045))
    repeated('coil-rails', new THREE.BoxGeometry(3.98, .035, .075), material.frame, 3, coil, (d, i) => d.position.set(0, -.56 + i * .56, .08))
    box('fan-deck-frame', [4.22, .12, 1.76], [0, 0, 0], material.casing, roof, .035)
    for (let i = 0; i < 3; i++) {
      const x = -1.34 + i * 1.34
      const well = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .025, 40), material.dark)
      well.position.set(x, .075, 0)
      roof.add(well)
      const fan = new THREE.Group()
      fan.name = `plant-fan-${i}`
      fan.position.set(x, .105, 0)
      roof.add(fan)
      fans.push(fan)
      repeated(`fan-blades-${i}`, new THREE.BoxGeometry(.13, .022, .4), material.frame, 7, fan, (d, j) => {
        const angle = j / 7 * Math.PI * 2
        d.position.set(Math.sin(angle) * .26, 0, Math.cos(angle) * .26)
        d.rotation.y = angle + .28
      })
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .07, 20), material.casing)
      hub.position.y = .025
      fan.add(hub)
      repeated(`fan-guards-${i}`, new THREE.TorusGeometry(.51, .009, 4, 48), material.fins, 4, roof, (d, j) => {
        d.position.set(x, .17 + j * .015, 0)
        d.rotation.x = Math.PI / 2
      })
      repeated(`guard-spokes-${i}`, new THREE.BoxGeometry(1.05, .012, .012), material.fins, 5, roof, (d, j) => {
        d.position.set(x, .23, 0)
        d.rotation.y = j * Math.PI / 5
      })
    }
    for (let i = 0; i < 3; i++) {
      const x = -1.25 + i * 1.25
      const compressor = new THREE.Mesh(new THREE.CylinderGeometry(.28, .31, .85, 28), material.dark)
      compressor.name = `compressor-${i}`
      compressor.position.set(x, -.29, .15)
      plant.add(compressor)
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.21, .28, .12, 28), material.frame)
      cap.position.set(x, .19, .15)
      plant.add(cap)
      pipe(`compressor-pipe-${i}`, [[x, .24, .15], [x, .43, .15], [x + .31, .44, .15], [x + .38, -.4, .15], [x + .38, -.55, .64]], .035, material.copper, plant)
    }
    pipe('supply-header', [[-1.95, -.64, .62], [1.8, -.64, .62], [2.23, -.48, .62], [2.23, .14, .62]], .07, material.copper, plant)
    box('plant-control', [.44, .56, .13], [1.68, -.15, .14], material.green, coil, .025)
    box('plant-display', [.26, .12, .025], [1.68, -.04, .215], material.dark, coil)
    box('plant-status', [.16, .012, .025], [1.68, -.04, .235], material.flow, coil)
  }

  const distribution = asset?.getObjectByName('distribution-assembly') ?? new THREE.Group()
  distribution.name = 'distribution-assembly'
  if (!asset) scene.add(distribution)
  if (!asset) {
    const ahu = new THREE.Group()
    ahu.name = 'air-handling-unit'
    ahu.position.set(2.8, 1.3, .1)
    distribution.add(ahu)
    box('ahu-body', [2.12, 1.36, 1.42], [0, 0, 0], material.casing, ahu, .04).castShadow = true
    box('ahu-inlet', [1.78, 1.07, .025], [0, 0, .728], material.dark, ahu)
    repeated('ahu-louvres', new THREE.BoxGeometry(1.75, .018, .1), material.fins, 18, ahu, (d, i) => d.position.set(0, -.48 + i * .057, .76))
    for (const side of [-1, 1]) box(`ahu-upright-${side}`, [.055, 1.4, 1.46], [side, 0, 0], material.green, ahu)
    box('duct-riser', [.76, 1.25, .8], [-.5, 1.23, -.12], material.casing, ahu, .02)
    box('duct-outlet', [1.55, .75, .8], [.04, 1.49, -.12], material.casing, ahu, .02)
    repeated('duct-seams', new THREE.BoxGeometry(.016, .79, .84), material.frame, 4, ahu, (d, i) => d.position.set(-.66 + i * .46, 1.49, -.12))
  }
  const fluid: THREE.Mesh[] = []
  for (let i = 0; i < 2; i++) {
    const y = .68 + i * .22
    const points = [[.95, y, .45], [1.35, y, .45], [1.45, y, -.3], [2.15, y, -.3], [2.15, 1.65 + i * .2, -.3], [2.75, 1.65 + i * .2, -.3]]
    pipe(`distribution-pipe-${i}`, points, .055, i ? material.copper : material.green, distribution)
    fluid.push(pipe(`distribution-flow-${i}`, points, .06, material.flow, distribution))
  }

  const electrical = asset?.getObjectByName('commercial-electrical') ?? new THREE.Group()
  electrical.name = 'commercial-electrical'
  electrical.position.set(4.8, 1.4, .1)
  if (!asset) scene.add(electrical)
  if (!asset) {
    box('switchboard-body', [1.55, 2.7, .67], [0, 0, 0], material.casing, electrical, .045).castShadow = true
    box('switchboard-inset', [1.28, 2.42, .05], [0, 0, .35], material.dark, electrical)
    for (let row = 0; row < 4; row++) {
      box(`power-rail-${row}`, [1.15, .09, .055], [0, .82 - row * .53, .39], material.copper, electrical)
      for (let col = 0; col < 4; col++) {
        const x = -.45 + col * .3
        box(`commercial-breaker-${row}-${col}`, [.25, .36, .13], [x, .83 - row * .53, .43], material.white, electrical, .015)
        box(`commercial-switch-${row}-${col}`, [.13, .1, .045], [x, .81 - row * .53, .51], material.green, electrical)
      }
    }
  }
  const power: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const points = [[-.48 + i * .18, 1.12, .42], [-.48 + i * .18, 1.62, .42], [-1.15 - i * .12, 1.65, .42], [-1.45 - i * .12, 1.25, .1], [-1.45 - i * .12, .65, .1]]
    pipe(`power-cable-${i}`, points, .028, material.copper, electrical)
    power.push(pipe(`power-trace-${i}`, points, .033, material.flow, electrical))
  }
  const ownedMaterials = new Set<THREE.Material>(Object.values(material))
  asset?.traverse(object => {
    if (object instanceof THREE.Mesh) for (const mat of Array.isArray(object.material) ? object.material : [object.material]) ownedMaterials.add(mat)
  })
  const revealed = [distribution, electrical].map(group => {
    const clones = new Map<THREE.Material, THREE.Material>()
    group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const clone = (original: THREE.Material) => {
        if (!clones.has(original)) {
          const copy = original.clone()
          copy.transparent = true
          clones.set(original, copy)
        }
        return clones.get(original)!
      }
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material)
    })
    return { group, materials: [...clones.values()] }
  })

  // The static guards/deck supply the fan-well shadows. Tiny moving rotor shadows
  // would force the entire detailed plant through a depth pass on every idle frame.
  fans.forEach(fan => fan.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = false }))
  scene.add(new THREE.HemisphereLight('#e5eee8', '#10291c', .7))
  const key = new THREE.DirectionalLight('#fff3df', 3.2)
  key.position.set(-3, 8, 5)
  key.castShadow = true
  key.shadow.autoUpdate = false
  let previousShadowState = ''
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -7, right: 8, top: 7, bottom: -5, near: 1, far: 28 })
  key.shadow.normalBias = .03
  scene.add(key)
  const rim = new THREE.DirectionalLight('#d1ebe2', 4)
  rim.position.set(4, 5, -4)
  scene.add(rim)
  const fill = new THREE.DirectionalLight('#d0e3d9', .65)
  fill.position.set(6, 2, 7)
  scene.add(fill)

  const flowMarkers = [...fluid, ...power].map((tube, i) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), material.flow)
    marker.name = `system-flow-marker-${i}`
    tube.parent!.add(marker)
    return { marker, curve: (tube.geometry as THREE.TubeGeometry).parameters.path, electrical: i >= fluid.length }
  })

  function update(pose: CommercialPose, aspect = 16 / 9, time = 0) {
    backdropMaterial.uniforms.center!.value.set(.5 - pose.shiftX, .5 + pose.shiftY)
    backdropMaterial.uniforms.aspect!.value = aspect
    key.position.x = -3 + pose.eye[0] * .15
    const shadowState = `${key.position.x}:${pose.maintenance}:${pose.distribution}:${pose.wiring}`
    if (shadowState !== previousShadowState) {
      key.shadow.needsUpdate = true
      previousShadowState = shadowState
    }
    fans.forEach((fan, i) => { fan.rotation.y = pose.flow * (Math.PI * (3 + i * .25) + time * (1.3 + i * .12)) })
    coil.position.set(-pose.maintenance * .22, -.05 - pose.maintenance * .38, .85 + pose.maintenance * .85)
    coil.rotation.x = -pose.maintenance * .12
    roof.position.y = .79 + pose.maintenance * .65
    for (let i = 0; i < revealed.length; i++) {
      const item = revealed[i]!
      const amount = i === 0 ? pose.distribution : pose.wiring
      item.group.visible = amount > 0
      const alpha = THREE.MathUtils.smoothstep(amount, 0, .6)
      item.materials.forEach(mat => { mat.opacity = alpha; mat.depthWrite = alpha === 1 })
    }
    plant.visible = pose.wiring < .95
    for (const [meshes, amount] of [[fluid, pose.distribution], [power, pose.wiring]] as const) {
      meshes.forEach(mesh => mesh.geometry.setDrawRange(0, Math.floor((mesh.geometry.index?.count ?? 0) * amount / 3) * 3))
    }
    flowMarkers.forEach(({ marker, curve, electrical }, i) => {
      const amount = electrical ? pose.wiring : pose.distribution
      const phase = (time * .18 + i * .21) % 1
      marker.visible = pose.flow > .05 && phase < amount && amount > .05
      marker.position.copy(curve.getPointAt(phase))
    })
  }
  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set(ownedMaterials)
    const textures = new Set<THREE.Texture>()
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry)
        for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat)
      }
      if (object instanceof THREE.InstancedMesh) object.dispose()
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose()
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(mat => {
      for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value)
      mat.dispose()
    })
    textures.forEach(texture => texture.dispose())
    scene.clear()
  }
  update(commercialPoseAt(0))
  return { scene, update, dispose }
}

export function createCommercialRenderer(host: HTMLElement, asset?: THREE.Group) {
  let ownedByWorld = false
  try {
    return createEquipmentRenderer(host, () => {
      const world = createCommercialWorld(asset)
      ownedByWorld = true
      return world
    }, commercialPoseAt)
  } catch (error) {
    if (asset && !ownedByWorld) disposeProductAsset(asset)
    throw error
  }
}
