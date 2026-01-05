export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export const PM_LOCK_FILES = {
  npm: "package-lock.json",
  yarn: "yarn.lock",
  pnpm: "pnpm-lock.yaml",
  bun: ["bun.lockb", "bun.lock"],
} as const;

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

export const getGithubWorkflow = (pm: PackageManager = "bun") => {
  const setupStep =
    pm === "bun"
      ? `
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest`
      : `
      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: '${pm}'`;

  const installCmd = pm === "npm" ? "npm ci" : `${pm} install`;
  const runCmd = pm === "bun" ? "bun run release" : `${pm} run release`;

  return `name: Release

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
        uses: actions/checkout@v6
        with:
          fetch-depth: 0
${setupStep}

      - name: Install dependencies
        run: ${installCmd}

      - name: Release
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: ${runCmd}
  `;
};

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

export const getLefthookConfig = (pm: PackageManager = "bun") => {
  const runPrefix = pm === "bun" ? "bun run" : `${pm} run`;
  const executePrefix =
    pm === "bun" ? "bunx" : pm === "npm" ? "npx" : pm === "yarn" ? "yarn dlx" : "pnpm dlx";
  // actually for commitlint, we might standardise on using the locally installed one via the script runner or npx/bunx.
  // bunx --no is specific.

  const commitlintCmd =
    pm === "bun" ? "bunx --no -- commitlint --edit {1}" : `${executePrefix} commitlint --edit {1}`;

  return `pre-commit:
  commands:
    format-check:
      run: ${runPrefix} format:check
    lint:
      run: ${runPrefix} lint
    type-check:
      run: ${runPrefix} type-check

commit-msg:
  commands:
    commitlint:
      run: ${commitlintCmd}
`;
};
