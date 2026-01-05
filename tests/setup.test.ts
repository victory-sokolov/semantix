import { describe, it, expect, spyOn } from 'bun:test';
import { ConventionalCommitSetup } from '../src/setup.ts';

describe('Conventional Commit Setup Class', () => {
    const mockCwd = '/test/project';

    // Spy on console to prevent output during tests
    spyOn(console, 'log').mockImplementation(() => {});

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

        it('should return a promise', () => {
            const setup = new ConventionalCommitSetup(mockCwd);
            const result = setup.setup();
            expect(result).toBeInstanceOf(Promise);
        });
    });
});
