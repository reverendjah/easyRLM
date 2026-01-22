// OOLONG Benchmark - Semantic Aggregation (O(N) complexity)
import { aggregationMatch, setMatch } from '../../lib/evaluators.js';

/**
 * OOLONG tests O(N) aggregation - gathering and synthesizing information
 * scattered across the entire context.
 *
 * Paper reference: Section 4.1 - "OOLONG synthetic benchmark (131K tokens)"
 * Paper results: Base 44% → RLM 56.5% (+28% improvement)
 */

// Simulated OOLONG-style questions requiring aggregation
const AGGREGATION_TEMPLATES = [
  {
    id: 'count-entities',
    template: 'How many {entity_type} are mentioned in the document?',
    entityTypes: ['companies', 'products', 'locations', 'people', 'dates'],
    complexity: 'count'
  },
  {
    id: 'list-attributes',
    template: 'List all {attribute} mentioned for {entity}.',
    complexity: 'enumeration'
  },
  {
    id: 'compare-values',
    template: 'Which {entity_type} has the highest {metric}?',
    complexity: 'comparison'
  },
  {
    id: 'aggregate-numbers',
    template: 'What is the total {metric} across all {entity_type}?',
    complexity: 'sum'
  },
  {
    id: 'filter-condition',
    template: 'Which {entity_type} satisfy the condition: {condition}?',
    complexity: 'filter'
  }
];

// Generate synthetic business document with scattered facts
function generateOolongDocument(config) {
  const { numCompanies, numProducts, numRegions, sections } = config;

  const companies = [];
  for (let i = 0; i < numCompanies; i++) {
    companies.push({
      name: `Company ${String.fromCharCode(65 + i)}`,
      revenue: Math.floor(Math.random() * 100) * 1000000,
      employees: Math.floor(Math.random() * 10000) + 500,
      founded: 1990 + Math.floor(Math.random() * 30),
      products: [],
      regions: []
    });
  }

  // Assign products and regions
  const productNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const regionNames = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];

  companies.forEach(company => {
    const numProds = 1 + Math.floor(Math.random() * 3);
    const numRegs = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numProds; i++) {
      const prodIdx = Math.floor(Math.random() * productNames.length);
      company.products.push({
        name: `${company.name} ${productNames[prodIdx]}`,
        price: Math.floor(Math.random() * 500) + 50,
        units: Math.floor(Math.random() * 100000) + 1000
      });
    }

    for (let i = 0; i < numRegs; i++) {
      company.regions.push(regionNames[Math.floor(Math.random() * regionNames.length)]);
    }
    company.regions = [...new Set(company.regions)];
  });

  // Generate document sections with scattered information
  const document = [];

  // Executive summary
  document.push(`# Market Analysis Report\n\nThis report covers ${numCompanies} major companies across ${regionNames.length} regions.`);

  // Scatter company information across sections
  for (let section = 0; section < sections; section++) {
    const sectionTitle = `## Section ${section + 1}: ${['Overview', 'Financial Analysis', 'Product Landscape', 'Regional Distribution', 'Growth Trends'][section % 5]}`;

    let content = sectionTitle + '\n\n';

    // Add 2-3 company facts per section (scattered)
    const companiesInSection = companies
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2));

    companiesInSection.forEach(company => {
      const factType = Math.floor(Math.random() * 4);
      switch (factType) {
        case 0:
          content += `${company.name} reported annual revenue of $${(company.revenue / 1000000).toFixed(1)}M in the fiscal year. `;
          break;
        case 1:
          content += `With ${company.employees.toLocaleString()} employees, ${company.name} continues to expand its workforce. `;
          break;
        case 2:
          content += `${company.name}'s product line includes ${company.products.map(p => p.name).join(', ')}. `;
          break;
        case 3:
          content += `${company.name} operates in ${company.regions.join(', ')}. `;
          break;
      }
    });

    // Add filler content
    content += '\n\nMarket conditions remain dynamic with various factors influencing performance across sectors. Analysts note emerging trends that could impact future projections.\n';

    document.push(content);
  }

  return {
    text: document.join('\n\n'),
    facts: companies
  };
}

// Generate queries that require aggregation
function generateAggregationQueries(facts) {
  const queries = [];

  // Q1: Count companies
  queries.push({
    id: 'oolong-count-companies',
    prompt: 'How many companies are mentioned in this report?',
    expected: facts.length.toString(),
    evaluator: 'contains'
  });

  // Q2: List all company names
  queries.push({
    id: 'oolong-list-companies',
    prompt: 'List all company names mentioned in the report.',
    expected: facts.map(c => c.name),
    evaluator: 'setMatch'
  });

  // Q3: Total employees
  const totalEmployees = facts.reduce((sum, c) => sum + c.employees, 0);
  queries.push({
    id: 'oolong-total-employees',
    prompt: 'What is the approximate total number of employees across all companies?',
    expected: totalEmployees.toString(),
    evaluator: 'numericMatch'
  });

  // Q4: Company with highest revenue
  const highestRevenue = facts.reduce((max, c) => c.revenue > max.revenue ? c : max, facts[0]);
  queries.push({
    id: 'oolong-highest-revenue',
    prompt: 'Which company has the highest reported revenue?',
    expected: highestRevenue.name,
    evaluator: 'contains'
  });

  // Q5: List all products
  const allProducts = facts.flatMap(c => c.products.map(p => p.name));
  queries.push({
    id: 'oolong-list-products',
    prompt: 'List all product names mentioned across all companies.',
    expected: allProducts,
    evaluator: 'setMatch'
  });

  // Q6: Companies in specific region
  const targetRegion = 'Europe';
  const europeCompanies = facts.filter(c => c.regions.includes(targetRegion)).map(c => c.name);
  if (europeCompanies.length > 0) {
    queries.push({
      id: 'oolong-europe-companies',
      prompt: 'Which companies operate in Europe?',
      expected: europeCompanies,
      evaluator: 'setMatch'
    });
  }

  // Q7: Oldest company
  const oldest = facts.reduce((min, c) => c.founded < min.founded ? c : min, facts[0]);
  queries.push({
    id: 'oolong-oldest',
    prompt: 'Which company was founded earliest, and in what year?',
    expected: [oldest.name, oldest.founded.toString()],
    evaluator: 'setMatch'
  });

  return queries;
}

export function createBenchmark(options = {}) {
  const config = {
    numCompanies: options.numCompanies || 10,
    numProducts: options.numProducts || 20,
    numRegions: 5,
    sections: options.sections || 30
  };

  const { text, facts } = generateOolongDocument(config);
  const queries = generateAggregationQueries(facts);

  return {
    name: `OOLONG (${config.numCompanies} companies, ${config.sections} sections)`,
    description: 'Semantic aggregation benchmark - O(N) complexity',
    context: text,
    queries: queries.map(q => ({
      id: q.id,
      prompt: q.prompt,
      expected: q.expected
    })),
    evaluate: (expected, actual) => {
      if (Array.isArray(expected)) {
        return setMatch(expected, actual);
      }
      return aggregationMatch(expected, actual);
    }
  };
}

export const metadata = {
  name: 'OOLONG',
  complexity: 'O(N)',
  description: 'Aggregates information scattered across entire context',
  paperReference: 'Section 4.1 - OOLONG benchmark',
  expectedImprovement: '20-30% (RLM excels at aggregation tasks)'
};
