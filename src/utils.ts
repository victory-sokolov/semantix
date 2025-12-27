import { execSync } from "child_process";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PM_LOCK_FILES, type PackageManager } from "./constants";

export function log(message: string, type: "info" | "success" | "error" | "warning" = "info") {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warning: "\x1b[33m",
  };
  const reset = "\x1b[0m";
  console.log(`${colors[type]}${message}${reset}`);
}

export function execCommand(command: string, cwd: string) {
  try {
    execSync(command, { cwd, stdio: "inherit" });
  } catch (error) {
    log(`Failed to execute: ${command}`, "error");
    throw error;
  }
}

export function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export function writeJsonFile(filePath: string, data: unknown) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function writeTextFile(filePath: string, content: string) {
  writeFileSync(filePath, content);
}

export function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export function updatePackageJsonScripts(packageJsonPath: string, scripts: Record<string, string>) {
  const packageJson = readJsonFile(packageJsonPath) as Record<string, unknown>;
  const existingScripts = (packageJson.scripts as Record<string, string>) || {};
  packageJson.scripts = {
    ...existingScripts,
    ...scripts,
  };
  writeJsonFile(packageJsonPath, packageJson);
}

export function detectPackageManager(cwd: string): PackageManager {
  // Check for lock files
  for (const [pm, lockFiles] of Object.entries(PM_LOCK_FILES)) {
    const files = Array.isArray(lockFiles) ? lockFiles : [lockFiles];
    if (files.some((file) => existsSync(join(cwd, file)))) {
      return pm as PackageManager;
    }
  }

  // Default to bun if no lock file found, or maybe check what ran the script?
  // But requirement says determine based on lock file.
  return "bun";
}

export function getInstallCommand(pm: PackageManager, dependencies: string[]): string {
  const deps = dependencies.join(" ");
  switch (pm) {
    case "npm":
      return `npm install -D ${deps}`;
    case "yarn":
      return `yarn add -D ${deps}`;
    case "pnpm":
      return `pnpm add -D ${deps}`;
    case "bun":
      return `bun add -D ${deps}`;
  }
}
