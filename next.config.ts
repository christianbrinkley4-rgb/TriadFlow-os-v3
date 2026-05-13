import type { NextConfig } from "next";

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH === undefined ||
  process.env.NEXT_PUBLIC_BASE_PATH === ""
    ? ""
    : process.env.NEXT_PUBLIC_BASE_PATH.startsWith("/")
      ? process.env.NEXT_PUBLIC_BASE_PATH
      : `/${process.env.NEXT_PUBLIC_BASE_PATH}`;

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
