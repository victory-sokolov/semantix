import { DEPENDENCIES, ASCII_ART, type PackageManager } from './constants';
import { log, execCommand, detectPackageManager, getInstallCommand, promptConfirmation } from './utils';
import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
} from './configs';

export class ConventionalCommitSetup {
    private cwd: string;
    private packageManager: PackageManager;
    private skipConfirmation: boolean;

    constructor(cwd: string = process.cwd(), skipConfirmation = false) {
        this.cwd = cwd;
        this.packageManager = detectPackageManager(cwd);
        this.skipConfirmation = skipConfirmation || process.env.CI === 'true' || process.env.NODE_ENV === 'test';
    }

    private installDependencies() {
        log('📦 Installing dependencies...', 'info');

        const cmd = getInstallCommand(this.packageManager, DEPENDENCIES);
        execCommand(cmd, this.cwd);

        log('✓ Dependencies installed', 'success');
    }

    private showPreview() {
        const installCmd = getInstallCommand(this.packageManager, DEPENDENCIES);

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
        log(`ℹ️  Detected package manager: ${this.packageManager}`, 'info');

        this.showPreview();

        if (!this.skipConfirmation) {
            const confirmed = await promptConfirmation('\nDo you want to proceed with the installation');
            if (!confirmed) {
                log('\n❌ Setup cancelled by user', 'error');
                process.exit(0);
            }
        }

        log('\n⏳ Starting installation...\n', 'info');

        try {
            this.installDependencies();
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
