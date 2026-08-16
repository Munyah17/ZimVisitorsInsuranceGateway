import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #273b64 0%, #0d1730 100%)",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 4 5v6c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V5l-8-3Z"
            fill="#fea468"
          />
          <path
            d="m8.5 12 2.5 2.5 4.5-5"
            stroke="#0d1730"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
