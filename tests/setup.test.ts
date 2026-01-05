import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ConventionalCommitSetup } from '../src/setup.ts';

// Mock utils and configs modules
const mockLog = mock(() => {});
const mockExecCommand = mock(() => {});
const mockDetectPackageManager = mock(() => 'bun');
const mockGetInstallCommand = mock(() => 'bun add -D dependencies');
const mockCreateCommitlintConfig = mock(() => {});
const mockCreateSemanticReleaseConfig = mock(() => {});
const mockSetupLefthook = mock(() => {});
const mockUpdatePackageJson = mock(() => {});
const mockCreateGitHubWorkflow = mock(() => {});

mock.module('../src/utils.ts', () => ({
    log: mockLog,
    execCommand: mockExecCommand,
    detectPackageManager: mockDetectPackageManager,
    getInstallCommand: mockGetInstallCommand,
}));

mock.module('../src/configs.ts', () => ({
    createCommitlintConfig: mockCreateCommitlintConfig,
    createSemanticReleaseConfig: mockCreateSemanticReleaseConfig,
    setupLefthook: mockSetupLefthook,
    updatePackageJson: mockUpdatePackageJson,
    createGitHubWorkflow: mockCreateGitHubWorkflow,
}));

describe('Conventional Commit Setup Class', () => {
    const mockCwd = '/test/project';

    beforeEach(() => {
        // Reset mocks between tests
    });

    describe('Class Instantiation', () => {
        it('should create an instance with provided cwd', () => {
            const setup = new ConventionalCommitSetup(mockCwd);
            expect(setup).toBeInstanceOf(ConventionalCommitSetup);
            expect((setup as unknown as { cwd: string }).cwd).toBe(mockCwd);
        });

        it('should default to process.cwd() when no path provided', () => {
            const setup = new ConventionalCommitSetup();
            expect((setup as unknown as { cwd: string }).cwd).toBe(process.cwd());
        });
    });

    describe('Automated Setup Process', () => {
        it('should be a function', () => {
            const setup = new ConventionalCommitSetup(mockCwd);
            expect(typeof setup.setup).toBe('function');
        });

        it('should return a promise', async () => {
            const setup = new ConventionalCommitSetup(mockCwd);
            const result = setup.setup();
            expect(result).toBeInstanceOf(Promise);
            await expect(result).resolves.toBeUndefined();
        });
    });
});
