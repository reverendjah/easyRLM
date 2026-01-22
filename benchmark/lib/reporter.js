// Benchmark Reporter - Output formatting and comparison

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export class BenchmarkReporter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './benchmark/results';
    this.format = options.format || 'console';
  }

  report(results, comparison = null) {
    switch (this.format) {
      case 'console':
        return this.consoleReport(results, comparison);
      case 'json':
        return this.jsonReport(results, comparison);
      case 'markdown':
        return this.markdownReport(results, comparison);
      default:
        return this.consoleReport(results, comparison);
    }
  }

  consoleReport(results, comparison) {
    console.log('\n' + chalk.cyan('=' .repeat(60)));
    console.log(chalk.cyan.bold('  BENCHMARK RESULTS'));
    console.log(chalk.cyan('=' .repeat(60)));

    for (const result of results) {
      console.log(chalk.yellow(`\n  ${result.name}`));
      console.log(chalk.gray('  ' + '-'.repeat(40)));

      const accuracy = result.metrics.accuracy.toFixed(1);
      const accuracyColor = result.metrics.accuracy >= 80 ? 'green' :
                           result.metrics.accuracy >= 50 ? 'yellow' : 'red';

      console.log(`  Accuracy:    ${chalk[accuracyColor](accuracy + '%')}`);
      console.log(`  Passed:      ${chalk.green(result.passed)}/${result.totalQueries}`);
      console.log(`  Avg Latency: ${chalk.gray((result.metrics.avgLatency / 1000).toFixed(2) + 's')}`);
      console.log(`  Tokens:      ${chalk.gray(result.metrics.totalTokens.toLocaleString())}`);
      console.log(`  Est. Cost:   ${chalk.gray('$' + result.metrics.cost.toFixed(4))}`);

      if (result.errors.length > 0) {
        console.log(chalk.red(`\n  Errors (${result.errors.length}):`));
        result.errors.slice(0, 3).forEach(e => {
          console.log(chalk.red(`    - ${e.id}: ${e.error}`));
        });
        if (result.errors.length > 3) {
          console.log(chalk.red(`    ... and ${result.errors.length - 3} more`));
        }
      }
    }

    if (comparison) {
      this.printComparison(comparison);
    }

    console.log('\n' + chalk.cyan('=' .repeat(60)) + '\n');
  }

  printComparison(comparison) {
    console.log(chalk.magenta('\n  COMPARISON: Base vs RLM'));
    console.log(chalk.gray('  ' + '-'.repeat(40)));

    for (const [benchmark, data] of Object.entries(comparison)) {
      const improvement = data.rlm.accuracy - data.base.accuracy;
      const improvementStr = improvement > 0 ?
        chalk.green(`+${improvement.toFixed(1)}%`) :
        chalk.red(`${improvement.toFixed(1)}%`);

      console.log(`\n  ${chalk.yellow(benchmark)}`);
      console.log(`    Base:        ${data.base.accuracy.toFixed(1)}%`);
      console.log(`    RLM:         ${data.rlm.accuracy.toFixed(1)}%`);
      console.log(`    Improvement: ${improvementStr}`);

      if (data.base.accuracy > 0) {
        const multiplier = data.rlm.accuracy / data.base.accuracy;
        console.log(`    Multiplier:  ${chalk.cyan(multiplier.toFixed(2) + 'x')}`);
      }
    }
  }

  async jsonReport(results, comparison) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-${timestamp}.json`;

    await fs.ensureDir(this.outputDir);

    const report = {
      timestamp: new Date().toISOString(),
      results,
      comparison,
      summary: this.generateSummary(results, comparison)
    };

    const filepath = path.join(this.outputDir, filename);
    await fs.writeJson(filepath, report, { spaces: 2 });

    console.log(chalk.green(`\nResults saved to: ${filepath}`));
    return filepath;
  }

  async markdownReport(results, comparison) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-${timestamp}.md`;

    await fs.ensureDir(this.outputDir);

    let md = `# Benchmark Results\n\n`;
    md += `**Date:** ${new Date().toISOString()}\n\n`;

    md += `## Summary\n\n`;
    md += `| Benchmark | Accuracy | Passed | Tokens | Cost |\n`;
    md += `|-----------|----------|--------|--------|------|\n`;

    for (const result of results) {
      md += `| ${result.name} | ${result.metrics.accuracy.toFixed(1)}% | ${result.passed}/${result.totalQueries} | ${result.metrics.totalTokens.toLocaleString()} | $${result.metrics.cost.toFixed(4)} |\n`;
    }

    if (comparison) {
      md += `\n## Base vs RLM Comparison\n\n`;
      md += `| Benchmark | Base | RLM | Improvement |\n`;
      md += `|-----------|------|-----|-------------|\n`;

      for (const [benchmark, data] of Object.entries(comparison)) {
        const improvement = data.rlm.accuracy - data.base.accuracy;
        md += `| ${benchmark} | ${data.base.accuracy.toFixed(1)}% | ${data.rlm.accuracy.toFixed(1)}% | ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}% |\n`;
      }
    }

    md += `\n## Detailed Results\n\n`;

    for (const result of results) {
      md += `### ${result.name}\n\n`;
      md += `- Total queries: ${result.totalQueries}\n`;
      md += `- Passed: ${result.passed}\n`;
      md += `- Failed: ${result.failed}\n`;
      md += `- Average latency: ${(result.metrics.avgLatency / 1000).toFixed(2)}s\n\n`;

      if (result.errors.length > 0) {
        md += `**Errors:**\n`;
        result.errors.forEach(e => {
          md += `- ${e.id}: ${e.error}\n`;
        });
        md += `\n`;
      }
    }

    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, md);

    console.log(chalk.green(`\nResults saved to: ${filepath}`));
    return filepath;
  }

  generateSummary(results, comparison) {
    const totalQueries = results.reduce((sum, r) => sum + r.totalQueries, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.metrics.totalTokens, 0);
    const totalCost = results.reduce((sum, r) => sum + r.metrics.cost, 0);

    return {
      totalBenchmarks: results.length,
      totalQueries,
      totalPassed,
      overallAccuracy: (totalPassed / totalQueries) * 100,
      totalTokens,
      totalCost,
      improvementOverBase: comparison ?
        Object.values(comparison).reduce((sum, c) =>
          sum + (c.rlm.accuracy - c.base.accuracy), 0) / Object.keys(comparison).length :
        null
    };
  }
}

export function createReporter(options) {
  return new BenchmarkReporter(options);
}
