// Auto-Decomposition Module - RLM-style context decomposition
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

/**
 * RLM Paper Reference:
 * - Context > 50K tokens: Decompose into sub-tasks
 * - Context > 100K tokens: Recursive decomposition
 * - Maximum 5 parallel sub-tasks per level
 */

// Token estimation constants
const CHARS_PER_TOKEN = 4;
const TOKENS_THRESHOLD_CHUNKED = 50000;
const TOKENS_THRESHOLD_RECURSIVE = 100000;
const MAX_PARALLEL_TASKS = 5;

/**
 * Analyze project and determine decomposition strategy
 */
export async function analyzeProject(projectPath = process.cwd()) {
  const analysis = {
    path: projectPath,
    totalFiles: 0,
    totalLines: 0,
    estimatedTokens: 0,
    filesByType: {},
    directories: [],
    strategy: 'direct',
    decomposition: null
  };

  // Find all code files
  const codePatterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.go', '**/*.rs', '**/*.java'];
  const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/build/**', '**/__pycache__/**'];

  try {
    const files = await glob(codePatterns, {
      cwd: projectPath,
      ignore: ignorePatterns,
      nodir: true
    });

    analysis.totalFiles = files.length;

    // Analyze each file
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').length;
        const tokens = Math.ceil(content.length / CHARS_PER_TOKEN);

        analysis.totalLines += lines;
        analysis.estimatedTokens += tokens;

        // Track by extension
        const ext = path.extname(file) || 'other';
        if (!analysis.filesByType[ext]) {
          analysis.filesByType[ext] = { count: 0, tokens: 0 };
        }
        analysis.filesByType[ext].count++;
        analysis.filesByType[ext].tokens += tokens;

        // Track directories
        const dir = path.dirname(file);
        if (dir !== '.' && !analysis.directories.includes(dir)) {
          analysis.directories.push(dir);
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch (error) {
    console.error('Error analyzing project:', error.message);
  }

  // Determine strategy
  if (analysis.estimatedTokens < TOKENS_THRESHOLD_CHUNKED) {
    analysis.strategy = 'direct';
  } else if (analysis.estimatedTokens < TOKENS_THRESHOLD_RECURSIVE) {
    analysis.strategy = 'chunked';
    analysis.decomposition = createChunkedDecomposition(analysis);
  } else {
    analysis.strategy = 'recursive';
    analysis.decomposition = createRecursiveDecomposition(analysis);
  }

  return analysis;
}

/**
 * Create chunked decomposition for medium codebases
 */
function createChunkedDecomposition(analysis) {
  const chunks = [];
  const sortedDirs = analysis.directories.sort();

  // Group directories into chunks of roughly equal token count
  const targetTokensPerChunk = analysis.estimatedTokens / MAX_PARALLEL_TASKS;
  let currentChunk = { directories: [], estimatedTokens: 0 };

  for (const dir of sortedDirs) {
    currentChunk.directories.push(dir);
    // Rough estimate based on directory distribution
    currentChunk.estimatedTokens += analysis.estimatedTokens / analysis.directories.length;

    if (currentChunk.estimatedTokens >= targetTokensPerChunk && chunks.length < MAX_PARALLEL_TASKS - 1) {
      chunks.push(currentChunk);
      currentChunk = { directories: [], estimatedTokens: 0 };
    }
  }

  if (currentChunk.directories.length > 0) {
    chunks.push(currentChunk);
  }

  return {
    type: 'chunked',
    chunks,
    parallelTasks: chunks.length
  };
}

/**
 * Create recursive decomposition for large codebases
 */
function createRecursiveDecomposition(analysis) {
  // Group by top-level directories first
  const topLevelDirs = [...new Set(
    analysis.directories.map(d => d.split('/')[0] || d.split('\\')[0])
  )];

  const levels = [{
    directories: topLevelDirs,
    depth: 0,
    subLevels: []
  }];

  // If any top-level dir has > threshold tokens, mark for sub-decomposition
  for (const dir of topLevelDirs) {
    const subDirs = analysis.directories.filter(d => d.startsWith(dir + '/') || d.startsWith(dir + '\\'));
    if (subDirs.length > MAX_PARALLEL_TASKS) {
      levels[0].subLevels.push({
        parent: dir,
        directories: subDirs,
        depth: 1
      });
    }
  }

  return {
    type: 'recursive',
    levels,
    maxDepth: levels[0].subLevels.length > 0 ? 2 : 1,
    parallelTasks: Math.min(topLevelDirs.length, MAX_PARALLEL_TASKS)
  };
}

/**
 * Generate decomposition plan for Claude Code
 */
export function generateDecompositionPlan(analysis, task) {
  if (analysis.strategy === 'direct') {
    return {
      strategy: 'direct',
      instructions: 'Load context directly - codebase is small enough.',
      estimatedTokens: analysis.estimatedTokens
    };
  }

  const plan = {
    strategy: analysis.strategy,
    estimatedTokens: analysis.estimatedTokens,
    steps: []
  };

  if (analysis.strategy === 'chunked') {
    plan.instructions = 'Decompose into parallel sub-tasks by directory groups.';

    analysis.decomposition.chunks.forEach((chunk, i) => {
      plan.steps.push({
        step: i + 1,
        type: 'parallel',
        scope: chunk.directories,
        task: `Analyze ${chunk.directories.join(', ')} for: ${task}`,
        estimatedTokens: chunk.estimatedTokens
      });
    });

    plan.steps.push({
      step: analysis.decomposition.chunks.length + 1,
      type: 'aggregate',
      task: 'Synthesize findings from all chunks into final answer'
    });
  }

  if (analysis.strategy === 'recursive') {
    plan.instructions = 'Use recursive RLM decomposition - codebase too large for single pass.';

    const level = analysis.decomposition.levels[0];
    level.directories.forEach((dir, i) => {
      plan.steps.push({
        step: i + 1,
        type: 'recursive',
        scope: [dir],
        task: `Deep-analyze ${dir}/ for: ${task}`,
        mayDecomposeFurther: level.subLevels.some(s => s.parent === dir)
      });
    });

    plan.steps.push({
      step: level.directories.length + 1,
      type: 'aggregate',
      task: 'Recursively aggregate findings, starting from deepest level'
    });
  }

  return plan;
}

/**
 * Check if decomposition should be triggered
 */
export async function shouldDecompose(projectPath = process.cwd()) {
  const analysis = await analyzeProject(projectPath);

  return {
    shouldDecompose: analysis.strategy !== 'direct',
    reason: analysis.strategy === 'direct'
      ? `Codebase is small (${analysis.estimatedTokens} tokens)`
      : `Codebase requires ${analysis.strategy} decomposition (${analysis.estimatedTokens} tokens)`,
    analysis
  };
}

/**
 * Auto-decompose a task
 */
export async function autoDecompose(task, projectPath = process.cwd()) {
  const analysis = await analyzeProject(projectPath);
  const plan = generateDecompositionPlan(analysis, task);

  return {
    analysis,
    plan,
    execute: () => generateSubAgentCalls(plan)
  };
}

/**
 * Generate sub-agent call specifications
 */
function generateSubAgentCalls(plan) {
  if (plan.strategy === 'direct') {
    return null;
  }

  return plan.steps
    .filter(step => step.type !== 'aggregate')
    .map(step => ({
      agentType: 'Explore',
      prompt: step.task,
      scope: step.scope,
      parallel: step.type === 'parallel',
      mayNest: step.mayDecomposeFurther
    }));
}
