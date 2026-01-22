// S-NIAH Benchmark - Synthetic Needle-in-a-Haystack (O(1) retrieval)
import { contains, exactMatch } from '../../lib/evaluators.js';

/**
 * S-NIAH tests O(1) retrieval - finding a single piece of information
 * in a large context. This is the simplest RLM task.
 *
 * Paper reference: "Baseline (O(1)): Needle in a Haystack retrieval"
 */

// Generate synthetic haystack with a hidden needle
function generateHaystack(size, needle) {
  const topics = [
    'weather patterns', 'economic trends', 'historical events',
    'scientific discoveries', 'geographical features', 'cultural practices',
    'technological advances', 'literary movements', 'philosophical concepts',
    'mathematical theories', 'biological processes', 'chemical reactions'
  ];

  const paragraphs = [];
  const needlePosition = Math.floor(Math.random() * size);

  for (let i = 0; i < size; i++) {
    if (i === needlePosition) {
      paragraphs.push(needle.text);
    } else {
      const topic = topics[i % topics.length];
      paragraphs.push(generateFiller(topic, i));
    }
  }

  return {
    context: paragraphs.join('\n\n'),
    needlePosition
  };
}

function generateFiller(topic, seed) {
  const templates = [
    `Research on ${topic} has shown significant developments in recent years. Studies indicate various factors contribute to observed patterns, though experts continue to debate the underlying mechanisms.`,
    `The study of ${topic} encompasses multiple disciplines and approaches. Various researchers have proposed different frameworks for understanding these phenomena, each with distinct advantages.`,
    `Historical analysis of ${topic} reveals complex interactions between various factors. Documentation from different periods provides insights into how understanding has evolved over time.`,
    `Contemporary perspectives on ${topic} differ from earlier interpretations. Modern methodologies have enabled more precise measurements and observations, leading to refined theories.`
  ];

  return templates[seed % templates.length];
}

// Predefined needles for consistent testing
const NEEDLES = [
  {
    id: 'password',
    text: 'The secret access code for the archive is "PHOENIX-7842-OMEGA". This code should be memorized and never written down.',
    question: 'What is the secret access code for the archive?',
    expected: 'PHOENIX-7842-OMEGA'
  },
  {
    id: 'meeting',
    text: 'The critical meeting with stakeholders is scheduled for March 15th at 3:30 PM in Conference Room Delta.',
    question: 'When and where is the stakeholder meeting?',
    expected: 'March 15th'
  },
  {
    id: 'budget',
    text: 'The approved budget for Project Epsilon is exactly $2,847,563, allocated across four fiscal quarters.',
    question: 'What is the exact approved budget for Project Epsilon?',
    expected: '$2,847,563'
  },
  {
    id: 'contact',
    text: 'For technical emergencies, contact Dr. Sarah Chen at extension 4521 or mobile: 555-0147.',
    question: 'What is Dr. Sarah Chen\'s mobile number?',
    expected: '555-0147'
  },
  {
    id: 'location',
    text: 'The backup data center is located at 1847 Industrial Parkway, Building C, Sub-basement Level 2.',
    question: 'Where is the backup data center located?',
    expected: '1847 Industrial Parkway'
  }
];

// Context size configurations (in paragraphs)
const SIZES = {
  small: 50,      // ~10K tokens
  medium: 200,    // ~40K tokens
  large: 500,     // ~100K tokens
  extreme: 1000   // ~200K tokens
};

export function createBenchmark(options = {}) {
  const size = SIZES[options.size] || SIZES.medium;
  const needles = options.needles || NEEDLES;

  const queries = needles.map(needle => {
    const { context, needlePosition } = generateHaystack(size, needle);
    return {
      id: `sniah-${needle.id}-${size}`,
      context,
      prompt: needle.question,
      expected: needle.expected,
      metadata: {
        needlePosition,
        totalParagraphs: size,
        complexity: 'O(1)'
      }
    };
  });

  return {
    name: `S-NIAH (${options.size || 'medium'})`,
    description: 'Synthetic Needle-in-a-Haystack - O(1) retrieval',
    queries,
    context: null, // Each query has its own context
    evaluate: (expected, actual) => contains(expected, actual)
  };
}

export const metadata = {
  name: 'S-NIAH',
  complexity: 'O(1)',
  description: 'Finds single piece of information in large context',
  paperReference: 'Section 3.1 - Baseline tasks',
  expectedImprovement: '10-20% (minimal, as base models handle O(1) well)'
};
