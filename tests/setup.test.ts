import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConventionalCommitSetup } from "../src/setup.ts";

// Mock the utils and configs modules
vi.mock("../src/utils.ts", () => ({
  log: vi.fn(),
  execCommand: vi.fn(),
}));

vi.mock("../src/configs.ts", () => ({
  createCommitlintConfig: vi.fn(),
  createSemanticReleaseConfig: vi.fn(),
  setupLefthook: vi.fn(),
  updatePackageJson: vi.fn(),
  createGitHubWorkflow: vi.fn(),
  createReadme: vi.fn(),
}));

describe("Conventional Commit Setup Class", () => {
  const mockCwd = "/test/project";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Class Instantiation", () => {
    it("should create an instance with provided cwd", () => {
      const setup = new ConventionalCommitSetup(mockCwd);
      expect(setup).toBeInstanceOf(ConventionalCommitSetup);
      expect((setup as unknown as { cwd: string }).cwd).toBe(mockCwd);
    });

    it("should default to process.cwd() when no path provided", () => {
      const setup = new ConventionalCommitSetup();
      expect((setup as unknown as { cwd: string }).cwd).toBe(process.cwd());
    });
  });

  describe("Automated Setup Process", () => {
    it("should be a function", () => {
      const setup = new ConventionalCommitSetup(mockCwd);
      expect(typeof setup.setup).toBe("function");
    });

    it("should return a promise", async () => {
      const setup = new ConventionalCommitSetup(mockCwd);
      const result = setup.setup();
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });
});
