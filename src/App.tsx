import { useMemo, useState } from "react";
import { ChromeLogo } from "./components/ChromeLogo";
import type { LogoSource } from "./components/LogoContent";

type SourceKind = LogoSource["kind"];

const SLIDER_STYLE: React.CSSProperties = {
  width: "100%",
  accentColor: "#8b93ff",
};

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#8b8b95",
        marginBottom: 14,
      }}
    >
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        {value && <span style={{ color: "#c8c8d0" }}>{value}</span>}
      </span>
      {children}
    </label>
  );
}

export function App() {
  const [kind, setKind] = useState<SourceKind>("text");
  const [text, setText] = useState("ASCENSION");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [arch, setArch] = useState(0.42);
  const [wobble, setWobble] = useState(0.007);
  const [sparkles, setSparkles] = useState(220);
  const [bloom, setBloom] = useState(0.75);
  const [speed, setSpeed] = useState(1);
  const [tint, setTint] = useState("#dfe4ff");
  const [pointerTilt, setPointerTilt] = useState(true);

  const source: LogoSource = useMemo(() => {
    if (kind === "text") return { kind: "text", text };
    if (fileUrl) return { kind, url: fileUrl } as LogoSource;
    return { kind: "text", text };
  }, [kind, text, fileUrl]);

  const accept =
    kind === "svg" ? ".svg" : kind === "image" ? "image/*" : ".glb,.gltf";

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <ChromeLogo
          source={source}
          arch={arch}
          wobble={wobble}
          sparkles={sparkles}
          bloom={bloom}
          speed={speed}
          tint={tint}
          pointerTilt={pointerTilt}
          background="#0a0a0c"
        />
      </div>
      <aside
        style={{
          width: 280,
          padding: "24px 20px",
          borderLeft: "1px solid #222228",
          overflowY: "auto",
          scrollbarWidth: "none",
          background: "#0d0d10",
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: 2,
            marginBottom: 20,
            color: "#f0f0f4",
          }}
        >
          CHROME LOGO
        </div>

        <Row label="Source">
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {(["text", "svg", "image", "glb"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: 11,
                  textTransform: "uppercase",
                  background: kind === k ? "#8b93ff" : "#1a1a20",
                  color: kind === k ? "#0a0a0c" : "#a0a0a8",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </Row>

        {kind === "text" && (
          <Row label="Text">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "8px 10px",
                background: "#1a1a20",
                border: "1px solid #2a2a32",
                borderRadius: 4,
                color: "#f0f0f4",
                fontSize: 14,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            />
          </Row>
        )}

        {kind !== "text" && (
          <Row label={kind === "glb" ? "GLB / GLTF" : kind === "svg" ? "SVG" : "Image"}>
            <input
              type="file"
              accept={accept}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFileUrl(URL.createObjectURL(f));
              }}
              style={{ marginTop: 6, fontSize: 11, color: "#a0a0a8" }}
            />
          </Row>
        )}

        <Row label="Arch" value={arch.toFixed(2)}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={arch}
            onChange={(e) => setArch(+e.target.value)}
            style={SLIDER_STYLE}
          />
        </Row>
        <Row label="Wobble" value={wobble.toFixed(3)}>
          <input
            type="range"
            min={0}
            max={0.05}
            step={0.001}
            value={wobble}
            onChange={(e) => setWobble(+e.target.value)}
            style={SLIDER_STYLE}
          />
        </Row>
        <Row label="Sparkles" value={String(sparkles)}>
          <input
            type="range"
            min={0}
            max={600}
            step={10}
            value={sparkles}
            onChange={(e) => setSparkles(+e.target.value)}
            style={SLIDER_STYLE}
          />
        </Row>
        <Row label="Bloom" value={bloom.toFixed(2)}>
          <input
            type="range"
            min={0}
            max={1.6}
            step={0.05}
            value={bloom}
            onChange={(e) => setBloom(+e.target.value)}
            style={SLIDER_STYLE}
          />
        </Row>
        <Row label="Speed" value={speed.toFixed(1)}>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            style={SLIDER_STYLE}
          />
        </Row>
        <Row label="Tint">
          <input
            type="color"
            value={tint}
            onChange={(e) => setTint(e.target.value)}
            style={{
              marginTop: 6,
              width: 44,
              height: 26,
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          />
        </Row>
        <Row label="Pointer tilt">
          <input
            type="checkbox"
            checked={pointerTilt}
            onChange={(e) => setPointerTilt(e.target.checked)}
            style={{ marginTop: 6, accentColor: "#8b93ff" }}
          />
        </Row>
      </aside>
    </div>
  );
}
