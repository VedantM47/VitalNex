import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// One .env for the whole repo: load the root .env (API + web) before Next reads
// NEXT_PUBLIC_* values. apps/web/.env* files, if present, still take precedence.
loadEnvConfig(path.resolve(process.cwd(), "../.."));

const nextConfig: NextConfig = {};

export default nextConfig;
