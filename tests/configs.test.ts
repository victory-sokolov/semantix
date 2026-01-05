import { describe, it, expect, spyOn } from 'bun:test';
import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
} from '../src/configs.ts';

describe('Configuration File Generators', () => {
    // Spy on console to prevent output during tests
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'error').mockImplementation(() => {});

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
});
