import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { disposeProductAsset } from './residential-product.ts'

export { disposeProductAsset as disposeCommercialProduct }
export const COMMERCIAL_PRODUCT_URL = '/models/commercial/commercial-equipment-v1.glb'
const parts = ['cooling-plant', 'service-coil', 'fan-deck', 'plant-fan-0', 'plant-fan-1', 'plant-fan-2', 'distribution-assembly', 'air-handling-unit', 'commercial-electrical'] as const

/** Reject incompatible exports before they enter the existing story camera path. */
export function prepareCommercialProduct(root: THREE.Group): THREE.Group {
  for (const name of parts) if (!root.getObjectByName(name)) throw new Error(`Commercial model is missing ${name}`)
  root.updateMatrixWorld(true)
  const size = new THREE.Box3().setFromObject(root, true).getSize(new THREE.Vector3())
  if (![size.x, size.y, size.z].every(Number.isFinite) || size.x < 8 || size.x > 9.2 || size.y < 2.8 || size.y > 3.5 || size.z > 2.2) {
    throw new Error('Commercial model dimensions do not match the story cameras')
  }
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    object.receiveShadow = true
    object.castShadow = true
  })
  root.userData.source = 'blender-commercial-equipment-v1'
  return root
}

/** Delivery failure leaves the procedural equipment available within eight seconds. */
export async function loadCommercialProduct(signal: AbortSignal, url = COMMERCIAL_PRODUCT_URL): Promise<THREE.Group | undefined> {
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
    loaded = (await new GLTFLoader().parseAsync(buffer, '')).scene
    if (request.signal.aborted) return
    const product = prepareCommercialProduct(loaded)
    loaded = undefined
    return product
  } catch {
    return undefined
  } finally {
    if (loaded) disposeProductAsset(loaded)
    clearTimeout(timeout)
    signal.removeEventListener('abort', abort)
  }
}
