// Multi-Session Benchmark - Tests continuity across session boundaries
import { contains, setMatch, exactMatch } from '../../lib/evaluators.js';

/**
 * Tests ability to maintain continuity when resuming work in a new session.
 *
 * Simulates the real-world scenario:
 * 1. Session 1: Start implementing a feature, make progress
 * 2. Session ends (user closes terminal, next day, etc.)
 * 3. Session 2: Resume work without re-explaining context
 *
 * Expected:
 * - Base Claude: Must re-explain everything, loses all context
 * - Easy RLM: Reads current.md, resumes seamlessly
 */

// Simulated session 1 state
const SESSION_1_STATE = {
  feature: 'User notification preferences',
  phase: 'implementation',
  completedSteps: [
    'Created UserPreferences model with Zod schema',
    'Added preferences endpoint to users route',
    'Implemented updatePreferences in userService',
    'Created migration for preferences JSONB column'
  ],
  pendingSteps: [
    'Add email toggle to notification service',
    'Add push toggle to notification service',
    'Write tests for preference changes',
    'Update API documentation'
  ],
  currentFile: 'src/services/notificationService.ts',
  currentLine: 45,
  lastAction: 'Added conditional check for emailNotifications preference',
  blockers: [],
  decisions: [
    'Using JSONB for flexibility in adding new preferences',
    'Defaulting all notifications to true for new users',
    'Preference changes take effect immediately (no cache)'
  ]
};

// Generate current.md content (what Easy RLM would store)
function generateCurrentMd() {
  return `# Current Session State

## Feature: ${SESSION_1_STATE.feature}

**Phase:** ${SESSION_1_STATE.phase}

## Progress

### Completed
${SESSION_1_STATE.completedSteps.map(s => `- [x] ${s}`).join('\n')}

### Pending
${SESSION_1_STATE.pendingSteps.map(s => `- [ ] ${s}`).join('\n')}

## Current Position

**File:** \`${SESSION_1_STATE.currentFile}\`
**Line:** ${SESSION_1_STATE.currentLine}
**Last action:** ${SESSION_1_STATE.lastAction}

## Decisions Made

${SESSION_1_STATE.decisions.map(d => `- ${d}`).join('\n')}

## Blockers

${SESSION_1_STATE.blockers.length > 0
  ? SESSION_1_STATE.blockers.map(b => `- ${b}`).join('\n')
  : 'None'}
`;
}

// Session 2 queries - should be answerable from current.md
export const queries = [
  // Direct recall
  {
    id: 'ms-resume-feature',
    prompt: 'What feature were we working on?',
    expected: 'User notification preferences',
    evaluator: 'contains'
  },
  {
    id: 'ms-resume-phase',
    prompt: 'What phase of development are we in?',
    expected: 'implementation',
    evaluator: 'contains'
  },
  {
    id: 'ms-resume-file',
    prompt: 'Which file was I editing?',
    expected: 'notificationService.ts',
    evaluator: 'contains'
  },
  {
    id: 'ms-resume-last-action',
    prompt: 'What was the last thing we did?',
    expected: 'conditional check for emailNotifications',
    evaluator: 'contains'
  },

  // Progress tracking
  {
    id: 'ms-completed-count',
    prompt: 'How many steps have we completed?',
    expected: SESSION_1_STATE.completedSteps.length.toString(),
    evaluator: 'exactMatch'
  },
  {
    id: 'ms-pending-count',
    prompt: 'How many steps are still pending?',
    expected: SESSION_1_STATE.pendingSteps.length.toString(),
    evaluator: 'exactMatch'
  },
  {
    id: 'ms-next-step',
    prompt: 'What should we work on next?',
    expected: SESSION_1_STATE.pendingSteps[0],
    evaluator: 'contains'
  },

  // Decision recall
  {
    id: 'ms-decision-storage',
    prompt: 'How are we storing preferences in the database?',
    expected: 'JSONB',
    evaluator: 'contains'
  },
  {
    id: 'ms-decision-defaults',
    prompt: 'What are the default notification settings for new users?',
    expected: 'true',
    evaluator: 'contains'
  },

  // Context synthesis
  {
    id: 'ms-summary',
    prompt: 'Give me a quick summary of where we left off',
    expected: ['notification', 'preferences', 'notificationService', 'email'],
    evaluator: 'setMatch',
    minScore: 0.5
  }
];

// Queries that test if assistant can continue work without re-explanation
export const continuityQueries = [
  {
    id: 'ms-continue-1',
    prompt: 'Continue where we left off',
    expectedBehavior: 'Should mention notificationService.ts and email toggle without asking for context',
    checkFor: ['notificationService', 'email', 'toggle'],
    evaluator: 'setMatch',
    minScore: 0.66
  },
  {
    id: 'ms-continue-2',
    prompt: 'What tests do we need to write?',
    expectedBehavior: 'Should mention preference change tests',
    checkFor: ['test', 'preference'],
    evaluator: 'setMatch',
    minScore: 0.5
  },
  {
    id: 'ms-blockers',
    prompt: 'Are there any blockers?',
    expected: 'None',
    evaluator: 'contains'
  }
];

export function createBenchmark(options = {}) {
  const currentMdContent = generateCurrentMd();

  // For base model: No context (simulating fresh session)
  const baseContext = 'You are starting a new session. The user may ask about previous work.';

  // For RLM: current.md content
  const rlmContext = {
    currentMd: currentMdContent,
    hint: 'Read current.md to understand the session state before responding'
  };

  return {
    name: 'Multi-Session Continuity',
    description: 'Tests ability to resume work across session boundaries',
    baseContext,
    rlmContext,
    sessionState: SESSION_1_STATE,
    queries: [...queries, ...continuityQueries],
    phases: [
      {
        name: 'session1',
        description: 'Implement feature, make progress, store state',
        state: SESSION_1_STATE
      },
      {
        name: 'boundary',
        description: 'Session ends - terminal closed, new day, etc.',
        action: 'Save state to current.md, clear conversation'
      },
      {
        name: 'session2',
        description: 'Resume work - test context recovery',
        queries: [...queries, ...continuityQueries]
      }
    ],
    evaluate: (query, actual) => {
      if (query.evaluator === 'exactMatch') {
        return exactMatch(query.expected, actual);
      }
      if (query.evaluator === 'setMatch') {
        const checkItems = query.checkFor || query.expected;
        const actualLower = actual.toLowerCase();
        const found = checkItems.filter(item =>
          actualLower.includes(item.toLowerCase())
        );
        return found.length / checkItems.length;
      }
      return contains(query.expected, actual);
    }
  };
}

// Calculate how well the assistant resumed vs re-asked for context
export function calculateResumptionScore(results) {
  const reAskedPatterns = [
    'what feature',
    'what are we working on',
    'can you remind me',
    'what was the context',
    'i need more information',
    'could you provide'
  ];

  let seamlessResumes = 0;
  let totalContinuityQueries = 0;

  results.forEach(r => {
    if (r.query.id.startsWith('ms-continue')) {
      totalContinuityQueries++;
      const responseLower = r.response.toLowerCase();
      const reAsked = reAskedPatterns.some(p => responseLower.includes(p));
      if (!reAsked && r.score > 0.5) {
        seamlessResumes++;
      }
    }
  });

  return {
    seamlessResumption: totalContinuityQueries > 0
      ? seamlessResumes / totalContinuityQueries
      : 0,
    contextRecall: results.filter(r => r.score > 0.5).length / results.length
  };
}

export const metadata = {
  name: 'Multi-Session Continuity',
  complexity: 'O(1)',
  description: 'Tests session resumption without re-explanation',
  targetImprovement: 'Base 0% seamless → Easy RLM 100% seamless',
  measuredMetrics: ['context recall', 'seamless resumption', 'no re-asking'],
  realWorldValue: 'Developers can close terminal and resume next day without losing context'
};
