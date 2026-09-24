# ChromeLogo

React + three.js 组件：3D 铬金属 logo 效果（拱形排布、熔边波动、闪光星星、泛光），灵感来自 ascension.pegassi.be 的 hero 字效，代码与资产全部自建。

## 使用

```tsx
import { ChromeLogo } from "./components/ChromeLogo";

<ChromeLogo text="ASCENSION" />
```

## 输入源

| source | 说明 |
|---|---|
| `{ kind: "text", text, fontUrl? }` | 文字 → 3D 挤出（默认 helvetiker bold，可传 typeface.json 字体 URL） |
| `{ kind: "svg", url }` | SVG 文件 → 轮廓挤出 |
| `{ kind: "image", url }` | 图片 → 亮度/alpha 阈值轮廓追踪后挤出（适合 logo/silhouette） |
| `{ kind: "glb", url }` | GLB/GLTF 模型 → 统一覆盖铬材质（支持 draco 压缩） |

## 参数

- `arch` (0–1)：拱形弯曲程度
- `wobble` (0–0.05)：表面熔边波动幅度
- `sparkles` / `sparkleSize`：闪光星星数量与大小
- `bloom`：泛光强度
- `speed`：动画速度（wobble/闪烁/摆动）
- `tint`：材质染色（默认淡蓝白 #dfe4ff）
- `pointerTilt`：指针视差倾斜开关
- `background`：背景色

## 本地运行

```bash
npm install
npm run build && npm run preview
```
