import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fix(state) {
  const cwd = process.cwd();
  const claudeTemplatesDir = path.join(__dirname, '..', 'templates', '.claude');
  const rootTemplatesDir = path.join(__dirname, '..', 'templates');

  try {
    console.log(chalk.gray(`  Missing files: ${state.missingFiles.length}`));

    for (const file of state.missingFiles) {
      let srcPath;

      // Handle different template locations
      if (file.startsWith('.claude/')) {
        srcPath = path.join(claudeTemplatesDir, file.replace('.claude/', ''));
      } else if (file.startsWith('scripts/')) {
        srcPath = path.join(rootTemplatesDir, file);
      } else {
        srcPath = path.join(claudeTemplatesDir, file);
      }

      const destPath = path.join(cwd, file);

      if (await fs.pathExists(srcPath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
        // Make scripts executable
        if (file.endsWith('.sh')) {
          await fs.chmod(destPath, 0o755);
        }
        console.log(chalk.green(`  ✓ Restored ${file}`));
      } else {
        console.log(chalk.yellow(`  ⚠ Template not found: ${file}`));
      }
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
}
