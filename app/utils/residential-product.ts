import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export const RESIDENTIAL_PRODUCT_URL = '/models/residential/ac-product-v1.glb'
const movingParts = ['ac-body', 'cover-face', 'hinged-cover', 'sliding-filter', 'crossflow-blower'] as const

/** Releases a loaded asset that never became a renderer's responsibility. */
export function disposeProductAsset(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
  })
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
  textures.forEach(texture => texture.dispose())
  root.clear()
}

/** Validate the Blender export at the boundary, before it can replace the fallback. */
export function prepareResidentialProduct(root: THREE.Group): THREE.Group {
  for (const name of movingParts) {
    if (!root.getObjectByName(name)) throw new Error(`AC model is missing ${name}`)
  }
  root.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(root)
  const size = bounds.getSize(new THREE.Vector3())
  if (![size.x, size.y, size.z].every(Number.isFinite) || size.x < 3.5 || size.x > 3.9 || size.y > 1.15 || size.z > 1.1) {
    throw new Error('AC model dimensions do not match the story camera')
  }
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    object.receiveShadow = true
    object.castShadow = ['ac-body', 'cover-face', 'moulded-end-cheeks'].includes(object.name)
  })
  root.userData.source = 'blender-ac-product-v1'
  return root
}

/** A bounded request keeps the procedural story usable on a failed/slow download. */
export async function loadResidentialProduct(signal: AbortSignal, url = RESIDENTIAL_PRODUCT_URL): Promise<THREE.Group | undefined> {
  if (signal.aborted) return
  const request = new AbortController()
  const abort = () => request.abort()
  signal.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 8000)
  let loaded: THREE.Group | undefined
  try {
    const response = await fetch(url, { signal: request.signal })
    if (!response.ok) return
    const buffer = await response.arrayBuffer()
    if (request.signal.aborted) return
    const gltf = await new GLTFLoader().parseAsync(buffer, '')
    loaded = gltf.scene
    if (request.signal.aborted) return
    const product = prepareResidentialProduct(loaded)
    loaded = undefined
    return product
  } catch {
    // The existing procedural AC remains available when delivery or parsing fails.
    return undefined
  } finally {
    if (loaded) disposeProductAsset(loaded)
    clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}
