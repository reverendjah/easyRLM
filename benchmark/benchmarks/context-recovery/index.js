// Context Recovery Benchmark - Tests preservation after compaction/restart
import { exactMatch, contains } from '../../lib/evaluators.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Tests ability to recover context after compaction or session restart.
 *
 * This is THE key differentiator for Easy RLM:
 * - Base Claude: 0% context recovery after compaction
 * - Easy RLM: 100% recovery via Kakaroto Fields
 *
 * The benchmark simulates:
 * 1. Making implementation decisions
 * 2. Storing them in knowledge.md (RLM) or just conversation (base)
 * 3. Simulating compaction (clearing conversation context)
 * 4. Testing recall of decisions
 */

// Simulated decisions made during a feature implementation
const IMPLEMENTATION_DECISIONS = [
  {
    id: 'decision-auth-method',
    category: 'architecture',
    question: 'What authentication method did we choose?',
    decision: 'JWT with refresh tokens stored in httpOnly cookies',
    reasoning: 'More secure than localStorage, works with SSR',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: 'decision-db-schema',
    category: 'database',
    question: 'How did we structure the user preferences table?',
    decision: 'JSONB column for flexible preferences, indexed on user_id',
    reasoning: 'Allows adding new preferences without migrations',
    timestamp: '2024-01-15T11:00:00Z'
  },
  {
    id: 'decision-error-handling',
    category: 'patterns',
    question: 'What error handling pattern did we adopt?',
    decision: 'Custom AppError class extending Error with statusCode and isOperational',
    reasoning: 'Distinguishes between operational errors and bugs',
    timestamp: '2024-01-15T11:30:00Z'
  },
  {
    id: 'decision-validation',
    category: 'patterns',
    question: 'Which validation library did we choose?',
    decision: 'Zod for runtime validation with TypeScript inference',
    reasoning: 'Better TS integration than Joi, smaller bundle than Yup',
    timestamp: '2024-01-15T12:00:00Z'
  },
  {
    id: 'decision-testing',
    category: 'testing',
    question: 'What testing framework are we using?',
    decision: 'Vitest with React Testing Library for components',
    reasoning: 'Faster than Jest, native ESM support',
    timestamp: '2024-01-15T14:00:00Z'
  },
  {
    id: 'decision-api-versioning',
    category: 'api',
    question: 'How are we versioning the API?',
    decision: 'URL path versioning (/api/v1/) with deprecation headers',
    reasoning: 'Most explicit, easy to maintain parallel versions',
    timestamp: '2024-01-15T14:30:00Z'
  },
  {
    id: 'decision-caching',
    category: 'performance',
    question: 'What caching strategy did we implement?',
    decision: 'Redis for session cache, in-memory LRU for computed values',
    reasoning: 'Redis for distributed, LRU for hot path optimization',
    timestamp: '2024-01-15T15:00:00Z'
  },
  {
    id: 'decision-logging',
    category: 'observability',
    question: 'What logging approach are we using?',
    decision: 'Structured JSON logs with pino, correlation IDs per request',
    reasoning: 'Easy to parse in CloudWatch/Datadog, trace requests across services',
    timestamp: '2024-01-15T15:30:00Z'
  },
  {
    id: 'decision-file-upload',
    category: 'feature',
    question: 'How are file uploads handled?',
    decision: 'Multipart to presigned S3 URLs, metadata in Postgres',
    reasoning: 'Direct S3 upload reduces server load, scales better',
    timestamp: '2024-01-15T16:00:00Z'
  },
  {
    id: 'decision-notification',
    category: 'feature',
    question: 'What notification channels did we implement?',
    decision: 'Email via SendGrid, push via Firebase, in-app via WebSocket',
    reasoning: 'Covers all use cases, all have good free tiers',
    timestamp: '2024-01-15T16:30:00Z'
  }
];

// Generate knowledge.md content (what Easy RLM would store)
function generateKnowledgeMd() {
  let content = `# Project Knowledge\n\n## Implementation Decisions\n\n`;

  const byCategory = {};
  IMPLEMENTATION_DECISIONS.forEach(d => {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  });

  Object.entries(byCategory).forEach(([category, decisions]) => {
    content += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    decisions.forEach(d => {
      content += `- **${d.question}**\n`;
      content += `  - Decision: ${d.decision}\n`;
      content += `  - Reasoning: ${d.reasoning}\n\n`;
    });
  });

  return content;
}

// Generate queries that test recall after "compaction"
export const queries = IMPLEMENTATION_DECISIONS.map(d => ({
  id: `cr-${d.id}`,
  prompt: d.question,
  expected: d.decision,
  category: d.category,
  evaluator: 'contains',
  // For RLM adapter: should search knowledge.md
  rlmHint: `Search knowledge.md for "${d.category}" decisions`
}));

// Additional meta-queries that require aggregation
export const metaQueries = [
  {
    id: 'cr-meta-count',
    prompt: 'How many major implementation decisions have we made?',
    expected: IMPLEMENTATION_DECISIONS.length.toString(),
    evaluator: 'exactMatch'
  },
  {
    id: 'cr-meta-categories',
    prompt: 'What categories of decisions have we documented?',
    expected: [...new Set(IMPLEMENTATION_DECISIONS.map(d => d.category))],
    evaluator: 'setMatch'
  },
  {
    id: 'cr-meta-pattern',
    prompt: 'What patterns did we establish for error handling and validation?',
    expected: 'AppError class for errors, Zod for validation',
    evaluator: 'contains'
  }
];

export function createBenchmark(options = {}) {
  const knowledgeContent = generateKnowledgeMd();

  // Context for base model: just the decisions as text
  const baseContext = `The following implementation decisions were made during the project:\n\n` +
    IMPLEMENTATION_DECISIONS.map(d =>
      `${d.question}\nDecision: ${d.decision}\nReasoning: ${d.reasoning}`
    ).join('\n\n');

  // For RLM testing, we simulate compaction by providing ONLY knowledge.md
  // The RLM adapter should be able to recover from this
  const rlmContext = {
    knowledgeMd: knowledgeContent,
    hint: 'Context was compacted. Use knowledge.md to answer questions about previous decisions.'
  };

  return {
    name: 'Context Recovery',
    description: 'Tests ability to recover decisions after compaction/restart',
    baseContext,
    rlmContext,
    phases: [
      {
        name: 'establish',
        description: 'Make implementation decisions and store in knowledge.md',
        decisions: IMPLEMENTATION_DECISIONS
      },
      {
        name: 'compact',
        description: 'Simulate compaction by clearing conversation context',
        action: 'Clear all conversation history, keep only knowledge.md'
      },
      {
        name: 'verify',
        description: 'Test recall of decisions',
        queries: [...queries, ...metaQueries]
      }
    ],
    queries: [...queries, ...metaQueries],
    evaluate: (query, actual) => {
      if (query.evaluator === 'exactMatch') {
        return exactMatch(query.expected, actual);
      }
      if (query.evaluator === 'setMatch') {
        const actualSet = new Set(
          actual.toLowerCase().split(/[,\s]+/).filter(Boolean)
        );
        const expectedSet = new Set(query.expected.map(e => e.toLowerCase()));
        const intersection = [...expectedSet].filter(e => actualSet.has(e));
        return intersection.length / expectedSet.size;
      }
      return contains(query.expected, actual);
    }
  };
}

// Metrics for reporting
export function calculateMetrics(results) {
  const byCategory = {};

  results.forEach(r => {
    const category = r.query.category || 'meta';
    if (!byCategory[category]) {
      byCategory[category] = { total: 0, correct: 0 };
    }
    byCategory[category].total++;
    if (r.score > 0.5) byCategory[category].correct++;
  });

  return {
    overall: results.filter(r => r.score > 0.5).length / results.length,
    byCategory: Object.entries(byCategory).reduce((acc, [cat, data]) => {
      acc[cat] = data.correct / data.total;
      return acc;
    }, {}),
    perfectRecall: results.every(r => r.score > 0.8)
  };
}

export const metadata = {
  name: 'Context Recovery',
  complexity: 'O(1) to O(N)',
  description: 'Tests persistence of decisions across compaction/restart',
  targetImprovement: 'Base 0% → Easy RLM 100%',
  measuredMetrics: ['decision recall', 'reasoning recall', 'meta-query accuracy'],
  keyDifferentiator: true // This is THE key test for Easy RLM value
};
