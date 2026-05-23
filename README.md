# Galaxy Shooter

A browser-based 3D arcade space shooter built entirely with vanilla JavaScript, Canvas 2D, and Web Audio API — no frameworks, no dependencies, no build step.

This project was built during an AWS workshop as a hands-on demonstration of **AI-assisted game development using Claude Code**, including a multi-agent pipeline where specialized AI agents each owned a phase of development.

---

## Play It

**Instant play** (no server needed):
```bash
open src/game.html
```
Just open the file in any browser. Everything is self-contained.

**Full stack** (with leaderboard):
```bash
node src/server.js &
# open http://localhost:3000/src/game.html
```

**Production** (nginx + Cloudflare tunnel):
```bash
sudo cp src/game.html /var/www/html/game.html
# nginx proxies /api/ → localhost:3000
```

---

## What's in the Game

### 3 Game Modes
| Mode | Description |
|------|-------------|
| **Campaign** | Wave-based progression. Pick 1 of 3 upgrades between each wave. |
| **Survival** | Enemies never stop spawning. Speed scales over time. Score = kills × time. |
| **Boss Rush** | Every wave is a boss fight. Defeat a boss → small heal → next boss. |

### 5 Weapons
| Key | Weapon | Style |
|-----|--------|-------|
| `1` | Laser Beam | Hold to fire continuous column |
| `2` | Spread Shot | 5-bullet fan, 250ms cooldown |
| `3` | Homing Missiles | 2 missiles that curve to nearest enemy |
| `4` | Plasma Bomb | Slow, large explosion radius |
| `5` | Railgun | Instant full-screen kill column, 2s cooldown |

### Roguelike Upgrades (Campaign)
Pick 1 of 3 random upgrades after each wave:
- Fire Rate +25%, Bullet Damage +1, Move Speed +15%, Shield Duration +3s
- Chain Radius +30px, Combo Window +0.5s, Extra Life
- Plasma Bomb Radius +40px, Railgun Cooldown −500ms
- Double Score (1 wave), Magnet (auto-collect powerups), Ricochet (bullets bounce)

### Game Feel Systems
- **Slow-motion** — kill 3+ enemies in 0.3s → 0.25× time scale for 0.4s
- **Kill streaks** — UNSTOPPABLE! (10) / GODLIKE! (20) / LEGENDARY! (50)
- **Combo multiplier** — chain kills within 1.5s for score multiplier up to 8×
- **Chain explosions** — killing one enemy can trigger nearby explosions
- **Camera shake** — boss hits, player damage, explosions
- **Rival line** — dotted gold line shows the #1 leaderboard pace in real time
- **Space Invader Formation** — classic march/drop pattern on wave 4, 8, 16…

### Leaderboard
- Node.js API server with zero npm dependencies
- Scores saved to `src/scores.json`, top 100 kept
- Name entry on game over, rank shown after submission
- Works via nginx proxy or direct localhost

---

## Project Structure

```
src/
  game.html       ← entire game (single file, ~2700 lines)
  server.js       ← leaderboard API (Node.js, no npm)
  scores.json     ← persisted high scores

archive/
  v1.html         ← original base
  v2.html         ← bullet-hell update
  v3.html         ← pseudo-3D, 5 weapons
  v4.html         ← V6 Chaos Edition snapshot
  v5.html         ← leaderboard + mobile
  v8.html         ← V8 Thai Edition snapshot

.claude/
  agents/         ← Claude Code sub-agent definitions
    game-architect.md
    gameplay-engineer.md
    ui-data-manager.md
    qa-balancer.md

AGENTS.md         ← how the multi-agent pipeline was used to build this
CHANGELOG.md      ← full version history
TODO_PIPELINE.md  ← feature backlog + pipeline prompt template
```

---

## Architecture

The entire game lives in one `<script>` tag inside `src/game.html`. It is organized into self-contained system objects:

| System | Responsibility |
|--------|---------------|
| `CFG` | All tunable values. Change behavior here first, never scatter numbers in logic. |
| `EnemyDefs` | Data for each enemy type — stats, color, movement pattern |
| `WeaponDefs` | Data for each weapon — cooldown, color, continuous flag |
| `BossPatternDefs` | Boss attack patterns — auto-discovered by BossAI at runtime |
| `Audio` | All Web Audio API synthesis. `Audio.play('name')` |
| `Input` | Keyboard + touch state |
| `FX` | Particles, shockwaves, screen shake, score popups, streak text |
| `BossAI` | Class. FSM: patrol → aggressive → enraged, driven by HP% |
| `MovementPatterns` | Swappable enemy movement functions |
| `WeaponSystem` | Pure fire logic — returns new game objects, no side effects |
| `UpgradeSystem` | Roguelike upgrade picks. `deal()`, `pick()`, `apply()`, `reset()` |
| `InvaderFormation` | Space Invader grid wave with march/drop/shoot AI |
| `LeaderboardUI` | Fetches + caches scores, draws top-10 table, `topScore()` for rival line |
| `NarratorAI` | Optional Claude Haiku API taunts with static fallback |
| `Game` (IIFE) | Main state machine + update loop + all draw functions |

### How to Extend

**Add a weapon:** Add entry to `WeaponDefs`, add `case` in `WeaponSystem.fire()`, add sound in `Audio.play()`.

**Add a boss pattern:** Add object to `BossPatternDefs` — BossAI auto-discovers it.

**Add an enemy type:** Add key to `EnemyDefs`, add movement case in `MovementPatterns`, add draw case in the renderer.

**Tune difficulty:** Edit values in `CFG` — never scatter new numbers into logic.

---

## AI Development Workflow

This project was built using **Claude Code** with a 4-agent pipeline. Each agent has a narrow role and a detailed system prompt in `.claude/agents/`:

```
game-architect → gameplay-engineer → ui-data-manager → qa-balancer
  (scaffold)        (mechanics)          (visuals)         (polish)
```

See [`AGENTS.md`](AGENTS.md) for the full breakdown of how the pipeline works and what each agent produced.

### NarratorAI (in-game)
The boss taunts you using Claude Haiku via the Anthropic API. To enable:
1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Enter it in the game's API key field (top of start screen)
3. It stays in memory only — never persisted or sent anywhere else

---

## Built With

- **Vanilla JavaScript** (ES6+) — no frameworks
- **Canvas 2D API** — all rendering
- **Web Audio API** — all sound synthesis (no audio files)
- **Node.js** (built-in `http`, `fs` modules only) — leaderboard server
- **Claude Code** — AI-assisted development CLI
- **Claude Haiku** — in-game NarratorAI taunts

---

## Version History

See [`CHANGELOG.md`](CHANGELOG.md) for the full history. Summary:

| Version | Highlight |
|---------|-----------|
| V1 | Basic 2D shooter |
| V2 | Bullet-hell boss patterns, warp transition |
| V3 | Pseudo-3D perspective, 5 weapons |
| V4 | Systems architecture refactor (CFG, BossAI FSM, data-driven design) |
| V5 | Leaderboard, name entry, mobile support, Cloudflare tunnel |
| V6 | 3 game modes, roguelike upgrades, slow-mo, kill streaks, Space Invader formation |

---

## License

MIT — do whatever you want with it.
