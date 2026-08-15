import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// A estrela é desenhada em SVG: um glyph de texto exigiria download de fonte no build.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "radial-gradient(circle at 50% 20%, #2b1a4d 0%, #0d1025 60%, #070710 100%)",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#d6b36a">
        <path d="M12 1.5 14.1 9.9 22.5 12 14.1 14.1 12 22.5 9.9 14.1 1.5 12 9.9 9.9Z" />
      </svg>
    </div>,
    size,
  );
}
