# AI Development Pipeline — Galaxy Shooter

This project was built using a **multi-agent Claude Code workflow**: four specialized sub-agents worked in a sequential pipeline, each owning a distinct phase of development and handing off to the next. This documents how that pipeline was designed and what each agent produced.

---

## Why Multi-Agent?

A single AI context window can lose focus across a large feature. By splitting work into agents with narrow, well-defined roles, each agent:

- Has a focused system prompt tuned to its specialty
- Cannot accidentally break concerns outside its scope
- Produces a clean handover summary for the next agent
- Can be reused independently on future features

This mirrors how a real game studio structures teams: architect → engineer → UI/data → QA.

---

## The Four Agents

### 1. `game-architect`
**Role:** Lead architect. Sets up systems, state machines, and global patterns. Never writes gameplay logic — only the scaffolding that gameplay builds on.

**Specialty:** Single-file browser games, Canvas 2D pipelines, game state machines, zero-dependency architecture.

**What it produced for the Space Invader Formation feature:**
- `CFG.invader` config block (rows, cols, spacing, march speed, shoot interval)
- `InvaderFormation` object with `init()`, `reset()`, `getScreenPos()`, `anyReachedBottom()`, `update()` stub
- `isInvaderWave()` gate function
- `spawnWave()` branch for invader waves
- `startGame()` reset integration

---

### 2. `gameplay-engineer`
**Role:** Gameplay and physics programmer. Implements mechanics, collision detection, enemy AI, and frame-rate-independent movement. Uses delta-time throughout.

**Specialty:** Player movement, combat systems, enemy state machines, collision math.

**What it produced:**
- `InvaderFormation.update()` — full march/edge-detect/drop logic (classic Space Invaders movement)
- Enemy shoot AI — random bottom-most column fires at timed intervals
- Bullet vs invader collision detection for all 5 weapons (standard bullets, spread, homing, laser, railgun)
- Player body vs invader collision (contact damage)

---

### 3. `ui-data-manager`
**Role:** UI/UX developer and data engineer. Builds HUDs, menus, visual feedback, and data flows. Never writes gameplay logic.

**Specialty:** Canvas 2D rendering, animated sprites, HUD design, data serialization.

**What it produced:**
- `drawInvaders()` — 3 enemy types (squid/crab/octopus) with 2-frame animation each
- HUD `INVASION N LEFT` counter with pulse glow effect
- `drawInvaderBanner()` — full-screen `INVASION!` entry banner with scale + fade animation

---

### 4. `qa-balancer`
**Role:** Game tester and balancing designer. Finds bugs, edge cases, and tunes numerical values.

**Specialty:** Memory leak detection, edge case testing, difficulty curves, FPS optimization.

**What it produced:**
- Fixed: laser weapon not hitting invaders
- Fixed: railgun not hitting invaders
- Fixed: alive count going negative (floored at 0)
- Balanced: march interval clamped at 0.10s minimum
- Balanced: shoot interval scales with alive-count ratio (last few invaders shoot faster — authentic to the original arcade)

---

## Pipeline Flow

```
game-architect  ──▶  gameplay-engineer  ──▶  ui-data-manager  ──▶  qa-balancer
   (scaffold)            (mechanics)              (visuals)            (polish)
```

Each agent reads the handover notes from the previous agent before starting. No agent touches another's domain.

---

## Agent Configuration

Agents are defined as Markdown files in `.claude/agents/`:

```
.claude/agents/
  game-architect.md       ← system prompt + memory system
  gameplay-engineer.md    ← system prompt
  ui-data-manager.md      ← system prompt
  qa-balancer.md          ← system prompt
```

Each file uses Claude Code's agent frontmatter format:

```markdown
---
name: gameplay-engineer
description: Gameplay and physics programmer. Use for player movement, collision...
model: claude-sonnet-4-5
---

Act as a Gameplay and Physics Programmer...
```

The `description` field is used by Claude to decide *when* to invoke the agent automatically.

---

## Features Built With This Pipeline

| Feature | Waves | Agent Pipeline Used |
|---------|-------|---------------------|
| Space Invader Formation | Wave 4, 8, 16… | All 4 agents, full pipeline |
| V6 Chaos Edition | All waves | game-architect + gameplay-engineer + ui-data-manager |
| V9 Dual Language Edition | All screens | All 4 agents, full pipeline |

---

## What This Demonstrates

- **Prompt engineering at scale** — writing system prompts that keep agents on-task across a 2600-line codebase
- **AI workflow design** — decomposing a feature into phases that map cleanly to agent roles
- **Context management** — agents hand off state via structured notes, not by sharing a context window
- **Tool use** — agents use Read, Edit, Bash, and Write tools autonomously to implement and verify changes
