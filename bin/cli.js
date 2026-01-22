#!/usr/bin/env node

import chalk from 'chalk';
import { detect } from '../lib/detector.js';
import { install } from '../lib/installer.js';
import { update } from '../lib/updater.js';
import { fix } from '../lib/fixer.js';
import { validate } from '../lib/validator.js';

const VERSION = '1.4.1';

async function main() {
  console.log(chalk.cyan(`\nEasy RLM v${VERSION}`));
  console.log(chalk.cyan('─'.repeat(20)));

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
        console.log(chalk.yellow(`\nUpdating Easy RLM (${state.currentVersion} → ${VERSION})...`));
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
        console.log(chalk.green('\nEasy RLM already configured!'));
        result = await validate();
        break;

      default:
        console.log(chalk.red('\nUnknown state detected'));
        process.exit(1);
    }

    // Phase 3: Report
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
