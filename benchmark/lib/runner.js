// Benchmark Runner - Core execution engine
import { performance } from 'perf_hooks';

export class BenchmarkRunner {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 60000,
      verbose: options.verbose || false
    };
    this.results = [];
  }

  async run(benchmark) {
    const results = {
      name: benchmark.name,
      totalQueries: benchmark.queries.length,
      passed: 0,
      failed: 0,
      errors: [],
      metrics: {
        accuracy: 0,
        avgLatency: 0,
        totalTokens: 0,
        cost: 0
      },
      details: []
    };

    const latencies = [];
    const startTime = performance.now();

    for (let i = 0; i < benchmark.queries.length; i++) {
      const query = benchmark.queries[i];

      if (this.options.verbose) {
        console.log(`  Query ${i + 1}/${benchmark.queries.length}: ${query.id}`);
      }

      const queryResult = await this.executeQuery(benchmark, query);
      results.details.push(queryResult);

      if (queryResult.passed) {
        results.passed++;
      } else {
        results.failed++;
        if (queryResult.error) {
          results.errors.push({ id: query.id, error: queryResult.error });
        }
      }

      latencies.push(queryResult.latency);
      results.metrics.totalTokens += queryResult.tokens || 0;
    }

    results.metrics.accuracy = (results.passed / results.totalQueries) * 100;
    results.metrics.avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    results.metrics.totalTime = performance.now() - startTime;
    results.metrics.cost = this.calculateCost(results.metrics.totalTokens);

    return results;
  }

  async executeQuery(benchmark, query) {
    const startTime = performance.now();

    const result = {
      id: query.id,
      passed: false,
      expected: query.expected,
      actual: null,
      latency: 0,
      tokens: 0,
      error: null
    };

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        const response = await this.adapter.query(
          benchmark.context,
          query.prompt,
          { timeout: this.options.timeout }
        );

        result.actual = response.answer;
        result.tokens = response.tokens || 0;
        result.passed = benchmark.evaluate(query.expected, response.answer);
        result.latency = performance.now() - startTime;

        break;
      } catch (error) {
        if (attempt === this.options.maxRetries - 1) {
          result.error = error.message;
          result.latency = performance.now() - startTime;
        }
      }
    }

    return result;
  }

  calculateCost(tokens) {
    // Claude pricing: $15 per 1M input tokens, $75 per 1M output tokens (Opus)
    // Approximate as average: $45 per 1M tokens
    return (tokens / 1_000_000) * 45;
  }
}

export function createRunner(adapter, options) {
  return new BenchmarkRunner(adapter, options);
}
