import { execSync } from "child_process";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";

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

export function writeJsonFile(filePath: string, data: any) {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function writeTextFile(filePath: string, content: string) {
  writeFileSync(filePath, content);
}

export function readJsonFile(filePath: string): any {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export function updatePackageJsonScripts(packageJsonPath: string, scripts: Record<string, string>) {
  const packageJson = readJsonFile(packageJsonPath);
  packageJson.scripts = {
    ...packageJson.scripts,
    ...scripts,
  };
  writeJsonFile(packageJsonPath, packageJson);
}
