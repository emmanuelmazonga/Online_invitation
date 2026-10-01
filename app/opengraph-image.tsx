import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "James & Diana · 21 November 2026 · Ndola, Zambia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function OpenGraphImage() {
  const photo = `data:image/jpeg;base64,${readFileSync(join(process.cwd(), "public", "images", "field-walk.jpg")).toString("base64")}`;
  return new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", alignItems: "center", overflow: "hidden", color: "#FAF7F0", background: "#28352B" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" width="1200" height="1800" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 56%" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(28,43,32,.94) 0%, rgba(28,43,32,.75) 45%, rgba(28,43,32,.16) 100%)" }} />
      <div style={{ position: "relative", display: "flex", width: "660px", height: "100%", padding: "78px 0 68px 78px", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", marginBottom: "24px", color: "#DDC796", fontSize: "18px", letterSpacing: "7px", textTransform: "uppercase" }}>Wedding invitation</div>
        <div style={{ display: "flex", fontFamily: "Georgia", fontSize: "96px", lineHeight: .92, letterSpacing: "-5px" }}>James &amp;<br />Diana</div>
        <div style={{ display: "flex", width: "110px", height: "2px", margin: "34px 0", background: "#C7A96B" }} />
        <div style={{ display: "flex", fontSize: "22px", letterSpacing: "5px" }}>21 NOVEMBER 2026</div>
        <div style={{ display: "flex", marginTop: "10px", color: "#EAE1D3", fontSize: "17px", letterSpacing: "6px" }}>NDOLA, ZAMBIA</div>
      </div>
    </div>,
    size,
  );
}
