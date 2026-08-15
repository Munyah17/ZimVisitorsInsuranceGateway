import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root — a stray lockfile in the user profile dir
    // otherwise makes Next.js infer the wrong root.
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      { source: "/super-admin", destination: "/private", permanent: false },
      { source: "/superadmin", destination: "/private", permanent: false },
    ];
  },
};

export default nextConfig;
