#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import { detect } from '../lib/detector.js';
import { install } from '../lib/installer.js';
import { update } from '../lib/updater.js';
import { fix } from '../lib/fixer.js';
import { validate } from '../lib/validator.js';

const VERSION = '1.9.0';

// Initialize context if placeholders detected (idempotent)
async function initContext(cwd) {
  const initScript = `${cwd}/scripts/init-context.sh`;
  try {
    const result = execSync(`bash "${initScript}"`, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    // Show output for both project init and CLAUDE.md rebuild
    const lines = result.trim().split('\n').filter(l => l.length > 0);
    for (const line of lines) {
      if (line.includes('initialized:') || line.includes('rebuilt')) {
        console.log(chalk.green(`  ✓ ${line}`));
      }
    }
  } catch (e) {
    // Script not found or failed - not critical
  }
}

async function main() {
  console.log(chalk.cyan(`\nEasy RLM v${VERSION}`));
  console.log(chalk.cyan('─'.repeat(20)));

  const cwd = process.cwd();

  try {
    // Phase 1: Detect state
    console.log(chalk.gray('\nDetecting project state...'));
    const state = await detect();

    console.log(chalk.gray(`  Project type: ${state.projectType || 'unknown'}`));
    console.log(chalk.gray(`  State: ${state.status}`));

    // Phase 2: Execute action based on state
    let result;

    switch (state.status) {
      case 'NEW':
        console.log(chalk.yellow('\nInstalling Easy RLM...'));
        result = await install(state);
        // Always sync system files after install
        await validate();
        break;

      case 'OUTDATED':
        console.log(chalk.yellow(`\nUpdating Easy RLM...`));
        result = await update(state);
        // Always sync system files after update
        await validate();
        break;

      case 'BROKEN':
        console.log(chalk.yellow('\nRestoring missing files...'));
        result = await fix(state);
        // Always sync system files after fix
        await validate();
        break;

      case 'OK':
        console.log(chalk.green('\nEasy RLM configured!'));
        result = await validate();
        break;

      default:
        console.log(chalk.red('\nUnknown state detected'));
        process.exit(1);
    }

    // Phase 3: ALWAYS try to initialize context (idempotent)
    // This ensures placeholders are replaced with real project data
    await initContext(cwd);

    // Phase 4: Report
    if (result.success) {
      console.log(chalk.green('\n✓ Easy RLM ready!'));
      console.log(chalk.gray('  Use /feature or /debug in Claude Code.\n'));
    } else {
      console.log(chalk.red('\n✗ Installation failed'));
      console.log(chalk.red(`  ${result.error}\n`));
      process.exit(1);
    }

  } catch (error) {
    console.log(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

main();
