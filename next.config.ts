import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.HANCUP_AUTH_TEST === "1" ? ".next-auth" : ".next",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};
export default config;
