import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { merge } from './merger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function install(state) {
  const cwd = process.cwd();
  const templatesDir = path.join(__dirname, '..', 'templates', '.claude');

  try {
    // Create backup if .claude exists
    if (state.hasClaude) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupDir = path.join(cwd, `.claude.backup.${timestamp}`);
      await fs.copy(path.join(cwd, '.claude'), backupDir);
      console.log(chalk.gray(`  Backup created: .claude.backup.${timestamp}/`));
    }

    // Create .claude directory if doesn't exist
    await fs.ensureDir(path.join(cwd, '.claude'));

    // Copy all template files
    const dirs = ['commands', 'agents', 'context', 'templates'];

    for (const dir of dirs) {
      const srcDir = path.join(templatesDir, dir);
      const destDir = path.join(cwd, '.claude', dir);

      if (await fs.pathExists(srcDir)) {
        // For context, only copy if doesn't exist (preserve user data)
        if (dir === 'context' && await fs.pathExists(destDir)) {
          console.log(chalk.gray(`  ○ ${dir}/ preserved (existing data)`));
          continue;
        }

        await fs.copy(srcDir, destDir, { overwrite: true });
        console.log(chalk.green(`  ✓ ${dir}/`));
      }
    }

    // Handle CLAUDE.md with merge
    const templateClaudeMd = path.join(templatesDir, 'CLAUDE.md');
    const targetClaudeMd = path.join(cwd, '.claude', 'CLAUDE.md');

    if (state.hasClaudeMd) {
      // Merge existing with template
      const existing = await fs.readFile(targetClaudeMd, 'utf-8');
      const template = await fs.readFile(templateClaudeMd, 'utf-8');
      const merged = merge(existing, template);
      await fs.writeFile(targetClaudeMd, merged);
      console.log(chalk.green(`  ✓ CLAUDE.md (merged)`));
    } else {
      await fs.copy(templateClaudeMd, targetClaudeMd);
      console.log(chalk.green(`  ✓ CLAUDE.md`));
    }

    // Copy ARCHITECTURE.md
    const templateArch = path.join(templatesDir, 'ARCHITECTURE.md');
    const targetArch = path.join(cwd, '.claude', 'ARCHITECTURE.md');
    await fs.copy(templateArch, targetArch, { overwrite: true });
    console.log(chalk.green(`  ✓ ARCHITECTURE.md`));

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
