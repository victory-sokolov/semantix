import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import { ConventionalCommitSetup } from '../src/setup.ts';
import * as utils from '../src/utils.ts';
import * as configs from '../src/configs.ts';
import {
    createTempDir,
    cleanupTempDir,
    createTestPackageFile,
    createBunLockFile,
    mockConfigsAndUtils,
} from './test-helpers.ts';

async function setupTestEnvironment(tempDir: string) {
    const mocks = mockConfigsAndUtils();
    createTestPackageFile(tempDir);
    createBunLockFile(tempDir);
    const setup = new ConventionalCommitSetup(tempDir, true);
    await setup.setup();
    return { mocks, setup };
}

describe('Conventional Commit Setup Class', () => {
    let tempDir: string;
    let consoleLogSpy: ReturnType<typeof spyOn>;
    let consoleErrorSpy: ReturnType<typeof spyOn>;
    let mocks: ReturnType<typeof mockConfigsAndUtils> | null = null;

    beforeEach(() => {
        tempDir = createTempDir('temp-test-setup');

        consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();

        if (mocks) {
            Object.values(mocks).forEach((mock) => mock.mockRestore());
            mocks = null;
        }
    });

    describe('Class Instantiation', () => {
        it('should create an instance with provided cwd', () => {
            const setup = new ConventionalCommitSetup(tempDir, true);
            expect(setup).toBeInstanceOf(ConventionalCommitSetup);
            expect((setup as unknown as { cwd: string }).cwd).toBe(tempDir);
        });

        it('should default to process.cwd() when no path provided', () => {
            const setup = new ConventionalCommitSetup(undefined, true);
            expect((setup as unknown as { cwd: string }).cwd).toBe(process.cwd());
        });

        it('should have null packageManager before setup is called', () => {
            const setup = new ConventionalCommitSetup(tempDir, true);
            expect((setup as unknown as { packageManager: string | null }).packageManager).toBe(null);
        });
    });

    describe('Setup Method', () => {
        it('should be a function', () => {
            const setup = new ConventionalCommitSetup(undefined, true);
            expect(typeof setup.setup).toBe('function');
        });

        it('should return a promise', () => {
            mocks = mockConfigsAndUtils();

            const setup = new ConventionalCommitSetup(undefined, true);
            const result = setup.setup();
            expect(result).toBeInstanceOf(Promise);
        });

        it('should call all configuration functions in order', async () => {
            const result = await setupTestEnvironment(tempDir);
            mocks = result.mocks;

            expect(mocks.execCommand).toHaveBeenCalled();
            expect(mocks.createCommitlintConfig).toHaveBeenCalledWith(tempDir);
            expect(mocks.createSemanticReleaseConfig).toHaveBeenCalledWith(tempDir);
            expect(mocks.setupLefthook).toHaveBeenCalledWith(tempDir, 'bun');
            expect(mocks.updatePackageJson).toHaveBeenCalledWith(tempDir);
            expect(mocks.createGitHubWorkflow).toHaveBeenCalledWith(tempDir, 'bun');
        });

        it('should handle errors and log error message', async () => {
            const execSpy = spyOn(utils, 'execCommand').mockImplementation(() => {
                throw new Error('Test error');
            });
            const configSpy = spyOn(configs, 'createCommitlintConfig').mockImplementation(() => {});

            createTestPackageFile(tempDir);
            createBunLockFile(tempDir);

            const setup = new ConventionalCommitSetup(tempDir, true);

            // eslint-disable-next-line @typescript-eslint/await-thenable
            await expect(setup.setup()).rejects.toThrow();

            execSpy.mockRestore();
            configSpy.mockRestore();
        });
    });

    describe('installDependencies', () => {
        it('should call execCommand with correct install command', async () => {
            const result = await setupTestEnvironment(tempDir);
            mocks = result.mocks;

            expect(mocks.execCommand).toHaveBeenCalled();
            const installCommand = mocks.execCommand.mock.calls[0][0];
            expect(installCommand).toContain('bun add -D');
            expect(installCommand).toContain('@semantic-release/changelog');
        });
    });
});
