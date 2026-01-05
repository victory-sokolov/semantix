import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import { ConventionalCommitSetup } from '../src/setup.ts';
import * as utils from '../src/utils.ts';
import * as configs from '../src/configs.ts';
import {
    createTempDir,
    cleanupTempDir,
    createTestPackageFile,
    createBunLockFile,
    createMockLockFile,
    mockConfigsAndUtils,
} from './test-helpers.ts';

describe('Conventional Commit Setup Class', () => {
    let tempDir: string;
    let consoleLogSpy: ReturnType<typeof spyOn>;
    let consoleErrorSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        tempDir = createTempDir('temp-test-setup');

        consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Class Instantiation', () => {
        it('should create an instance with provided cwd', () => {
            const setup = new ConventionalCommitSetup(tempDir);
            expect(setup).toBeInstanceOf(ConventionalCommitSetup);
            expect((setup as unknown as { cwd: string }).cwd).toBe(tempDir);
        });

        it('should default to process.cwd() when no path provided', () => {
            const setup = new ConventionalCommitSetup();
            expect((setup as unknown as { cwd: string }).cwd).toBe(process.cwd());
        });
    });

    describe('Package Manager Detection', () => {
        it('should detect bun package manager from bun.lock file', () => {
            createMockLockFile(tempDir, 'bun');

            const setup = new ConventionalCommitSetup(tempDir);
            expect((setup as unknown as { packageManager: string }).packageManager).toBe('bun');
        });

        it('should detect npm package manager from package-lock.json file', () => {
            createMockLockFile(tempDir, 'npm');

            const setup = new ConventionalCommitSetup(tempDir);
            expect((setup as unknown as { packageManager: string }).packageManager).toBe('npm');
        });

        it('should detect yarn package manager from yarn.lock file', () => {
            createMockLockFile(tempDir, 'yarn');

            const setup = new ConventionalCommitSetup(tempDir);
            expect((setup as unknown as { packageManager: string }).packageManager).toBe('yarn');
        });

        it('should default to bun when no lock file is found', () => {
            const setup = new ConventionalCommitSetup(tempDir);
            expect((setup as unknown as { packageManager: string }).packageManager).toBe('bun');
        });
    });

    describe('Setup Method', () => {
        it('should be a function', () => {
            const setup = new ConventionalCommitSetup();
            expect(typeof setup.setup).toBe('function');
        });

        it('should return a promise', () => {
            mockConfigsAndUtils();

            const setup = new ConventionalCommitSetup();
            const result = setup.setup();
            expect(result).toBeInstanceOf(Promise);
        });

        it('should call all configuration functions in order', async () => {
            const mocks = mockConfigsAndUtils();

            createTestPackageFile(tempDir);
            createBunLockFile(tempDir);

            const setup = new ConventionalCommitSetup(tempDir);
            await setup.setup();

            expect(mocks.execCommand).toHaveBeenCalled();
            expect(mocks.createCommitlintConfig).toHaveBeenCalledWith(tempDir);
            expect(mocks.createSemanticReleaseConfig).toHaveBeenCalledWith(tempDir);
            expect(mocks.setupLefthook).toHaveBeenCalledWith(tempDir, 'bun');
            expect(mocks.updatePackageJson).toHaveBeenCalledWith(tempDir);
            expect(mocks.createGitHubWorkflow).toHaveBeenCalledWith(tempDir, 'bun');
        });

        it('should handle errors and log error message', async () => {
            spyOn(utils, 'execCommand').mockImplementation(() => {
                throw new Error('Test error');
            });
            spyOn(configs, 'createCommitlintConfig').mockImplementation(() => {});

            createTestPackageFile(tempDir);
            createBunLockFile(tempDir);

            const setup = new ConventionalCommitSetup(tempDir);

            await expect(setup.setup()).rejects.toThrow();
        });
    });

    describe('installDependencies', () => {
        it('should call execCommand with correct install command', () => {
            const mocks = mockConfigsAndUtils();

            createTestPackageFile(tempDir);
            createBunLockFile(tempDir);

            const setup = new ConventionalCommitSetup(tempDir);
            setup.setup();

            expect(mocks.execCommand).toHaveBeenCalled();
            const installCommand = mocks.execCommand.mock.calls[0][0];
            expect(installCommand).toContain('bun add -D');
            expect(installCommand).toContain('@semantic-release/changelog');
        });
    });
});
