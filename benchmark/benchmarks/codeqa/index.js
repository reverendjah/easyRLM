// CodeQA Benchmark - Code Understanding (variable complexity)
import { codeLocationMatch, contains } from '../../lib/evaluators.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * CodeQA tests code understanding across varying codebase sizes.
 *
 * Paper reference: Section 4.3 - "CodeQA (23K-4.2M tokens)"
 * Paper results: Base 24% → RLM 62% (+158% improvement)
 */

// Code understanding question types
const QUESTION_TYPES = {
  FUNCTION_PURPOSE: 'What does the function {name} do?',
  ERROR_HANDLING: 'How does the code handle errors in {component}?',
  DATA_FLOW: 'How does data flow from {source} to {destination}?',
  DEPENDENCY: 'What are the dependencies of {module}?',
  SIDE_EFFECTS: 'What side effects does {function} have?',
  ENTRY_POINT: 'What is the main entry point and what does it do?',
  CONFIG: 'How is {feature} configured?'
};

// Generate synthetic codebase for testing
function generateSyntheticCodebase(config) {
  const { numFiles, avgLinesPerFile, complexity } = config;

  const codebase = {
    files: [],
    facts: []
  };

  const fileTypes = ['service', 'controller', 'model', 'util', 'config'];

  for (let i = 0; i < numFiles; i++) {
    const fileType = fileTypes[i % fileTypes.length];
    const filename = `${fileType}-${String(i + 1).padStart(2, '0')}.ts`;

    const { code, facts } = generateFile(fileType, i, avgLinesPerFile);

    codebase.files.push({
      name: filename,
      content: code,
      lines: code.split('\n').length
    });

    facts.forEach(fact => {
      fact.file = filename;
      codebase.facts.push(fact);
    });
  }

  return codebase;
}

function generateFile(type, index, targetLines) {
  const facts = [];
  const lines = [];

  // Header
  lines.push(`// ${type}-${String(index + 1).padStart(2, '0')}.ts`);
  lines.push(`// Auto-generated ${type} file`);
  lines.push('');

  // Imports
  const imports = generateImports(type);
  lines.push(...imports);
  lines.push('');

  // Main class/functions
  switch (type) {
    case 'service':
      const service = generateService(index);
      lines.push(...service.code);
      facts.push(...service.facts);
      break;

    case 'controller':
      const controller = generateController(index);
      lines.push(...controller.code);
      facts.push(...controller.facts);
      break;

    case 'model':
      const model = generateModel(index);
      lines.push(...model.code);
      facts.push(...model.facts);
      break;

    case 'util':
      const util = generateUtil(index);
      lines.push(...util.code);
      facts.push(...util.facts);
      break;

    case 'config':
      const config = generateConfig(index);
      lines.push(...config.code);
      facts.push(...config.facts);
      break;
  }

  // Pad to target lines
  while (lines.length < targetLines) {
    lines.push('');
    lines.push(`// Additional ${type} logic`);
    lines.push(`function helper${lines.length}() {`);
    lines.push('  return null;');
    lines.push('}');
  }

  return {
    code: lines.join('\n'),
    facts
  };
}

function generateImports(type) {
  const imports = {
    service: ["import { Database } from './database';", "import { Logger } from './logger';"],
    controller: ["import { Request, Response } from 'express';", "import { validate } from './validator';"],
    model: ["import { z } from 'zod';", "import { Entity } from './base';"],
    util: ["import crypto from 'crypto';", "import { format } from 'date-fns';"],
    config: ["import dotenv from 'dotenv';", "dotenv.config();"]
  };
  return imports[type] || [];
}

function generateService(index) {
  const serviceName = `Service${index + 1}`;
  const methodName = `process${['Order', 'User', 'Payment', 'Data', 'Request'][index % 5]}`;

  const code = [
    `export class ${serviceName} {`,
    '  private db: Database;',
    '  private logger: Logger;',
    '',
    '  constructor(db: Database, logger: Logger) {',
    '    this.db = db;',
    '    this.logger = logger;',
    '  }',
    '',
    `  async ${methodName}(id: string): Promise<Result> {`,
    '    this.logger.info(`Processing ${id}`);',
    '    try {',
    '      const data = await this.db.find(id);',
    '      if (!data) {',
    `        throw new Error('Not found: ' + id);`,
    '      }',
    '      return { success: true, data };',
    '    } catch (error) {',
    '      this.logger.error(error);',
    '      throw error;',
    '    }',
    '  }',
    '}'
  ];

  const facts = [
    {
      type: 'function-purpose',
      name: methodName,
      answer: `${methodName} processes data by looking it up in the database and returning a Result object`,
      line: 10
    },
    {
      type: 'error-handling',
      component: serviceName,
      answer: 'Errors are logged using the logger and then re-thrown',
      line: 18
    }
  ];

  return { code, facts };
}

function generateController(index) {
  const controllerName = `Controller${index + 1}`;
  const routeName = ['users', 'orders', 'products', 'payments', 'reports'][index % 5];

  const code = [
    `export class ${controllerName} {`,
    `  // Handles /${routeName} endpoints`,
    '',
    '  async get(req: Request, res: Response) {',
    '    const { id } = req.params;',
    '    if (!validate(id)) {',
    '      return res.status(400).json({ error: "Invalid ID" });',
    '    }',
    '    const data = await this.service.find(id);',
    '    return res.json(data);',
    '  }',
    '',
    '  async create(req: Request, res: Response) {',
    '    const validated = validate(req.body);',
    '    const result = await this.service.create(validated);',
    '    return res.status(201).json(result);',
    '  }',
    '}'
  ];

  const facts = [
    {
      type: 'endpoint',
      name: `GET /${routeName}/:id`,
      answer: `Validates ID, fetches data from service, returns JSON`,
      line: 4
    },
    {
      type: 'validation',
      component: controllerName,
      answer: 'Uses validate() function for input validation, returns 400 on invalid input',
      line: 6
    }
  ];

  return { code, facts };
}

function generateModel(index) {
  const modelName = ['User', 'Order', 'Product', 'Transaction', 'Session'][index % 5];

  const code = [
    `export const ${modelName}Schema = z.object({`,
    '  id: z.string().uuid(),',
    `  name: z.string().min(1).max(100),`,
    '  createdAt: z.date(),',
    '  updatedAt: z.date().optional(),',
    '  metadata: z.record(z.string()).optional()',
    '});',
    '',
    `export type ${modelName} = z.infer<typeof ${modelName}Schema>;`,
    '',
    `export function create${modelName}(data: Partial<${modelName}>): ${modelName} {`,
    '  return {',
    '    id: crypto.randomUUID(),',
    '    createdAt: new Date(),',
    '    ...data',
    `  } as ${modelName};`,
    '}'
  ];

  const facts = [
    {
      type: 'model-schema',
      name: modelName,
      answer: `${modelName} has fields: id (UUID), name (1-100 chars), createdAt, optional updatedAt and metadata`,
      line: 1
    }
  ];

  return { code, facts };
}

function generateUtil(index) {
  const utilName = ['hash', 'format', 'parse', 'validate', 'transform'][index % 5];

  const code = [
    `export function ${utilName}Data(input: unknown): string {`,
    '  if (typeof input !== "string") {',
    '    throw new TypeError("Input must be a string");',
    '  }',
    `  return crypto.createHash('sha256').update(input).digest('hex');`,
    '}',
    '',
    `export function ${utilName}Safe(input: unknown): string | null {`,
    '  try {',
    `    return ${utilName}Data(input);`,
    '  } catch {',
    '    return null;',
    '  }',
    '}'
  ];

  const facts = [
    {
      type: 'function-purpose',
      name: `${utilName}Data`,
      answer: `Converts string input to SHA256 hash, throws TypeError for non-strings`,
      line: 1
    },
    {
      type: 'function-purpose',
      name: `${utilName}Safe`,
      answer: `Safe wrapper that returns null instead of throwing on error`,
      line: 8
    }
  ];

  return { code, facts };
}

function generateConfig(index) {
  const configName = ['database', 'auth', 'api', 'cache', 'logging'][index % 5];

  const code = [
    `export const ${configName}Config = {`,
    `  host: process.env.${configName.toUpperCase()}_HOST || 'localhost',`,
    `  port: parseInt(process.env.${configName.toUpperCase()}_PORT || '${3000 + index}'),`,
    `  timeout: parseInt(process.env.${configName.toUpperCase()}_TIMEOUT || '30000'),`,
    `  enabled: process.env.${configName.toUpperCase()}_ENABLED !== 'false'`,
    '};',
    '',
    `export function validate${configName.charAt(0).toUpperCase() + configName.slice(1)}Config() {`,
    `  if (!${configName}Config.host) {`,
    `    throw new Error('${configName.toUpperCase()}_HOST is required');`,
    '  }',
    '  return true;',
    '}'
  ];

  const facts = [
    {
      type: 'config',
      feature: configName,
      answer: `${configName} is configured via environment variables: ${configName.toUpperCase()}_HOST, ${configName.toUpperCase()}_PORT, ${configName.toUpperCase()}_TIMEOUT, ${configName.toUpperCase()}_ENABLED`,
      line: 1
    }
  ];

  return { code, facts };
}

function generateQueries(codebase) {
  const queries = [];

  // Select diverse facts for questions
  const factsByType = {};
  codebase.facts.forEach(fact => {
    if (!factsByType[fact.type]) factsByType[fact.type] = [];
    factsByType[fact.type].push(fact);
  });

  // Q1: Function purpose
  if (factsByType['function-purpose']?.length > 0) {
    const fact = factsByType['function-purpose'][0];
    queries.push({
      id: 'codeqa-function-purpose',
      prompt: `What does the function ${fact.name} do?`,
      expected: {
        answer: fact.answer,
        file: fact.file,
        line: fact.line
      }
    });
  }

  // Q2: Error handling
  if (factsByType['error-handling']?.length > 0) {
    const fact = factsByType['error-handling'][0];
    queries.push({
      id: 'codeqa-error-handling',
      prompt: `How does ${fact.component} handle errors?`,
      expected: {
        answer: fact.answer,
        file: fact.file,
        line: fact.line
      }
    });
  }

  // Q3: Config
  if (factsByType['config']?.length > 0) {
    const fact = factsByType['config'][0];
    queries.push({
      id: 'codeqa-config',
      prompt: `How is ${fact.feature} configured in this codebase?`,
      expected: {
        answer: fact.answer,
        file: fact.file
      }
    });
  }

  // Q4: Model schema
  if (factsByType['model-schema']?.length > 0) {
    const fact = factsByType['model-schema'][0];
    queries.push({
      id: 'codeqa-model',
      prompt: `What fields does the ${fact.name} model have?`,
      expected: {
        answer: fact.answer,
        file: fact.file
      }
    });
  }

  // Q5: Cross-file question
  queries.push({
    id: 'codeqa-cross-file',
    prompt: 'How many files use the Database class?',
    expected: {
      answer: codebase.files.filter(f =>
        f.content.includes('Database')
      ).length.toString()
    }
  });

  return queries;
}

export function createBenchmark(options = {}) {
  const config = {
    numFiles: options.numFiles || 20,
    avgLinesPerFile: options.avgLinesPerFile || 50,
    complexity: options.complexity || 'medium'
  };

  const codebase = generateSyntheticCodebase(config);

  // Build context as concatenated files
  const context = codebase.files.map(f =>
    `=== ${f.name} ===\n${f.content}`
  ).join('\n\n');

  const queries = generateQueries(codebase);

  return {
    name: `CodeQA (${config.numFiles} files)`,
    description: 'Code understanding benchmark - variable complexity',
    context,
    queries,
    evaluate: (expected, actual) => codeLocationMatch(expected, actual)
  };
}

// For testing with real codebases
export async function createFromDirectory(dirPath, options = {}) {
  const files = await fs.readdir(dirPath, { recursive: true });
  const codeFiles = files.filter(f =>
    /\.(ts|js|py|go|rs|java)$/.test(f)
  );

  const codebase = {
    files: [],
    facts: []
  };

  for (const file of codeFiles.slice(0, options.maxFiles || 100)) {
    const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
    codebase.files.push({ name: file, content });
  }

  const context = codebase.files.map(f =>
    `=== ${f.name} ===\n${f.content}`
  ).join('\n\n');

  return {
    name: `CodeQA (${codebase.files.length} files from ${path.basename(dirPath)})`,
    description: 'Code understanding - real codebase',
    context,
    queries: [], // Manual queries needed for real codebases
    evaluate: (expected, actual) => codeLocationMatch(expected, actual)
  };
}

export const metadata = {
  name: 'CodeQA',
  complexity: 'O(N) to O(N²)',
  description: 'Understanding code across multiple files',
  paperReference: 'Section 4.3 - CodeQA benchmark',
  expectedImprovement: '100-150% (RLM handles cross-file analysis well)'
};
