import fs from 'fs-extra';
import path from 'path';

const REQUIRED_FILES = [
  '.claude/CLAUDE.md',
  '.claude/ARCHITECTURE.md',
  '.claude/commands/feature.md',
  '.claude/commands/debug.md',
  '.claude/commands/gate.md',
  '.claude/commands/index.md',
  '.claude/agents/code-reviewer.md',
  '.claude/agents/test-fixer.md',
  '.claude/context/project.md',
  '.claude/context/current.md',
  '.claude/context/knowledge.md',
  '.claude/context/architecture.md',
  '.claude/context/patterns.md',
  '.claude/settings.json',
  'scripts/load-context.sh',
  'scripts/extract-decisions.sh',
  'scripts/save-context.sh',
  'scripts/init-context.sh'
];

export async function detect() {
  const cwd = process.cwd();
  const state = {
    status: 'NEW',
    projectType: null,
    currentVersion: null,
    missingFiles: [],
    hasClaude: false,
    hasClaudeMd: false
  };

  // Detect project type
  if (await fs.pathExists(path.join(cwd, 'package.json'))) {
    state.projectType = 'node';
  } else if (await fs.pathExists(path.join(cwd, 'pyproject.toml')) ||
             await fs.pathExists(path.join(cwd, 'requirements.txt'))) {
    state.projectType = 'python';
  } else if (await fs.pathExists(path.join(cwd, 'go.mod'))) {
    state.projectType = 'go';
  } else if (await fs.pathExists(path.join(cwd, 'Cargo.toml'))) {
    state.projectType = 'rust';
  } else {
    state.projectType = 'unknown';
  }

  // Check if .claude exists
  state.hasClaude = await fs.pathExists(path.join(cwd, '.claude'));
  state.hasClaudeMd = await fs.pathExists(path.join(cwd, '.claude', 'CLAUDE.md'));

  if (!state.hasClaude) {
    state.status = 'NEW';
    return state;
  }

  // Check for missing files
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(cwd, file);
    if (!await fs.pathExists(filePath)) {
      state.missingFiles.push(file);
    }
  }

  if (state.missingFiles.length > 0) {
    state.status = 'BROKEN';
    return state;
  }

  // Check version (look for marker in ARCHITECTURE.md)
  try {
    const archContent = await fs.readFile(
      path.join(cwd, '.claude', 'ARCHITECTURE.md'),
      'utf-8'
    );

    // Look for Easy RLM section
    if (!archContent.includes('Easy RLM') && !archContent.includes('Kakaroto Fields')) {
      state.status = 'OUTDATED';
      state.currentVersion = '0.x';
    } else {
      state.status = 'OK';
      state.currentVersion = '1.0.0';
    }
  } catch {
    state.status = 'BROKEN';
  }

  return state;
}
