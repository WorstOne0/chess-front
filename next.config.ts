import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the files the server needs, so the Docker image skips the full node_modules.
  output: "standalone",
};

export default nextConfig;
