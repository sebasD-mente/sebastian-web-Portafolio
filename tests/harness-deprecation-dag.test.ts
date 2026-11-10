import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateFeatureListObject } from '../scripts/lib/harness-utils.mjs';

const REPO_ROOT = path.resolve(__dirname, '..');

function loadCurrentFeatureList() {
  const raw = fs.readFileSync(path.join(REPO_ROOT, 'feature_list.json'), 'utf8');
  return JSON.parse(raw);
}

describe('Event-Sourced Pass-State Gating & DAG Deprecation (feat-008)', () => {
  it('validates the repository feature_list.json with immutable feat-001..feat-007 history and purged zombie components', () => {
    const parsed = loadCurrentFeatureList();
    const result = validateFeatureListObject(parsed, REPO_ROOT);
    expect(result).toEqual({ valid: true, reason: null });

    const zombiePaths = [
      'src/ui/components/BenchmarksStrip.tsx',
      'src/ui/components/AgenticOrchestrationSection.tsx',
      'src/ui/components/TechStackMatrix.tsx',
      'src/ui/components/LiveTerminalSection.tsx',
      'src/ui/components/ContactAdvisorySection.tsx',
    ];
    for (const relPath of zombiePaths) {
      expect(fs.existsSync(path.join(REPO_ROOT, relPath))).toBe(false);
    }

    const activeComponents = fs
      .readdirSync(path.join(REPO_ROOT, 'src/ui/components'))
      .filter((name) => name.endsWith('.tsx'))
      .sort();
    expect(activeComponents).toEqual([
      'AdminLoginView.tsx',
      'AiProjectsCatalogView.tsx',
      'AppShell.tsx',
      'CatalogAdminView.tsx',
      'CodeInspectorTabs.tsx',
      'HeroSection.tsx',
      'ProductionSystemsSection.tsx',
      'SystemDetailView.tsx',
    ]);
  });

  it('enforces Candado Anti-Zombi (Fail-Closed when a done feature lists an existing file in deprecated_files)', () => {
    const parsed = {
      project: 'test-zombie-lock',
      features: [
        {
          id: 'feat-001',
          name: 'Base feature',
          description: 'Creates package.json and HeroSection.tsx',
          status: 'done',
          dependencies: [],
          required_files: ['package.json', 'src/ui/components/HeroSection.tsx'],
          verification: ['npm test'],
          evidence: 'npm test -> 24/24 PASS (verified on disk)',
        },
        {
          id: 'feat-002',
          name: 'Claims to deprecate HeroSection.tsx while it still exists on disk',
          description: 'Leaves a zombie file behind',
          status: 'done',
          dependencies: ['feat-001'],
          required_files: ['tsconfig.json'],
          deprecated_files: ['src/ui/components/HeroSection.tsx'],
          verification: ['npm test'],
          evidence: 'npm test -> 24/24 PASS (but zombie file still exists)',
        },
      ],
    };

    const result = validateFeatureListObject(parsed, REPO_ROOT);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('zombie file');
  });

  it('enforces Candado Anti-Trampa #1 (Fail-Closed on self-deprecation within the same feature)', () => {
    const parsed = {
      project: 'test-self-deprecation-lock',
      features: [
        {
          id: 'feat-001',
          name: 'Base feature',
          description: 'Creates package.json',
          status: 'done',
          dependencies: [],
          required_files: ['package.json'],
          verification: ['npm test'],
          evidence: 'npm test -> PASS verified',
        },
        {
          id: 'feat-002',
          name: 'Self-deprecating feature',
          description: 'Attempts to list the same file in required_files and deprecated_files',
          status: 'in-progress',
          dependencies: ['feat-001'],
          required_files: ['package.json'],
          deprecated_files: ['package.json'],
          verification: ['npm test'],
        },
      ],
    };

    const result = validateFeatureListObject(parsed, REPO_ROOT);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('self-deprecation forbidden');
  });

  it('enforces Candado Anti-Trampa #2 (Fail-Closed when deprecating a file not introduced by any DAG ancestor)', () => {
    const parsed = {
      project: 'test-lineage-lock',
      features: [
        {
          id: 'feat-001',
          name: 'Base feature',
          description: 'Creates package.json',
          status: 'done',
          dependencies: [],
          required_files: ['package.json'],
          verification: ['npm test'],
          evidence: 'npm test -> PASS verified',
        },
        {
          id: 'feat-002',
          name: 'Unrelated deprecation attempt',
          description: 'Attempts to deprecate a file never declared by feat-001',
          status: 'in-progress',
          dependencies: ['feat-001'],
          required_files: ['tsconfig.json'],
          deprecated_files: ['src/ui/components/NonAncestorFile.tsx'],
          verification: ['npm test'],
        },
      ],
    };

    const result = validateFeatureListObject(parsed, REPO_ROOT);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('no ancestor in its dependency DAG');
  });
});
