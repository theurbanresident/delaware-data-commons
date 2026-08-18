import type { NextConfig } from "next";

const pagesAssetPrefix = process.env.PAGES_ASSET_PREFIX ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  assetPrefix: pagesAssetPrefix || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
