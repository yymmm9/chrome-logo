import * as THREE from "three";

export interface ChromeMaterialOptions {
  tint: string;
  wobble: number;
  wobbleScale: number;
}

export interface ChromeMaterialHandle {
  material: THREE.MeshPhysicalMaterial;
  uniforms: {
    uWobble: { value: number };
    uWobbleScale: { value: number };
    uTime: { value: number };
  };
}

export function createChromeMaterial(
  options: ChromeMaterialOptions,
): ChromeMaterialHandle {
  const uniforms = {
    uWobble: { value: options.wobble },
    uWobbleScale: { value: options.wobbleScale },
    uTime: { value: 0 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(options.tint),
    metalness: 1.0,
    roughness: 0.22,
    envMapIntensity: 1.15,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
    reflectivity: 1.0,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uWobble;
uniform float uWobbleScale;
uniform float uTime;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec2 q = position.xy / max(uWobbleScale, 1e-4);
  float wob =
      sin(q.x * 1.0 + q.y * 0.7 + uTime * 0.7)
    + 0.6 * sin(q.x * 2.3 - q.y * 1.9 + 1.7 + uTime * 0.9)
    + sin(q.y * 0.9 - q.x * 0.6 + uTime * 0.8)
    + 0.6 * sin(q.y * 2.1 + q.x * 1.7 - 0.9 - uTime * 0.6);
  transformed += normal * wob * uWobble;
}`,
      );
  };
  material.customProgramCacheKey = () => "chrome-wobble";

  return { material, uniforms };
}
