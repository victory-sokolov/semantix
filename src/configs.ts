import { join, basename } from 'path';
import { existsSync, unlinkSync, rmSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import {
    COMMITLINT_CONFIG,
    COMMITLINT_CONFIG_FILES,
    RELEASE_CONFIG_FILES,
    SEMANTIC_RELEASE_CONFIG,
    getGithubWorkflow,
    getLefthookConfig,
    type PackageManager,
    PACKAGE_MANAGER_DISPLAY_NAMES,
} from './constants';
import {
    log,
    writeJsonFile,
    writeTextFile,
    ensureDirectoryExists,
    execCommand,
    readJsonFile,
    promptConfirmation,
    findConfigFile,
    readJsonFileIfExists,
    deepMerge,
    getRunInstallCommand,
} from './utils';

export function createCommitlintConfig(cwd: string) {
    log('📝 Creating commitlint configuration...', 'info');

    const existingConfigPath = findConfigFile(cwd, COMMITLINT_CONFIG_FILES);

    if (existingConfigPath) {
        // Try to read and merge with existing config
        const existingConfig = readJsonFileIfExists(existingConfigPath);

        if (existingConfig) {
            // Deep merge: existing config takes priority, add missing keys from default
            const mergedConfig = deepMerge(existingConfig, COMMITLINT_CONFIG);
            writeJsonFile(existingConfigPath, mergedConfig);
            log(`✓ Merged commitlint config with existing ${basename(existingConfigPath)}`, 'success');
            return;
        }

        // If we can't read it as JSON (e.g., .js file), skip with warning
        log(`⚠️ ${basename(existingConfigPath)} already exists but is not JSON, skipping...`, 'warning');
        return;
    }

    // No existing config, create new one as JSON
    writeJsonFile(join(cwd, '.commitlintrc.json'), COMMITLINT_CONFIG);
    log('✓ .commitlintrc.json created', 'success');
}

export function createSemanticReleaseConfig(cwd: string) {
    log('📝 Creating semantic-release configuration...', 'info');

    const existingConfigPath = findConfigFile(cwd, RELEASE_CONFIG_FILES);
    const newConfigPath = join(cwd, '.releaserc.json');

    if (existingConfigPath) {
        // Try to read and merge with existing config
        const existingConfig = readJsonFileIfExists(existingConfigPath);

        if (existingConfig) {
            // Deep merge: existing config takes priority, add missing keys from default
            const mergedConfig = deepMerge(existingConfig, SEMANTIC_RELEASE_CONFIG);

            // Always write as JSON format
            writeJsonFile(newConfigPath, mergedConfig);

            // Delete old config file if it's different from the new path
            if (existingConfigPath !== newConfigPath) {
                try {
                    unlinkSync(existingConfigPath);
                    log(
                        `✓ Merged release config and converted ${basename(existingConfigPath)} to .releaserc.json`,
                        'success',
                    );
                } catch (error) {
                    log(
                        `✓ Merged release config to .releaserc.json. ⚠️ Could not remove old config file '${basename(existingConfigPath)}': ${error instanceof Error ? error.message : String(error)}`,
                        'warning',
                    );
                }
            } else {
                log('✓ Merged release config with existing .releaserc.json', 'success');
            }
            return;
        }

        // If we can't read it as JSON (e.g., .js file), skip with warning
        log(`⚠️ ${basename(existingConfigPath)} already exists but is not JSON, skipping...`, 'warning');
        return;
    }

    // No existing config, create new one as JSON
    writeJsonFile(newConfigPath, SEMANTIC_RELEASE_CONFIG);
    log('✓ .releaserc.json created', 'success');
}

/**
 * Detect if Husky is installed in the project
 */
export function detectHusky(cwd: string): boolean {
    // Check for .husky directory
    const huskyDir = join(cwd, '.husky');
    if (existsSync(huskyDir)) {
        return true;
    }

    // Check for husky in package.json dependencies
    const packageJsonPath = join(cwd, 'package.json');
    const packageJson = readJsonFileIfExists(packageJsonPath);
    if (packageJson) {
        const allDeps = {
            ...(packageJson.devDependencies as Record<string, string> | undefined),
            ...(packageJson.dependencies as Record<string, string> | undefined),
        };
        if ('husky' in allDeps) {
            return true;
        }
    }

    return false;
}

/**
 * Remove Husky from the project
 * @param cwd - Current working directory
 * @param pm - Package manager to use
 * @param skipInstall - If true, skip running install to update lock file (use when install will be called separately)
 */
export function removeHusky(cwd: string, pm: PackageManager, skipInstall = false): void {
    log('🗑️  Removing Husky...', 'info');
    let hasWarnings = false;

    // 1. Unset git core.hooksPath
    try {
        execSync('git config --unset-all --local core.hooksPath', { cwd, stdio: 'pipe' });
        log('✓ Git core.hooksPath unset', 'success');
    } catch {
        // Config might not exist
    }

    // 2. Remove .husky directory
    const huskyDir = join(cwd, '.husky');
    if (existsSync(huskyDir)) {
        try {
            rmSync(huskyDir, { recursive: true, force: true });
            log('✓ .husky directory removed', 'success');
        } catch (error) {
            hasWarnings = true;
            log(
                `⚠️ Could not remove .husky directory: ${error instanceof Error ? error.message : String(error)}`,
                'warning',
            );
        }
    }

    // 3. Remove husky from package.json
    const packageJsonPath = join(cwd, 'package.json');
    const packageJson = readJsonFileIfExists(packageJsonPath);
    if (packageJson) {
        let modified = false;

        if (
            packageJson.devDependencies &&
            typeof packageJson.devDependencies === 'object' &&
            !Array.isArray(packageJson.devDependencies)
        ) {
            const deps = packageJson.devDependencies as Record<string, string>;
            if ('husky' in deps) {
                delete deps.husky;
                modified = true;
            }
        }

        if (packageJson.dependencies && typeof packageJson.dependencies === 'object') {
            const deps = packageJson.dependencies as Record<string, string>;
            if ('husky' in deps) {
                delete deps.husky;
                modified = true;
            }
        }

        if (modified) {
            writeJsonFile(packageJsonPath, packageJson);
            log('✓ husky removed from package.json', 'success');
        }
    }

    // 4. Run install to update lock file (unless skipped)
    if (!skipInstall) {
        try {
            execCommand(getRunInstallCommand(pm), cwd);
            log('✓ Dependencies updated', 'success');
        } catch (error) {
            hasWarnings = true;
            log(
                `⚠️ Could not update dependencies: ${error instanceof Error ? error.message : String(error)}`,
                'warning',
            );
        }
    }

    if (hasWarnings) {
        log('⚠️ Husky removal completed with warnings', 'warning');
    } else {
        log('✓ Husky removed successfully', 'success');
    }
}

export function setupLefthook(cwd: string, pm: PackageManager) {
    log('🥊 Setting up Lefthook...', 'info');

    const lefthookPath = join(cwd, 'lefthook.yml');

    // Check if lefthook.yml already exists
    if (existsSync(lefthookPath)) {
        log('⚠️ lefthook.yml already exists, skipping...', 'warning');
    } else {
        // Create lefthook.yml
        writeTextFile(lefthookPath, getLefthookConfig(pm));
        log('✓ lefthook.yml created', 'success');
    }

    try {
        let execCmd = 'npx lefthook install';
        if (pm === 'bun') {
            execCmd = 'bunx lefthook install';
        }
        if (pm === 'yarn') {
            execCmd = 'yarn dlx lefthook install';
        }
        if (pm === 'pnpm') {
            execCmd = 'pnpm dlx lefthook install';
        }

        execCommand(execCmd, cwd);
        log('✓ Lefthook installed', 'success');
    } catch (error) {
        log(
            `⚠️ Failed to run 'lefthook install': ${error instanceof Error ? error.message : String(error)}`,
            'warning',
        );
    }
}

/**
 * Check if any existing script runs the given command
 * @param existingScripts - The scripts object from package.json
 * @param command - The command to search for (e.g., 'semantic-release')
 * @returns The key of the script if found, null otherwise
 */
function findScriptByCommand(existingScripts: Record<string, string>, command: string): string | null {
    for (const [key, value] of Object.entries(existingScripts)) {
        if (value === command || value.startsWith(`${command} `)) {
            return key;
        }
    }
    return null;
}

/**
 * Add a script to package.json, handling conflicts by creating a namespaced version
 */
function addScriptWithNamespace(
    scripts: Record<string, string>,
    key: string,
    command: string,
    namespace: string,
): { added: boolean; conflict: boolean } {
    // Check if command already exists anywhere
    const existingKey = findScriptByCommand(scripts, command);
    if (existingKey) {
        log(`ℹ️ Found existing "${command}" script "${existingKey}", keeping it`, 'info');
        return { added: false, conflict: false };
    }

    // Key is available
    if (!scripts[key]) {
        scripts[key] = command;
        return { added: true, conflict: false };
    }

    // Same value already exists
    if (scripts[key] === command) {
        return { added: false, conflict: false };
    }

    // Conflict - create namespaced version
    const namespacedKey = `${key}:${namespace}`;
    scripts[namespacedKey] = command;
    log(`⚠️ Conflict detected for "${key}". Preserving existing and adding "${namespacedKey}"`, 'warning');
    return { added: true, conflict: true };
}

/**
 * Add prepare script with special merge logic for combining commands
 */
function addPrepareScript(scripts: Record<string, string>): boolean {
    const key = 'prepare';
    const command = 'lefthook install';

    // Key is available
    if (!scripts[key]) {
        scripts[key] = command;
        return false;
    }

    // Same value already exists
    if (scripts[key] === command) {
        return false;
    }

    const existing = scripts[key];

    // Merge if already has multiple commands or lefthook
    if (existing.includes('&&') || existing.includes('lefthook')) {
        scripts[key] = `${existing} && ${command}`;
        log(`⚠️ Merged prepare script: "${existing}" + "${command}"`, 'warning');
    } else {
        scripts[`${key}:lefthook`] = command;
        log(`⚠️ Conflict detected for "${key}". Preserving existing and adding "prepare:lefthook"`, 'warning');
    }

    return true;
}

export function updatePackageJson(cwd: string) {
    log('📦 Updating package.json scripts...', 'info');

    const packageJsonPath = join(cwd, 'package.json');

    let packageJson: Record<string, unknown>;
    try {
        packageJson = readJsonFile(packageJsonPath) as Record<string, unknown>;
    } catch (error) {
        throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
        packageJson.scripts = {};
    }

    const scripts = packageJson.scripts as Record<string, string>;
    const conflicts: string[] = [];

    // Add release scripts with namespace conflict handling
    const releaseResult = addScriptWithNamespace(scripts, 'release', 'semantic-release', 'semantic');
    if (releaseResult.conflict) {
        conflicts.push('release');
    }

    const dryRunResult = addScriptWithNamespace(scripts, 'release:dry', 'semantic-release --dry-run', 'semantic');
    if (dryRunResult.conflict) {
        conflicts.push('release:dry');
    }

    if (addPrepareScript(scripts)) {
        conflicts.push('prepare');
    }

    // Update and write
    packageJson.scripts = scripts;
    try {
        writeJsonFile(packageJsonPath, packageJson);
        log('✓ package.json updated', 'success');

        if (conflicts.length > 0) {
            log(`ℹ️ Conflicts resolved for scripts: ${conflicts.join(', ')}`, 'info');
        }
    } catch (error) {
        throw new Error(`Failed to write package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function getNodeVersionFromNvmrc(cwd: string): number {
    const nvmrcPath = join(cwd, '.nvmrc');
    let nodeVersion = 24;
    if (existsSync(nvmrcPath)) {
        const nvmrcContent = readFileSync(nvmrcPath, 'utf-8').trim();
        const parsed = parseInt(nvmrcContent, 10);
        if (!isNaN(parsed)) {
            nodeVersion = parsed;
            log(`📄 Found .nvmrc, using Node ${nodeVersion}`, 'info');
        }
    }
    return nodeVersion;
}

export function createGitHubWorkflow(cwd: string, pm: PackageManager) {
    log('🔄 Creating GitHub Actions workflow...', 'info');

    const workflowDir = join(cwd, '.github', 'workflows');
    const releaseWorkflowPath = join(workflowDir, 'release.yml');

    if (existsSync(releaseWorkflowPath)) {
        log('⚠️ .github/workflows/release.yml already exists, skipping...', 'warning');
        return;
    }

    const nodeVersion = getNodeVersionFromNvmrc(cwd);

    ensureDirectoryExists(workflowDir);
    writeTextFile(releaseWorkflowPath, getGithubWorkflow(pm, nodeVersion));

    log('✓ GitHub Actions workflow created', 'success');
}

export async function ensurePackageJsonExists(cwd: string, pm: PackageManager): Promise<void> {
    const packageJsonPath = join(cwd, 'package.json');

    // Check if package.json exists
    const exists = existsSync(packageJsonPath);

    if (exists) {
        return;
    }

    log('⚠️  package.json not found in this directory', 'warning');

    const wantToCreate = await promptConfirmation('Would you like to create a package.json?');

    if (!wantToCreate) {
        log('❌ Cannot proceed without package.json', 'error');
        process.exit(1);
    }

    // Create package.json using the package manager's init command
    log(`\n📦 Initializing package.json with ${PACKAGE_MANAGER_DISPLAY_NAMES[pm]}...`, 'info');

    try {
        let initCmd: string;
        switch (pm) {
            case 'npm':
                initCmd = 'npm init -y';
                break;
            case 'pnpm':
                initCmd = 'pnpm init';
                break;
            case 'bun':
                initCmd = 'bun init -y';
                break;
            case 'yarn':
                initCmd = 'yarn init -y';
                break;
        }

        execCommand(initCmd, cwd);
        log('✓ package.json created', 'success');
    } catch (error) {
        log(`❌ Failed to create package.json: ${error instanceof Error ? error.message : String(error)}`, 'error');
        process.exit(1);
    }
}
