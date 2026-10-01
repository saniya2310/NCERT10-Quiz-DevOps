import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd()),
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.61.1"],
};

export default nextConfig;
