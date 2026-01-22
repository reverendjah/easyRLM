// Dynamic Context Refresh Module
// RLM Paper: "Context should be refreshed when assumptions change during execution"

import fs from 'fs-extra';
import path from 'path';

/**
 * Context staleness indicators
 */
const STALENESS_INDICATORS = {
  FILE_NOT_FOUND: /file not found|no such file|cannot find|doesn't exist/i,
  FUNCTION_NOT_FOUND: /function.*not found|undefined function|is not a function/i,
  MODULE_CHANGED: /module.*changed|import.*failed|export.*missing/i,
  TYPE_ERROR: /type error|property.*does not exist|cannot read property/i,
  CONTEXT_MISMATCH: /expected.*but got|mismatch|inconsistent/i
};

/**
 * Detect if context is stale based on feedback
 */
export function detectStaleness(feedback) {
  const reasons = [];

  for (const [indicator, pattern] of Object.entries(STALENESS_INDICATORS)) {
    if (pattern.test(feedback)) {
      reasons.push(indicator);
    }
  }

  return {
    isStale: reasons.length > 0,
    reasons,
    severity: reasons.length > 2 ? 'high' : reasons.length > 0 ? 'medium' : 'low'
  };
}

/**
 * Checkpoint configuration for different workflow phases
 */
export const REFRESH_CHECKPOINTS = {
  feature: {
    'analyze': {
      before: ['project.md', 'architecture.md'],
      refreshOn: ['FILE_NOT_FOUND', 'MODULE_CHANGED'],
      action: 're-grep for relevant files'
    },
    'strategy': {
      before: ['patterns.md'],
      refreshOn: ['CONTEXT_MISMATCH'],
      action: 're-analyze dependencies'
    },
    'red': {
      before: [],
      refreshOn: ['FILE_NOT_FOUND', 'FUNCTION_NOT_FOUND'],
      action: 're-scan test utilities'
    },
    'green': {
      before: [],
      refreshOn: ['TYPE_ERROR', 'MODULE_CHANGED'],
      action: 're-load type definitions'
    },
    'quality': {
      before: ['knowledge.md'],
      refreshOn: ['any'],
      action: 'full context refresh'
    }
  },
  debug: {
    'investigate': {
      before: ['project.md', 'architecture.md'],
      refreshOn: ['FILE_NOT_FOUND', 'FUNCTION_NOT_FOUND'],
      action: 're-trace call stack'
    },
    'fix': {
      before: [],
      refreshOn: ['TYPE_ERROR', 'MODULE_CHANGED'],
      action: 're-analyze affected modules'
    },
    'verify': {
      before: [],
      refreshOn: ['any'],
      action: 're-run affected tests'
    }
  }
};

/**
 * Context state tracker
 */
export class ContextTracker {
  constructor() {
    this.loadedFiles = new Map(); // file -> { content, loadedAt, checksum }
    this.discoveredFacts = [];
    this.assumptions = [];
    this.refreshCount = 0;
    this.lastRefresh = null;
  }

  trackLoad(filePath, content) {
    this.loadedFiles.set(filePath, {
      content,
      loadedAt: new Date(),
      checksum: this.computeChecksum(content),
      lineCount: content.split('\n').length
    });
  }

  trackAssumption(assumption, source) {
    this.assumptions.push({
      text: assumption,
      source,
      madeAt: new Date(),
      validated: false
    });
  }

  trackDiscovery(fact, source) {
    this.discoveredFacts.push({
      fact,
      source,
      discoveredAt: new Date()
    });
  }

  async checkForChanges(projectPath = process.cwd()) {
    const changes = [];

    for (const [filePath, meta] of this.loadedFiles) {
      try {
        const fullPath = path.join(projectPath, filePath);
        const currentContent = await fs.readFile(fullPath, 'utf-8');
        const currentChecksum = this.computeChecksum(currentContent);

        if (currentChecksum !== meta.checksum) {
          changes.push({
            file: filePath,
            type: 'modified',
            oldLines: meta.lineCount,
            newLines: currentContent.split('\n').length
          });
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          changes.push({ file: filePath, type: 'deleted' });
        }
      }
    }

    return changes;
  }

  shouldRefresh(phase, feedback) {
    const checkpoint = REFRESH_CHECKPOINTS.feature[phase] ||
                      REFRESH_CHECKPOINTS.debug[phase];

    if (!checkpoint) return { shouldRefresh: false };

    const staleness = detectStaleness(feedback);

    if (!staleness.isStale) return { shouldRefresh: false };

    const matchesCheckpoint = checkpoint.refreshOn.includes('any') ||
      staleness.reasons.some(r => checkpoint.refreshOn.includes(r));

    return {
      shouldRefresh: matchesCheckpoint,
      reason: staleness.reasons.join(', '),
      action: checkpoint.action,
      filesToReload: checkpoint.before
    };
  }

  recordRefresh() {
    this.refreshCount++;
    this.lastRefresh = new Date();
  }

  getStats() {
    return {
      loadedFiles: this.loadedFiles.size,
      assumptions: this.assumptions.length,
      validatedAssumptions: this.assumptions.filter(a => a.validated).length,
      discoveries: this.discoveredFacts.length,
      refreshCount: this.refreshCount,
      lastRefresh: this.lastRefresh
    };
  }

  computeChecksum(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  toJSON() {
    return {
      loadedFiles: Array.from(this.loadedFiles.entries()).map(([k, v]) => ({
        path: k,
        loadedAt: v.loadedAt,
        lines: v.lineCount
      })),
      assumptions: this.assumptions,
      discoveries: this.discoveredFacts,
      stats: this.getStats()
    };
  }
}

/**
 * Generate refresh instructions for Claude
 */
export function generateRefreshInstructions(refreshResult, currentPhase) {
  if (!refreshResult.shouldRefresh) {
    return null;
  }

  const instructions = [];

  instructions.push(`## Context Refresh Required`);
  instructions.push(`**Reason**: ${refreshResult.reason}`);
  instructions.push(`**Action**: ${refreshResult.action}`);
  instructions.push('');

  if (refreshResult.filesToReload.length > 0) {
    instructions.push('### Files to Reload:');
    refreshResult.filesToReload.forEach(f => {
      instructions.push(`- \`.claude/context/${f}\``);
    });
    instructions.push('');
  }

  instructions.push('### Refresh Steps:');
  instructions.push('1. Re-grep codebase for keywords related to current error');
  instructions.push('2. Update knowledge.md with new findings if significant');
  instructions.push('3. Continue with refreshed context');
  instructions.push('');
  instructions.push('**NOTE**: Do not ask user for confirmation - refresh automatically.');

  return instructions.join('\n');
}

/**
 * Create checkpoint marker for workflow state
 */
export function createCheckpoint(phase, context) {
  return {
    phase,
    timestamp: new Date().toISOString(),
    contextSnapshot: {
      loadedFiles: context?.loadedFiles ? Array.from(context.loadedFiles.keys()) : [],
      assumptionCount: context?.assumptions?.length || 0
    },
    canResumeFrom: true
  };
}
