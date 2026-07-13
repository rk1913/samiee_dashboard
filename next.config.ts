import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  ...({ optimizeFonts: false } as any),
};

export default nextConfig;
