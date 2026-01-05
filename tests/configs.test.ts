import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
} from '../src/configs.ts';
import { COMMITLINT_CONFIG, SEMANTIC_RELEASE_CONFIG } from '../src/constants.ts';
import * as utils from '../src/utils.ts';
import { createTempDir, cleanupTempDir, assertPackageJsonScripts } from './test-helpers.ts';

describe('Configuration File Generators', () => {
    let tempDir: string;
    let consoleLogSpy: ReturnType<typeof spyOn>;
    let consoleErrorSpy: ReturnType<typeof spyOn>;
    let execCommandSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        tempDir = createTempDir('temp-test');

        consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
        execCommandSpy = spyOn(utils, 'execCommand').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        execCommandSpy.mockRestore();
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
            utils.writeTextFile(testFile, 'util content');
            expect(existsSync(testFile)).toBe(true);
            const content = readFileSync(testFile, 'utf-8');
            expect(content).toBe('util content');
        });

        it('should be able to call utility writeJsonFile', () => {
            const testFile = join(tempDir, 'test-json.json');
            utils.writeJsonFile(testFile, { key: 'value' });
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
        it('should create commitlint.config.js with correct content', () => {
            createCommitlintConfig(tempDir);

            const configPath = join(tempDir, 'commitlint.config.js');
            expect(existsSync(configPath)).toBe(true);

            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('export default');
            expect(content).toContain(JSON.stringify(COMMITLINT_CONFIG, null, 4));
        });

        it('should handle existing file by overwriting it', () => {
            const configPath = join(tempDir, 'commitlint.config.js');
            writeFileSync(configPath, 'old content');

            createCommitlintConfig(tempDir);

            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('export default');
            expect(content).not.toBe('old content');
        });
    });

    describe('createSemanticReleaseConfig', () => {
        it('should create .releaserc.mjs with correct content', () => {
            createSemanticReleaseConfig(tempDir);

            const configPath = join(tempDir, '.releaserc.mjs');
            expect(existsSync(configPath)).toBe(true);

            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('const config =');
            expect(content).toContain(JSON.stringify(SEMANTIC_RELEASE_CONFIG, null, 4));
            expect(content).toContain('export default config;');
        });

        it('should handle existing file by overwriting it', () => {
            const configPath = join(tempDir, '.releaserc.mjs');
            writeFileSync(configPath, 'old config');

            createSemanticReleaseConfig(tempDir);

            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('const config =');
            expect(content).not.toBe('old config');
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
            expect(content).toContain('bun run format:check');
            expect(content).toContain('bunx --no -- commitlint');
        });

        it('should create lefthook.yml with npm package manager config', () => {
            setupLefthook(tempDir, 'npm');

            const configPath = join(tempDir, 'lefthook.yml');
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('npm run format:check');
            expect(content).toContain('npx commitlint');
        });

        it('should create lefthook.yml with yarn package manager config', () => {
            setupLefthook(tempDir, 'yarn');

            const configPath = join(tempDir, 'lefthook.yml');
            const content = readFileSync(configPath, 'utf-8');
            expect(content).toContain('yarn run format:check');
            expect(content).toContain('yarn dlx commitlint');
        });

        it('should call lefthook install command', () => {
            setupLefthook(tempDir, 'bun');

            expect(execCommandSpy).toHaveBeenCalledWith('bunx lefthook install', tempDir);
        });

        it('should call correct install command for different package managers', () => {
            setupLefthook(tempDir, 'npm');
            expect(execCommandSpy).toHaveBeenCalledWith('npx lefthook install', tempDir);

            setupLefthook(tempDir, 'yarn');
            expect(execCommandSpy).toHaveBeenCalledWith('yarn dlx lefthook install', tempDir);

            setupLefthook(tempDir, 'pnpm');
            expect(execCommandSpy).toHaveBeenCalledWith('pnpm dlx lefthook install', tempDir);
        });

        it('should handle lefthook install errors gracefully', () => {
            execCommandSpy.mockImplementation(() => {
                throw new Error('Command failed');
            });

            expect(() => setupLefthook(tempDir, 'bun')).not.toThrow();
            expect(existsSync(join(tempDir, 'lefthook.yml'))).toBe(true);
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

        it('should overwrite existing release.yml file', () => {
            const workflowsDir = join(tempDir, '.github', 'workflows');
            mkdirSync(workflowsDir, { recursive: true });
            const workflowPath = join(workflowsDir, 'release.yml');
            writeFileSync(workflowPath, 'old workflow');

            createGitHubWorkflow(tempDir, 'bun');

            const content = readFileSync(workflowPath, 'utf-8');
            expect(content).toContain('Setup Bun');
            expect(content).not.toBe('old workflow');
        });
    });
});
