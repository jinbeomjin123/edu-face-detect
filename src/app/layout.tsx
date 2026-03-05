import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FaceAuth · 얼굴 인증",
  description: "얼굴 인식 기반 금융 인증 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-surface-900 antialiased">
        {/* Mobile frame wrapper */}
        <div className="mx-auto min-h-screen max-w-md relative">
          {children}
        </div>
      </body>
    </html>
  );
}
