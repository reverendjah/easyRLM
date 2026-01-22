#!/bin/bash
# Auto-index project context at install time
# Idempotent: safe to run multiple times

CONTEXT_DIR=".claude/context"
PROJECT_FILE="$CONTEXT_DIR/project.md"

# Skip if project.md already has real content (not template)
if [ -f "$PROJECT_FILE" ]; then
  # Check for common placeholder patterns
  if ! grep -qE "\{(Nome do Projeto|Project Name|name|description)\}" "$PROJECT_FILE" 2>/dev/null; then
    echo "Context already initialized - skipping"
    exit 0
  fi
fi

# Detect project type and extract info
PROJECT_TYPE="unknown"
PROJECT_NAME=""
PROJECT_DESC=""

if [ -f "package.json" ]; then
  PROJECT_TYPE="node"
  PROJECT_NAME=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | head -1 | sed 's/.*: *"\([^"]*\)"/\1/')
  PROJECT_DESC=$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | head -1 | sed 's/.*: *"\([^"]*\)"/\1/')
elif [ -f "pyproject.toml" ]; then
  PROJECT_TYPE="python"
  PROJECT_NAME=$(grep -o 'name = "[^"]*"' pyproject.toml | head -1 | sed 's/name = "\([^"]*\)"/\1/')
elif [ -f "go.mod" ]; then
  PROJECT_TYPE="go"
  PROJECT_NAME=$(head -1 go.mod | sed 's/module //')
elif [ -f "Cargo.toml" ]; then
  PROJECT_TYPE="rust"
  PROJECT_NAME=$(grep -o 'name = "[^"]*"' Cargo.toml | head -1 | sed 's/name = "\([^"]*\)"/\1/')
fi

# Fallback to folder name
[ -z "$PROJECT_NAME" ] && PROJECT_NAME=$(basename "$PWD")

# Count code files
CODE_FILES=$(find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) 2>/dev/null | grep -v node_modules | grep -v venv | grep -v .next | wc -l | tr -d ' ')

# Get folder structure (top 2 levels)
FOLDERS=$(find . -type d -maxdepth 2 -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/venv/*" -not -path "*/__pycache__/*" 2>/dev/null | sort | head -20 | sed 's|^\./||' | grep -v "^\.$" | sed 's/^/  /')

# Ensure context dir exists
mkdir -p "$CONTEXT_DIR"

# Generate project.md with real data
cat > "$PROJECT_FILE" << EOF
# $PROJECT_NAME

> **TIER 1 - CORE**: This file is loaded at the start of every session.

---

## Description

${PROJECT_DESC:-"$PROJECT_TYPE project auto-indexed by easyRLM."}

---

## Stack

| Layer | Technology |
|-------|------------|
| Type | $PROJECT_TYPE |
| Files | $CODE_FILES code files |

---

## Structure

\`\`\`
$FOLDERS
\`\`\`

---

## Quality Gates

- [ ] Tests passing
- [ ] Build without errors

---

*Auto-indexed at: $(date '+%Y-%m-%d %H:%M')*
*For full details, run context-indexer agent in Claude.*
EOF

echo "Context initialized: $PROJECT_NAME ($PROJECT_TYPE, $CODE_FILES files)"
