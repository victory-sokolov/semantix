import { DEPENDENCIES, ASCII_ART } from "./constants";
import { log, execCommand } from "./utils";
import {
  createCommitlintConfig,
  createSemanticReleaseConfig,
  setupHusky,
  updatePackageJson,
  createGitHubWorkflow,
  createReadme,
} from "./configs";

export class ConventionalCommitSetup {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  private installDependencies() {
    log("📦 Installing dependencies...", "info");

    execCommand(`bun add -D ${DEPENDENCIES.join(" ")}`, this.cwd);
    log("✓ Dependencies installed", "success");
  }

  public async setup() {
    console.log(ASCII_ART);

    log("\n🚀 Setting up Conventional Commits...\n", "info");

    try {
      this.installDependencies();
      createCommitlintConfig(this.cwd);
      createSemanticReleaseConfig(this.cwd);
      setupHusky(this.cwd);
      updatePackageJson(this.cwd);
      createGitHubWorkflow(this.cwd);
      createReadme(this.cwd);

      log("\n✨ Setup completed successfully!\n", "success");
      log("Next steps:", "info");
      log("1. Commit your changes with a conventional commit message", "info");
      log("2. Push to main/master branch to trigger automatic release", "info");
      log("3. Run 'bun run release:dry' to test the release process\n", "info");
    } catch (error) {
      log("\n❌ Setup failed", "error");
      throw error;
    }
  }
}
