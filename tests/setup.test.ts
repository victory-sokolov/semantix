import { describe, it, expect } from 'bun:test';
import { ConventionalCommitSetup } from '../src/setup.ts';

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
            const setup = new ConventionalCommitSetup();
            const result = setup.setup();
            expect(result).toBeInstanceOf(Promise);
        });
    });
});
