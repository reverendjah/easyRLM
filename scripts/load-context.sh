#!/bin/bash
# Auto-load context at session start
# Called by Claude Code SessionStart hook

CONTEXT_DIR=".claude/context"

# Load Tier 1 (always)
if [ -f "$CONTEXT_DIR/project.md" ]; then
  echo "=== PROJECT CONTEXT ==="
  cat "$CONTEXT_DIR/project.md"
  echo ""
fi

# Load Tier 3 (important decisions)
if [ -f "$CONTEXT_DIR/knowledge.md" ]; then
  echo "=== PREVIOUS DECISIONS ==="
  cat "$CONTEXT_DIR/knowledge.md"
  echo ""
fi

# Load current state if resuming work
if [ -f "$CONTEXT_DIR/current.md" ]; then
  if grep -q "in Progress" "$CONTEXT_DIR/current.md" 2>/dev/null; then
    echo "=== RESUMING WORK ==="
    cat "$CONTEXT_DIR/current.md"
    echo ""
  fi
fi
