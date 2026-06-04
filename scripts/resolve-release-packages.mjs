import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const packagesRoot = "packages";
const releaseTag = process.env.RELEASE_TAG ?? process.argv[2];
const repositoryFullName = process.env.GITHUB_REPOSITORY;
const repositoryOwner =
  process.env.GITHUB_REPOSITORY_OWNER ?? repositoryFullName?.split("/")[0];
const expectedScope =
  repositoryOwner === undefined ? null : `@${repositoryOwner.toLowerCase()}`;
const expectedRepositoryPath =
  repositoryFullName === undefined
    ? null
    : `github.com/${repositoryFullName.toLowerCase()}`;
const packageNamePattern = /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const forbiddenLifecycleScripts = [
  "preinstall",
  "install",
  "postinstall",
  "prepublish",
  "prepublishOnly",
  "prepack",
  "prepare",
  "postpack",
  "publish",
  "postpublish",
  "dependencies",
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!releaseTag) {
  fail("RELEASE_TAG is required.");
}

if (!existsSync(packagesRoot)) {
  fail(`Packages directory '${packagesRoot}' does not exist.`);
}

const readPackageJson = (directory) => {
  const path = join(directory, "package.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw);
};

const normalizeRepositoryUrl = (url) =>
  url
    .toLowerCase()
    .replace(/^git\+https:\/\/github\.com\//, "github.com/")
    .replace(/^https:\/\/github\.com\//, "github.com/")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

const repositoryUrlMatches = (url) =>
  expectedRepositoryPath === null ||
  normalizeRepositoryUrl(url) === expectedRepositoryPath;

const packageDirectories = readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesRoot, entry.name))
  .filter((directory) => existsSync(join(directory, "package.json")));

const packages = packageDirectories
  .map((directory) => {
    const packageJson = readPackageJson(directory);
    return {
      directory,
      directoryName: basename(directory),
      packageJson,
    };
  })
  .filter(({ packageJson }) => packageJson.private !== true)
  .map(({ directory, directoryName, packageJson }) => {
    if (typeof packageJson.name !== "string" || packageJson.name.length === 0) {
      fail(`${directory}/package.json must define a package name.`);
    }

    if (
      typeof packageJson.version !== "string" ||
      packageJson.version.length === 0
    ) {
      fail(`${directory}/package.json must define a package version.`);
    }

    if (!packageNamePattern.test(packageJson.name)) {
      fail(
        `${packageJson.name} must be a lowercase scoped npm package name in the '@scope/name' format.`,
      );
    }

    const [scope, unscopedName] = packageJson.name.split("/");

    if (expectedScope !== null && scope !== expectedScope) {
      fail(`${packageJson.name} must use the '${expectedScope}' scope.`);
    }

    if (!semverPattern.test(packageJson.version)) {
      fail(
        `${packageJson.name} version '${packageJson.version}' must be valid semver.`,
      );
    }

    for (const lifecycleScript of forbiddenLifecycleScripts) {
      if (typeof packageJson.scripts?.[lifecycleScript] === "string") {
        fail(
          `${directory}/package.json must not define scripts.${lifecycleScript}; release publishing runs with --ignore-scripts.`,
        );
      }
    }

    if (expectedRepositoryPath !== null) {
      if (
        typeof packageJson.repository !== "object" ||
        packageJson.repository === null ||
        typeof packageJson.repository.url !== "string"
      ) {
        fail(
          `${directory}/package.json must define repository.url for ${repositoryFullName}.`,
        );
      }

      if (!repositoryUrlMatches(packageJson.repository.url)) {
        fail(
          `${directory}/package.json repository.url must point to ${repositoryFullName}.`,
        );
      }

      if (packageJson.repository.directory !== directory) {
        fail(
          `${directory}/package.json repository.directory must be '${directory}'.`,
        );
      }
    }

    return {
      dir: directory,
      dirName: directoryName,
      name: packageJson.name,
      scope,
      unscopedName,
      version: packageJson.version,
    };
  });

if (packages.length === 0) {
  fail(`No publishable packages were found under '${packagesRoot}'.`);
}

const parsePackageTag = (tag) => {
  const separatorIndex = tag.lastIndexOf("@");

  if (separatorIndex <= 0) {
    return null;
  }

  return {
    selector: tag.slice(0, separatorIndex),
    version: tag.slice(separatorIndex + 1),
  };
};

const versionFromSharedTag = releaseTag.startsWith("v")
  ? releaseTag.slice(1)
  : null;
const packageTag = parsePackageTag(releaseTag);

const selectedPackages =
  versionFromSharedTag !== null
    ? packages.filter(
        (packageEntry) => packageEntry.version === versionFromSharedTag,
      )
    : [];

const selectedPackageTags =
  packageTag === null
    ? []
    : packages.filter(
        (packageEntry) =>
          packageEntry.version === packageTag.version &&
          [
            packageEntry.name,
            packageEntry.unscopedName,
            packageEntry.dirName,
          ].includes(packageTag.selector),
      );

const targets =
  selectedPackageTags.length > 0 ? selectedPackageTags : selectedPackages;

if (targets.length === 0) {
  fail(
    [
      `Release tag '${releaseTag}' does not match any publishable package.`,
      "Use 'v<version>' to publish every package at that version,",
      "or '<package-name>@<version>' to publish one package.",
    ].join(" "),
  );
}

const matrix = targets.map((packageEntry) => ({
  dir: packageEntry.dir,
  name: packageEntry.name,
  scope: packageEntry.scope,
  spec: `${packageEntry.name}@${packageEntry.version}`,
  tarball: `${packageEntry.name
    .replace(/^@/, "")
    .replaceAll("/", "-")}-${packageEntry.version}.tgz`,
  testProject: existsSync(join(packageEntry.dir, "vitest.config.ts"))
    ? packageEntry.dirName
    : "",
  version: packageEntry.version,
}));

console.log("Release packages:");
for (const packageEntry of matrix) {
  console.log(`- ${packageEntry.spec} (${packageEntry.dir})`);
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `packages=${JSON.stringify(matrix)}\n`,
  );
} else {
  console.log(JSON.stringify(matrix, null, 2));
}
