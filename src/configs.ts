import { join, basename } from 'path';
import { existsSync, unlinkSync, rmSync } from 'fs';
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
 */
export function removeHusky(cwd: string, pm: PackageManager): void {
    log('🗑️  Removing Husky...', 'info');

    // 1. Unset git core.hooksPath
    try {
        execSync('git config --unset-all --local core.hooksPath', { cwd, stdio: 'pipe' });
        log('✓ Git core.hooksPath unset', 'success');
    } catch {
        // Config might not exist, that's fine
    }

    // 2. Remove .husky directory
    const huskyDir = join(cwd, '.husky');
    if (existsSync(huskyDir)) {
        try {
            rmSync(huskyDir, { recursive: true, force: true });
            log('✓ .husky directory removed', 'success');
        } catch (error) {
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

        if (packageJson.devDependencies && typeof packageJson.devDependencies === 'object') {
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

    // 4. Run install to update lock file
    try {
        execCommand(getRunInstallCommand(pm), cwd);
        log('✓ Dependencies updated', 'success');
    } catch (error) {
        log(`⚠️ Could not update dependencies: ${error instanceof Error ? error.message : String(error)}`, 'warning');
    }

    log('✓ Husky removed successfully', 'success');
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

export function updatePackageJson(cwd: string) {
    log('📦 Updating package.json scripts...', 'info');

    const packageJsonPath = join(cwd, 'package.json');
    const scripts = {
        release: 'semantic-release',
        'release:dry': 'semantic-release --dry-run',
        prepare: 'lefthook install',
    };

    let packageJson: Record<string, unknown>;
    try {
        packageJson = readJsonFile(packageJsonPath) as Record<string, unknown>;
    } catch (error) {
        throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!packageJson.scripts || typeof packageJson.scripts !== 'object') {
        packageJson.scripts = {};
    }

    const existingScripts = packageJson.scripts as Record<string, string>;
    const conflicts: string[] = [];
    const mergedScripts: Record<string, string> = { ...existingScripts };

    // Check for conflicts and handle them
    for (const [key, value] of Object.entries(scripts)) {
        if (existingScripts[key]) {
            if (existingScripts[key] === value) {
                // Same value, no conflict
                continue;
            }

            conflicts.push(key);

            // For prepare script, try to merge with existing prepare hooks
            if (key === 'prepare') {
                const existing = existingScripts[key];
                if (existing.includes('&&') || existing.includes('lefthook')) {
                    // Already has lefthook or multiple commands, append with &&
                    mergedScripts[key] = `${existing} && ${value}`;
                    log(`⚠️ Merged prepare script: "${existing}" + "${value}"`, 'warning');
                } else {
                    // Create namespaced alternative
                    mergedScripts[`${key}:lefthook`] = value;
                    log(
                        `⚠️ Conflict detected for "${key}". Preserving existing and adding "prepare:lefthook"`,
                        'warning',
                    );
                }
            } else {
                // For other scripts, create namespaced alternatives
                mergedScripts[`${key}:semantic`] = value;
                log(`⚠️ Conflict detected for "${key}". Preserving existing and adding "${key}:semantic"`, 'warning');
            }
        } else {
            mergedScripts[key] = value;
        }
    }

    // Update and write
    packageJson.scripts = mergedScripts;
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

export function createGitHubWorkflow(cwd: string, pm: PackageManager) {
    log('🔄 Creating GitHub Actions workflow...', 'info');

    const workflowDir = join(cwd, '.github', 'workflows');
    const releaseWorkflowPath = join(workflowDir, 'release.yml');

    // Check if release.yml already exists
    if (existsSync(releaseWorkflowPath)) {
        log('⚠️ .github/workflows/release.yml already exists, skipping...', 'warning');
        return;
    }

    ensureDirectoryExists(workflowDir);
    writeTextFile(releaseWorkflowPath, getGithubWorkflow(pm));

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
