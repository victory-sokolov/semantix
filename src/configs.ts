import { join } from "path";
import {
  COMMITLINT_CONFIG,
  SEMANTIC_RELEASE_CONFIG,
  getGithubWorkflow,
  getLefthookConfig,
  type PackageManager,
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
    `export default ${JSON.stringify(COMMITLINT_CONFIG, null, 4)};`,
  );

  log("✓ commitlint.config.js created", "success");
}

export function createSemanticReleaseConfig(cwd: string) {
  log("📝 Creating semantic-release configuration...", "info");

  const configContent = `const config = ${JSON.stringify(SEMANTIC_RELEASE_CONFIG, null, 4)};

export default config;
`;
  writeTextFile(join(cwd, ".releaserc.mjs"), configContent);

  log("✓ .releaserc.mjs created", "success");
}

export function setupLefthook(cwd: string, pm: PackageManager) {
  log("🥊 Setting up Lefthook...", "info");

  // Create lefthook.yml
  writeTextFile(join(cwd, "lefthook.yml"), getLefthookConfig(pm));

  // Install Lefthook
  try {
    let execCmd = "npx lefthook install";
    if (pm === "bun") {
      execCmd = "bunx lefthook install";
    }
    if (pm === "yarn") {
      execCmd = "yarn dlx lefthook install";
    }
    if (pm === "pnpm") {
      execCmd = "pnpm dlx lefthook install";
    }

    execCommand(execCmd, cwd);
    log("✓ Lefthook installed and configured", "success");
  } catch (error) {
    log(`⚠️ Failed to run 'lefthook install': ${error}`, "warning");
  }
}

export function updatePackageJson(cwd: string) {
  log("📦 Updating package.json scripts...", "info");

  const packageJsonPath = join(cwd, "package.json");
  const scripts = {
    release: "semantic-release",
    "release:dry": "semantic-release --dry-run",
    prepare: "lefthook install",
  };

  let packageJson: Record<string, unknown>;
  try {
    packageJson = readJsonFile(packageJsonPath) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error}`);
  }

  if (!packageJson.scripts || typeof packageJson.scripts !== "object") {
    packageJson.scripts = {};
  }

  const existingScripts = packageJson.scripts as Record<string, string>;
  const conflicts: string[] = [];
  const mergedScripts: Record<string, string> = { ...existingScripts };

  // Check for conflicts and handle them
  for (const [key, value] of Object.entries(scripts)) {
    if (existingScripts[key]) {
      if (existingScripts[key] === value) {
        // Same value, no conflict
        continue;
      }

      conflicts.push(key);

      // For prepare script, try to merge with existing prepare hooks
      if (key === "prepare") {
        const existing = existingScripts[key];
        if (existing.includes("&&") || existing.includes("lefthook")) {
          // Already has lefthook or multiple commands, append with &&
          mergedScripts[key] = `${existing} && ${value}`;
          log(`⚠️ Merged prepare script: "${existing}" + "${value}"`, "warning");
        } else {
          // Create namespaced alternative
          mergedScripts[`${key}:lefthook`] = value;
          log(
            `⚠️ Conflict detected for "${key}". Preserving existing and adding "prepare:lefthook"`,
            "warning",
          );
        }
      } else {
        // For other scripts, create namespaced alternatives
        mergedScripts[`${key}:semantic`] = value;
        log(
          `⚠️ Conflict detected for "${key}". Preserving existing and adding "${key}:semantic"`,
          "warning",
        );
      }
    } else {
      mergedScripts[key] = value;
    }
  }

  // Update and write
  packageJson.scripts = mergedScripts;
  try {
    writeJsonFile(packageJsonPath, packageJson);
    log("✓ package.json updated", "success");

    if (conflicts.length > 0) {
      log(`ℹ️ Conflicts resolved for scripts: ${conflicts.join(", ")}`, "info");
    }
  } catch (error) {
    throw new Error(`Failed to write package.json: ${error}`);
  }
}

export function createGitHubWorkflow(cwd: string, pm: PackageManager) {
  log("🔄 Creating GitHub Actions workflow...", "info");

  const workflowDir = join(cwd, ".github", "workflows");
  ensureDirectoryExists(workflowDir);

  writeTextFile(join(workflowDir, "release.yml"), getGithubWorkflow(pm));

  log("✓ GitHub Actions workflow created", "success");
}
