# Easy RLM

**Transform Claude Code into a reliable software engineering partner.**

> *"The key insight is that long prompts should not be fed into the neural network directly but should instead be treated as part of the environment that the LLM can symbolically interact with."*
> — [Recursive Language Models (MIT CSAIL, 2025)](https://arxiv.org/abs/2512.24601)

---

## The Problem

Every developer using AI coding assistants has experienced this:

| Problem | What Happens |
|---------|--------------|
| **Context Rot** | Model quality degrades as conversation grows. GPT-5 drops from 100% to 20% accuracy on complex tasks as context increases. |
| **Session Amnesia** | Start a new session? The AI forgot everything about your project. |
| **Hallucination Spiral** | AI confidently generates code that doesn't match your codebase patterns. |
| **Compaction Loss** | When context is "summarized", critical details vanish forever. |
| **Inconsistent Quality** | Sometimes brilliant, sometimes useless. No reliability. |

**The research is clear:** Base LLMs fail catastrophically on long-context, information-dense tasks. On the OOLONG-Pairs benchmark, GPT-5 and Qwen3-Coder score **<0.1%** — essentially random.

---

## The Solution: Recursive Language Models

MIT CSAIL's RLM paper demonstrates a paradigm shift:

```
Traditional LLM:  [Entire Context] → Neural Network → Response
                  (context rot, hallucinations, lost details)

RLM Approach:     [Context as Environment] → Symbolic Interaction → Focused Queries
                  (maintains accuracy at 10M+ tokens)
```

### Results from the Paper

| Benchmark | Base GPT-5 | RLM (GPT-5) | Improvement |
|-----------|------------|-------------|-------------|
| BrowseComp+ (6-11M tokens) | 0%* | **91.33%** | ∞ (couldn't even run) |
| OOLONG (131K tokens) | 44% | **56.50%** | +28.4% |
| OOLONG-Pairs (32K tokens) | 0.04% | **58.00%** | +1,450x |
| CodeQA (23K-4.2M tokens) | 24%* | **62.00%** | +158% |

*\* Base model hit context limits or failed completely*

**Key insight:** RLMs maintain strong performance even at **10M+ tokens** while base models collapse.

---

## Easy RLM: RLM Principles for Claude Code

Easy RLM implements RLM principles as a practical workflow system:

### 1. Context as External Environment

Instead of stuffing everything into the prompt, Easy RLM uses **Kakaroto Fields** — a 5-tier persistent context system:

```
.claude/context/
├── project.md      # Always loaded (project identity)
├── architecture.md # Loaded for structural tasks
├── patterns.md     # Loaded when creating code
├── knowledge.md    # Searchable by keywords
└── current.md      # Session state (survives restarts)
```

**Why it works:** The AI loads only what's needed, keeping the working context small and focused. Like an RLM's REPL environment, context is *accessed programmatically*, not dumped wholesale.

### 2. Recursive Decomposition

Complex tasks are broken into phases with specialized sub-agents:

```
/feature "add user authentication"
    │
    ├── Phase 1: Understand (interview, requirements)
    ├── Phase 2: Analyze (explore codebase)
    ├── Phase 3: Strategy (test approach)
    ├── Phase 4: RED (write failing tests)
    ├── Phase 5: GREEN (implement)
    ├── Phase 6: Quality (refactor + validate)
    ├── Phase 7: E2E Validation
    ├── Phase 8: Delivery (commit + sync)
    └── Phase 9: Self-Evaluation (improve system)
```

Each phase has focused context. No context rot.

### 3. Symbolic Interaction with Codebase

Instead of the AI guessing about your code, Easy RLM workflows:
- **Search** before assuming
- **Read** before modifying
- **Validate** before committing
- **Test** before declaring done

### 4. Persistent Memory Across Sessions

```bash
# Session 1: Implement feature
> /feature "add payment processing"
# ... AI learns about your Stripe integration, error patterns, etc.

# Session 2 (days later): Debug issue
> /debug "payment failing for international cards"
# AI already knows your payment architecture from context/knowledge.md
```

**No more re-explaining your project every session.**

---

## Installation

```bash
npx easyrlm
```

That's it. One command that:
- **New project?** Full installation
- **Existing setup?** Smart update (preserves your customizations)
- **Broken files?** Auto-repair
- **Already configured?** Status report

### What Gets Installed

```
.claude/
├── CLAUDE.md              # Your rules (preserved on updates)
├── ARCHITECTURE.md        # System overview
├── commands/
│   ├── feature.md         # 9-phase feature workflow
│   ├── debug.md           # 6-phase debug workflow
│   ├── gate.md            # Quality validation
│   └── [playbooks]        # Category-specific guides
├── agents/                # 8 specialized sub-agents
├── context/               # Kakaroto Fields (your project memory)
└── templates/             # Reusable templates
```

**64 files, 15,000+ lines of battle-tested workflow logic.**

---

## Usage

### Implementing Features

```bash
claude
> /feature "add dark mode toggle"
```

The AI will:
1. Interview you about requirements
2. Analyze your existing codebase
3. Propose a test strategy (TDD)
4. Write failing tests first
5. Implement minimal code to pass
6. Refactor and validate quality
7. Run E2E validation
8. Commit with proper message
9. Self-evaluate and improve

**No more "here's some code, good luck" responses.**

### Debugging Issues

```bash
claude
> /debug "users can't log in after password reset"
```

The AI will:
1. Reproduce the bug (with evidence)
2. Investigate root cause (not symptoms)
3. Implement surgical fix
4. Verify fix + create regression test
5. Commit and document
6. Evaluate debugging process

**No more "try adding a console.log" suggestions.**

### Quality Gate

```bash
claude
> /gate
```

Runs comprehensive validation:
- All tests pass
- TypeScript compiles
- Build succeeds
- Code review (security, types, quality)
- Visual validation (if UI changes)
- Environment consistency (if config changes)

---

## Why Easy RLM Works

### The Science

From the RLM paper:

> *"RLMs demonstrate extremely strong performance even at the 10M+ token scale, and dramatically outperform all other approaches at long-context processing, in most cases by double-digit percentage gains while maintaining a comparable or lower cost."*

Easy RLM applies these principles:

| RLM Principle | Easy RLM Implementation |
|---------------|------------------------|
| Context as environment | Kakaroto Fields (.claude/context/) |
| Recursive sub-calls | Specialized agents (code-reviewer, test-fixer, etc.) |
| Symbolic manipulation | Workflow phases with focused queries |
| REPL persistence | Git-versioned markdown files |

### The Guarantee

Unlike MCP Memory servers that:
- Require running servers
- Can timeout or crash
- Lose data on compaction
- Only work locally

**Easy RLM uses files + Git:**
- No servers required
- No timeouts possible
- Git preserves everything
- Clone = full memory transfer

---

## The Vision

We believe AI-assisted development should be:

- **Reliable** — Same quality every time, not random brilliance
- **Persistent** — Knowledge accumulates, never resets
- **Structured** — Clear workflows, not chaos
- **Trustworthy** — Test-driven, validated, verified

**Easy RLM is our contribution to making this real.**

This is an open-source project for the community. We want every developer using Claude Code to experience what reliable AI assistance feels like.

---

## Comparison

| Aspect | Vanilla Claude Code | Easy RLM |
|--------|--------------------|--------------------|
| Context management | Compaction (lossy) | Kakaroto Fields (persistent) |
| Session continuity | Lost on restart | Preserved in context/ |
| Code quality | Variable | Enforced (TDD, quality gates) |
| Debugging | Ad-hoc suggestions | 6-phase systematic workflow |
| Features | "Here's code" | 9-phase TDD workflow |
| Learning | Starts fresh | Accumulates in knowledge.md |

---

## New in v1.1: Closer to Paper RLM

Version 1.1 adds four key improvements based on the RLM paper recommendations:

### 1. Benchmark Suite

Compare Easy RLM vs base model performance:

```bash
npm run benchmark                 # Run all benchmarks
npm run benchmark:compare         # Side-by-side comparison
node benchmark/bin/benchmark.js --help
```

Includes implementations of:
- **S-NIAH** — Needle-in-a-haystack (O(1) retrieval)
- **OOLONG** — Semantic aggregation (O(N) complexity)
- **OOLONG-Pairs** — Pairwise comparison (O(N²) complexity)
- **CodeQA** — Code understanding

### 2. Auto-Decomposition

Context manager now auto-triggers RLM decomposition for large codebases:

| Project Size | Trigger | Strategy |
|--------------|---------|----------|
| < 100 files | — | Direct queries |
| 100-200 files | Automatic | Chunked decomposition |
| > 200 files | Automatic | Recursive sub-agents |

No manual configuration needed.

### 3. Dynamic Context Refresh

Workflows now auto-refresh context when:
- Files are not found where expected
- Functions are undefined
- Types don't match
- Working across 3+ modules

The system re-queries the codebase and updates `knowledge.md` with discoveries.

### 4. Recursive Sub-Agents

Agents can now invoke other agents when needed:

```
code-reviewer
  └── can invoke → test-fixer (when fixes break tests)
  └── can invoke → Explore (when reviewing unfamiliar code)

test-fixer
  └── can invoke → Explore (when tests reference unknown modules)
```

Maximum recursion depth: 2-3 levels (prevents infinite loops).

---

## Project Structure

```
easyrlm/
├── bin/cli.js           # CLI entry point
├── lib/
│   ├── detector.js      # Detect project state
│   ├── installer.js     # Full installation
│   ├── updater.js       # Smart updates
│   ├── fixer.js         # Repair broken files
│   ├── merger.js        # Merge CLAUDE.md intelligently
│   ├── validator.js     # Validate installation
│   ├── decomposer.js    # Auto-decomposition logic
│   ├── context-refresh.js # Dynamic refresh system
│   └── recursive-agents.js # Agent coordination
├── benchmark/
│   ├── bin/benchmark.js # Benchmark CLI
│   ├── lib/             # Runner, evaluators, reporter
│   ├── adapters/        # Claude base vs RLM adapters
│   └── benchmarks/      # S-NIAH, OOLONG, CodeQA
├── templates/.claude/   # All workflow files
└── package.json
```

---

## Contributing

We welcome contributions! Areas of interest:

- **New playbooks** — Domain-specific workflows (mobile, ML, etc.)
- **Agent improvements** — Smarter sub-agents
- **Translations** — Help translate remaining files to English
- **Documentation** — Tutorials, examples, case studies

---

## Research Foundation

Easy RLM is inspired by and builds upon:

- **[Recursive Language Models](https://arxiv.org/abs/2512.24601)** (Zhang, Kraska, Khattab — MIT CSAIL, 2025)
- **[Context Rot Research](https://research.trychroma.com/context-rot)** (Hong et al., 2025)
- **[OOLONG Benchmark](https://arxiv.org/abs/2511.02817)** (Bertsch et al., 2025)

---

## License

MIT — Use freely, contribute back.

---

<p align="center">
  <b>Stop fighting your AI assistant. Start collaborating with it.</b>
  <br><br>
  <code>npx easyrlm</code>
</p>
