// Easy RLM Library Entry Point
export { detect } from './detector.js';
export { install } from './installer.js';
export { update } from './updater.js';
export { fix } from './fixer.js';
export { validate } from './validator.js';
export { merge } from './merger.js';

// RLM Auto-Decomposition
export {
  analyzeProject,
  shouldDecompose,
  autoDecompose,
  generateDecompositionPlan
} from './decomposer.js';

// Dynamic Context Refresh
export {
  detectStaleness,
  ContextTracker,
  generateRefreshInstructions,
  createCheckpoint,
  REFRESH_CHECKPOINTS
} from './context-refresh.js';

// Recursive Sub-Agents
export {
  AGENT_HIERARCHY,
  MAX_RECURSION_DEPTH,
  AgentCoordinator,
  createCoordinator,
  generateRecursivePlan,
  generateTaskInvocation,
  AGGREGATION_STRATEGIES
} from './recursive-agents.js';
