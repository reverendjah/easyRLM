// Claude Base Adapter - Direct API calls without RLM
import { spawn } from 'child_process';

export class ClaudeBaseAdapter {
  constructor(options = {}) {
    this.model = options.model || 'claude-opus-4-5-20251101';
    this.timeout = options.timeout || 60000;
  }

  async query(context, prompt, options = {}) {
    const fullPrompt = this.buildPrompt(context, prompt);
    const startTime = Date.now();

    try {
      const response = await this.callClaude(fullPrompt, options.timeout || this.timeout);

      return {
        answer: response.content,
        tokens: response.tokens || this.estimateTokens(fullPrompt + response.content),
        latency: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  buildPrompt(context, prompt) {
    // Base adapter: inject full context directly (no RLM optimization)
    return `<context>
${context}
</context>

<question>
${prompt}
</question>

Answer the question based solely on the information provided in the context. Be concise and specific.`;
  }

  async callClaude(prompt, timeout) {
    // Use Claude Code CLI for API access
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
          // Plain text response
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
    // Rough estimation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}

export function createAdapter(options) {
  return new ClaudeBaseAdapter(options);
}

// Alias for CLI compatibility
export const createBaseAdapter = createAdapter;
