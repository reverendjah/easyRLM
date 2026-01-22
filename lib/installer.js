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
  const scriptsTemplateDir = path.join(__dirname, '..', 'templates', 'scripts');

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
        // For context, copy missing files individually (preserve existing user data)
        if (dir === 'context' && await fs.pathExists(destDir)) {
          const templateFiles = await fs.readdir(srcDir);
          let copied = 0;
          for (const file of templateFiles) {
            const destFile = path.join(destDir, file);
            if (!await fs.pathExists(destFile)) {
              await fs.copy(path.join(srcDir, file), destFile);
              copied++;
            }
          }
          if (copied > 0) {
            console.log(chalk.green(`  ✓ ${dir}/ (${copied} missing files restored)`));
          } else {
            console.log(chalk.gray(`  ○ ${dir}/ (all files present)`));
          }
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

    // Copy settings.json (hooks configuration)
    const templateSettings = path.join(templatesDir, 'settings.json');
    const targetSettings = path.join(cwd, '.claude', 'settings.json');
    if (await fs.pathExists(templateSettings)) {
      await fs.copy(templateSettings, targetSettings, { overwrite: true });
      console.log(chalk.green(`  ✓ settings.json (hooks enabled)`));
    }

    // Copy scripts/ directory for hooks
    const targetScriptsDir = path.join(cwd, 'scripts');
    if (await fs.pathExists(scriptsTemplateDir)) {
      await fs.ensureDir(targetScriptsDir);
      const scriptFiles = await fs.readdir(scriptsTemplateDir);
      for (const file of scriptFiles) {
        const srcFile = path.join(scriptsTemplateDir, file);
        const destFile = path.join(targetScriptsDir, file);
        await fs.copy(srcFile, destFile, { overwrite: true });
        // Make scripts executable
        await fs.chmod(destFile, 0o755);
      }
      console.log(chalk.green(`  ✓ scripts/ (${scriptFiles.length} hook scripts)`));
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
