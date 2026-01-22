// Claude RLM Adapter - Uses Easy RLM patterns for context management
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class ClaudeRLMAdapter {
  constructor(options = {}) {
    this.model = options.model || 'claude-opus-4-5-20251101';
    this.timeout = options.timeout || 120000;
    this.chunkSize = options.chunkSize || 4000; // tokens per chunk
    this.maxParallelQueries = options.maxParallelQueries || 5;
  }

  async query(context, prompt, options = {}) {
    const startTime = Date.now();

    // Apply RLM decomposition strategy
    const strategy = this.determineStrategy(context);

    let response;
    switch (strategy) {
      case 'direct':
        response = await this.directQuery(context, prompt, options);
        break;
      case 'chunked':
        response = await this.chunkedQuery(context, prompt, options);
        break;
      case 'recursive':
        response = await this.recursiveQuery(context, prompt, options);
        break;
      default:
        response = await this.directQuery(context, prompt, options);
    }

    response.latency = Date.now() - startTime;
    return response;
  }

  determineStrategy(context) {
    const estimatedTokens = this.estimateTokens(context);

    if (estimatedTokens < 10000) {
      return 'direct'; // Small context: no decomposition needed
    } else if (estimatedTokens < 50000) {
      return 'chunked'; // Medium: chunk and aggregate
    } else {
      return 'recursive'; // Large: recursive sub-agents
    }
  }

  async directQuery(context, prompt, options) {
    const fullPrompt = this.buildPrompt(context, prompt);
    return this.callClaude(fullPrompt, options.timeout || this.timeout);
  }

  async chunkedQuery(context, prompt, options) {
    // Split context into semantic chunks
    const chunks = this.splitIntoChunks(context);
    const relevantChunks = await this.filterRelevantChunks(chunks, prompt);

    // Query with filtered context
    const filteredContext = relevantChunks.join('\n\n---\n\n');
    return this.directQuery(filteredContext, prompt, options);
  }

  async recursiveQuery(context, prompt, options) {
    // Split into major sections
    const sections = this.splitIntoSections(context);
    const results = [];

    // Query each section in parallel (limited concurrency)
    const batches = this.createBatches(sections, this.maxParallelQueries);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(section => this.querySection(section, prompt, options))
      );
      results.push(...batchResults);
    }

    // Aggregate results
    return this.aggregateResults(results, prompt, options);
  }

  async querySection(section, prompt, options) {
    const sectionPrompt = `Given this section of a larger document:

<section>
${section.content}
</section>

${prompt}

If this section does not contain relevant information, respond with "NOT_RELEVANT".
Otherwise, extract the relevant information concisely.`;

    try {
      const response = await this.callClaude(sectionPrompt, options.timeout || this.timeout);
      return {
        sectionId: section.id,
        content: response.content,
        tokens: response.tokens,
        relevant: !response.content.includes('NOT_RELEVANT')
      };
    } catch (error) {
      return {
        sectionId: section.id,
        content: null,
        error: error.message,
        relevant: false
      };
    }
  }

  async aggregateResults(results, originalPrompt, options) {
    const relevantResults = results.filter(r => r.relevant && r.content);

    if (relevantResults.length === 0) {
      return {
        answer: 'No relevant information found.',
        tokens: results.reduce((sum, r) => sum + (r.tokens || 0), 0)
      };
    }

    const aggregationPrompt = `Based on these findings from different sections:

${relevantResults.map((r, i) => `[Section ${i + 1}]\n${r.content}`).join('\n\n')}

Original question: ${originalPrompt}

Synthesize a final answer that combines all relevant information.`;

    const response = await this.callClaude(aggregationPrompt, options.timeout || this.timeout);

    return {
      answer: response.content,
      tokens: results.reduce((sum, r) => sum + (r.tokens || 0), 0) + (response.tokens || 0),
      decomposed: true,
      sectionsQueried: results.length,
      sectionsRelevant: relevantResults.length
    };
  }

  splitIntoChunks(text, maxTokens = null) {
    const targetTokens = maxTokens || this.chunkSize;
    const targetChars = targetTokens * 4; // ~4 chars per token

    const chunks = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > targetChars && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += para + '\n\n';
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  splitIntoSections(text) {
    // Split by headers or natural section boundaries
    const sectionRegex = /(?=^#{1,3}\s|\n(?:---|\*\*\*|___)\n)/gm;
    const parts = text.split(sectionRegex).filter(p => p.trim());

    return parts.map((content, idx) => ({
      id: `section-${idx + 1}`,
      content: content.trim()
    }));
  }

  async filterRelevantChunks(chunks, prompt) {
    // Extract keywords from prompt
    const keywords = this.extractKeywords(prompt);

    // Score chunks by keyword relevance
    const scored = chunks.map(chunk => ({
      chunk,
      score: this.scoreChunk(chunk, keywords)
    }));

    // Sort by relevance and take top chunks
    scored.sort((a, b) => b.score - a.score);

    // Take chunks until we hit token budget
    const maxTokens = 20000;
    let totalTokens = 0;
    const selected = [];

    for (const { chunk, score } of scored) {
      const chunkTokens = this.estimateTokens(chunk);
      if (totalTokens + chunkTokens > maxTokens) break;
      if (score > 0) {
        selected.push(chunk);
        totalTokens += chunkTokens;
      }
    }

    return selected.length > 0 ? selected : [chunks[0]]; // Fallback to first chunk
  }

  extractKeywords(text) {
    // Simple keyword extraction
    const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it', 'its']);

    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));
  }

  scoreChunk(chunk, keywords) {
    const chunkLower = chunk.toLowerCase();
    return keywords.reduce((score, keyword) => {
      if (chunkLower.includes(keyword)) {
        return score + 1;
      }
      return score;
    }, 0);
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  buildPrompt(context, prompt) {
    return `You are answering questions using the RLM (Recursive Language Models) approach.

<context>
${context}
</context>

<question>
${prompt}
</question>

Answer the question based solely on the information provided in the context.
Be concise and specific. If the information is not in the context, say "Information not found."`;
  }

  async callClaude(prompt, timeout) {
    return new Promise((resolve, reject) => {
      const child = spawn('claude', ['-p', prompt, '--output-format', 'json'], {
        timeout,
        maxBuffer: 10 * 1024 * 1024
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => { stdout += data; });
      child.stderr.on('data', data => { stderr += data; });

      child.on('close', code => {
        if (code !== 0) {
          reject(new Error(stderr || `Claude exited with code ${code}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            content: result.result || result.content || stdout,
            tokens: result.usage?.total_tokens || 0
          });
        } catch {
          resolve({
            content: stdout.trim(),
            tokens: this.estimateTokens(stdout)
          });
        }
      });

      child.on('error', reject);
    });
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
}

export function createAdapter(options) {
  return new ClaudeRLMAdapter(options);
}

// Alias for CLI compatibility
export const createRLMAdapter = createAdapter;
