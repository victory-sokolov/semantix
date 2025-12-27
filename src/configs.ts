import { join } from "path";
import { existsSync } from "fs";
import {
  COMMITLINT_CONFIG,
  SEMANTIC_RELEASE_CONFIG,
  GITHUB_WORKFLOW,
  COMMIT_CONVENTION_README,
  COMMIT_MSG_HOOK,
} from "./constants";
import {
  log,
  writeJsonFile,
  writeTextFile,
  ensureDirectoryExists,
  execCommand,
  readJsonFile,
} from "./utils";

export function createCommitlintConfig(cwd: string) {
  log("📝 Creating commitlint configuration...", "info");

  writeTextFile(
    join(cwd, "commitlint.config.js"),
    `module.exports = ${JSON.stringify(COMMITLINT_CONFIG, null, 2)};`,
  );

  log("✓ commitlint.config.js created", "success");
}

export function createSemanticReleaseConfig(cwd: string) {
  log("📝 Creating semantic-release configuration...", "info");

  writeJsonFile(join(cwd, ".releaserc.json"), SEMANTIC_RELEASE_CONFIG);

  log("✓ .releaserc.json created", "success");
}

export function setupHusky(cwd: string) {
  log("🐕 Setting up Husky...", "info");

  // Initialize Husky
  execCommand("bunx husky init", cwd);

  // Create commit-msg hook
  const huskyDir = join(cwd, ".husky");
  ensureDirectoryExists(huskyDir);

  writeTextFile(join(huskyDir, "commit-msg"), COMMIT_MSG_HOOK);
  execCommand(`chmod +x ${join(huskyDir, "commit-msg")}`, cwd);

  log("✓ Husky configured with commit-msg hook", "success");
}

export function updatePackageJson(cwd: string) {
  log("📦 Updating package.json scripts...", "info");

  const packageJsonPath = join(cwd, "package.json");
  const scripts = {
    release: "semantic-release",
    "release:dry": "semantic-release --dry-run",
    prepare: "husky",
  };

  const packageJson = readJsonFile(packageJsonPath);
  packageJson.scripts = {
    ...packageJson.scripts,
    ...scripts,
  };
  writeJsonFile(packageJsonPath, packageJson);

  log("✓ package.json updated", "success");
}

export function createGitHubWorkflow(cwd: string) {
  log("🔄 Creating GitHub Actions workflow...", "info");

  const workflowDir = join(cwd, ".github", "workflows");
  ensureDirectoryExists(workflowDir);

  writeTextFile(join(workflowDir, "release.yml"), GITHUB_WORKFLOW);

  log("✓ GitHub Actions workflow created", "success");
}

export function createReadme(cwd: string) {
  const readmePath = join(cwd, "COMMIT_CONVENTION.md");

  if (existsSync(readmePath)) {
    log("ℹ️  COMMIT_CONVENTION.md already exists, skipping", "info");
    return;
  }

  writeTextFile(readmePath, COMMIT_CONVENTION_README);
  log("✓ COMMIT_CONVENTION.md created", "success");
}
