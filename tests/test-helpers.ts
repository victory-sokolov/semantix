import { expect, spyOn } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as configs from '../src/configs.ts';
import * as utils from '../src/utils.ts';

export function createTempDir(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 11);
    const tempDir = join(tmpdir(), `${prefix}-${timestamp}-${random}`);
    mkdirSync(tempDir, { recursive: true });
    return tempDir;
}

export function cleanupTempDir(tempDir: string): void {
    if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
    }
}

export function assertPackageJsonScripts(
    packageJson: Record<string, unknown>,
    expectedScripts: Record<string, string>,
): void {
    for (const [scriptName, expectedCommand] of Object.entries(expectedScripts)) {
        expect((packageJson.scripts as Record<string, string>)[scriptName]).toBe(expectedCommand);
    }
}

export function createTestPackageFile(tempDir: string, content: Record<string, unknown> = { name: 'test' }): void {
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(content));
}

export function createBunLockFile(tempDir: string): void {
    writeFileSync(join(tempDir, 'bun.lock'), '');
}

export function createMockLockFile(tempDir: string, packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'): void {
    const lockFiles = {
        npm: 'package-lock.json',
        yarn: 'yarn.lock',
        pnpm: 'pnpm-lock.yaml',
        bun: 'bun.lock',
    };
    writeFileSync(join(tempDir, lockFiles[packageManager]), '');
}

export function mockConfigsAndUtils(): {
    execCommand: ReturnType<typeof spyOn>;
    createCommitlintConfig: ReturnType<typeof spyOn>;
    createSemanticReleaseConfig: ReturnType<typeof spyOn>;
    setupLefthook: ReturnType<typeof spyOn>;
    updatePackageJson: ReturnType<typeof spyOn>;
    createGitHubWorkflow: ReturnType<typeof spyOn>;
    ensurePackageJsonExists: ReturnType<typeof spyOn>;
    promptConfirmation: ReturnType<typeof spyOn>;
} {
    return {
        execCommand: spyOn(utils, 'execCommand').mockImplementation(() => {}),
        createCommitlintConfig: spyOn(configs, 'createCommitlintConfig').mockImplementation(() => {}),
        createSemanticReleaseConfig: spyOn(configs, 'createSemanticReleaseConfig').mockImplementation(() => {}),
        setupLefthook: spyOn(configs, 'setupLefthook').mockImplementation(() => {}),
        updatePackageJson: spyOn(configs, 'updatePackageJson').mockImplementation(() => {}),
        createGitHubWorkflow: spyOn(configs, 'createGitHubWorkflow').mockImplementation(() => {}),
        ensurePackageJsonExists: spyOn(configs, 'ensurePackageJsonExists').mockImplementation(async () => {}),
        promptConfirmation: spyOn(utils, 'promptConfirmation').mockImplementation(() => Promise.resolve(true)),
    };
}
