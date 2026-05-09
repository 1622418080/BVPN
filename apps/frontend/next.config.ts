import type { NextConfig } from "next";

// API_URL takes precedence for server-side rewrites (Docker internal networking),
// NEXT_PUBLIC_API_URL is used for client-side API calls
const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
const devOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const apiRoutes = ["auth", "plans", "orders", "payments", "vpn", "dashboard"];

const nextConfig: NextConfig = {
  output: "standalone",
  ...(devOrigins.length ? { allowedDevOrigins: devOrigins } : {}),
  async rewrites() {
    return [
      ...apiRoutes.map((route) => ({
        source: `/${route}/:path*`,
        destination: `${apiUrl}/${route}/:path*`
      })),
      {
        source: "/health",
        destination: `${apiUrl}/health`
      }
    ];
  }
};

export default nextConfig;
