import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "svgo-plugin-hoist-stroke-width",
    environment: "node",
  },
});
