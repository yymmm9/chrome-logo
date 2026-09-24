# Changelog

## 2026-09-24 — ChromeLogo 组件首版

- 复刻 ascension.pegassi.be hero 的 3D 铬字 + 闪光效果（资产全部自建，未使用原站文件）
- `<ChromeLogo>` React 组件（three.js + R3F）：MeshPhysicalMaterial 铬材质（metalness + clearcoat + RoomEnvironment env map）、顶点 wobble 熔边（移植原站 shader 思路的多频正弦位移）、抛物线拱形形变、MeshSurfaceSampler 表面采样闪光星星（四角星纹理 + 闪烁 shader）、UnrealBloom 泛光 + 胶片颗粒 + 暗角后处理、指针视差倾斜
- 四种输入源：文字（TextGeometry + bevel）、SVG（SVGLoader → Extrude）、图片（d3-contour 轮廓追踪 → Extrude）、GLB/GLTF（GLTFLoader + DRACO，材质统一覆盖为铬）
- demo 页：源切换、文字输入、文件上传、arch/wobble/sparkles/bloom/speed/tint/pointerTilt 全参数面板

## 2026-09-24 — 效果修正：平色字面 + 白边辉光（对齐原站）

- 原版并非镜面铬 —— 改为淡紫平色字面（metalness 0.25 / roughness 0.6 / envMapIntensity 0.22）
- fragment 注入 fresnel rim（pow 1.7，淡蓝白）形成贴合轮廓的白色描边辉光
- 字形 condensed：x 0.66 / y 1.3，挤出减薄（depth 0.18 + 小 bevel）
- 顶点 wobble 增加 xy 面内位移 → 字形轮廓出现熔边抖动
- 闪光星星：采样偏向 bevel 棱边（n.z 0.12–0.8），尺寸加大（默认 0.9），数量减到 70
- bloom 阈值 0.88 只让 rim/星星溢出；默认强度 0.55
