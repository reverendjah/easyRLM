#!/bin/bash
# Extract decisions from session transcript and save to knowledge.md
# Called by Claude Code SessionEnd hook with transcript as input

KNOWLEDGE=".claude/context/knowledge.md"
TEMP_FILE="/tmp/new-decisions-$$"

# Read transcript from stdin
TRANSCRIPT=$(cat)

# Extract lines that look like decisions (Portuguese and English)
echo "$TRANSCRIPT" | grep -iE \
  "(decidimos|escolhemos|optamos|decisão:|decision:|we chose|we decided|implemented using|using .* because)" \
  | head -20 > "$TEMP_FILE"

# Only append if we found new decisions
if [ -s "$TEMP_FILE" ]; then
  # Check for duplicates before appending
  if [ -f "$KNOWLEDGE" ]; then
    while IFS= read -r line; do
      # Only add if not already in knowledge.md
      if ! grep -qF "$line" "$KNOWLEDGE" 2>/dev/null; then
        echo "- $line" >> "$KNOWLEDGE"
      fi
    done < "$TEMP_FILE"
  else
    # Create new knowledge.md with header
    echo "# Project Knowledge" > "$KNOWLEDGE"
    echo "" >> "$KNOWLEDGE"
    echo "## Decisions" >> "$KNOWLEDGE"
    echo "" >> "$KNOWLEDGE"
    while IFS= read -r line; do
      echo "- $line" >> "$KNOWLEDGE"
    done < "$TEMP_FILE"
  fi
fi

rm -f "$TEMP_FILE"
