import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const REQUIRED_FILES = [
  // Core
  '.claude/CLAUDE.md',
  '.claude/ARCHITECTURE.md',

  // Orchestrators
  '.claude/commands/feature.md',
  '.claude/commands/debug.md',
  '.claude/commands/gate.md',

  // Feature phases
  '.claude/commands/feature/01-understand.md',
  '.claude/commands/feature/02-analyze.md',
  '.claude/commands/feature/03-strategy.md',
  '.claude/commands/feature/04-red.md',
  '.claude/commands/feature/05-green.md',
  '.claude/commands/feature/06-quality.md',
  '.claude/commands/feature/07-validation.md',
  '.claude/commands/feature/08-delivery.md',
  '.claude/commands/feature/09-evaluate.md',

  // Debug phases
  '.claude/commands/debug/01-reproduce.md',
  '.claude/commands/debug/02-investigate.md',
  '.claude/commands/debug/03-fix.md',
  '.claude/commands/debug/04-verify.md',
  '.claude/commands/debug/05-commit.md',
  '.claude/commands/debug/06-evaluate.md',

  // Agents
  '.claude/agents/code-reviewer.md',
  '.claude/agents/code-simplifier.md',
  '.claude/agents/context-indexer.md',
  '.claude/agents/context-manager.md',
  '.claude/agents/functional-validator.md',
  '.claude/agents/memory-sync.md',
  '.claude/agents/terraform-validator.md',
  '.claude/agents/test-fixer.md',

  // Context
  '.claude/context/project.md',
  '.claude/context/architecture.md',
  '.claude/context/patterns.md',
  '.claude/context/knowledge.md',
  '.claude/context/current.md'
];

const REQUIRED_SECTIONS = [
  'Autonomy',
  'Workflows',
  'Code',
  'Tests',
  'Context (RLM)',
  'Workflow Recovery'
];

export async function validate() {
  const cwd = process.cwd();
  let allPassed = true;

  // Check files
  let fileCount = 0;
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(cwd, file);
    if (await fs.pathExists(filePath)) {
      fileCount++;
    } else {
      allPassed = false;
    }
  }

  console.log(chalk.gray(`  Files: ${fileCount}/${REQUIRED_FILES.length}`));

  // Check CLAUDE.md sections
  let sectionCount = 0;
  try {
    const claudeMd = await fs.readFile(
      path.join(cwd, '.claude', 'CLAUDE.md'),
      'utf-8'
    );

    for (const section of REQUIRED_SECTIONS) {
      if (claudeMd.includes(`## ${section}`) || claudeMd.includes(section)) {
        sectionCount++;
      }
    }
  } catch {
    // File doesn't exist
  }

  console.log(chalk.gray(`  Sections: ${sectionCount}/${REQUIRED_SECTIONS.length}`));

  if (allPassed && sectionCount === REQUIRED_SECTIONS.length) {
    return { success: true };
  } else {
    return {
      success: true, // Still return success for status OK
      warnings: [
        `Missing ${REQUIRED_FILES.length - fileCount} files`,
        `Missing ${REQUIRED_SECTIONS.length - sectionCount} sections`
      ].filter(w => !w.includes('0'))
    };
  }
}
