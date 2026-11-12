import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  const isDockerBuild = process.env.NEXT_DOCKER_BUILD === "1";
  const isPreTypechecked = process.env.NEXT_PRE_TYPECHECKED === "1";
  const isDev =
    phase === PHASE_DEVELOPMENT_SERVER || process.env.NODE_ENV === "development";

  return {
    distDir: process.env.NEXT_DIST_DIR || (isDev ? ".next-dev" : ".next"),
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
}
