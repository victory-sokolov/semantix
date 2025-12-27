# Semantix - Quick Start Guide

## 1. Install Semantix

```bash
bun install -g semantix
```

## 2. Run in Your Project

```bash
cd your-project
semantix
```

## 3. Make Your First Conventional Commit

```bash
git add .
git commit -m "feat: add new feature"
```

If you try to make an invalid commit, it will be rejected:

```bash
git commit -m "added stuff"
# ❌ Error: Commit message doesn't follow conventional format
```

## 4. Push and Watch the Magic

```bash
git push origin main
```

This will automatically:

- ✅ Analyze your commits
- ✅ Determine the version bump
- ✅ Generate CHANGELOG.md
- ✅ Create a git tag
- ✅ Publish a GitHub release

## 5. Test Release Locally (Optional)

Before pushing, you can preview what would happen:

```bash
bun run release:dry
```

## Commit Types Quick Reference

| Type        | Description      | Version Bump          |
| ----------- | ---------------- | --------------------- |
| `feat:`     | New feature      | Minor (1.0.0 → 1.1.0) |
| `fix:`      | Bug fix          | Patch (1.0.0 → 1.0.1) |
| `docs:`     | Documentation    | None                  |
| `style:`    | Code style       | None                  |
| `refactor:` | Code refactoring | None                  |
| `perf:`     | Performance      | Patch                 |
| `test:`     | Tests            | None                  |
| `build:`    | Build system     | None                  |
| `ci:`       | CI config        | None                  |
| `chore:`    | Other changes    | None                  |

### Breaking Changes

Add `!` or `BREAKING CHANGE:` for major version bump:

```bash
git commit -m "feat!: redesign API"
# 1.0.0 → 2.0.0
```

## Examples

```bash
# New feature (minor bump)
git commit -m "feat: add user authentication"

# Bug fix (patch bump)
git commit -m "fix: resolve memory leak in data processing"

# Breaking change (major bump)
git commit -m "feat!: redesign authentication flow"

# With scope
git commit -m "feat(api): add REST endpoints"

# Multi-line commit
git commit -m "feat: add payment processing

This adds Stripe integration for payment processing.
Closes #123"
```

## Troubleshooting

### Commits not being validated?

```bash
bunx lefthook install
```

### Release not triggering?

- Check GitHub Actions is enabled
- Verify you're on `main` or `master` branch
- Check workflow permissions in repository settings

### Want to customize?

Edit these files:

- `.releaserc.mjs` - Release configuration
- `commitlint.config.js` - Commit rules
- `.github/workflows/release.yml` - CI/CD workflow

## Need Help?

Read the full documentation: [README.md](./README.md)
