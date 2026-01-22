// OOLONG-Pairs Benchmark - Pairwise Comparison (O(N²) complexity)
import { pairMatch, setMatch } from '../../lib/evaluators.js';

/**
 * OOLONG-Pairs tests O(N²) complexity - finding relationships between
 * pairs of items scattered across the context.
 *
 * Paper reference: Section 4.2 - "OOLONG-Pairs benchmark (32K tokens)"
 * Paper results: Base 0.04% → RLM 58% (+1,450x improvement)
 *
 * This is where RLM shows the most dramatic improvement!
 */

// Based on RLM Paper Appendix E.1 - 20 OOLONG-Pairs queries
const PAPER_QUERIES = [
  {
    id: 'pair-01',
    prompt: 'Which two dishes share exactly the same set of ingredients?',
    type: 'exact-match'
  },
  {
    id: 'pair-02',
    prompt: 'Find two products that have the same price but different ratings.',
    type: 'attribute-mismatch'
  },
  {
    id: 'pair-03',
    prompt: 'Which two employees work in the same department but have different managers?',
    type: 'partial-match'
  },
  {
    id: 'pair-04',
    prompt: 'Identify two locations that are equidistant from the headquarters.',
    type: 'numeric-equality'
  },
  {
    id: 'pair-05',
    prompt: 'Which two projects have overlapping team members?',
    type: 'set-intersection'
  },
  {
    id: 'pair-06',
    prompt: 'Find two events that occurred on the same date but in different cities.',
    type: 'date-match'
  },
  {
    id: 'pair-07',
    prompt: 'Which two recipes can be combined using only their shared ingredients?',
    type: 'combinatorial'
  },
  {
    id: 'pair-08',
    prompt: 'Identify two documents authored by people from the same organization.',
    type: 'metadata-match'
  },
  {
    id: 'pair-09',
    prompt: 'Which two products have complementary features (one has what the other lacks)?',
    type: 'complement'
  },
  {
    id: 'pair-10',
    prompt: 'Find two transactions with amounts that sum to exactly $1000.',
    type: 'numeric-sum'
  }
];

// Generate synthetic data with hidden pairs
function generatePairableData(config) {
  const { numItems, numAttributes, hiddenPairs } = config;

  const items = [];
  const pairs = [];

  // Generate base items
  const attributeValues = {
    color: ['red', 'blue', 'green', 'yellow', 'purple'],
    size: ['small', 'medium', 'large', 'xlarge'],
    category: ['A', 'B', 'C', 'D', 'E'],
    price: [99, 149, 199, 249, 299, 349, 399],
    rating: [3.5, 4.0, 4.5, 5.0]
  };

  for (let i = 0; i < numItems; i++) {
    const item = {
      id: `Item-${String(i + 1).padStart(3, '0')}`,
      attributes: {}
    };

    Object.entries(attributeValues).forEach(([attr, values]) => {
      item.attributes[attr] = values[Math.floor(Math.random() * values.length)];
    });

    items.push(item);
  }

  // Create hidden pairs with specific relationships
  for (let p = 0; p < hiddenPairs; p++) {
    const idx1 = Math.floor(Math.random() * items.length);
    let idx2 = Math.floor(Math.random() * items.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * items.length);
    }

    const pairType = p % 3;

    switch (pairType) {
      case 0: // Same price, different rating
        items[idx2].attributes.price = items[idx1].attributes.price;
        items[idx2].attributes.rating = items[idx1].attributes.rating === 5.0 ? 3.5 : 5.0;
        pairs.push({
          type: 'same-price-diff-rating',
          items: [items[idx1].id, items[idx2].id],
          description: `${items[idx1].id} and ${items[idx2].id} have same price ($${items[idx1].attributes.price}) but different ratings`
        });
        break;

      case 1: // Same category, different color
        items[idx2].attributes.category = items[idx1].attributes.category;
        items[idx2].attributes.color = items[idx1].attributes.color === 'red' ? 'blue' : 'red';
        pairs.push({
          type: 'same-category-diff-color',
          items: [items[idx1].id, items[idx2].id],
          description: `${items[idx1].id} and ${items[idx2].id} are in category ${items[idx1].attributes.category}`
        });
        break;

      case 2: // Complementary sizes
        items[idx1].attributes.size = 'small';
        items[idx2].attributes.size = 'xlarge';
        pairs.push({
          type: 'complementary-sizes',
          items: [items[idx1].id, items[idx2].id],
          description: `${items[idx1].id} (small) and ${items[idx2].id} (xlarge) are size complements`
        });
        break;
    }
  }

  return { items, pairs };
}

function generateDocument(items) {
  const sections = [];

  // Shuffle items to scatter them across document
  const shuffled = [...items].sort(() => Math.random() - 0.5);

  // Create sections with 3-5 items each
  for (let i = 0; i < shuffled.length; i += 4) {
    const sectionItems = shuffled.slice(i, i + 4);
    let content = `## Product Section ${Math.floor(i / 4) + 1}\n\n`;

    sectionItems.forEach(item => {
      content += `**${item.id}**: `;
      content += `Color: ${item.attributes.color}, `;
      content += `Size: ${item.attributes.size}, `;
      content += `Category: ${item.attributes.category}, `;
      content += `Price: $${item.attributes.price}, `;
      content += `Rating: ${item.attributes.rating}/5.0\n\n`;
    });

    // Add filler
    content += 'Additional market analysis indicates varying demand patterns across segments. Consumer preferences continue to evolve based on multiple factors.\n';

    sections.push(content);
  }

  return sections.join('\n\n');
}

function generateQueries(pairs, items) {
  const queries = [];

  // Query 1: Same price, different rating
  const samePricePair = pairs.find(p => p.type === 'same-price-diff-rating');
  if (samePricePair) {
    queries.push({
      id: 'pairs-same-price',
      prompt: 'Find two products that have the exact same price but different ratings.',
      expected: samePricePair.items
    });
  }

  // Query 2: Same category
  const sameCategoryPair = pairs.find(p => p.type === 'same-category-diff-color');
  if (sameCategoryPair) {
    queries.push({
      id: 'pairs-same-category',
      prompt: 'Which two products are in the same category but have different colors?',
      expected: sameCategoryPair.items
    });
  }

  // Query 3: Complementary sizes
  const sizePair = pairs.find(p => p.type === 'complementary-sizes');
  if (sizePair) {
    queries.push({
      id: 'pairs-size-complement',
      prompt: 'Find the pair of products where one is the smallest size and one is the largest size.',
      expected: sizePair.items
    });
  }

  // Query 4: Price sum (requires comparing all pairs - true O(N²))
  // Find two items whose prices sum to a specific target
  const target = 498; // 99 + 399, 149 + 349, 199 + 299
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].attributes.price + items[j].attributes.price === target) {
        queries.push({
          id: 'pairs-price-sum',
          prompt: `Find two products whose prices sum to exactly $${target}.`,
          expected: [items[i].id, items[j].id]
        });
        break;
      }
    }
    if (queries.find(q => q.id === 'pairs-price-sum')) break;
  }

  // Query 5: Unique attribute combination
  queries.push({
    id: 'pairs-unique-combo',
    prompt: 'Are there any two products that share at least 3 identical attributes? If so, which ones?',
    expected: pairs.length > 0 ? pairs[0].items : ['none']
  });

  return queries;
}

export function createBenchmark(options = {}) {
  const config = {
    numItems: options.numItems || 50,
    numAttributes: 5,
    hiddenPairs: options.hiddenPairs || 5
  };

  const { items, pairs } = generatePairableData(config);
  const context = generateDocument(items);
  const queries = generateQueries(pairs, items);

  return {
    name: `OOLONG-Pairs (${config.numItems} items, ${config.hiddenPairs} hidden pairs)`,
    description: 'Pairwise comparison benchmark - O(N²) complexity',
    context,
    queries,
    pairs, // For debugging
    evaluate: (expected, actual) => {
      if (Array.isArray(expected)) {
        return pairMatch(expected, actual);
      }
      return actual.toLowerCase().includes(expected.toLowerCase());
    }
  };
}

export const metadata = {
  name: 'OOLONG-Pairs',
  complexity: 'O(N²)',
  description: 'Finds relationships between pairs of items in context',
  paperReference: 'Section 4.2 & Appendix E.1 - OOLONG-Pairs',
  expectedImprovement: '1000%+ (Base models fail catastrophically on O(N²) tasks)'
};
