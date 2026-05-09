import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BVPN - Secure WireGuard VPN", template: "%s | BVPN" },
  description: "WireGuard-based VPN subscription dashboard"
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
