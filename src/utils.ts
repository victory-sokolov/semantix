import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { PM_LOCK_FILES, type PackageManager } from './constants';

export function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m',
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
}

export function execCommand(command: string, cwd: string) {
    try {
        execSync(command, { cwd, stdio: 'inherit' });
    } catch (error) {
        log(`Failed to execute: ${command}`, 'error');
        throw error;
    }
}

export function ensureDirectoryExists(dirPath: string) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}

export function writeJsonFile(filePath: string, data: unknown) {
    writeFileSync(filePath, JSON.stringify(data, null, 4));
}

export function writeTextFile(filePath: string, content: string) {
    writeFileSync(filePath, content);
}

export function readJsonFile(filePath: string): unknown {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function updatePackageJsonScripts(packageJsonPath: string, scripts: Record<string, string>) {
    const packageJson = readJsonFile(packageJsonPath) as Record<string, unknown>;
    const existingScripts = (packageJson.scripts as Record<string, string>) || {};
    packageJson.scripts = {
        ...existingScripts,
        ...scripts,
    };
    writeJsonFile(packageJsonPath, packageJson);
}

export function detectAllPackageManagers(cwd: string): PackageManager[] {
    const detected: PackageManager[] = [];
    for (const [pm, lockFiles] of Object.entries(PM_LOCK_FILES)) {
        const files = Array.isArray(lockFiles) ? lockFiles : [lockFiles];
        if (files.some((file) => existsSync(join(cwd, file)))) {
            detected.push(pm as PackageManager);
        }
    }
    return detected;
}

export function detectPackageManager(cwd: string): PackageManager {
    const detected = detectAllPackageManagers(cwd);
    if (detected.length > 0) {
        return detected[0];
    }

    return 'npm';
}

export async function resolvePackageManager(cwd: string, skipConfirmation: boolean): Promise<PackageManager> {
    const detected = detectAllPackageManagers(cwd);

    if (detected.length === 0) {
        return 'npm';
    }

    if (detected.length === 1) {
        return detected[0];
    }

    // Multiple lock files found - default to npm, prompt user if not in CI/skip mode
    if (skipConfirmation) {
        log('⚠️  Multiple lock files detected. Defaulting to npm.', 'warning');
        return 'npm';
    }

    // Put npm first in the options list so it's the default selection
    const sortedOptions = detected.sort((a, b) => (a === 'npm' ? -1 : b === 'npm' ? 1 : 0));
    return promptPackageManagerSelection(sortedOptions);
}

export async function promptPackageManagerSelection(options: PackageManager[]): Promise<PackageManager> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        let resolved = false;

        const resolveOnce = (value: PackageManager) => {
            if (!resolved) {
                resolved = true;
                rl.close();
                resolve(value);
            }
        };

        log('\n⚠️  Multiple package manager lock files detected.', 'warning');
        log('Which package manager do you want to use?', 'info');

        options.forEach((pm, index) => {
            console.log(`  ${index + 1}. ${pm}`);
        });

        rl.on('close', () => {
            resolveOnce(options[0]);
        });

        rl.question(`Enter selection (1-${options.length}): `, (answer) => {
            if (!answer?.trim()) {
                log('No selection provided. Defaulting to first option.', 'warning');
                resolveOnce(options[0]);
                return;
            }
            const selection = parseInt(answer.trim(), 10);
            if (selection >= 1 && selection <= options.length) {
                resolveOnce(options[selection - 1]);
            } else {
                log('Invalid selection. Defaulting to first option.', 'warning');
                resolveOnce(options[0]);
            }
        });
    });
}

export function getInstallCommand(pm: PackageManager, dependencies: string[]): string {
    const deps = dependencies.join(' ');
    switch (pm) {
        case 'npm':
            return `npm install -D ${deps}`;
        case 'yarn':
            return `yarn add -D ${deps}`;
        case 'pnpm':
            return `pnpm add -D ${deps}`;
        case 'bun':
            return `bun add -D ${deps}`;
    }
}

export function promptConfirmation(question: string): Promise<boolean> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(`${question} (Y/n): `, (answer) => {
            rl.close();
            const normalized = answer.trim().toLowerCase();
            resolve(normalized === '' || normalized === 'y' || normalized === 'yes');
        });
    });
}
