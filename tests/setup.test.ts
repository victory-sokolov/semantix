import { describe, it, expect, spyOn } from 'bun:test';
import { ConventionalCommitSetup } from '../src/setup.ts';
import * as utils from '../src/utils.ts';
import * as configs from '../src/configs.ts';

describe('Conventional Commit Setup Class', () => {
    describe('Class Instantiation', () => {
        it('should create an instance with provided cwd', () => {
            const mockCwd = process.cwd();
            const setup = new ConventionalCommitSetup(mockCwd);
            expect(setup).toBeInstanceOf(ConventionalCommitSetup);
            expect((setup as unknown as { cwd: string }).cwd).toBe(mockCwd);
        });

        it('should default to process.cwd() when no path provided', () => {
            const setup = new ConventionalCommitSetup();
            expect((setup as unknown as { cwd: string }).cwd).toBe(process.cwd());
        });
    });

    describe('Setup Method', () => {
        it('should be a function', () => {
            const setup = new ConventionalCommitSetup();
            expect(typeof setup.setup).toBe('function');
        });

        it('should return a promise', () => {
            spyOn(console, 'log').mockImplementation(() => {});
            spyOn(utils, 'execCommand').mockImplementation(() => {});
            spyOn(configs, 'createCommitlintConfig').mockImplementation(() => {});
            spyOn(configs, 'createSemanticReleaseConfig').mockImplementation(() => {});
            spyOn(configs, 'setupLefthook').mockImplementation(() => {});
            spyOn(configs, 'updatePackageJson').mockImplementation(() => {});
            spyOn(configs, 'createGitHubWorkflow').mockImplementation(() => {});

            const setup = new ConventionalCommitSetup();
            const result = setup.setup();
            expect(result).toBeInstanceOf(Promise);
        });
    });
});
