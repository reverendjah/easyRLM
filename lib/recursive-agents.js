// Recursive Sub-Agents Module
// RLM Paper: "Sub-agents calling sub-agents recursively for nested decomposition"

/**
 * Agent hierarchy and invocation rules
 *
 * RLM Paper Reference:
 * - Nested REPL allows sub-LM to call sub-sub-LM
 * - Maximum depth prevents infinite loops
 * - Results aggregate upward
 */

// Maximum recursion depth (paper uses 2-3 levels)
export const MAX_RECURSION_DEPTH = 3;

/**
 * Agent invocation permissions
 * Defines which agents can invoke which other agents
 */
export const AGENT_HIERARCHY = {
  'context-manager': {
    canInvoke: ['context-indexer', 'Explore'],
    maxParallel: 5,
    maxDepth: 2
  },
  'code-reviewer': {
    canInvoke: ['test-fixer', 'Explore'],
    maxParallel: 3,
    maxDepth: 2
  },
  'code-simplifier': {
    canInvoke: ['Explore'],
    maxParallel: 2,
    maxDepth: 1
  },
  'test-fixer': {
    canInvoke: ['Explore'],
    maxParallel: 3,
    maxDepth: 1
  },
  'functional-validator': {
    canInvoke: ['test-fixer'],
    maxParallel: 1,
    maxDepth: 2
  },
  'memory-sync': {
    canInvoke: [],
    maxParallel: 0,
    maxDepth: 0
  },
  'terraform-validator': {
    canInvoke: [],
    maxParallel: 0,
    maxDepth: 0
  },
  'context-indexer': {
    canInvoke: ['Explore'],
    maxParallel: 5,
    maxDepth: 1
  }
};

/**
 * Agent call tracking for coordination
 */
export class AgentCoordinator {
  constructor() {
    this.activeAgents = new Map(); // agentId -> { type, depth, parent, startTime }
    this.completedAgents = [];
    this.aggregatedResults = new Map(); // parentId -> [childResults]
  }

  /**
   * Register a new agent invocation
   */
  startAgent(agentId, agentType, parentId = null) {
    const parentDepth = parentId ? (this.activeAgents.get(parentId)?.depth || 0) : 0;
    const depth = parentDepth + 1;

    // Check depth limit
    const hierarchy = AGENT_HIERARCHY[agentType];
    const maxDepth = hierarchy?.maxDepth || MAX_RECURSION_DEPTH;

    if (depth > maxDepth) {
      throw new Error(`Recursion depth exceeded for ${agentType}: ${depth} > ${maxDepth}`);
    }

    // Check if agent can be invoked by parent
    if (parentId) {
      const parentAgent = this.activeAgents.get(parentId);
      if (parentAgent) {
        const parentHierarchy = AGENT_HIERARCHY[parentAgent.type];
        if (parentHierarchy && !parentHierarchy.canInvoke.includes(agentType)) {
          throw new Error(`Agent ${parentAgent.type} cannot invoke ${agentType}`);
        }
      }
    }

    this.activeAgents.set(agentId, {
      type: agentType,
      depth,
      parent: parentId,
      startTime: Date.now(),
      children: []
    });

    // Track child relationship
    if (parentId && this.activeAgents.has(parentId)) {
      this.activeAgents.get(parentId).children.push(agentId);
    }

    return { agentId, depth, maxDepth };
  }

  /**
   * Record agent completion
   */
  completeAgent(agentId, result) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return null;

    const completion = {
      agentId,
      type: agent.type,
      depth: agent.depth,
      parent: agent.parent,
      duration: Date.now() - agent.startTime,
      result,
      childCount: agent.children.length
    };

    this.completedAgents.push(completion);

    // Aggregate result to parent
    if (agent.parent) {
      if (!this.aggregatedResults.has(agent.parent)) {
        this.aggregatedResults.set(agent.parent, []);
      }
      this.aggregatedResults.get(agent.parent).push({
        childId: agentId,
        result
      });
    }

    this.activeAgents.delete(agentId);

    return completion;
  }

  /**
   * Get aggregated results for a parent agent
   */
  getAggregatedResults(parentId) {
    return this.aggregatedResults.get(parentId) || [];
  }

  /**
   * Check if all children of an agent have completed
   */
  allChildrenComplete(parentId) {
    const parent = this.activeAgents.get(parentId);
    if (!parent) return true;

    return parent.children.every(childId =>
      !this.activeAgents.has(childId)
    );
  }

  /**
   * Get current depth for an agent
   */
  getCurrentDepth(agentId) {
    return this.activeAgents.get(agentId)?.depth || 0;
  }

  /**
   * Check if agent can invoke more children
   */
  canInvokeMore(agentId) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return false;

    const hierarchy = AGENT_HIERARCHY[agent.type];
    if (!hierarchy) return true;

    const activeChildren = agent.children.filter(childId =>
      this.activeAgents.has(childId)
    ).length;

    return activeChildren < hierarchy.maxParallel;
  }

  /**
   * Generate coordination statistics
   */
  getStats() {
    return {
      activeAgents: this.activeAgents.size,
      completedAgents: this.completedAgents.length,
      maxDepthReached: Math.max(
        ...this.completedAgents.map(a => a.depth),
        ...Array.from(this.activeAgents.values()).map(a => a.depth),
        0
      ),
      totalDuration: this.completedAgents.reduce((sum, a) => sum + a.duration, 0),
      byType: this.completedAgents.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

/**
 * Generate recursive invocation plan
 */
export function generateRecursivePlan(task, scope, currentDepth = 0) {
  const plan = {
    task,
    scope,
    depth: currentDepth,
    subTasks: [],
    aggregation: null
  };

  // Determine if decomposition is needed
  if (Array.isArray(scope) && scope.length > 5) {
    // Split scope into batches
    const batchSize = Math.ceil(scope.length / 5);
    for (let i = 0; i < scope.length; i += batchSize) {
      const batch = scope.slice(i, i + batchSize);
      plan.subTasks.push({
        scope: batch,
        task: `${task} (batch ${Math.floor(i / batchSize) + 1})`,
        depth: currentDepth + 1,
        mayDecomposeFurther: batch.length > 5 && currentDepth < MAX_RECURSION_DEPTH - 1
      });
    }

    plan.aggregation = {
      type: 'merge',
      instruction: 'Combine results from all batches into unified response'
    };
  }

  return plan;
}

/**
 * Generate Claude Code Task invocation for recursive agent
 */
export function generateTaskInvocation(agentType, task, options = {}) {
  const hierarchy = AGENT_HIERARCHY[agentType];

  return {
    tool: 'Task',
    params: {
      subagent_type: agentType,
      prompt: task,
      description: options.description || `${agentType}: ${task.slice(0, 30)}...`
    },
    metadata: {
      canRecurse: hierarchy?.canInvoke.length > 0,
      maxDepth: hierarchy?.maxDepth || MAX_RECURSION_DEPTH,
      allowedChildren: hierarchy?.canInvoke || []
    }
  };
}

/**
 * Aggregation strategies for combining sub-agent results
 */
export const AGGREGATION_STRATEGIES = {
  /**
   * Merge: Combine all results into a single list
   */
  merge: (results) => {
    return results.flatMap(r => Array.isArray(r.result) ? r.result : [r.result]);
  },

  /**
   * Consensus: Find common elements across results
   */
  consensus: (results) => {
    if (results.length < 2) return results[0]?.result;

    const allItems = results.flatMap(r =>
      Array.isArray(r.result) ? r.result : [r.result]
    );

    const counts = allItems.reduce((acc, item) => {
      const key = JSON.stringify(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Return items that appear in majority of results
    const threshold = Math.ceil(results.length / 2);
    return Object.entries(counts)
      .filter(([_, count]) => count >= threshold)
      .map(([key]) => JSON.parse(key));
  },

  /**
   * Priority: Use first non-null result
   */
  priority: (results) => {
    for (const r of results) {
      if (r.result && r.result !== 'NOT_RELEVANT' && r.result !== 'No relevant info') {
        return r.result;
      }
    }
    return null;
  },

  /**
   * Synthesize: Combine text results into summary
   */
  synthesize: (results) => {
    const relevantResults = results.filter(r =>
      r.result && r.result !== 'NOT_RELEVANT'
    );

    if (relevantResults.length === 0) {
      return 'No relevant information found across all sub-tasks.';
    }

    return relevantResults.map((r, i) =>
      `[Source ${i + 1}]: ${r.result}`
    ).join('\n\n');
  }
};

/**
 * Create a new coordinator instance
 */
export function createCoordinator() {
  return new AgentCoordinator();
}
