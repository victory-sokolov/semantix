import { describe, it, expect, vi } from "vitest";
import { log } from "../src/utils";

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
});
