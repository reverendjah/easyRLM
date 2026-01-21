import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function update(state) {
  const cwd = process.cwd();
  const templatesDir = path.join(__dirname, '..', 'templates', '.claude');

  try {
    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(cwd, `.claude.backup.${timestamp}`);
    await fs.copy(path.join(cwd, '.claude'), backupDir);
    console.log(chalk.gray(`  Backup created: .claude.backup.${timestamp}/`));

    // Update commands and agents (always overwrite)
    const dirsToUpdate = ['commands', 'agents', 'templates'];

    for (const dir of dirsToUpdate) {
      const srcDir = path.join(templatesDir, dir);
      const destDir = path.join(cwd, '.claude', dir);

      if (await fs.pathExists(srcDir)) {
        await fs.copy(srcDir, destDir, { overwrite: true });
        console.log(chalk.green(`  ✓ ${dir}/ updated`));
      }
    }

    // Update ARCHITECTURE.md (always overwrite)
    const templateArch = path.join(templatesDir, 'ARCHITECTURE.md');
    const targetArch = path.join(cwd, '.claude', 'ARCHITECTURE.md');
    await fs.copy(templateArch, targetArch, { overwrite: true });
    console.log(chalk.green(`  ✓ ARCHITECTURE.md updated`));

    // Preserve context and CLAUDE.md
    console.log(chalk.gray(`  ○ context/ preserved (user data)`));
    console.log(chalk.gray(`  ○ CLAUDE.md preserved (user customizations)`));

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
