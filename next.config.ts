import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Anchor tracing to this app (avoids picking parent GitHub/ package-lock.json)
  outputFileTracingRoot: projectRoot,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/transactions/import": [
      "./node_modules/pdf-parse/dist/worker/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
    ],
  },
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;
