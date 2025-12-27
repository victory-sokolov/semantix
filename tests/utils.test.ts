import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { log, detectPackageManager, getInstallCommand } from "../src/utils.ts";
import { existsSync } from "fs";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("Utility Functions", () => {
  describe("Logging functionality", () => {
    it("should log info messages with cyan color", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      log("Test message", "info");
      expect(consoleSpy).toHaveBeenCalledWith("\x1b[36mTest message\x1b[0m");
      consoleSpy.mockRestore();
    });

    it("should log success messages with green color", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      log("Success message", "success");
      expect(consoleSpy).toHaveBeenCalledWith("\x1b[32mSuccess message\x1b[0m");
      consoleSpy.mockRestore();
    });

    it("should log error messages with red color", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      log("Error message", "error");
      expect(consoleSpy).toHaveBeenCalledWith("\x1b[31mError message\x1b[0m");
      consoleSpy.mockRestore();
    });

    it("should default to info type", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      log("Default message");
      expect(consoleSpy).toHaveBeenCalledWith("\x1b[36mDefault message\x1b[0m");
      consoleSpy.mockRestore();
    });
  });

  describe("Package Manager Detection", () => {
    const mockCwd = "/test";

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should detect bun via bun.lockb", () => {
      (existsSync as unknown as Mock).mockImplementation((path: string) =>
        path.endsWith("bun.lockb"),
      );
      expect(detectPackageManager(mockCwd)).toBe("bun");
    });

    it("should detect bun via bun.lock", () => {
      (existsSync as unknown as Mock).mockImplementation((path: string) =>
        path.endsWith("bun.lock"),
      );
      expect(detectPackageManager(mockCwd)).toBe("bun");
    });

    it("should detect npm via package-lock.json", () => {
      (existsSync as unknown as Mock).mockImplementation((path: string) =>
        path.endsWith("package-lock.json"),
      );
      expect(detectPackageManager(mockCwd)).toBe("npm");
    });

    it("should detect yarn via yarn.lock", () => {
      (existsSync as unknown as Mock).mockImplementation((path: string) =>
        path.endsWith("yarn.lock"),
      );
      expect(detectPackageManager(mockCwd)).toBe("yarn");
    });

    it("should detect pnpm via pnpm-lock.yaml", () => {
      (existsSync as unknown as Mock).mockImplementation((path: string) =>
        path.endsWith("pnpm-lock.yaml"),
      );
      expect(detectPackageManager(mockCwd)).toBe("pnpm");
    });

    it("should default to bun if no lock file found", () => {
      (existsSync as unknown as Mock).mockReturnValue(false);
      expect(detectPackageManager(mockCwd)).toBe("bun");
    });
  });

  describe("Install Command Generation", () => {
    const deps = ["dep1", "dep2"];
    const depsString = "dep1 dep2";

    it("should generate npm install command", () => {
      expect(getInstallCommand("npm", deps)).toBe(`npm install -D ${depsString}`);
    });

    it("should generate yarn add command", () => {
      expect(getInstallCommand("yarn", deps)).toBe(`yarn add -D ${depsString}`);
    });

    it("should generate pnpm add command", () => {
      expect(getInstallCommand("pnpm", deps)).toBe(`pnpm add -D ${depsString}`);
    });

    it("should generate bun add command", () => {
      expect(getInstallCommand("bun", deps)).toBe(`bun add -D ${depsString}`);
    });
  });
});
