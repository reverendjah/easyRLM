import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function update(state) {
  const cwd = process.cwd();
  const templatesDir = path.join(__dirname, '..', 'templates', '.claude');
  const scriptsTemplateDir = path.join(__dirname, '..', 'templates', 'scripts');

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

    // Copy missing context files (preserve existing user data)
    const contextSrcDir = path.join(templatesDir, 'context');
    const contextDestDir = path.join(cwd, '.claude', 'context');
    await fs.ensureDir(contextDestDir);
    const contextFiles = await fs.readdir(contextSrcDir);
    let contextCopied = 0;
    for (const file of contextFiles) {
      const destFile = path.join(contextDestDir, file);
      if (!await fs.pathExists(destFile)) {
        await fs.copy(path.join(contextSrcDir, file), destFile);
        contextCopied++;
      }
    }
    if (contextCopied > 0) {
      console.log(chalk.green(`  ✓ context/ (${contextCopied} missing files added)`));
    } else {
      console.log(chalk.gray(`  ○ context/ preserved (all files present)`));
    }

    // Preserve CLAUDE.md
    console.log(chalk.gray(`  ○ CLAUDE.md preserved (user customizations)`));

    // Update settings.json (hooks configuration)
    const templateSettings = path.join(templatesDir, 'settings.json');
    const targetSettings = path.join(cwd, '.claude', 'settings.json');
    if (await fs.pathExists(templateSettings)) {
      await fs.copy(templateSettings, targetSettings, { overwrite: true });
      console.log(chalk.green(`  ✓ settings.json (hooks enabled)`));
    }

    // Update scripts/ directory for hooks
    const targetScriptsDir = path.join(cwd, 'scripts');
    if (await fs.pathExists(scriptsTemplateDir)) {
      await fs.ensureDir(targetScriptsDir);
      const scriptFiles = await fs.readdir(scriptsTemplateDir);
      for (const file of scriptFiles) {
        const srcFile = path.join(scriptsTemplateDir, file);
        const destFile = path.join(targetScriptsDir, file);
        await fs.copy(srcFile, destFile, { overwrite: true });
        await fs.chmod(destFile, 0o755);
      }
      console.log(chalk.green(`  ✓ scripts/ (${scriptFiles.length} hook scripts)`));
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
