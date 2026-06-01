import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playgroundRootDir = join(rootDir, "apps", "playground");
const pagesRootDir = join(rootDir, ".pages");

const escapeHtml = (value) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
};

const loadPackageDescription = async (slug) => {
  const packageJsonPath = join(rootDir, "packages", slug, "package.json");

  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return packageJson.description ?? "";
  } catch {
    return "";
  }
};

const renderLandingPage = (playgrounds) => {
  const cards = playgrounds
    .map((playground) => {
      return `
        <li class="card">
          <a href="./${playground.slug}/">
            <strong>${escapeHtml(playground.slug)}</strong>
            <span>${escapeHtml(playground.description)}</span>
          </a>
        </li>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SVGO Playgrounds</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f6f0;
        --ink: #102033;
        --muted: #55657a;
        --card: rgba(255, 255, 255, 0.84);
        --border: rgba(16, 32, 51, 0.12);
        --accent: #0f766e;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.22), transparent 34%),
          linear-gradient(180deg, #fffef8, var(--bg));
      }

      main {
        width: min(960px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 72px 0 96px;
      }

      h1 {
        margin: 0 0 12px;
        font-size: clamp(2.2rem, 4vw, 4rem);
        line-height: 0.95;
      }

      p {
        max-width: 54rem;
        margin: 0 0 32px;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.6;
      }

      ul {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        padding: 0;
        margin: 0;
        list-style: none;
      }

      .card a {
        display: grid;
        gap: 10px;
        min-height: 160px;
        padding: 20px;
        border: 1px solid var(--border);
        border-radius: 24px;
        text-decoration: none;
        color: inherit;
        background: var(--card);
        backdrop-filter: blur(16px);
      }

      .card strong {
        font-size: 1.1rem;
      }

      .card span {
        color: var(--muted);
        line-height: 1.6;
      }

      .card a:hover {
        border-color: rgba(15, 118, 110, 0.34);
        transform: translateY(-1px);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>SVGO Plugin Playgrounds</h1>
      <p>
        Each playground is built from <code>apps/playground/&lt;slug&gt;</code>
        and published at a slug-based path so GitHub Pages can host a single
        artifact with a root landing page.
      </p>
      <ul>${cards}</ul>
    </main>
  </body>
</html>`;
};

const buildPlaygrounds = async () => {
  const entries = await readdir(playgroundRootDir, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (slugs.length === 0) {
    throw new Error("No playground apps were found under apps/playground");
  }

  await rm(pagesRootDir, {
    recursive: true,
    force: true,
  });
  await mkdir(pagesRootDir, { recursive: true });

  const playgrounds = [];

  for (const slug of slugs) {
    const result = spawnSync(
      "pnpm",
      ["--filter", `./apps/playground/${slug}`, "build"],
      {
        cwd: rootDir,
        stdio: "inherit",
      },
    );

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }

    const distDir = join(playgroundRootDir, slug, "dist");
    const targetDir = join(pagesRootDir, slug);

    cpSync(distDir, targetDir, { recursive: true });

    playgrounds.push({
      slug,
      description: await loadPackageDescription(slug),
    });
  }

  await writeFile(
    join(pagesRootDir, "index.html"),
    renderLandingPage(playgrounds),
  );
  await writeFile(join(pagesRootDir, ".nojekyll"), "");
};

await buildPlaygrounds();
