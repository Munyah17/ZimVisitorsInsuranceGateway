import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root — a stray lockfile in the user profile dir
    // otherwise makes Next.js infer the wrong root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
