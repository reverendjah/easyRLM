#!/usr/bin/env node

/**
 * Easy RLM Benchmark CLI
 *
 * Compares base Claude vs Claude with RLM patterns across standard benchmarks.
 *
 * Usage:
 *   node benchmark/bin/benchmark.js --benchmark oolong --adapter both
 *   node benchmark/bin/benchmark.js --benchmark all --adapter rlm --output json
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { createRunner } from '../lib/runner.js';
import { createReporter } from '../lib/reporter.js';
import { createBaseAdapter } from '../adapters/claude-base.js';
import { createRLMAdapter } from '../adapters/claude-rlm.js';
import * as benchmarks from '../benchmarks/index.js';

const program = new Command();

program
  .name('benchmark')
  .description('Easy RLM Benchmark Suite - Compare base vs RLM performance')
  .version('1.0.0')
  .option('-b, --benchmark <name>', 'Benchmark to run (sniah, oolong, oolong-pairs, codeqa, project-understanding, context-recovery, multi-session, all, practical)', 'all')
  .option('-a, --adapter <type>', 'Adapter to use (base, rlm, both)', 'both')
  .option('-o, --output <format>', 'Output format (console, json, markdown)', 'console')
  .option('-v, --verbose', 'Verbose output')
  .option('--size <size>', 'Benchmark size (small, medium, large)', 'medium')
  .option('--timeout <ms>', 'Query timeout in milliseconds', '60000')
  .option('--dry-run', 'Show what would be run without executing')
  .parse(process.argv);

const options = program.opts();

async function main() {
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('  Easy RLM Benchmark Suite'));
  console.log(chalk.cyan('='.repeat(60)));
  console.log(chalk.gray(`\n  Benchmark: ${options.benchmark}`));
  console.log(chalk.gray(`  Adapter:   ${options.adapter}`));
  console.log(chalk.gray(`  Size:      ${options.size}`));
  console.log(chalk.gray(`  Output:    ${options.output}\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] No actual queries will be executed.\n'));
    return;
  }

  // Create adapters
  const adapters = {};
  const timeout = parseInt(options.timeout);

  if (options.adapter === 'base' || options.adapter === 'both') {
    adapters.base = createBaseAdapter({ timeout });
  }
  if (options.adapter === 'rlm' || options.adapter === 'both') {
    adapters.rlm = createRLMAdapter({ timeout });
  }

  // Select benchmarks
  const benchmarksToRun = [];

  // Paper benchmarks (from RLM paper)
  const paperBenchmarks = [
    { name: 'S-NIAH', create: () => benchmarks.sniah.createBenchmark({ size: options.size }) },
    { name: 'OOLONG', create: () => benchmarks.oolong.createBenchmark({ sections: options.size === 'large' ? 50 : 30 }) },
    { name: 'OOLONG-Pairs', create: () => benchmarks.oolongPairs.createBenchmark({ numItems: options.size === 'large' ? 100 : 50 }) },
    { name: 'CodeQA', create: () => benchmarks.codeqa.createBenchmark({ numFiles: options.size === 'large' ? 50 : 20 }) }
  ];

  // Practical benchmarks (Easy RLM specific - test real-world value)
  const practicalBenchmarks = [
    { name: 'Project Understanding', create: () => benchmarks.projectUnderstanding.createBenchmark() },
    { name: 'Context Recovery', create: () => benchmarks.contextRecovery.createBenchmark() },
    { name: 'Multi-Session', create: () => benchmarks.multiSession.createBenchmark() }
  ];

  if (options.benchmark === 'all') {
    benchmarksToRun.push(...paperBenchmarks, ...practicalBenchmarks);
  } else if (options.benchmark === 'practical') {
    // Run only practical benchmarks (recommended for proving Easy RLM value)
    benchmarksToRun.push(...practicalBenchmarks);
  } else if (options.benchmark === 'paper') {
    // Run only paper benchmarks
    benchmarksToRun.push(...paperBenchmarks);
  } else {
    const benchmarkMap = {
      // Paper benchmarks
      'sniah': paperBenchmarks[0],
      's-niah': paperBenchmarks[0],
      'oolong': paperBenchmarks[1],
      'oolong-pairs': paperBenchmarks[2],
      'codeqa': paperBenchmarks[3],
      // Practical benchmarks
      'project-understanding': practicalBenchmarks[0],
      'context-recovery': practicalBenchmarks[1],
      'multi-session': practicalBenchmarks[2]
    };

    const selected = benchmarkMap[options.benchmark.toLowerCase()];
    if (!selected) {
      console.error(chalk.red(`Unknown benchmark: ${options.benchmark}`));
      console.error(chalk.gray('Available: sniah, oolong, oolong-pairs, codeqa, project-understanding, context-recovery, multi-session'));
      console.error(chalk.gray('Groups: all, paper, practical'));
      process.exit(1);
    }
    benchmarksToRun.push(selected);
  }

  // Run benchmarks
  const allResults = [];
  const comparison = {};

  for (const benchmarkDef of benchmarksToRun) {
    console.log(chalk.yellow(`\nRunning: ${benchmarkDef.name}`));
    console.log(chalk.gray('-'.repeat(40)));

    const benchmark = benchmarkDef.create();

    for (const [adapterName, adapter] of Object.entries(adapters)) {
      console.log(chalk.gray(`  Adapter: ${adapterName}`));

      const runner = createRunner(adapter, {
        timeout,
        verbose: options.verbose
      });

      try {
        const result = await runner.run(benchmark);
        result.adapter = adapterName;
        allResults.push(result);

        // Store for comparison
        if (!comparison[benchmarkDef.name]) {
          comparison[benchmarkDef.name] = {};
        }
        comparison[benchmarkDef.name][adapterName] = {
          accuracy: result.metrics.accuracy,
          tokens: result.metrics.totalTokens,
          cost: result.metrics.cost
        };

        console.log(chalk.gray(`    Accuracy: ${result.metrics.accuracy.toFixed(1)}%`));
      } catch (error) {
        console.error(chalk.red(`    Error: ${error.message}`));
      }
    }
  }

  // Generate report
  const reporter = createReporter({
    format: options.output,
    outputDir: './benchmark/results'
  });

  const comparisonData = options.adapter === 'both' ? comparison : null;
  await reporter.report(allResults, comparisonData);

  // Summary
  if (options.adapter === 'both' && Object.keys(comparison).length > 0) {
    console.log(chalk.magenta('\n  === IMPROVEMENT SUMMARY ==='));

    for (const [bench, data] of Object.entries(comparison)) {
      if (data.base && data.rlm) {
        const improvement = data.rlm.accuracy - data.base.accuracy;
        const multiplier = data.base.accuracy > 0 ?
          (data.rlm.accuracy / data.base.accuracy).toFixed(2) : '∞';

        const color = improvement > 0 ? 'green' : 'red';
        console.log(chalk.gray(`  ${bench}: `) +
          chalk[color](`${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`) +
          chalk.gray(` (${multiplier}x)`));
      }
    }
  }

  console.log('');
}

main().catch(error => {
  console.error(chalk.red(`\nFatal error: ${error.message}`));
  process.exit(1);
});
