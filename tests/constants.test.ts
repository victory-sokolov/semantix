import { describe, it, expect } from "vitest";
import {
  DEPENDENCIES,
  COMMIT_TYPES,
  COMMITLINT_CONFIG,
  SEMANTIC_RELEASE_CONFIG,
  GITHUB_WORKFLOW,
  ASCII_ART,
  LEFTHOOK_CONFIG,
} from "../src/constants.ts";

describe("Configuration Constants", () => {
  describe("Project Dependencies Configuration", () => {
    it("should contain all required semantic-release dependencies", () => {
      expect(DEPENDENCIES).toContain("@semantic-release/changelog");
      expect(DEPENDENCIES).toContain("@semantic-release/git");
      expect(DEPENDENCIES).toContain("@semantic-release/github");
      expect(DEPENDENCIES).toContain("@commitlint/cli");
      expect(DEPENDENCIES).toContain("@commitlint/config-conventional");
      expect(DEPENDENCIES).toContain("lefthook");
      expect(DEPENDENCIES).toContain("semantic-release");
    });

    it("should be an array of strings", () => {
      expect(Array.isArray(DEPENDENCIES)).toBe(true);
      DEPENDENCIES.forEach((dep) => {
        expect(typeof dep).toBe("string");
      });
    });
  });

  describe("Conventional Commit Types", () => {
    it("should contain all conventional commit types", () => {
      const expectedTypes = [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ];

      expectedTypes.forEach((type) => {
        expect(COMMIT_TYPES).toContain(type);
      });
    });
  });

  describe("Commitlint Configuration", () => {
    it("should have correct extends configuration", () => {
      expect(COMMITLINT_CONFIG.extends).toEqual(["@commitlint/config-conventional"]);
    });

    it("should have type-enum rule with all commit types", () => {
      expect(COMMITLINT_CONFIG.rules["type-enum"]).toEqual([2, "always", COMMIT_TYPES]);
    });

    it("should have subject-case rule", () => {
      expect(COMMITLINT_CONFIG.rules["subject-case"]).toEqual([2, "never", ["upper-case"]]);
    });
  });

  describe("Semantic Release Configuration", () => {
    it("should have correct branches configuration", () => {
      expect(SEMANTIC_RELEASE_CONFIG.branches).toEqual(["main", "master"]);
    });

    it("should have required plugins", () => {
      const plugins = SEMANTIC_RELEASE_CONFIG.plugins;
      expect(plugins).toContain("@semantic-release/commit-analyzer");
      expect(plugins).toContain("@semantic-release/release-notes-generator");
      expect(plugins).toContain("@semantic-release/npm");
    });

    it("should have changelog plugin with correct config", () => {
      const changelogPlugin = SEMANTIC_RELEASE_CONFIG.plugins.find(
        (plugin: unknown) => Array.isArray(plugin) && plugin[0] === "@semantic-release/changelog",
      );
      expect(changelogPlugin).toEqual([
        "@semantic-release/changelog",
        { changelogFile: "CHANGELOG.md" },
      ]);
    });
  });

  describe("GitHub Actions Workflow Configuration", () => {
    it("should be a valid YAML string", () => {
      expect(typeof GITHUB_WORKFLOW).toBe("string");
      expect(GITHUB_WORKFLOW).toContain("name: Release");
      expect(GITHUB_WORKFLOW).toContain("bun run release");
    });
  });

  describe("ASCII Art Display", () => {
    it("should contain the semantix ASCII art", () => {
      expect(typeof ASCII_ART).toBe("string");
      expect(ASCII_ART).toContain("█");
      expect(ASCII_ART).toContain("║");
      expect(ASCII_ART).toContain("Automated Conventional Commits & Releases");
    });
  });

  describe("Lefthook Configuration", () => {
    it("should be a valid YAML string", () => {
      expect(typeof LEFTHOOK_CONFIG).toBe("string");
      expect(LEFTHOOK_CONFIG).toContain("commit-msg:");
      expect(LEFTHOOK_CONFIG).toContain("commitlint");
    });
  });
});
