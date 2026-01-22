---
name: context-manager
description: "RLM-style context loader. Loads Kakaroto fields selectively based on task. For large codebases (100+ files), decomposes into sub-agent calls. Use at session start or when context refresh needed."
tools: Read, Grep, Glob, Task, Bash
model: sonnet
---

# Context Manager Protocol

Load project context using RLM (Recursive Language Models) patterns.

**CORE PRINCIPLE**: Load MINIMUM necessary. Search on demand. **AUTO-DECOMPOSE if large.**

---

## Phase 0: DETECT STATE

```bash
# Check if project was already indexed
ls .claude/context/project.md 2>/dev/null && echo "INDEXED" || echo "NOT_INDEXED"
```

### If NOT_INDEXED
```
Invoke: Task(context-indexer, "Index this project for the first time")
Wait for completion before proceeding.
```

### If INDEXED
Continue to Phase 1.

---

## Phase 1: LOAD TIER 1 (ALWAYS)

**File**: `.claude/context/project.md`

```bash
cat .claude/context/project.md
```

Extract and memorize:
- Tech stack
- Main commands
- Folder structure
- Entry points

**REQUIRED**: Always load this file.

---

## Phase 2: LOAD TIER 2 (ON DEMAND)

Load based on keywords in user request:

| Keywords in Request | File to Load |
|--------------------|--------------|
| architecture, module, flow, integration, how it works | `architecture.md` |
| pattern, example, how to, template, create new | `patterns.md` |
| why, decision, history, problem, pitfall | `knowledge.md` |

```bash
# Example: if request mentions "architecture"
cat .claude/context/architecture.md
```

**RULE**: DO NOT load if keywords don't appear.

---

## Phase 3: LOAD STATE (IF RESUMING)

**File**: `.claude/context/current.md`

```bash
cat .claude/context/current.md
```

If file contains "Feature in Progress" or "Debug in Progress":
- Inform user: "Resuming previous work on {feature/debug}"
- Load relevant context (modified files, decisions)

---

## Phase 4: AUTO-DETECT CODEBASE SIZE

**AUTOMATIC TRIGGER** - Always run this check:

```bash
# Count code files and estimate tokens
CODE_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) 2>/dev/null | grep -v node_modules | grep -v dist | wc -l | tr -d ' ')
echo "CODE_FILES: $CODE_FILES"

# Estimate tokens (~100 tokens per file average)
ESTIMATED_TOKENS=$((CODE_FILES * 100))
echo "ESTIMATED_TOKENS: $ESTIMATED_TOKENS"
```

### Auto-Classification & Strategy

| Metric | Classification | Strategy | Action |
|--------|----------------|----------|--------|
| < 50 files OR < 10K tokens | SMALL | Direct | Normal Grep/Read |
| 50-100 files OR 10K-50K tokens | MEDIUM | Selective | Filter by folder |
| > 100 files OR > 50K tokens | LARGE | **AUTO-RLM** | **Trigger decomposition** |
| > 200 files OR > 100K tokens | XLARGE | **RECURSIVE** | **Nested sub-agents** |

**IMPORTANT**: For LARGE/XLARGE, **automatically proceed to Phase 5** without asking.

---

## Phase 5: AUTO-RLM DECOMPOSITION

**WHEN**: AUTO-TRIGGERED for LARGE/XLARGE codebases.

### Step 5.1: Identify Modules

```bash
# Get top-level directories with code
ls -d */ 2>/dev/null | head -10
```

### Step 5.2: Generate Decomposition Plan

For the user's task, create parallel sub-tasks:

```
TASK: "{original_user_task}"

DECOMPOSITION:
├── Sub-task 1: Analyze {dir1}/ for relevance to task
├── Sub-task 2: Analyze {dir2}/ for relevance to task
├── Sub-task 3: Analyze {dir3}/ for relevance to task
├── Sub-task 4: Analyze {dir4}/ for relevance to task
└── Sub-task 5: Analyze {dir5}/ for relevance to task (max 5 parallel)

AGGREGATION: Synthesize findings into final response
```

### Step 5.3: Execute Sub-Agents (PARALLEL)

```
# Execute ALL sub-tasks in PARALLEL using Task tool
Task(Explore, "Analyze {dir1}/ for: {task}", scope="{dir1}")
Task(Explore, "Analyze {dir2}/ for: {task}", scope="{dir2}")
Task(Explore, "Analyze {dir3}/ for: {task}", scope="{dir3}")
...
```

**RULES**:
- Maximum 5 parallel sub-tasks
- Each sub-task scoped to specific directory
- If sub-task times out, continue with others
- If all sub-tasks fail, fall back to Tier 3 (keyword search)

### Step 5.4: Aggregate Results

Collect responses from all sub-agents and synthesize:

```
SUB-TASK RESULTS:
- {dir1}: {finding or "No relevant info"}
- {dir2}: {finding or "No relevant info"}
- ...

SYNTHESIS: Based on findings, {final_answer}
```

### Recursive Decomposition (XLARGE only)

If a sub-task directory is itself > 50 files:

```
Sub-task for {large_dir}/:
├── Sub-sub-task 1: {large_dir}/module1/
├── Sub-sub-task 2: {large_dir}/module2/
└── Sub-sub-task 3: {large_dir}/module3/
```

**MAX RECURSION DEPTH**: 2 levels

---

## Phase 6: DYNAMIC CONTEXT REFRESH

**TRIGGER**: Mid-task, if any of these conditions:
- Error mentions file/function not found in current context
- User asks follow-up question touching different area
- Task spans > 3 different modules

**ACTION**:
```
1. Re-run Phase 4 (size check)
2. Re-grep for new keywords
3. Load additional Tier 2 files if needed
4. Update working context
```

---

## Phase 7: SYNC AT END (IF WORK WAS DONE)

At end of feature or debug:

### Update current.md
```markdown
## Active Session
Started at: {now}
Type: {feature|debug}

## Feature in Progress
Name: {from context}
Phase: {current phase}
Modified Files: {list}
```

### Update knowledge.md (if discovered something)
Criteria: Took > 15 min to discover AND not obvious from code.

### Update patterns.md (if created new pattern)
Criteria: Code that will be reused AND follows project conventions.

---

## Required Output

```
---AGENT_RESULT---
STATUS: PASS | FAIL
PROJECT_INDEXED: true | false
FIELDS_LOADED: [project.md, architecture.md, ...]
CODEBASE_SIZE: small | medium | large | xlarge
RLM_DECOMPOSITION: true | false
RLM_SUBTASKS: {number of parallel tasks executed}
CONTEXT_REFRESHED: true | false
BLOCKING: false
---END_RESULT---
```

---

## Quick Reference

```
PHASE 0: Detect if project indexed (if not, call context-indexer)
PHASE 1: ALWAYS load project.md
PHASE 2: Load Tier 2 by keywords in request
PHASE 3: Load current.md if resuming work
PHASE 4: AUTO-DETECT size → trigger decomposition if large
PHASE 5: AUTO-RLM for large codebases (no user prompt needed)
PHASE 6: DYNAMIC refresh mid-task if context stale
PHASE 7: Sync fields at end of work

AUTO-TRIGGER THRESHOLDS:
- > 100 files OR > 50K tokens → AUTO-RLM
- > 200 files OR > 100K tokens → RECURSIVE

TIER 1 (always): project.md
TIER 2 (on demand): architecture.md, patterns.md
TIER 3 (search): knowledge.md
VOLATILE: current.md
```
