import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { applyArch, normalizeGeometry } from "./arch-deform";
import { imageToShapes, shapesToGeometry } from "./image-trace";

const fontLoader = new FontLoader();
const svgLoader = new SVGLoader();
const gltfLoader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
);
gltfLoader.setDRACOLoader(draco);

export type LogoSource =
  | { kind: "text"; text: string; fontUrl?: string }
  | { kind: "svg"; url: string }
  | { kind: "image"; url: string }
  | { kind: "glb"; url: string };

const DEFAULT_FONT = "/fonts/helvetiker_bold.typeface.json";

function useFont(fontUrl: string) {
  const [font, setFont] = useState<ReturnType<FontLoader["parse"]> | null>(
    null,
  );
  useEffect(() => {
    let alive = true;
    fontLoader.load(fontUrl, (f) => {
      if (alive) setFont(f);
    });
    return () => {
      alive = false;
    };
  }, [fontUrl]);
  return font;
}

function buildExtruded(shapes: THREE.Shape[], depth: number) {
  const geometries = shapes.map(
    (shape) =>
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: depth * 0.3,
        bevelSize: depth * 0.18,
        bevelSegments: 4,
        curveSegments: 10,
      }),
  );
  return geometries.length === 1
    ? geometries[0]
    : BufferGeometryUtils.mergeGeometries(geometries, false);
}

export function useLogoGeometry(
  source: LogoSource,
  arch: number,
): THREE.BufferGeometry | null {
  const [svgText, setSvgText] = useState<string | null>(null);
  const [imageShapes, setImageShapes] = useState<THREE.Shape[] | null>(null);
  const [glb, setGlb] = useState<THREE.BufferGeometry | null>(null);
  const font = useFont(
    source.kind === "text" ? (source.fontUrl ?? DEFAULT_FONT) : DEFAULT_FONT,
  );

  useEffect(() => {
    if (source.kind !== "svg") {
      setSvgText(null);
      return;
    }
    let alive = true;
    fetch(source.url)
      .then((r) => r.text())
      .then((t) => {
        if (alive) setSvgText(t);
      });
    return () => {
      alive = false;
    };
  }, [source]);

  useEffect(() => {
    if (source.kind !== "image") {
      setImageShapes(null);
      return;
    }
    let alive = true;
    imageToShapes(source.url).then((s) => {
      if (alive) setImageShapes(s);
    });
    return () => {
      alive = false;
    };
  }, [source]);

  useEffect(() => {
    if (source.kind !== "glb") {
      setGlb(null);
      return;
    }
    let alive = true;
    gltfLoader.load(source.url, (g) => {
      if (!alive) return;
      const geometries: THREE.BufferGeometry[] = [];
      g.scene.updateMatrixWorld(true);
      g.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry) {
          const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
          geometries.push(geo);
        }
      });
      if (geometries.length > 0) {
        const merged =
          geometries.length === 1
            ? geometries[0]
            : BufferGeometryUtils.mergeGeometries(geometries, false);
        setGlb(merged ?? geometries[0]);
      }
    });
    return () => {
      alive = false;
    };
  }, [source]);

  return useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    if (source.kind === "text" && font) {
      geometry = new TextGeometry(source.text || " ", {
        font,
        size: 1,
        depth: 0.3,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.03,
        bevelSegments: 4,
      });
    } else if (source.kind === "svg" && svgText) {
      const parsed = svgLoader.parse(svgText);
      const shapes = parsed.paths.flatMap((p) =>
        SVGLoader.createShapes(p),
      );
      geometry = buildExtruded(shapes, 0.3);
    } else if (source.kind === "image" && imageShapes) {
      geometry = buildExtruded(imageShapes, 0.3);
    } else if (source.kind === "glb" && glb) {
      geometry = glb;
    }
    if (!geometry) return null;
    normalizeGeometry(geometry, 4.2);
    applyArch(geometry, arch);
    return geometry;
  }, [source, font, svgText, imageShapes, glb, arch]);
}
