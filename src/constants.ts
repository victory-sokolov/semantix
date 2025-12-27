export const DEPENDENCIES = [
  "@semantic-release/changelog",
  "@semantic-release/git",
  "@semantic-release/github",
  "@commitlint/cli",
  "@commitlint/config-conventional",
  "lefthook",
  "semantic-release",
];

export const COMMIT_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];

export const COMMITLINT_CONFIG = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", COMMIT_TYPES],
    "subject-case": [2, "never", ["upper-case"]],
  },
};

export const SEMANTIC_RELEASE_CONFIG = {
  branches: ["main", "master"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/github",
      {
        assets: ["CHANGELOG.md"],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};

export const GITHUB_WORKFLOW = `name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Release
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: bun run release
`;

export const COMMIT_CONVENTION_README = `# Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

## Format

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

## Examples

\`\`\`
feat: add user authentication
fix: resolve memory leak in data processing
docs: update installation instructions
\`\`\`

## Automated Release

Commits following this convention will automatically:
- Generate CHANGELOG.md
- Create git tags
- Publish GitHub releases
- Bump version numbers

Run \`bun run release:dry\` to preview the next release.
`;

export const ASCII_ART = `
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ███████╗███████╗███╗   ███╗ █████╗ ███╗   ██╗████████╗██╗██╗  ██╗  ║
║   ██╔════╝██╔════╝████╗ ████║██╔══██╗████╗  ██║╚══██╔══╝██║╚██╗██╔╝  ║
║   ███████╗█████╗  ██╔████╔██║███████║██╔██╗ ██║   ██║   ██║ ╚███╔╝   ║
║   ╚════██║██╔══╝  ██║╚██╔╝██║██╔══██║██║╚██╗██║   ██║   ██║ ██╔██╗   ║
║   ███████║███████╗██║ ╚═╝ ██║██║  ██║██║ ╚████║   ██║   ██║██╔╝ ██╗  ║
║   ╚══════╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═╝  ║
║                                                                      ║
║            Automated Conventional Commits & Releases                 ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`;

export const LEFTHOOK_CONFIG = `pre-commit:
  commands:
    format-check:
      run: bun run format:check
    lint:
      run: bun run lint
    type-check:
      run: bun run type-check

commit-msg:
  commands:
    commitlint:
      run: bunx --no -- commitlint --edit {1}
`;
