import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { prototypePoseAt, prototypeUpgradeAt, type PrototypePose } from './residential-prototype-path.ts'
import { createResidentialAirflow } from './residential-airflow.ts'
import { disposeProductAsset } from './residential-product.ts'

export { applyEquipmentCamera as applyPrototypeCamera } from './equipment-renderer.ts'
import { createEquipmentRenderer, createStudioBackdrop } from './equipment-renderer.ts'

// A standalone, unbranded product. Studio cards are used only for reflections.
export function createPrototypeWorld(product?: THREE.Group) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b3022')
  scene.environmentIntensity = .8
  const materials = {
    paper: new THREE.MeshPhysicalMaterial({ color: '#f4f3eb', roughness: .24, clearcoat: .7, clearcoatRoughness: .16 }),
    shell: new THREE.MeshStandardMaterial({ color: '#ccd0ca', roughness: .46 }),
    pine: new THREE.MeshStandardMaterial({ color: '#234436', roughness: .38 }),
    dark: new THREE.MeshStandardMaterial({ color: '#141c18', roughness: .4 }),
    metal: new THREE.MeshStandardMaterial({ color: '#becac5', metalness: .88, roughness: .28 }),
    copper: new THREE.MeshStandardMaterial({ color: '#bb8555', metalness: .9, roughness: .25 }),
    energy: new THREE.MeshStandardMaterial({ color: '#bbdec5', emissive: '#639f7a', emissiveIntensity: 1.5, roughness: .3 }),
  }
  const world = new THREE.Group()
  world.name = 'residential-prototype'
  scene.add(world)

  function box(name: string, size: [number, number, number], position: [number, number, number], material: THREE.Material, parent: THREE.Object3D = world, radius = .035) {
    const geometry = radius >= .06
      ? new RoundedBoxGeometry(...size, 5, Math.min(radius, ...size.map(value => value / 3)))
      : new THREE.BoxGeometry(...size)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    mesh.position.set(...position)
    mesh.receiveShadow = true
    mesh.castShadow = ['ac-body', 'cover-face', 'board-body'].includes(name)
    parent.add(mesh)
    return mesh
  }

  function tube(name: string, points: number[][], material: THREE.Material, radius = .025, parent: THREE.Object3D = world) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(point[0], point[1], point[2])), false, 'centripetal')
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 6, false), material)
    mesh.name = name
    parent.add(mesh)
    return mesh
  }

  // The backdrop stays in screen space, with no wall, floor or room geometry.
  const { mesh: backdrop, material: backdropMaterial } = createStudioBackdrop()
  scene.add(backdrop)

  function repeated(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, count: number, parent: THREE.Object3D, place: (dummy: THREE.Object3D, index: number) => void) {
    const mesh = new THREE.InstancedMesh(geometry, material, count)
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

  const ac = product ?? new THREE.Group()
  ac.name = 'air-conditioner'
  ac.position.set(-1.05, 2.6, 0)
  world.add(ac)
  if (!product) {
    box('ac-body', [3.7, 1.0, .68], [0, 0, 0], materials.paper, ac, .15)
    box('ac-recess', [3.38, .68, .06], [0, .07, .35], materials.dark, ac)
    box('ac-outlet', [3.22, .17, .13], [0, -.34, .37], materials.dark, ac)
    for (let i = 0; i < 3; i++) box(`outlet-louvre-${i}`, [3.13, .018, .1], [0, -.3 - i * .04, .45], materials.metal, ac, .006)
    box('lower-lip', [3.19, .028, .08], [0, -.45, .37], materials.paper, ac)
    box('top-intake', [3.15, .015, .37], [0, .493, -.04], materials.dark, ac)
    repeated('intake-slats', new THREE.BoxGeometry(.024, .025, .39), materials.shell, 42, ac, (dummy, i) => {
      dummy.position.set(-1.51 + i * .074, .502, -.04)
    })
    repeated('end-cap-seams', new THREE.BoxGeometry(.012, .66, .018), materials.shell, 2, ac, (dummy, i) => {
      dummy.position.set(i === 0 ? -1.76 : 1.76, .03, .343)
    })
    repeated('chassis-fasteners', new THREE.CylinderGeometry(.025, .025, .014, 12), materials.metal, 4, ac, (dummy, i) => {
      dummy.rotation.x = Math.PI / 2
      dummy.position.set(i % 2 ? 1.65 : -1.65, i < 2 ? .31 : -.17, .395)
    })

    // Shared fin geometry keeps the technical close-up inexpensive.
    repeated('evaporator-fins', new THREE.BoxGeometry(.013, .46, .15), materials.metal, 110, ac, (dummy, i) => {
      dummy.position.set(-1.54 + i * .0283, .08, .38)
    })
    tube('copper-header', [[-1.6, .33, .43], [1.58, .33, .43], [1.65, .24, .43], [1.58, -.14, .43], [-1.6, -.14, .43]], materials.copper, .025, ac)
    repeated('coil-return-bends', new THREE.TorusGeometry(.045, .012, 6, 12, Math.PI), materials.copper, 8, ac, (dummy, i) => {
      dummy.rotation.z = -Math.PI / 2
      dummy.position.set(1.6, .27 - i * .052, .4)
    })
    const blower = new THREE.Group()
    blower.name = 'crossflow-blower'
    blower.position.set(0, -.28, .25)
    ac.add(blower)
    repeated('blower-blades', new THREE.BoxGeometry(2.95, .014, .06), materials.dark, 32, blower, (dummy, i) => {
      const angle = i / 32 * Math.PI * 2
      dummy.position.set(0, Math.cos(angle) * .075, Math.sin(angle) * .075)
      dummy.rotation.x = -angle
    })

    const cover = new THREE.Group()
    cover.name = 'hinged-cover'
    cover.position.set(0, .46, .565)
    ac.add(cover)
    box('cover-face', [3.5, .71, .12], [0, -.355, 0], materials.paper, cover, .07)
    box('sensor-window', [.29, .06, .014], [1.22, -.57, .065], materials.dark, cover)
    box('status-light', [.1, .012, .018], [1.22, -.57, .074], materials.energy, cover, .005)
    const filter = new THREE.Group()
    filter.name = 'sliding-filter'
    filter.position.set(0, .07, .48)
    ac.add(filter)
    box('filter-top', [3.18, .035, .025], [0, .25, 0], materials.pine, filter)
    box('filter-bottom', [3.18, .035, .025], [0, -.25, 0], materials.pine, filter)
    repeated('filter-grid', new THREE.BoxGeometry(.009, .5, .014), materials.pine, 53, filter, (dummy, i) => {
      dummy.position.set(-1.56 + i * .06, 0, 0)
    })
    repeated('filter-rows', new THREE.BoxGeometry(3.14, .008, .014), materials.pine, 9, filter, (dummy, i) => {
      dummy.position.set(0, -.2 + i * .05, 0)
    })
  }
  const cover = ac.getObjectByName('hinged-cover')!
  const filter = ac.getObjectByName('sliding-filter')!
  const blower = ac.getObjectByName('crossflow-blower')!
  const acMaterials = new Set<THREE.Material>()
  ac.traverse(object => {
    if (object instanceof THREE.Mesh) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) acMaterials.add(material)
    }
  })
  const shellMaterials = [...acMaterials].filter((material): material is THREE.MeshStandardMaterial =>
    material instanceof THREE.MeshStandardMaterial && (material === materials.paper || material.name === 'ac-porcelain'))

  const air = new THREE.Group()
  air.name = 'airflow'
  ac.add(air)
  const airflow = createResidentialAirflow()
  air.add(airflow.mesh)

  // The duplicate enters only for the replacement chapter.
  // Shared geometry/materials are disposed through the deduplicated resource sets.
  const replacementUnit = ac.clone(true)
  replacementUnit.name = 'replacement-unit'
  replacementUnit.visible = false
  const replacementMaterials = new Map<THREE.Material, THREE.Material>()
  replacementUnit.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    const cloneMaterial = (source: THREE.Material) => {
      if (!replacementMaterials.has(source)) replacementMaterials.set(source, source.clone())
      return replacementMaterials.get(source)!
    }
    object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material)
  })
  replacementUnit.getObjectByName('airflow')!.visible = false
  world.add(replacementUnit)

  const electrical = new THREE.Group()
  electrical.name = 'electrical-assembly'
  electrical.visible = false
  world.add(electrical)
  // Independent materials allow the electrical equipment to emerge without
  // changing the AC shell or its reflections.
  const electricalMaterials = new Map<THREE.Material, THREE.Material>()
  function electricalMaterial(source: THREE.Material) {
    if (!electricalMaterials.has(source)) {
      const material = source.clone()
      material.transparent = true
      electricalMaterials.set(source, material)
    }
    return electricalMaterials.get(source)!
  }
  const liveWires: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const x = 1.85 + i * .16
    const y = 3.35 + i * .15
    const points = [[.68, 2.7 + i * .08, -.28], [1.1, 2.7 + i * .08, -.28], [1.15, y, -.28], [x, y, -.28], [x + .15, 3.1, -.28], [x + .15, 1.0 + i * .13, -.28], [2.3, .95 + i * .13, -.28], [2.8, .95 + i * .13, -.1]]
    tube(`cable-${i}`, points, i === 1 ? materials.copper : materials.pine, .035, electrical)
    liveWires.push(tube(`power-reveal-${i}`, points, materials.energy, .042, electrical))
  }

  const panel = new THREE.Group()
  panel.name = 'electrical-board'
  panel.position.set(2.78, .85, -.06)
  electrical.add(panel)
  box('board-body', [1.32, 1.92, .38], [0, 0, 0], materials.paper, panel, .06)
  box('board-inset', [1.08, 1.55, .04], [0, .02, .21], materials.dark, panel)
  for (let row = 0; row < 3; row++) {
    box(`din-rail-${row}`, [1, .07, .06], [0, .49 - row * .43, .25], materials.metal, panel)
    for (let i = 0; i < 4; i++) {
      const x = -.38 + i * .255
      const y = .48 - row * .43
      box(`breaker-${row}-${i}`, [.21, .32, .12], [x, y, .29], materials.shell, panel, .012)
      box(`switch-${row}-${i}`, [.1, .075, .065], [x, y, .39], materials.pine, panel, .009)
    }
  }
  box('board-terminal', [.9, .07, .08], [0, -.59, .28], materials.copper, panel)

  electrical.traverse(object => {
    if (object instanceof THREE.Mesh) object.material = electricalMaterial(object.material as THREE.Material)
  })

  scene.add(new THREE.HemisphereLight('#e5efe8', '#122e21', .75))
  const key = new THREE.DirectionalLight('#fff5e4', 3.4)
  key.position.set(-3.5, 7.5, 5)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -4, near: 1, far: 24 })
  key.shadow.normalBias = .03
  key.shadow.bias = -.0002
  scene.add(key)
  const rim = new THREE.DirectionalLight('#dcece5', 4.2)
  rim.position.set(2.5, 5, -4)
  scene.add(rim)
  const fill = new THREE.DirectionalLight('#c6d9ce', .7)
  fill.position.set(4, 1, 6)
  scene.add(fill)

  function opacity(material: THREE.Material, value: number) {
    const transparent = value < 1
    if (material.transparent !== transparent) {
      material.transparent = transparent
      material.needsUpdate = true
    }
    material.opacity = value
    material.depthWrite = !transparent
  }
  const newShellColor = new THREE.Color('#f4f3eb')
  const oldShellColor = new THREE.Color('#c1b9a4')

  function update(pose: PrototypePose, aspect = 16 / 9, time = 0) {
    backdropMaterial.uniforms.center!.value.set(.5 - pose.shiftX, .5 + pose.shiftY)
    backdropMaterial.uniforms.aspect!.value = aspect
    // The soft key tracks the view gently, revealing the shell's curved profile.
    key.position.x = -3.5 + pose.eye[0] * .22
    electrical.visible = pose.wiring > 0
    const reveal = THREE.MathUtils.smoothstep(pose.wiring, 0, .3)
    for (const material of electricalMaterials.values()) {
      material.opacity = reveal
      material.depthWrite = reveal === 1
    }
    cover.rotation.x = -pose.cover * 1.7
    filter.position.z = .48 + pose.filter * .48
    filter.position.y = .07 + pose.filter * .12
    const swap = prototypeUpgradeAt(pose.replacement)
    replacementUnit.visible = swap.active && swap.incoming > 0
    const outgoing = swap.active ? swap.outgoing : 0
    ac.position.set(-1.05 - outgoing * .4, 2.6 + outgoing * .16, -outgoing * 1.6)
    ac.rotation.y = -outgoing * .3
    const arriving = 1 - swap.incoming
    replacementUnit.position.set(-1.05 + arriving * .3, 2.6 - arriving * .3, -arriving)
    replacementUnit.rotation.y = arriving * .22
    for (const material of acMaterials) opacity(material, 1 - outgoing)
    replacementMaterials.forEach(material => opacity(material, swap.incoming))
    for (const material of shellMaterials) {
      material.color.copy(newShellColor).lerp(oldShellColor, outgoing)
      material.roughness = .24 + outgoing * .38
    }
    airflow.material.uniforms.strength!.value = swap.active ? 0 : pose.airflow
    airflow.material.uniforms.time!.value = time
    air.visible = !swap.active && pose.airflow > .001
    blower.rotation.x = pose.airflow * (Math.PI * 3 + time * 5)
    for (const wire of liveWires) {
      const total = wire.geometry.index?.count ?? 0
      wire.geometry.setDrawRange(0, Math.floor(total * pose.wiring / 3) * 3)
    }
  }

  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>()
    const sceneMaterials = new Set<THREE.Material>(Object.values(materials))
    const textures = new Set<THREE.Texture>()
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry)
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) sceneMaterials.add(material)
      }
      if (object instanceof THREE.InstancedMesh) object.dispose()
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose()
    })
    geometries.forEach(geometry => geometry.dispose())
    sceneMaterials.forEach(material => {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
      material.dispose()
    })
    textures.forEach(texture => texture.dispose())
    scene.clear()
  }
  return { scene, update, dispose }
}

export function createPrototypeRenderer(host: HTMLElement, product?: THREE.Group) {
  let ownedByWorld = false
  try {
    return createEquipmentRenderer(host, () => {
      const world = createPrototypeWorld(product)
      ownedByWorld = true
      return world
    }, prototypePoseAt)
  } catch (error) {
    // The shared renderer disposes a constructed world; startup may fail earlier.
    if (product && !ownedByWorld) disposeProductAsset(product)
    throw error
  }
}
