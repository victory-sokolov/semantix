# Semantix

A TypeScript CLI tool built with Bun to automatically configure conventional commits, semantic-release, and automated releases for your projects.

## Quick Start

```bash
# Install globally
bun install -g semantix

# Run in your project
cd your-project
semantix

# Make a commit
git commit -m "feat: add new feature"
```

See [QUICKSTART.md](./QUICKSTART.md) for a detailed getting started guide.

## Features

- ✅ **Commitlint** - Enforces conventional commit format
- ✅ **Lefthook** - Git hooks to validate commits
- ✅ **Semantic Release** - Automated versioning and releases
- ✅ **Changelog Generation** - Auto-generates CHANGELOG.md
- ✅ **GitHub Releases** - Creates releases automatically
- ✅ **GitHub Actions** - CI/CD workflow included

## Installation

### Global Installation (Recommended)

```bash
# Using Bun
bun install -g semantix

# Using npm
npm install -g semantix

# Using pnpm
pnpm add -g semantix
```

### Local Installation

```bash
# Using Bun
bun add -D semantix

# Using npm
npm install --save-dev semantix
```

## Usage

Navigate to your project directory and run:

```bash
# If installed globally
semantix

# If installed locally
bunx semantix
# or
npx semantix
```

That's it! Semantix will automatically configure everything for you.

## Project Structure

After running Semantix, your project will have:

```
your-project/
├── .github/
│   └── workflows/
│       └── release.yml           # GitHub Actions workflow
├── lefthook.yml            # Git hooks configuration
├── commitlint.config.js          # Commit message rules
├── .releaserc.mjs               # Semantic-release config
├── COMMIT_CONVENTION.md          # Team documentation
└── package.json                  # Updated with scripts
```

## What Gets Configured

### 1. Dependencies Installed

- `@commitlint/cli` & `@commitlint/config-conventional`
- `@semantic-release/changelog`
- `@semantic-release/git`
- `@semantic-release/github`
- `lefthook`
- `semantic-release`

### 2. Configuration Files Created

- **commitlint.config.js** - Commit message validation rules
- **.releaserc.mjs** - Semantic-release configuration
- **lefthook.yml** - Git hooks configuration
- **.github/workflows/release.yml** - GitHub Actions workflow
- **COMMIT_CONVENTION.md** - Documentation for your team

### 3. Package.json Scripts Added

```json
{
  "scripts": {
    "release": "semantic-release",
    "release:dry": "semantic-release --dry-run",
    "prepare": "lefthook install"
  }
}
```

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes
- `revert`: Revert previous commit

### Examples

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve memory leak in data processing"
git commit -m "docs: update installation instructions"
git commit -m "feat(api)!: redesign authentication flow

BREAKING CHANGE: The authentication API has been completely redesigned"
```

## How Releases Work

1. **Commit** with conventional commit format
2. **Push** to `main` or `master` branch
3. **GitHub Actions** runs automatically
4. **Semantic-release** analyzes commits and:
   - Determines version bump (major/minor/patch)
   - Generates CHANGELOG.md
   - Creates git tag
   - Publishes GitHub release
   - Updates package.json version

### Version Bumping

- `fix:` → Patch release (1.0.0 → 1.0.1)
- `feat:` → Minor release (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → Major release (1.0.0 → 2.0.0)

## Testing Releases

Before pushing, test the release process locally:

```bash
bun run release:dry
```

This shows what would happen without actually creating a release.

## GitHub Configuration

### Required: GitHub Token

The GitHub Actions workflow needs a `GITHUB_TOKEN` to create releases. This is automatically provided by GitHub Actions, but ensure your repository has:

1. **Settings** → **Actions** → **General**
2. **Workflow permissions** → Select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

### Optional: NPM Publishing

To publish to npm, add `NPM_TOKEN` to repository secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add `NPM_TOKEN` with your npm access token

## Customization

### Change Release Branches

Edit `.releaserc.mjs`:

```javascript
const config = {
  branches: ["main", "develop", {"name": "beta", "prerelease": true}],
  // ... rest of config
};

export default config;
```

### Customize Commit Types

Edit `commitlint.config.js`:

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "custom-type"]
    ]
  }
};
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/semantix.git
cd semantix

# Install dependencies
bun install
```

### Local Development

```bash
# Run in watch mode
bun run dev

# Build the project
bun run build

# Test locally in another project
bun link
cd /path/to/test-project
semantix
```

### Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests once
bun run test:run

# Run tests with coverage
bun run test:coverage

# Type checking
bun run type-check

# Linting
bun run lint

# Fix linting issues
bun run lint:fix

# Code formatting
bun run format

# Check formatting
bun run format:check
```

### Publishing

```bash
# Build and publish to npm
bun run build
npm publish

# Or use Bun to publish
bun publish
```

## Troubleshooting

### Commits are not being validated

```bash
bunx lefthook install
```

### Release not triggering

- Check GitHub Actions tab for errors
- Verify workflow permissions are set correctly
- Ensure you're pushing to `main` or `master` branch

### "No commits since last release"

This means there are no conventional commits that would trigger a release (feat, fix, etc.)

## License

MIT
