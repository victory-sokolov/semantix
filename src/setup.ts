import { DEPENDENCIES, ASCII_ART, type PackageManager } from "./constants";
import { log, execCommand, detectPackageManager, getInstallCommand } from "./utils";
import {
  createCommitlintConfig,
  createSemanticReleaseConfig,
  setupLefthook,
  updatePackageJson,
  createGitHubWorkflow,
  createReadme,
} from "./configs";
import { error } from "console";

export class ConventionalCommitSetup {
  private cwd: string;
  private packageManager: PackageManager;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.packageManager = detectPackageManager(cwd);
  }

  private installDependencies() {
    log("📦 Installing dependencies...", "info");

    const cmd = getInstallCommand(this.packageManager, DEPENDENCIES);
    execCommand(cmd, this.cwd);
    
    log("✓ Dependencies installed", "success");
  }

  public async setup() {
    console.log(ASCII_ART);

    log("\n🚀 Setting up Conventional Commits...\n", "info");
    log(`ℹ️  Detected package manager: ${this.packageManager}`, "info");

    try {
      this.installDependencies();
      createCommitlintConfig(this.cwd);
      createSemanticReleaseConfig(this.cwd);
      setupLefthook(this.cwd, this.packageManager);
      updatePackageJson(this.cwd);
      createGitHubWorkflow(this.cwd, this.packageManager);
      createReadme(this.cwd, this.packageManager);

      log("\n✨ Setup completed successfully!\n", "success");
      
      const runCmd = this.packageManager === "bun" ? "bun run" : `${this.packageManager} run`;
      
      log("Next steps:", "info");
      log("1. Commit your changes with a conventional commit message", "info");
      log("2. Push to main/master branch to trigger automatic release", "info");
      log(`3. Run '${runCmd} release:dry' to test the release process\n`, "info");
    } catch (error) {
      log("\n❌ Setup failed", "error");
      throw error;
    }
  }
}

