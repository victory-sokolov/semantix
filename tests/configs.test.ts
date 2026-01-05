import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { join } from 'path';

// Mock the utils module
mock.module('../src/utils.ts', () => ({
    log: mock(() => {}),
    writeJsonFile: mock(() => {}),
    writeTextFile: mock(() => {}),
    ensureDirectoryExists: mock(() => {}),
    execCommand: mock(() => {}),
    readJsonFile: mock(() => ({ name: 'test-package', version: '1.0.0', scripts: {} })),
}));

// Mock the fs module
mock.module('fs', () => ({
    existsSync: mock(() => false),
    writeFileSync: mock(() => {}),
    readFileSync: mock(() => JSON.stringify({ name: 'test-package', version: '1.0.0', scripts: {} })),
    mkdirSync: mock(() => {}),
}));

import {
    createCommitlintConfig,
    createSemanticReleaseConfig,
    setupLefthook,
    updatePackageJson,
    createGitHubWorkflow,
} from '../src/configs.ts';
import { writeTextFile, ensureDirectoryExists, execCommand, readJsonFile, writeJsonFile } from '../src/utils.ts';

describe('Configuration File Generators', () => {
    const mockCwd = '/test/project';

    beforeEach(() => {});

    describe('Commitlint Configuration Creation', () => {
        it('should create commitlint.config.js with correct content', () => {
            createCommitlintConfig(mockCwd);

            expect(writeTextFile).toHaveBeenCalledWith(
                join(mockCwd, 'commitlint.config.js'),
                expect.stringContaining('export default'),
            );
        });
    });

    describe('Semantic Release Configuration Creation', () => {
        it('should create .releaserc.mjs with correct content', () => {
            createSemanticReleaseConfig(mockCwd);

            expect(writeTextFile).toHaveBeenCalledWith(
                join(mockCwd, '.releaserc.mjs'),
                expect.stringContaining('const config ='),
            );
            expect(writeTextFile).toHaveBeenCalledWith(
                join(mockCwd, '.releaserc.mjs'),
                expect.stringContaining('export default config'),
            );
        });
    });

    describe('Lefthook Git Hooks Setup', () => {
        it('should create lefthook.yml and run install command', () => {
            setupLefthook(mockCwd, 'bun');

            expect(writeTextFile).toHaveBeenCalledWith(join(mockCwd, 'lefthook.yml'), expect.any(String));
            expect(execCommand).toHaveBeenCalledWith('bunx lefthook install', mockCwd);
        });
    });

    describe('Package.json Scripts Update', () => {
        it('should read and update package.json with scripts', () => {
            updatePackageJson(mockCwd);

            expect(readJsonFile).toHaveBeenCalledWith(join(mockCwd, 'package.json'));
            expect(writeJsonFile).toHaveBeenCalledWith(
                join(mockCwd, 'package.json'),
                expect.objectContaining({
                    scripts: expect.objectContaining({
                        release: 'semantic-release',
                        'release:dry': 'semantic-release --dry-run',
                        prepare: 'lefthook install',
                    }),
                }),
            );
        });
    });

    describe('GitHub Actions Workflow Creation', () => {
        it('should create workflow directory and release.yml file', () => {
            createGitHubWorkflow(mockCwd, 'bun');

            expect(ensureDirectoryExists).toHaveBeenCalledWith(join(mockCwd, '.github', 'workflows'));
            expect(writeTextFile).toHaveBeenCalledWith(
                join(mockCwd, '.github', 'workflows', 'release.yml'),
                expect.any(String),
            );
        });
    });
});
