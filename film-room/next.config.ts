import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds a static preview (no server): the /api/ai route is left
 * out and the producer uses the local mock. Normal builds keep the server route.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server-only files use the ".api.ts" suffix so the static export can skip them.
  pageExtensions: isStaticExport ? ["tsx", "ts"] : ["tsx", "ts", "api.ts"],
  ...(isStaticExport ? { output: "export", basePath: "/app" } : {}),
};

export default nextConfig;
