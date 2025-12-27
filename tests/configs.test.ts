import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createCommitlintConfig,
  createSemanticReleaseConfig,
  setupHusky,
  updatePackageJson,
  createGitHubWorkflow,
  createReadme
} from '../src/configs.ts'

// Mock the utils module
vi.mock('../src/utils.ts', () => ({
  log: vi.fn(),
  writeJsonFile: vi.fn(),
  writeTextFile: vi.fn(),
  ensureDirectoryExists: vi.fn(),
  execCommand: vi.fn(),
  readJsonFile: vi.fn(() => ({ scripts: {} })),
}))

describe('Configuration File Generators', () => {
  const mockCwd = '/test/project'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Commitlint Configuration Creation', () => {
    it('should be a function', () => {
      expect(typeof createCommitlintConfig).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => createCommitlintConfig(mockCwd)).not.toThrow()
    })
  })

  describe('Semantic Release Configuration Creation', () => {
    it('should be a function', () => {
      expect(typeof createSemanticReleaseConfig).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => createSemanticReleaseConfig(mockCwd)).not.toThrow()
    })
  })

  describe('Husky Git Hooks Setup', () => {
    it('should be a function', () => {
      expect(typeof setupHusky).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => setupHusky(mockCwd)).not.toThrow()
    })
  })

  describe('Package.json Scripts Update', () => {
    it('should be a function', () => {
      expect(typeof updatePackageJson).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => updatePackageJson(mockCwd)).not.toThrow()
    })
  })

  describe('GitHub Actions Workflow Creation', () => {
    it('should be a function', () => {
      expect(typeof createGitHubWorkflow).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => createGitHubWorkflow(mockCwd)).not.toThrow()
    })
  })

  describe('Commit Convention README Creation', () => {
    it('should be a function', () => {
      expect(typeof createReadme).toBe('function')
    })

    it('should not throw when called', () => {
      expect(() => createReadme(mockCwd)).not.toThrow()
    })
  })
})