import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createChromeMaterial } from "./chrome-material";
import { Sparkles } from "./Sparkles";
import { useLogoGeometry, type LogoSource } from "./LogoContent";

const GRAIN_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    float hash(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float g = hash(vUv * vec2(1920.0, 1080.0) + mod(uTime, 10.0) * 61.7) - 0.5;
      c.rgb += g * 0.05;
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - smoothstep(0.55, 0.95, d) * 0.45;
      gl_FragColor = c;
    }
  `,
};

export interface ChromeLogoProps {
  source?: LogoSource;
  text?: string;
  fontUrl?: string;
  arch?: number;
  wobble?: number;
  sparkles?: number;
  sparkleSize?: number;
  bloom?: number;
  speed?: number;
  tint?: string;
  pointerTilt?: boolean;
  background?: string;
  className?: string;
}

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Effects({ bloom, speed }: { bloom: number; speed: number }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      bloom,
      0.55,
      0.72,
    );
    c.addPass(bloomPass);
    const grainPass = new ShaderPass(GRAIN_SHADER);
    c.addPass(grainPass);
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useFrame((state) => {
    const bloomPass = composer.passes[1] as UnrealBloomPass;
    bloomPass.strength = bloom;
    const grainPass = composer.passes[2] as ShaderPass;
    grainPass.uniforms.uTime.value = state.clock.elapsedTime * speed;
    composer.render();
  }, 1);
  return null;
}

function LogoMesh({
  geometry,
  uniforms,
  material,
}: {
  geometry: THREE.BufferGeometry | null;
  uniforms: ReturnType<typeof createChromeMaterial>["uniforms"];
  material: THREE.Material;
}) {
  if (!geometry) return null;
  return <mesh geometry={geometry} material={material} />;
}

function SceneContent(props: Required<Omit<ChromeLogoProps, "className" | "text" | "fontUrl" | "source" | "background">> & { source: LogoSource }) {
  const geometry = useLogoGeometry(props.source, props.arch);
  const { material, uniforms } = useMemo(
    () =>
      createChromeMaterial({
        tint: props.tint,
        wobble: props.wobble,
        wobbleScale: 2.4,
      }),
    [],
  );

  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef(new THREE.Vector2());

  useFrame((state) => {
    const t = state.clock.elapsedTime * props.speed;
    uniforms.uTime.value = t;
    uniforms.uWobble.value = props.wobble;
    material.color.set(props.tint);

    const group = groupRef.current;
    if (group) {
      const px = props.pointerTilt ? state.pointer.x : 0;
      const py = props.pointerTilt ? state.pointer.y : 0;
      pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, px, 0.06);
      pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, py, 0.06);
      group.rotation.y =
        Math.sin(t * 0.24) * 0.05 + pointer.current.x * 0.22;
      group.rotation.x =
        Math.sin(t * 0.31 + 1.2) * 0.03 - pointer.current.y * 0.14;
    }
  });

  return (
    <group ref={groupRef}>
      <LogoMesh geometry={geometry} uniforms={uniforms} material={material} />
      <Sparkles
        geometry={geometry}
        count={props.sparkles}
        size={props.sparkleSize}
        speed={props.speed}
      />
    </group>
  );
}

export function ChromeLogo(props: ChromeLogoProps) {
  const source: LogoSource = props.source ?? {
    kind: "text",
    text: props.text ?? "ASCENSION",
    fontUrl: props.fontUrl,
  };

  const resolved = {
    source,
    arch: props.arch ?? 0.42,
    wobble: props.wobble ?? 0.007,
    sparkles: props.sparkles ?? 220,
    sparkleSize: props.sparkleSize ?? 0.2,
    bloom: props.bloom ?? 0.75,
    speed: props.speed ?? 1,
    tint: props.tint ?? "#dfe4ff",
    pointerTilt: props.pointerTilt ?? true,
  };

  return (
    <div
      className={props.className}
      style={{
        width: "100%",
        height: "100%",
        background: props.background ?? "transparent",
      }}
    >
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[props.background ?? "#0a0a0c"]} />
        <Environment />
        <SceneContent {...resolved} />
        <Effects bloom={resolved.bloom} speed={resolved.speed} />
      </Canvas>
    </div>
  );
}
