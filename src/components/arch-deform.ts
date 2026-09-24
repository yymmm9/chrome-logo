import * as THREE from "three";

export function normalizeGeometry(
  geometry: THREE.BufferGeometry,
  targetWidth: number,
): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const scale = size.x > 1e-6 ? targetWidth / size.x : 1;
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(scale, scale, scale);
  geometry.computeBoundingBox();
  return geometry;
}

export function applyArch(
  geometry: THREE.BufferGeometry,
  arch: number,
): THREE.BufferGeometry {
  if (arch < 1e-4) return geometry;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;
  const halfW = Math.max(
    (box.max.x - box.min.x) / 2,
    1e-4,
  );
  const radius = halfW / Math.max(arch, 0.05);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const theta = THREE.MathUtils.clamp(x / radius, -1.4, 1.4);
    pos.setX(i, Math.sin(theta) * radius);
    pos.setY(i, y + (Math.cos(theta) - 1) * radius);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
