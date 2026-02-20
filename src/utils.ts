import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
import { isPlainObject } from '@vsokolov/utils';
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

    // Multiple lock files found - default to first detected, prompt user if not in CI/skip mode
    if (skipConfirmation) {
        log(`⚠️  Multiple lock files detected. Defaulting to ${detected[0]}.`, 'warning');
        return detected[0];
    }

    return promptPackageManagerSelection(detected);
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

export function getRunInstallCommand(pm: PackageManager): string {
    switch (pm) {
        case 'npm':
            return 'npm install';
        case 'yarn':
            return 'yarn install';
        case 'pnpm':
            return 'pnpm install';
        case 'bun':
            return 'bun install';
    }
}

export function promptConfirmation(question: string): Promise<boolean> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        let resolved = false;

        const resolveOnce = (value: boolean) => {
            if (!resolved) {
                resolved = true;
                rl.close();
                resolve(value);
            }
        };

        rl.on('close', () => {
            resolveOnce(true);
        });

        rl.question(`${question} (Y/n): `, (answer) => {
            const normalized = answer?.trim().toLowerCase() ?? '';
            resolveOnce(normalized === '' || normalized === 'y' || normalized === 'yes');
        });
    });
}

/**
 * Check if any variant of a config file exists, return the found path
 */
export function findConfigFile(cwd: string, patterns: string[]): string | null {
    for (const pattern of patterns) {
        const filePath = join(cwd, pattern);
        if (existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}

/**
 * Read JSON file safely, return null if doesn't exist or invalid
 */
export function readJsonFileIfExists(filePath: string): Record<string, unknown> | null {
    try {
        if (!existsSync(filePath)) {
            return null;
        }
        return JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
    } catch {
        return null;
    }
}

/**
 * Deep merge two objects - EXISTING values take priority (don't overwrite user's custom config)
 * Only adds keys that don't exist in target
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target } as T;

    for (const key of Object.keys(source) as (keyof T)[]) {
        const sourceValue = source[key];
        const targetValue = result[key];

        // If key doesn't exist in target, add it from source
        if (targetValue === undefined) {
            result[key] = sourceValue as T[keyof T];
        }
        // If both are plain objects, recursively merge
        else if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
            result[key] = deepMerge(
                targetValue as Record<string, unknown>,
                sourceValue as Record<string, unknown>,
            ) as T[keyof T];
        }
    }

    return result;
}
