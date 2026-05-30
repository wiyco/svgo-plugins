import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  entry: "src/index.ts",
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  sourcemap: false,
  target: "node24",
  tsconfig: "tsconfig.src.json",
});
