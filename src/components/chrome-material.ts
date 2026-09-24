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
    uRimStrength: { value: number };
    uRimColor: { value: THREE.Color };
  };
}

export function createChromeMaterial(
  options: ChromeMaterialOptions,
): ChromeMaterialHandle {
  const uniforms = {
    uWobble: { value: options.wobble },
    uWobbleScale: { value: options.wobbleScale },
    uTime: { value: 0 },
    uRimStrength: { value: 0.9 },
    uRimColor: { value: new THREE.Color("#f2f4ff") },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(options.tint),
    metalness: 0.25,
    roughness: 0.6,
    envMapIntensity: 0.22,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
    reflectivity: 0.6,
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
  vec2 q2 = position.xy / max(uWobbleScale * 0.6, 1e-4);
  transformed.x += sin(q2.y * 2.1 + q2.x * 0.4 + uTime * 0.6) * uWobble * 0.55;
  transformed.y += cos(q2.x * 1.7 - q2.y * 0.5 + uTime * 0.5) * uWobble * 0.55;
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRimStrength;
uniform vec3 uRimColor;`,
      )
      .replace(
        "#include <opaque_fragment>",
        `float rimF = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 1.7);
outgoingLight += uRimColor * rimF * uRimStrength;
#include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => "chrome-wobble-rim";

  return { material, uniforms };
}
