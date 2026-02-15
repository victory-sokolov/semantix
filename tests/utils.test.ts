import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import { join } from 'path';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import {
    log,
    getInstallCommand,
    ensureDirectoryExists,
    writeJsonFile,
    writeTextFile,
    readJsonFile,
    detectAllPackageManagers,
    detectPackageManager,
    resolvePackageManager,
} from '../src/utils.ts';
import { createTempDir, cleanupTempDir, createMockLockFile } from './test-helpers.ts';

describe('Utility Functions', () => {
    let tempDir: string;
    let consoleSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        tempDir = createTempDir('temp-test-utils');
        consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
        consoleSpy.mockRestore();
    });

    describe('Package Manager Detection', () => {
        describe('detectAllPackageManagers', () => {
            it('should return empty array when no lock files exist', () => {
                const result = detectAllPackageManagers(tempDir);
                expect(result).toEqual([]);
            });

            it('should detect single package manager', () => {
                createMockLockFile(tempDir, 'bun');
                const result = detectAllPackageManagers(tempDir);
                expect(result).toEqual(['bun']);
            });

            it('should detect multiple package managers', () => {
                createMockLockFile(tempDir, 'npm');
                createMockLockFile(tempDir, 'bun');
                const result = detectAllPackageManagers(tempDir);
                expect(result).toContain('npm');
                expect(result).toContain('bun');
                expect(result.length).toBe(2);
            });

            it('should detect all package managers when all lock files exist', () => {
                createMockLockFile(tempDir, 'npm');
                createMockLockFile(tempDir, 'yarn');
                createMockLockFile(tempDir, 'pnpm');
                createMockLockFile(tempDir, 'bun');
                const result = detectAllPackageManagers(tempDir);
                expect(result).toContain('npm');
                expect(result).toContain('yarn');
                expect(result).toContain('pnpm');
                expect(result).toContain('bun');
                expect(result.length).toBe(4);
            });
        });

        describe('detectPackageManager', () => {
            it('should return first detected package manager', () => {
                createMockLockFile(tempDir, 'npm');
                createMockLockFile(tempDir, 'bun');
                const result = detectPackageManager(tempDir);
                expect(['npm', 'bun']).toContain(result);
            });

            it('should default to npm when no lock files exist', () => {
                const result = detectPackageManager(tempDir);
                expect(result).toBe('npm');
            });
        });

        describe('resolvePackageManager', () => {
            it('should return npm when no lock files exist', async () => {
                const result = await resolvePackageManager(tempDir, true);
                expect(result).toBe('npm');
            });

            it('should return single detected package manager', async () => {
                createMockLockFile(tempDir, 'bun');
                const result = await resolvePackageManager(tempDir, true);
                expect(result).toBe('bun');
            });

            it('should default to npm when multiple exist and skipConfirmation is true', async () => {
                createMockLockFile(tempDir, 'npm');
                createMockLockFile(tempDir, 'bun');
                const result = await resolvePackageManager(tempDir, true);
                expect(result).toBe('npm');
            });
        });
    });

    describe('Logging functionality', () => {
        it('should log info messages with cyan color', () => {
            log('Test message', 'info');

            expect(consoleSpy).toHaveBeenCalledWith('\x1b[36mTest message\x1b[0m');
        });

        it('should log success messages with green color', () => {
            log('Success message', 'success');

            expect(consoleSpy).toHaveBeenCalledWith('\x1b[32mSuccess message\x1b[0m');
        });

        it('should log error messages with red color', () => {
            log('Error message', 'error');

            expect(consoleSpy).toHaveBeenCalledWith('\x1b[31mError message\x1b[0m');
        });

        it('should log warning messages with yellow color', () => {
            log('Warning message', 'warning');

            expect(consoleSpy).toHaveBeenCalledWith('\x1b[33mWarning message\x1b[0m');
        });

        it('should default to info type', () => {
            log('Default message');

            expect(consoleSpy).toHaveBeenCalledWith('\x1b[36mDefault message\x1b[0m');
        });
    });

    describe('Install Command Generation', () => {
        const deps = ['dep1', 'dep2'];
        const depsString = 'dep1 dep2';

        it('should generate npm install command', () => {
            expect(getInstallCommand('npm', deps)).toBe(`npm install -D ${depsString}`);
        });

        it('should generate yarn add command', () => {
            expect(getInstallCommand('yarn', deps)).toBe(`yarn add -D ${depsString}`);
        });

        it('should generate pnpm add command', () => {
            expect(getInstallCommand('pnpm', deps)).toBe(`pnpm add -D ${depsString}`);
        });

        it('should generate bun add command', () => {
            expect(getInstallCommand('bun', deps)).toBe(`bun add -D ${depsString}`);
        });

        it('should handle empty dependencies array', () => {
            expect(getInstallCommand('npm', [])).toBe('npm install -D ');
        });

        it('should handle single dependency', () => {
            expect(getInstallCommand('bun', ['single-dep'])).toBe('bun add -D single-dep');
        });
    });

    describe('Directory Operations', () => {
        describe('ensureDirectoryExists', () => {
            it('should create directory if it does not exist', () => {
                const testDir = join(tempDir, 'new-directory');
                expect(existsSync(testDir)).toBe(false);

                ensureDirectoryExists(testDir);

                expect(existsSync(testDir)).toBe(true);
            });

            it('should create nested directories', () => {
                const testDir = join(tempDir, 'a', 'b', 'c');
                expect(existsSync(testDir)).toBe(false);

                ensureDirectoryExists(testDir);

                expect(existsSync(testDir)).toBe(true);
            });

            it('should not error if directory already exists', () => {
                const testDir = join(tempDir, 'existing-dir');
                mkdirSync(testDir);

                expect(() => ensureDirectoryExists(testDir)).not.toThrow();
                expect(existsSync(testDir)).toBe(true);
            });
        });
    });

    describe('File Operations', () => {
        describe('writeJsonFile', () => {
            it('should write JSON file with correct formatting', () => {
                const testFile = join(tempDir, 'test.json');
                const testData = { name: 'test', value: 123 };

                writeJsonFile(testFile, testData);

                expect(existsSync(testFile)).toBe(true);
                const content = readFileSync(testFile, 'utf-8');
                const parsed = JSON.parse(content);
                expect(parsed).toEqual(testData);
            });

            it('should write JSON with 4-space indentation', () => {
                const testFile = join(tempDir, 'indented.json');
                const testData = { key: 'value' };

                writeJsonFile(testFile, testData);

                const content = readFileSync(testFile, 'utf-8');
                expect(content).toContain('    "key"');
            });

            it('should handle nested objects', () => {
                const testFile = join(tempDir, 'nested.json');
                const testData = { outer: { inner: 'value' } };

                writeJsonFile(testFile, testData);

                const parsed = JSON.parse(readFileSync(testFile, 'utf-8'));
                expect(parsed).toEqual(testData);
            });
        });

        describe('writeTextFile', () => {
            it('should write text file with exact content', () => {
                const testFile = join(tempDir, 'test.txt');
                const content = 'Hello, World!';

                writeTextFile(testFile, content);

                expect(existsSync(testFile)).toBe(true);
                const fileContent = readFileSync(testFile, 'utf-8');
                expect(fileContent).toBe(content);
            });

            it('should handle multi-line content', () => {
                const testFile = join(tempDir, 'multiline.txt');
                const content = 'Line 1\nLine 2\nLine 3';

                writeTextFile(testFile, content);

                const fileContent = readFileSync(testFile, 'utf-8');
                expect(fileContent).toBe(content);
            });

            it('should overwrite existing file', () => {
                const testFile = join(tempDir, 'overwrite.txt');
                writeTextFile(testFile, 'original');

                writeTextFile(testFile, 'new content');

                const fileContent = readFileSync(testFile, 'utf-8');
                expect(fileContent).toBe('new content');
            });
        });

        describe('readJsonFile', () => {
            it('should read and parse JSON file', () => {
                const testFile = join(tempDir, 'read.json');
                const testData = { key: 'value', number: 42 };
                writeTextFile(testFile, JSON.stringify(testData));

                const result = readJsonFile(testFile);

                expect(result).toEqual(testData);
            });

            it('should throw error for invalid JSON', () => {
                const testFile = join(tempDir, 'invalid.json');
                writeTextFile(testFile, '{ invalid json }');

                expect(() => readJsonFile(testFile)).toThrow();
            });

            it('should throw error for non-existent file', () => {
                const testFile = join(tempDir, 'nonexistent.json');

                expect(() => readJsonFile(testFile)).toThrow();
            });

            it('should parse arrays', () => {
                const testFile = join(tempDir, 'array.json');
                const testData = [1, 2, 3, 4, 5];
                writeTextFile(testFile, JSON.stringify(testData));

                const result = readJsonFile(testFile);

                expect(result).toEqual(testData);
            });
        });
    });
});
