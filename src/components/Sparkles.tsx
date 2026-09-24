import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

function createStarTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const c = size / 2;
    const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.12, "rgba(255,255,255,0.9)");
    glow.addColorStop(0.35, "rgba(220,228,255,0.25)");
    glow.addColorStop(1, "rgba(220,228,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    ctx.globalCompositeOperation = "lighter";
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ] as const) {
      const streak = ctx.createLinearGradient(
        c - dx * c,
        c - dy * c,
        c + dx * c,
        c + dy * c,
      );
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(255,255,255,0.95)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = streak;
      if (dx === 1) {
        ctx.fillRect(0, c - 1.2, size, 2.4);
      } else {
        ctx.fillRect(c - 1.2, 0, 2.4, size);
      }
    }
    for (const rot of [Math.PI / 4, -Math.PI / 4]) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(rot);
      const streak = ctx.createLinearGradient(-c * 0.45, 0, c * 0.45, 0);
      streak.addColorStop(0, "rgba(255,255,255,0)");
      streak.addColorStop(0.5, "rgba(255,255,255,0.55)");
      streak.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = streak;
      ctx.fillRect(-c * 0.45, -0.8, c * 0.9, 1.6);
      ctx.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const VERTEX = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSize;
varying float vTwinkle;
void main() {
  float s = sin(uTime * 2.4 + aSeed * 6.2831853);
  vTwinkle = pow(max(0.5 + 0.5 * s, 0.0), 3.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (0.35 + 1.15 * vTwinkle) * (160.0 / max(-mv.z, 1.0));
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
varying float vTwinkle;
void main() {
  vec4 c = texture2D(uMap, gl_PointCoord);
  float alpha = c.a * (0.08 + 0.92 * vTwinkle);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(c.rgb, alpha);
}
`;

export interface SparklesProps {
  geometry: THREE.BufferGeometry | null;
  count: number;
  size: number;
  speed: number;
}

export function Sparkles({ geometry, count, size, speed }: SparklesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const pointsGeometry = useMemo(() => {
    if (!geometry || count <= 0) return null;
    const mesh = new THREE.Mesh(geometry);
    const sampler = new MeshSurfaceSampler(mesh).build();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      let tries = 0;
      do {
        sampler.sample(p, n);
        tries++;
      } while (n.z < 0.35 && tries < 24);
      const offset = n.clone().multiplyScalar(0.012);
      positions[i * 3] = p.x + offset.x;
      positions[i * 3 + 1] = p.y + offset.y;
      positions[i * 3 + 2] = p.z + offset.z;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [geometry, count]);

  const texture = useMemo(() => createStarTexture(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uMap: { value: texture },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [texture],
  );
  materialRef.current = material;

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime * speed;
    material.uniforms.uSize.value = size;
  });

  if (!pointsGeometry) return null;
  return <points ref={pointsRef} geometry={pointsGeometry} material={material} />;
}
