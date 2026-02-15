import { DEPENDENCIES, ASCII_ART, type PackageManager } from './constants';
import { log, execCommand, resolvePackageManager, getInstallCommand, promptConfirmation } from './utils';
import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
    ensurePackageJsonExists,
} from './configs';

export class ConventionalCommitSetup {
    private cwd: string;
    private packageManager: PackageManager | null = null;
    private skipConfirmation: boolean;

    constructor(cwd: string = process.cwd(), skipConfirmation = false) {
        this.cwd = cwd;
        this.skipConfirmation = skipConfirmation || process.env.CI === 'true' || process.env.NODE_ENV === 'test';
    }

    private installDependencies(packageManager: PackageManager) {
        log('📦 Installing dependencies...', 'info');

        const cmd = getInstallCommand(packageManager, DEPENDENCIES);
        execCommand(cmd, this.cwd);

        log('✓ Dependencies installed', 'success');
    }

    private showPreview(packageManager: PackageManager) {
        const installCmd = getInstallCommand(packageManager, DEPENDENCIES);

        log('\n📋 The following will be installed and configured:', 'info');
        log('\n📦 Packages to install:', 'info');
        for (const dep of DEPENDENCIES) {
            log(`   • ${dep}`, 'info');
        }
        log(`\n   Install command: ${installCmd}`, 'info');

        log('\n📝 Configuration files to create:', 'info');
        log('   • commitlint.config.js', 'info');
        log('   • .releaserc.mjs', 'info');
        log('   • lefthook.yml', 'info');
        log('   • .github/workflows/release.yml', 'info');

        log('\n📦 package.json scripts to add:', 'info');
        log('   • release', 'info');
        log('   • release:dry', 'info');
        log('   • prepare (lefthook install)', 'info');
    }

    public async setup() {
        console.log(ASCII_ART);

        log('\n🚀 Setting up Conventional Commits...\n', 'info');

        this.packageManager = await resolvePackageManager(this.cwd, this.skipConfirmation);
        log(`ℹ️  Using package manager: ${this.packageManager}`, 'info');

        this.showPreview(this.packageManager);

        if (!this.skipConfirmation) {
            const confirmed = await promptConfirmation('\nDo you want to proceed with the installation');
            if (!confirmed) {
                log('\n❌ Setup cancelled by user', 'error');
                process.exit(0);
            }
        }

        // Check if package.json exists and prompt to create if needed (after user confirms)
        await ensurePackageJsonExists(this.cwd, this.packageManager);

        log('\n⏳ Starting installation...\n', 'info');

        try {
            this.installDependencies(this.packageManager);
            createCommitlintConfig(this.cwd);
            createSemanticReleaseConfig(this.cwd);
            setupLefthook(this.cwd, this.packageManager);
            updatePackageJson(this.cwd);
            createGitHubWorkflow(this.cwd, this.packageManager);

            log('\n✨ Setup completed successfully!\n', 'success');

            const runCmd = this.packageManager === 'bun' ? 'bun run' : `${this.packageManager} run`;

            log('Next steps:', 'info');
            log('1. Commit your changes with a conventional commit message', 'info');
            log('2. Push to main/master branch to trigger automatic release', 'info');
            log(`3. Run '${runCmd} release:dry' to test the release process\n`, 'info');
        } catch (error) {
            log('\n❌ Setup failed', 'error');
            throw error;
        }
    }
}
