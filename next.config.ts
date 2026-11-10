import type { NextConfig } from "next";

const isDockerBuild = process.env.NEXT_DOCKER_BUILD === "1";
const isPreTypechecked = process.env.NEXT_PRE_TYPECHECKED === "1";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingExcludes: isDockerBuild
    ? undefined
    : {
        "*": ["./node_modules/**"]
      },
  eslint: {
    ignoreDuringBuilds: isPreTypechecked
  },
  typescript: {
    ignoreBuildErrors: isPreTypechecked
  }
};

export default nextConfig;
