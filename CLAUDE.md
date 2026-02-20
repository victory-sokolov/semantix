# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Semantix is a CLI tool that automatically configures conventional commits, semantic-release, and automated releases for JavaScript/TypeScript projects. It's published as `@vsokolov/semantix` and runs as `setup-commits` when installed globally.

## Development Commands

```bash
# Development
bun run dev           # Run in watch mode
bun run start         # Run CLI once

# Build
bun run build         # Build to dist/index.js using rolldown

# Testing
bun test              # Run all tests
bun test --coverage   # Run with coverage

# Quality Checks
bun run typecheck     # TypeScript check (no emit)
bun run lint          # oxlint with type-aware
bun run lint:fix      # Auto-fix linting issues
bun run format        # Format with oxfmt
bun run format:check  # Check formatting
bun run jscpd         # Check for code duplication
bun run check         # All checks: typecheck + lint + format + test + jscpd
```

## Architecture

The codebase follows a modular architecture with clear separation of concerns:

### Entry Point
- `src/index.ts` - CLI entry point, parses optional target directory argument and instantiates `ConventionalCommitSetup`

### Core Classes
- `src/setup.ts` - `ConventionalCommitSetup` class orchestrates the entire setup flow:
  - Detects/resolves package manager
  - Shows preview and prompts for confirmation
  - Installs dependencies
  - Handles Husky→Lefthook migration
  - Creates all configuration files
  - Updates package.json scripts

### Configuration Generators (`src/configs.ts`)
Each function creates or merges configuration files:
- `createCommitlintConfig()` - Creates `.commitlintrc.json`, merges with existing configs
- `createSemanticReleaseConfig()` - Creates `.releaserc.json`
- `setupLefthook()` - Creates `lefthook.yml` and runs `lefthook install`
- `updatePackageJson()` - Adds `release`, `release:dry`, `prepare` scripts with conflict handling
- `createGitHubWorkflow()` - Creates `.github/workflows/release.yml`
- `detectHusky()`/`removeHusky()` - Detects and removes Husky to avoid conflicts with Lefthook

### Constants (`src/constants.ts`)
- `DEPENDENCIES` - List of packages to install
- `COMMITLINT_CONFIG` / `SEMANTIC_RELEASE_CONFIG` - Default configurations
- `getGithubWorkflow(pm)` / `getLefthookConfig(pm)` - Template generators that adapt to package manager

### Utilities (`src/utils.ts`)
- Package manager detection and resolution
- File operations (JSON read/write, config file finding)
- `deepMerge()` - Merges configs where existing values take priority
- `promptConfirmation()` / `promptPackageManagerSelection()` - Interactive prompts

### Key Design Decisions

1. **Config Merging**: When configs already exist, the tool merges rather than overwrites. Existing user values take priority via `deepMerge()`.

2. **Script Conflict Handling**: `updatePackageJson()` uses namespaced scripts (e.g., `release:semantic`) when conflicts are detected. The `prepare` script gets special handling to merge commands with `&&`.

3. **Package Manager Support**: Supports npm, yarn, pnpm, and bun. Lock file detection determines default; multiple lock files trigger user prompt.

## Testing

Tests use Bun's built-in test runner. Key patterns:
- `createTempDir()`/`cleanupTempDir()` for isolated test environments
- `mockConfigsAndUtils()` in `tests/test-helpers.ts` provides pre-configured spies for all config functions
- `mock.module('child_process', ...)` to prevent actual command execution
- Tests verify file creation, content, merging behavior, and conflict handling
