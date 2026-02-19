import { DEPENDENCIES, ASCII_ART, type PackageManager } from './constants';
import { log, execCommand, resolvePackageManager, getInstallCommand, promptConfirmation } from './utils';
import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
    ensurePackageJsonExists,
    detectHusky,
    removeHusky,
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

        const packageManager = await resolvePackageManager(this.cwd, this.skipConfirmation);
        this.packageManager = packageManager;
        log(`ℹ️  Using package manager: ${packageManager}`, 'info');

        this.showPreview(packageManager);

        if (!this.skipConfirmation) {
            const confirmed = await promptConfirmation('\nDo you want to proceed with the installation');
            if (!confirmed) {
                log('\n❌ Setup cancelled by user', 'error');
                process.exit(0);
            }
        }

        // Check if package.json exists and prompt to create if needed (after user confirms)
        await ensurePackageJsonExists(this.cwd, packageManager);

        log('\n⏳ Starting installation...\n', 'info');

        try {
            this.installDependencies(packageManager);

            // Check for Husky and offer to remove it before setting up Lefthook
            if (detectHusky(this.cwd)) {
                log('\n⚠️  Husky detected in your project', 'warning');
                log('Lefthook and Husky both manage git hooks and will conflict.', 'info');

                if (this.skipConfirmation) {
                    log('Automatically removing Husky in non-interactive mode...', 'info');
                    removeHusky(this.cwd, packageManager);
                } else {
                    const removeHuskyConfirmed = await promptConfirmation(
                        'Would you like to remove Husky and use Lefthook instead',
                    );
                    if (removeHuskyConfirmed) {
                        removeHusky(this.cwd, packageManager);
                    } else {
                        log('⚠️  Keeping Husky. Lefthook setup may fail due to conflict.', 'warning');
                    }
                }
            }

            createCommitlintConfig(this.cwd);
            createSemanticReleaseConfig(this.cwd);
            setupLefthook(this.cwd, packageManager);
            updatePackageJson(this.cwd);
            createGitHubWorkflow(this.cwd, packageManager);

            log('\n✨ Setup completed successfully!\n', 'success');

            const runCmd = packageManager === 'bun' ? 'bun run' : `${packageManager} run`;

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
