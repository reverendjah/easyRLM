import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Always sync system files (settings.json, scripts/) - these are not user data
async function syncSystemFiles() {
  const cwd = process.cwd();
  const templatesDir = path.join(__dirname, '..', 'templates', '.claude');
  const scriptsTemplateDir = path.join(__dirname, '..', 'templates', 'scripts');
  let updated = [];

  // Always update settings.json (hooks configuration)
  const templateSettings = path.join(templatesDir, 'settings.json');
  const targetSettings = path.join(cwd, '.claude', 'settings.json');
  if (await fs.pathExists(templateSettings)) {
    const templateContent = await fs.readFile(templateSettings, 'utf-8');
    let needsUpdate = true;

    if (await fs.pathExists(targetSettings)) {
      const currentContent = await fs.readFile(targetSettings, 'utf-8');
      needsUpdate = currentContent !== templateContent;
    }

    if (needsUpdate) {
      await fs.copy(templateSettings, targetSettings, { overwrite: true });
      updated.push('settings.json');
    }
  }

  // Always update scripts/ (hook scripts)
  const targetScriptsDir = path.join(cwd, 'scripts');
  if (await fs.pathExists(scriptsTemplateDir)) {
    await fs.ensureDir(targetScriptsDir);
    const scriptFiles = await fs.readdir(scriptsTemplateDir);

    for (const file of scriptFiles) {
      if (!file.endsWith('.sh')) continue;

      const srcFile = path.join(scriptsTemplateDir, file);
      const destFile = path.join(targetScriptsDir, file);
      const templateContent = await fs.readFile(srcFile, 'utf-8');
      let needsUpdate = true;

      if (await fs.pathExists(destFile)) {
        const currentContent = await fs.readFile(destFile, 'utf-8');
        needsUpdate = currentContent !== templateContent;
      }

      if (needsUpdate) {
        await fs.copy(srcFile, destFile, { overwrite: true });
        await fs.chmod(destFile, 0o755);
        updated.push(`scripts/${file}`);
      }
    }
  }

  return updated;
}

export async function validate() {
  const cwd = process.cwd();
  let allPassed = true;

  // Always sync system files first
  const updatedFiles = await syncSystemFiles();
  if (updatedFiles.length > 0) {
    console.log(chalk.green(`  ✓ System files synced: ${updatedFiles.join(', ')}`));
  }

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
