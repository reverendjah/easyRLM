// Benchmark Evaluators - Scoring functions for different benchmark types

/**
 * Exact match evaluator
 * Returns true if answer exactly matches expected
 */
export function exactMatch(expected, actual) {
  if (typeof expected === 'string' && typeof actual === 'string') {
    return expected.trim().toLowerCase() === actual.trim().toLowerCase();
  }
  return expected === actual;
}

/**
 * Contains evaluator
 * Returns true if actual contains expected
 */
export function contains(expected, actual) {
  if (typeof expected === 'string' && typeof actual === 'string') {
    return actual.toLowerCase().includes(expected.toLowerCase());
  }
  return false;
}

/**
 * Set match evaluator for multi-value answers
 * Returns fraction of expected items found
 */
export function setMatch(expected, actual) {
  if (!Array.isArray(expected)) {
    expected = [expected];
  }

  if (typeof actual === 'string') {
    const actualLower = actual.toLowerCase();
    const found = expected.filter(e =>
      actualLower.includes(e.toString().toLowerCase())
    );
    return found.length === expected.length;
  }

  return false;
}

/**
 * Numeric evaluator with tolerance
 * Returns true if actual is within tolerance of expected
 */
export function numericMatch(expected, actual, tolerance = 0.01) {
  const expectedNum = parseFloat(expected);
  const actualNum = parseFloat(actual);

  if (isNaN(expectedNum) || isNaN(actualNum)) {
    return false;
  }

  return Math.abs(expectedNum - actualNum) <= tolerance * Math.abs(expectedNum);
}

/**
 * Aggregation evaluator for O(N) tasks
 * Checks if the answer correctly aggregates information
 */
export function aggregationMatch(expected, actual) {
  // For aggregation tasks, the answer should include all expected items
  if (Array.isArray(expected)) {
    const actualLower = (actual || '').toLowerCase();
    return expected.every(item =>
      actualLower.includes(item.toString().toLowerCase())
    );
  }
  return contains(expected, actual);
}

/**
 * Pair verification evaluator for O(N²) tasks
 * Checks if pairs are correctly identified
 */
export function pairMatch(expectedPair, actual) {
  const [item1, item2] = expectedPair;
  const actualLower = (actual || '').toLowerCase();

  // Both items must be mentioned
  const hasItem1 = actualLower.includes(item1.toLowerCase());
  const hasItem2 = actualLower.includes(item2.toLowerCase());

  return hasItem1 && hasItem2;
}

/**
 * Code location evaluator
 * Checks if the answer contains correct file:line reference
 */
export function codeLocationMatch(expected, actual) {
  if (!expected.file || !expected.line) {
    return contains(expected.answer, actual);
  }

  const actualLower = (actual || '').toLowerCase();
  const hasFile = actualLower.includes(expected.file.toLowerCase());
  const hasLine = actualLower.includes(expected.line.toString());

  return hasFile && hasLine;
}

/**
 * Semantic similarity evaluator (simplified)
 * Checks if key concepts from expected are present in actual
 */
export function semanticSimilarity(expected, actual, threshold = 0.5) {
  if (typeof expected !== 'string' || typeof actual !== 'string') {
    return false;
  }

  // Extract key words (simple tokenization)
  const expectedWords = expected.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const actualLower = actual.toLowerCase();

  // Count how many expected words appear in actual
  const found = expectedWords.filter(w => actualLower.includes(w));
  const score = expectedWords.length > 0 ? found.length / expectedWords.length : 0;

  return score >= threshold;
}

export const evaluators = {
  exactMatch,
  contains,
  setMatch,
  numericMatch,
  aggregationMatch,
  pairMatch,
  codeLocationMatch,
  semanticSimilarity
};
