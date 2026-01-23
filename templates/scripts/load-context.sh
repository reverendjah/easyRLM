#!/bin/bash
# Auto-load context at session start
# Called by Claude Code SessionStart hook

CONTEXT_DIR=".claude/context"

# Check if context needs deep indexing
needs_indexing() {
  # No knowledge.md = needs indexing
  [ ! -f "$CONTEXT_DIR/knowledge.md" ] && return 0

  # Has placeholders = needs indexing
  grep -qE "\{(Nome|Project|Titulo|Tecnologia|TIMESTAMP|DATA|YYYY)\}" \
    "$CONTEXT_DIR/knowledge.md" 2>/dev/null && return 0

  # Also check project.md for placeholders
  grep -qE "\{(Nome do Projeto|Project Name|Uma frase)\}" \
    "$CONTEXT_DIR/project.md" 2>/dev/null && return 0

  # Context exists and has real content
  return 1
}

# Detect if auto-indexing is needed
if needs_indexing; then
  echo "---AUTO-INDEX-REQUIRED---"
  echo "First-time setup: Project context needs indexing."
  exit 0
fi

# Normal context loading continues...

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
