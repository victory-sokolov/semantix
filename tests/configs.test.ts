import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
    ensurePackageJsonExists,
} from '../src/configs.ts';
import { COMMITLINT_CONFIG, SEMANTIC_RELEASE_CONFIG } from '../src/constants.ts';
import { writeTextFile, writeJsonFile } from '../src/utils.ts';
import { createTempDir, cleanupTempDir, assertPackageJsonScripts } from './test-helpers.ts';

void mock.module('child_process', () => ({
    execSync: () => undefined,
}));

describe('Configuration File Generators', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir('temp-test');
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    describe('File System Verification', () => {
        it('should verify temp directory is created', () => {
            expect(existsSync(tempDir)).toBe(true);
        });

        it('should be able to create and read files', () => {
            const testFile = join(tempDir, 'test-file.txt');
            writeFileSync(testFile, 'test content');
            expect(existsSync(testFile)).toBe(true);
            const content = readFileSync(testFile, 'utf-8');
            expect(content).toBe('test content');
        });

        it('should be able to call utility write functions', () => {
            const testFile = join(tempDir, 'test-util.txt');
            writeTextFile(testFile, 'util content');
            expect(existsSync(testFile)).toBe(true);
            const content = readFileSync(testFile, 'utf-8');
            expect(content).toBe('util content');
        });

        it('should be able to call utility writeJsonFile', () => {
            const testFile = join(tempDir, 'test-json.json');
            writeJsonFile(testFile, { key: 'value' });
            expect(existsSync(testFile)).toBe(true);
            const content = readFileSync(testFile, 'utf-8');
            const parsed = JSON.parse(content);
            expect(parsed).toEqual({ key: 'value' });
        });
    });

    describe('Exported Functions', () => {
        it('should export createCommitlintConfig', () => {
            expect(typeof createCommitlintConfig).toBe('function');
        });

        it('should export createSemanticReleaseConfig', () => {
            expect(typeof createSemanticReleaseConfig).toBe('function');
        });

        it('should export setupLefthook', () => {
            expect(typeof setupLefthook).toBe('function');
        });

        it('should export updatePackageJson', () => {
            expect(typeof updatePackageJson).toBe('function');
        });

        it('should export createGitHubWorkflow', () => {
            expect(typeof createGitHubWorkflow).toBe('function');
        });
    });

    describe('createCommitlintConfig', () => {
        it('should create .commitlintrc.json with correct content', () => {
            createCommitlintConfig(tempDir);

            const configPath = join(tempDir, '.commitlintrc.json');
            expect(existsSync(configPath)).toBe(true);

            const content = readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(content);
            expect(parsed).toEqual(COMMITLINT_CONFIG);
        });

        it('should merge with existing JSON config', () => {
            const configPath = join(tempDir, '.commitlintrc.json');
            const existingConfig = { extends: ['custom-preset'] };
            writeFileSync(configPath, JSON.stringify(existingConfig));

            createCommitlintConfig(tempDir);

            const content = readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(content);
            // Existing extends should be preserved
            expect(parsed.extends).toEqual(['custom-preset']);
            // Default rules should be added
            expect(parsed.rules).toBeDefined();
        });

        it('should skip if existing config is not JSON (e.g., .js file)', () => {
            const configPath = join(tempDir, 'commitlint.config.js');
            writeFileSync(configPath, 'export default {}');

            createCommitlintConfig(tempDir);

            // Original file should not be modified
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toBe('export default {}');
            // No new JSON config should be created
            expect(existsSync(join(tempDir, '.commitlintrc.json'))).toBe(false);
        });
    });

    describe('createSemanticReleaseConfig', () => {
        it('should create .releaserc.json with correct content', () => {
            createSemanticReleaseConfig(tempDir);

            const configPath = join(tempDir, '.releaserc.json');
            expect(existsSync(configPath)).toBe(true);

            const content = readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(content);
            expect(parsed).toEqual(SEMANTIC_RELEASE_CONFIG);
        });

        it('should merge with existing JSON config', () => {
            const configPath = join(tempDir, '.releaserc.json');
            const existingConfig = { branches: ['custom-branch'] };
            writeFileSync(configPath, JSON.stringify(existingConfig));

            createSemanticReleaseConfig(tempDir);

            const content = readFileSync(configPath, 'utf-8');
            const parsed = JSON.parse(content);
            // Existing branches should be preserved
            expect(parsed.branches).toEqual(['custom-branch']);
            // Default plugins should be added
            expect(parsed.plugins).toBeDefined();
        });

        it('should convert existing JSON-format release config to .releaserc.json', () => {
            const oldConfigPath = join(tempDir, '.releaserc'); // No extension, just JSON content
            const newConfigPath = join(tempDir, '.releaserc.json');
            const existingConfig = { branches: ['main'] };
            writeFileSync(oldConfigPath, JSON.stringify(existingConfig));

            createSemanticReleaseConfig(tempDir);

            // New JSON config should exist
            expect(existsSync(newConfigPath)).toBe(true);
            // Old file should be deleted
            expect(existsSync(oldConfigPath)).toBe(false);
        });

        it('should skip if existing config is not JSON (e.g., .js file with non-JSON content)', () => {
            const configPath = join(tempDir, '.releaserc.mjs');
            writeFileSync(configPath, 'export default {}');

            createSemanticReleaseConfig(tempDir);

            // Original file should not be modified
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toBe('export default {}');
            // No new JSON config should be created
            expect(existsSync(join(tempDir, '.releaserc.json'))).toBe(false);
        });
    });

    describe('setupLefthook', () => {
        it('should create lefthook.yml file', () => {
            setupLefthook(tempDir, 'bun');

            const configPath = join(tempDir, 'lefthook.yml');
            expect(existsSync(configPath)).toBe(true);
        });

        it('should create lefthook.yml with bun package manager config', () => {
            setupLefthook(tempDir, 'bun');

            const configPath = join(tempDir, 'lefthook.yml');
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('bun run format');
            expect(content).toContain('bunx --no -- commitlint');
        });

        it('should create lefthook.yml with npm package manager config', () => {
            setupLefthook(tempDir, 'npm');

            const configPath = join(tempDir, 'lefthook.yml');
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('npm run format');
            expect(content).toContain('npx commitlint');
        });

        it('should create lefthook.yml with yarn package manager config', () => {
            setupLefthook(tempDir, 'yarn');

            const configPath = join(tempDir, 'lefthook.yml');
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('yarn run format');
            expect(content).toContain('yarn dlx commitlint');
        });

        it('should create lefthook.yml with pnpm package manager config', () => {
            setupLefthook(tempDir, 'pnpm');

            const configPath = join(tempDir, 'lefthook.yml');
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('pnpm run format');
            expect(content).toContain('pnpm dlx commitlint');
        });

        it('should call lefthook install command', () => {
            setupLefthook(tempDir, 'bun');

            const configPath = join(tempDir, 'lefthook.yml');
            expect(existsSync(configPath)).toBe(true);
        });

        it('should call correct install command for different package managers', () => {
            setupLefthook(tempDir, 'npm');
            const npmConfigPath = join(tempDir, 'lefthook.yml');
            expect(existsSync(npmConfigPath)).toBe(true);

            setupLefthook(tempDir, 'yarn');
            const yarnConfigPath = join(tempDir, 'lefthook.yml');
            expect(existsSync(yarnConfigPath)).toBe(true);

            setupLefthook(tempDir, 'pnpm');
            const pnpmConfigPath = join(tempDir, 'lefthook.yml');
            expect(existsSync(pnpmConfigPath)).toBe(true);
        });

        it('should handle lefthook install errors gracefully', () => {
            expect(() => setupLefthook(tempDir, 'bun')).not.toThrow();
            expect(existsSync(join(tempDir, 'lefthook.yml'))).toBe(true);
        });

        it('should skip creating lefthook.yml if it already exists', () => {
            const configPath = join(tempDir, 'lefthook.yml');
            writeFileSync(configPath, 'existing config');

            setupLefthook(tempDir, 'bun');

            // Original file should NOT be overwritten
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toBe('existing config');
        });
    });

    describe('updatePackageJson', () => {
        it('should add new scripts to package.json', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(packageJsonPath, JSON.stringify({ name: 'test-package' }, null, 4));

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect((packageJson.scripts as Record<string, string>).release).toBe('semantic-release');
            expect((packageJson.scripts as Record<string, string>)['release:dry']).toBe('semantic-release --dry-run');
            expect((packageJson.scripts as Record<string, string>).prepare).toBe('lefthook install');
        });

        it('should merge with existing scripts', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify({ name: 'test-package', scripts: { build: 'tsc' } }, null, 4),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect((packageJson.scripts as Record<string, string>).build).toBe('tsc');
            assertPackageJsonScripts(packageJson, {
                release: 'semantic-release',
                'release:dry': 'semantic-release --dry-run',
                prepare: 'lefthook install',
            });
        });

        it('should handle prepare script conflict by creating namespaced version', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify({ name: 'test-package', scripts: { prepare: 'husky install' } }, null, 4),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect(packageJson.scripts.prepare).toBe('husky install');
            expect(packageJson.scripts['prepare:lefthook']).toBe('lefthook install');
        });

        it('should skip merging if prepare script already matches', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify({ name: 'test-package', scripts: { prepare: 'lefthook install' } }, null, 4),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect(packageJson.scripts.prepare).toBe('lefthook install');
            expect(packageJson.scripts['prepare:lefthook']).toBeUndefined();
        });

        it('should merge prepare script if existing has lefthook and other commands', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify({ name: 'test-package', scripts: { prepare: 'lefthook install --help' } }, null, 4),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect(packageJson.scripts.prepare).toBe('lefthook install --help && lefthook install');
        });

        it('should merge prepare script if existing has multiple commands', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify(
                    { name: 'test-package', scripts: { prepare: 'npm run build && npm run test' } },
                    null,
                    4,
                ),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect(packageJson.scripts.prepare).toBe('npm run build && npm run test && lefthook install');
        });

        it('should handle conflicting release script by creating namespaced version', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify({ name: 'test-package', scripts: { release: 'custom-release' } }, null, 4),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect(packageJson.scripts.release).toBe('custom-release');
            expect(packageJson.scripts['release:semantic']).toBe('semantic-release');
        });

        it('should skip adding duplicate scripts', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify(
                    { name: 'test-package', scripts: { release: 'semantic-release', prepare: 'lefthook install' } },
                    null,
                    4,
                ),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            expect(packageJson.scripts.release).toBe('semantic-release');
            expect(packageJson.scripts.prepare).toBe('lefthook install');
        });

        it('should throw error if package.json does not exist', () => {
            expect(() => updatePackageJson(tempDir)).toThrow();
        });

        it('should throw error if package.json is invalid JSON', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(packageJsonPath, 'invalid json');

            expect(() => updatePackageJson(tempDir)).toThrow();
        });

        it('should keep existing semantic-release script and not add release', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify(
                    {
                        name: 'test-package',
                        scripts: { 'semantic-release': 'semantic-release' },
                    },
                    null,
                    4,
                ),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            // Should keep the original script
            expect(packageJson.scripts['semantic-release']).toBe('semantic-release');
            // Should NOT add a duplicate release script
            expect(packageJson.scripts['release']).toBeUndefined();
            // Should still add release:dry
            expect(packageJson.scripts['release:dry']).toBe('semantic-release --dry-run');
            expect(packageJson.scripts.prepare).toBe('lefthook install');
        });

        it('should keep existing release script that runs semantic-release', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify(
                    {
                        name: 'test-package',
                        scripts: { release: 'semantic-release' },
                    },
                    null,
                    4,
                ),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            // Should keep the original release script
            expect(packageJson.scripts.release).toBe('semantic-release');
            // Should add release:dry
            expect(packageJson.scripts['release:dry']).toBe('semantic-release --dry-run');
            expect(packageJson.scripts.prepare).toBe('lefthook install');
        });

        it('should keep existing semantic-release --dry-run script and not add release:dry', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify(
                    {
                        name: 'test-package',
                        scripts: {
                            release: 'semantic-release',
                            'semantic-release:dry': 'semantic-release --dry-run',
                        },
                    },
                    null,
                    4,
                ),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            // Should keep original scripts
            expect(packageJson.scripts.release).toBe('semantic-release');
            expect(packageJson.scripts['semantic-release:dry']).toBe('semantic-release --dry-run');
            // Should NOT add a duplicate release:dry
            expect(packageJson.scripts['release:dry']).toBeUndefined();
            expect(packageJson.scripts.prepare).toBe('lefthook install');
        });

        it('should detect semantic-release with additional flags', () => {
            const packageJsonPath = join(tempDir, 'package.json');
            writeFileSync(
                packageJsonPath,
                JSON.stringify(
                    {
                        name: 'test-package',
                        scripts: { release: 'semantic-release --branches main' },
                    },
                    null,
                    4,
                ),
            );

            updatePackageJson(tempDir);

            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            // Should keep the original release script with flags
            expect(packageJson.scripts.release).toBe('semantic-release --branches main');
            // Should still add release:dry
            expect(packageJson.scripts['release:dry']).toBe('semantic-release --dry-run');
        });
    });

    describe('createGitHubWorkflow', () => {
        it('should create .github/workflows directory and release.yml file', () => {
            createGitHubWorkflow(tempDir, 'bun');

            const workflowPath = join(tempDir, '.github', 'workflows', 'release.yml');
            expect(existsSync(workflowPath)).toBe(true);
        });

        it('should create workflow with bun package manager config', () => {
            createGitHubWorkflow(tempDir, 'bun');

            const workflowPath = join(tempDir, '.github', 'workflows', 'release.yml');
            const content = readFileSync(workflowPath, 'utf-8');
            expect(content).toContain('Setup Bun');
            expect(content).toContain('bun install');
            expect(content).toContain('bun run release');
        });

        it('should create workflow with npm package manager config', () => {
            createGitHubWorkflow(tempDir, 'npm');

            const workflowPath = join(tempDir, '.github', 'workflows', 'release.yml');
            const content = readFileSync(workflowPath, 'utf-8');
            expect(content).toContain('Setup Node');
            expect(content).toContain('npm ci');
            expect(content).toContain("cache: 'npm'");
            expect(content).toContain('npm run release');
        });

        it('should create workflow with yarn package manager config', () => {
            createGitHubWorkflow(tempDir, 'yarn');

            const workflowPath = join(tempDir, '.github', 'workflows', 'release.yml');
            const content = readFileSync(workflowPath, 'utf-8');
            expect(content).toContain('Setup Node');
            expect(content).toContain('yarn install');
            expect(content).toContain("cache: 'yarn'");
            expect(content).toContain('yarn run release');
        });

        it('should handle existing directory', () => {
            const workflowsDir = join(tempDir, '.github', 'workflows');
            mkdirSync(workflowsDir, { recursive: true });

            createGitHubWorkflow(tempDir, 'bun');

            const workflowPath = join(workflowsDir, 'release.yml');
            expect(existsSync(workflowPath)).toBe(true);
        });

        it('should skip if release.yml already exists', () => {
            const workflowsDir = join(tempDir, '.github', 'workflows');
            mkdirSync(workflowsDir, { recursive: true });
            const workflowPath = join(workflowsDir, 'release.yml');
            writeFileSync(workflowPath, 'old workflow');

            createGitHubWorkflow(tempDir, 'bun');

            // Original file should NOT be overwritten
            const content = readFileSync(workflowPath, 'utf-8');
            expect(content).toBe('old workflow');
        });
    });

    describe('ensurePackageJsonExists', () => {
        let mockProcessExit: ReturnType<typeof spyOn>;
        let execCommandSpy: ReturnType<typeof spyOn>;
        let promptConfirmationSpy: ReturnType<typeof spyOn>;
        let consoleLogSpy: ReturnType<typeof spyOn>;

        beforeEach(() => {
            // Mock console.log to suppress output
            consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});

            // Mock process.exit to prevent test from actually exiting
            mockProcessExit = spyOn(process, 'exit').mockImplementation((() => {}) as () => never);

            // Mock utils functions
            const utils = require('../src/utils.ts');
            execCommandSpy = spyOn(utils, 'execCommand').mockImplementation(() => {});
            promptConfirmationSpy = spyOn(utils, 'promptConfirmation').mockResolvedValue(true);
        });

        afterEach(() => {
            mockProcessExit.mockRestore();
            consoleLogSpy.mockRestore();
            execCommandSpy?.mockRestore();
            promptConfirmationSpy?.mockRestore();
        });

        const getPackageJsonPath = () => join(tempDir, 'package.json');

        it('should return early when package.json already exists', async () => {
            // Create package.json
            writeFileSync(getPackageJsonPath(), JSON.stringify({ name: 'test' }));

            await ensurePackageJsonExists(tempDir, 'npm');

            // Should not call execCommand since package.json exists
            expect(execCommandSpy).not.toHaveBeenCalled();
            expect(promptConfirmationSpy).not.toHaveBeenCalled();
        });

        it('should prompt user when package.json does not exist', async () => {
            await ensurePackageJsonExists(tempDir, 'npm');

            expect(promptConfirmationSpy).toHaveBeenCalledWith('Would you like to create a package.json?');
        });

        it('should run npm init -y when package.json does not exist and user agrees', async () => {
            await ensurePackageJsonExists(tempDir, 'npm');

            expect(execCommandSpy).toHaveBeenCalledWith('npm init -y', tempDir);
        });

        it('should run bun init -y when package.json does not exist and user agrees', async () => {
            await ensurePackageJsonExists(tempDir, 'bun');

            expect(execCommandSpy).toHaveBeenCalledWith('bun init -y', tempDir);
        });

        it('should run yarn init -y when package.json does not exist and user agrees', async () => {
            await ensurePackageJsonExists(tempDir, 'yarn');

            expect(execCommandSpy).toHaveBeenCalledWith('yarn init -y', tempDir);
        });

        it('should run pnpm init when package.json does not exist and user agrees', async () => {
            await ensurePackageJsonExists(tempDir, 'pnpm');

            expect(execCommandSpy).toHaveBeenCalledWith('pnpm init', tempDir);
        });

        it('should exit process when user declines to create package.json', async () => {
            promptConfirmationSpy.mockResolvedValue(false); // User declines

            await ensurePackageJsonExists(tempDir, 'npm');

            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });

        it('should handle init command errors gracefully and exit', async () => {
            execCommandSpy.mockImplementation(() => {
                throw new Error('Command failed');
            });

            await ensurePackageJsonExists(tempDir, 'npm');

            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });
    });
});
