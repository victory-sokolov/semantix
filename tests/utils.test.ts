import { describe, it, expect, spyOn } from 'bun:test';
import { log, getInstallCommand } from '../src/utils.ts';

describe('Utility Functions', () => {
    describe('Logging functionality', () => {
        it('should log info messages with cyan color', () => {
            const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
            log('Test message', 'info');
            expect(consoleSpy).toHaveBeenCalledWith('\x1b[36mTest message\x1b[0m');
            consoleSpy.mockRestore();
        });

        it('should log success messages with green color', () => {
            const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
            log('Success message', 'success');
            expect(consoleSpy).toHaveBeenCalledWith('\x1b[32mSuccess message\x1b[0m');
            consoleSpy.mockRestore();
        });

        it('should log error messages with red color', () => {
            const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
            log('Error message', 'error');
            expect(consoleSpy).toHaveBeenCalledWith('\x1b[31mError message\x1b[0m');
            consoleSpy.mockRestore();
        });

        it('should default to info type', () => {
            const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
            log('Default message');
            expect(consoleSpy).toHaveBeenCalledWith('\x1b[36mDefault message\x1b[0m');
            consoleSpy.mockRestore();
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
    });
});
