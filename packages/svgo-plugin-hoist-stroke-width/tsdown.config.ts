import { defineConfig } from "tsdown";

export default defineConfig({
  attw: {
    level: "error",
    profile: "esm-only",
  },
  clean: true,
  dts: true,
  entry: "src/index.ts",
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  publint: {
    strict: true,
  },
  sourcemap: false,
  target: "node24",
  tsconfig: "tsconfig.src.json",
});
