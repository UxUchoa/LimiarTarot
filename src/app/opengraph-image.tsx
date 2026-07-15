import { ImageResponse } from "next/og";

export const alt = "Limiar — Tarô de Waite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "radial-gradient(circle at 70% 25%, #3b1f62 0%, #0d1025 42%, #070710 100%)",
        color: "#f2ebdd",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ border: "1px solid rgba(214,179,106,.48)", borderRadius: 999, height: 500, position: "absolute", right: -80, top: -110, width: 500 }} />
      <div style={{ border: "1px solid rgba(121,80,242,.4)", borderRadius: 999, bottom: -260, height: 620, left: -160, position: "absolute", width: 620 }} />
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", maxWidth: 900, textAlign: "center" }}>
        <div style={{ color: "#d6b36a", display: "flex", fontSize: 22, letterSpacing: 9, marginBottom: 26, textTransform: "uppercase" }}>Entre símbolos e caminhos</div>
        <div style={{ display: "flex", fontFamily: "Georgia, serif", fontSize: 102, lineHeight: 1 }}>Limiar</div>
        <div style={{ color: "#aaa3b8", display: "flex", fontSize: 28, letterSpacing: 5, marginTop: 25, textTransform: "uppercase" }}>Tarô de Waite</div>
      </div>
    </div>,
    size,
  );
}
