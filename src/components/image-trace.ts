import * as THREE from "three";
import { contours } from "d3-contour";

export interface ImageTraceOptions {
  width?: number;
  threshold?: number;
}

export async function imageToShapes(
  url: string,
  options: ImageTraceOptions = {},
): Promise<THREE.Shape[]> {
  const width = options.width ?? 192;
  const threshold = options.threshold ?? 0.5;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = url;
  });

  const height = Math.max(
    8,
    Math.round(width * (img.naturalHeight / Math.max(img.naturalWidth, 1))),
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  const mask = new Array<number>(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3] / 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    mask[i] = a > 0.1 ? a * (a > 0.9 ? lum : 1) : 0;
  }

  const rings = contours()
    .size([width, height])
    .thresholds([threshold])(mask);

  const shapes: THREE.Shape[] = [];
  for (const multi of rings) {
    for (const polygon of multi.coordinates) {
      const outer = polygon[0];
      if (!outer || outer.length < 4) continue;
      const shape = new THREE.Shape();
      shape.moveTo(outer[0][0], height - outer[0][1]);
      for (let i = 1; i < outer.length; i++) {
        shape.lineTo(outer[i][0], height - outer[i][1]);
      }
      for (let h = 1; h < polygon.length; h++) {
        const hole = polygon[h];
        if (hole.length < 4) continue;
        const path = new THREE.Path();
        path.moveTo(hole[0][0], height - hole[0][1]);
        for (let i = 1; i < hole.length; i++) {
          path.lineTo(hole[i][0], height - hole[i][1]);
        }
        shape.holes.push(path);
      }
      shapes.push(shape);
    }
  }
  return shapes;
}

export function shapesToGeometry(
  shapes: THREE.Shape[],
  depth: number,
): THREE.BufferGeometry | null {
  if (shapes.length === 0) return null;
  const geometries = shapes.map(
    (shape) =>
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: depth * 0.12,
        bevelSize: depth * 0.08,
        bevelSegments: 3,
        curveSegments: 6,
      }),
  );
  let merged: THREE.BufferGeometry = geometries[0];
  for (let i = 1; i < geometries.length; i++) {
    merged = mergeGeometries(merged, geometries[i]);
  }
  return merged;
}

function mergeGeometries(
  a: THREE.BufferGeometry,
  b: THREE.BufferGeometry,
): THREE.BufferGeometry {
  const aPos = a.getAttribute("position");
  const bPos = b.getAttribute("position");
  const total = aPos.count + bPos.count;
  const merged = new THREE.BufferGeometry();
  for (const name of ["position", "normal", "uv"] as const) {
    const aAttr = a.getAttribute(name);
    const bAttr = b.getAttribute(name);
    if (!aAttr || !bAttr) continue;
    const size = aAttr.itemSize;
    const arr = new Float32Array(total * size);
    arr.set(aAttr.array as Float32Array, 0);
    arr.set(bAttr.array as Float32Array, aPos.count * size);
    merged.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return merged;
}
