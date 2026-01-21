import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fix(state) {
  const cwd = process.cwd();
  const templatesDir = path.join(__dirname, '..', 'templates', '.claude');

  try {
    console.log(chalk.gray(`  Missing files: ${state.missingFiles.length}`));

    for (const file of state.missingFiles) {
      const srcPath = path.join(templatesDir, file.replace('.claude/', ''));
      const destPath = path.join(cwd, file);

      if (await fs.pathExists(srcPath)) {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(srcPath, destPath);
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
