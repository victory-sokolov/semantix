import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "path";

// Mock the fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(() => false),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock the utils module
vi.mock("../src/utils.ts", () => ({
  log: vi.fn(),
  writeJsonFile: vi.fn(),
  writeTextFile: vi.fn(),
  ensureDirectoryExists: vi.fn(),
  execCommand: vi.fn(),
  readJsonFile: vi.fn(() => ({ scripts: {} })),
}));

import { existsSync, writeFileSync } from "fs";
import {
  createCommitlintConfig,
  createSemanticReleaseConfig,
  setupLefthook,
  updatePackageJson,
  createGitHubWorkflow,
  createReadme,
} from "../src/configs.ts";
import {
  writeTextFile,
  ensureDirectoryExists,
  execCommand,
  readJsonFile,
  writeJsonFile,
} from "../src/utils.ts";

describe("Configuration File Generators", () => {
  const mockCwd = "/test/project";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Commitlint Configuration Creation", () => {
    it("should create commitlint.config.js with correct content", () => {
      createCommitlintConfig(mockCwd);

      expect(writeTextFile).toHaveBeenCalledWith(
        join(mockCwd, "commitlint.config.js"),
        expect.stringContaining("export default"),
      );
    });
  });

  describe("Semantic Release Configuration Creation", () => {
    it("should create .releaserc.mjs with correct content", () => {
      createSemanticReleaseConfig(mockCwd);

      expect(writeTextFile).toHaveBeenCalledWith(
        join(mockCwd, ".releaserc.mjs"),
        expect.stringContaining("const config ="),
      );
      expect(writeTextFile).toHaveBeenCalledWith(
        join(mockCwd, ".releaserc.mjs"),
        expect.stringContaining("export default config"),
      );
    });
  });

  describe("Lefthook Git Hooks Setup", () => {
    it("should create lefthook.yml and run install command", () => {
      setupLefthook(mockCwd);

      expect(writeTextFile).toHaveBeenCalledWith(join(mockCwd, "lefthook.yml"), expect.any(String));
      expect(execCommand).toHaveBeenCalledWith("bunx lefthook install", mockCwd);
    });
  });

  describe("Package.json Scripts Update", () => {
    it("should read and update package.json with scripts", () => {
      updatePackageJson(mockCwd);

      expect(readJsonFile).toHaveBeenCalledWith(join(mockCwd, "package.json"));
      expect(writeJsonFile).toHaveBeenCalledWith(
        join(mockCwd, "package.json"),
        expect.objectContaining({
          scripts: expect.objectContaining({
            release: "semantic-release",
            "release:dry": "semantic-release --dry-run",
            prepare: "lefthook install",
          }),
        }),
      );
    });
  });

  describe("GitHub Actions Workflow Creation", () => {
    it("should create workflow directory and release.yml file", () => {
      createGitHubWorkflow(mockCwd);

      expect(ensureDirectoryExists).toHaveBeenCalledWith(join(mockCwd, ".github", "workflows"));
      expect(writeTextFile).toHaveBeenCalledWith(
        join(mockCwd, ".github", "workflows", "release.yml"),
        expect.any(String),
      );
    });
  });

  describe("Commit Convention README Creation", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset existsSync to default (false)
      vi.mocked(existsSync).mockReturnValue(false);
    });

    it("should create README when file does not exist", () => {
      createReadme(mockCwd);

      expect(writeTextFile).toHaveBeenCalledWith(
        expect.stringContaining("COMMIT_CONVENTION.md"),
        expect.any(String),
      );
    });

    it("should skip creation when file already exists", () => {
      // Mock existsSync to return true (file exists)
      vi.mocked(existsSync).mockReturnValue(true);

      createReadme(mockCwd);

      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });
});
