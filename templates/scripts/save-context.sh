#!/bin/bash
# Save current context - called by PreCompact hook or workflows
# This is the BACKUP layer for context persistence

CONTEXT_DIR=".claude/context"
WORKFLOW_STATE=".claude/workflow-state.json"

# Create context dir if needed
mkdir -p "$CONTEXT_DIR"

# Generate current.md from workflow state
if [ -f "$WORKFLOW_STATE" ]; then
  # Check if jq is available
  if command -v jq &> /dev/null; then
    PHASE=$(jq -r '.currentPhase // "unknown"' "$WORKFLOW_STATE" 2>/dev/null)
    HINT=$(jq -r '.resumeHint // "No active task"' "$WORKFLOW_STATE" 2>/dev/null)
    WORKFLOW=$(jq -r '.workflow // "unknown"' "$WORKFLOW_STATE" 2>/dev/null)
  else
    # Fallback: extract with grep/sed if jq not available
    PHASE=$(grep -o '"currentPhase"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKFLOW_STATE" | sed 's/.*: *"\([^"]*\)"/\1/' | head -1)
    HINT=$(grep -o '"resumeHint"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKFLOW_STATE" | sed 's/.*: *"\([^"]*\)"/\1/' | head -1)
    WORKFLOW=$(grep -o '"workflow"[[:space:]]*:[[:space:]]*"[^"]*"' "$WORKFLOW_STATE" | sed 's/.*: *"\([^"]*\)"/\1/' | head -1)
    PHASE=${PHASE:-"unknown"}
    HINT=${HINT:-"No active task"}
    WORKFLOW=${WORKFLOW:-"unknown"}
  fi

  cat > "$CONTEXT_DIR/current.md" << EOF
# Current Task

**Workflow:** $WORKFLOW
**Phase:** $PHASE
**Status:** In Progress
**Resume Hint:** $HINT
**Last Saved:** $(date '+%Y-%m-%d %H:%M:%S')

## To Resume
Run \`/$WORKFLOW\` and follow the resume hint above.
EOF
  echo "Context saved: $WORKFLOW/$PHASE"
else
  # No workflow active - just note the session timestamp
  cat > "$CONTEXT_DIR/current.md" << EOF
# Current Task

**Status:** No active workflow
**Last Updated:** $(date '+%Y-%m-%d %H:%M:%S')

No structured workflow is currently in progress.
EOF
  echo "Context saved: no active workflow"
fi
