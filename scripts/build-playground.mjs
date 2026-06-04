import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playgroundDir = join(rootDir, "apps", "playground");
const pagesRootDir = join(rootDir, ".pages");

const buildPlaygrounds = async () => {
  const result = spawnSync("pnpm", ["--filter", "./apps/playground", "build"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  await rm(pagesRootDir, {
    recursive: true,
    force: true,
  });
  await mkdir(pagesRootDir, { recursive: true });

  cpSync(join(playgroundDir, "dist"), pagesRootDir, { recursive: true });
  await writeFile(join(pagesRootDir, ".nojekyll"), "");
};

await buildPlaygrounds();
