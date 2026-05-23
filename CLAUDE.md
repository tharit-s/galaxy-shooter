# Galaxy Shooter — Claude Code Context

## The one file you work on
**`src/game.html`** — this is the only file you edit. Everything else is read-only.

## Project overview
Browser-based arcade space shooter. Canvas 2D + Web Audio API. Zero external dependencies.
Single self-contained HTML file, runs by opening in a browser (no build step).

## How to run

**Game only (no leaderboard):**
```bash
python3 -m http.server 8080
# then open http://localhost:8080/src/game.html
```
Or just open `src/game.html` directly in a browser.

**Full stack (game + leaderboard API):**
```bash
node src/server.js &
# then open http://localhost:3000/src/game.html
# API available at http://localhost:3000/api/scores
```

**Production (nginx on port 80, proxies /api/ to Node):**
```bash
# nginx must be running — already configured on this server
# nginx proxies /api/ → localhost:3000
# deploy: sudo cp src/game.html /var/www/html/game.html
```

## Directory layout
```
src/          ← active code (edit here)
  game.html   ← the game, current version (only file to edit)
  server.js   ← Node.js leaderboard API server (port 3000)
  scores.json ← persisted leaderboard data (top 100 scores)

archive/      ← read-only history (never edit)
  v1.html       ← original base (V1)
  v2.html       ← bullet-hell update (V2)
  v3.html       ← pseudo-3D update (V3)
  v4.html       ← systems architecture refactor (V4)
  v5.html       ← leaderboard + mobile (V5)
  v6-pre.html   ← pre-Chaos Edition snapshot
  v7.html       ← mobile polish (V7)
  v8.html       ← Thai Edition snapshot (V8)
  enemies-patch.js  ← enemy AI reference from V3 era
  polish-patch.js   ← particle/audio reference from V3 era

.claude/agents/  ← Claude Code sub-agent definitions
  game-architect.md
  gameplay-engineer.md
  ui-data-manager.md
  qa-balancer.md

AGENTS.md     ← multi-agent pipeline — how the project was built with AI
CHANGELOG.md  ← feature history, keep updated after each change
TODO_PIPELINE.md ← feature backlog + pipeline prompt template
CLAUDE.md     ← this file
```

## Architecture of src/game.html
Each system is a self-contained object — read the section headers:

| System | Responsibility |
|--------|---------------|
| `CFG` | All magic numbers and tunable values. Change behavior here first. |
| `EnemyDefs` | Data for each enemy type (stats, color, pattern name) |
| `WeaponDefs` | Data for each weapon (name, color, cooldown, continuous flag) |
| `BossPatternDefs` | Data for each boss attack pattern (cooldown, min phase, shoot fn) |
| `Audio` | All Web Audio API synthesis. `Audio.play(name)` |
| `Input` | Keyboard + touch state. Read `Input.left`, `Input.right`, `Input.fire` |
| `FX` | Particles, shockwaves, score popups, screen shake. `FX.spawn*()` |
| `BossAI` | Class. FSM: patrol → aggressive → enraged. Reads `BossPatternDefs`. |
| `MovementPatterns` | Named movement functions. `MovementPatterns[e.pattern](e, dt)` |
| `WeaponSystem` | Fire logic per weapon. Reads `WeaponDefs`. |
| `Renderer` | All draw functions. No game logic inside. |
| `NarratorAI` | Optional Claude API taunts. Falls back gracefully with no key. |
| `LeaderboardUI` | Fetches/caches scores from API, draws leaderboard panel. `LeaderboardUI.drawLeaderboard(ctx,x,y)`, `topScore()` |
| `NameInput` | State object for game-over name entry (active, value, submitted, savedMsg, _el, _submitBtn, etc.) |
| `UpgradeSystem` | Roguelike upgrade picks between waves. `deal()`, `pick()`, `apply()`, `reset()` |
| `InvaderFormation` | Space Invader grid wave. `init()`, `update()`, `reset()`, `getScreenPos()` |
| `Game` | Main state machine + update loop. Calls all other systems. |

## How to extend (tell Claude which of these applies)

**Add a weapon:**
1. Add entry to `WeaponDefs` array
2. Add `case` in `WeaponSystem.fire()`
3. Add sound in `Audio.play()` switch

**Add a boss pattern:**
1. Add object to `BossPatternDefs` — `{ name, cooldown, minPhase, shoot(bx,by,...) }`
2. Done — `BossAI` auto-discovers it

**Add an enemy type:**
1. Add key to `EnemyDefs`
2. Add movement case in `MovementPatterns` if new movement needed
3. Add draw case in `Renderer.drawEnemy()`

**Tune difficulty:**
- Edit values in `CFG` — don't scatter new numbers into logic

## Claude API (NarratorAI)
- Uses `claude-haiku-4-5-20251001` for low-latency taunts
- API key entered in-page, stays in memory only, never persisted
- Falls back to static messages if no key or API error
- **Security**: direct browser calls are fine for local dev/demos only

## Versioning convention
When making a significant change, save a copy before editing:
```bash
cp src/game.html archive/v9.html
```
Then edit `src/game.html`. This keeps rollback easy.
Current version in archive: v1, v2, v3, v4, v5, v6-pre, v7, v8. Next archive will be v9.

## Things to never do
- Do not edit anything in `archive/` — it's history
- Do not add external script tags or CDN dependencies
- Do not split the game into multiple files (single-file is a feature)
- Do not add a build step
