# Galaxy Shooter — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [V9.2] — 2026-05-23 — DOCS & DEPLOYMENT NOTES

### Documentation
- **README**: clarified leaderboard is unavailable on GitHub Pages (static frontend only); added local vs online play instructions with explicit note that gameplay works fully without backend
- **CLAUDE.md**: added deployment notes section explaining GitHub Pages limitation and path to enable full leaderboard via a Node.js host
- **CHANGELOG**: all post-V9 fixes (V9.0.1, V9.1) now documented

---

## [V9.1] — 2026-05-23 — BUG FIXES & GAME OVER POLISH

### Fixed
- **Leaderboard not opening on first tap (mobile)** — button rects were only stored after a draw frame; pre-computed with `computeGameOverBtns()` / `computeLeaderboardOverlayBtns()` so hit-testing works immediately on first tap
- **Game restarting instead of opening leaderboard** — `onStart` now guards against `NameInput.submitted`, preventing synthesized browser click events from restarting while the post-game screen is shown
- **Leaderboard overlay blank (loading race)** — `LeaderboardUI` now tracks `loading` / `fetchFailed` flags; `drawLeaderboard()` shows "LOADING SCORES…" while the fetch is in progress, "SCORES UNAVAILABLE" on network error, "NO SCORES YET" if empty

### Added
- **HOME button on game over screen** — purple ⌂ button lets players return to the start screen and pick a different mode without restarting; works on both the post-game screen and the leaderboard overlay
- **`goHome()` function** — cleanly resets all game-over state and returns to `STATE.START`
- **Leaderboard loading strings** — `lbLoading`, `lbEmpty`, `lbError` keys added in both EN and TH

### Improved
- **Game over buttons enlarged** — RESTART / SCORES / HOME buttons increased to 110×50px (from 90×34px) to meet Apple's 44pt minimum tap target on mobile
- **`onStart` guard** — added `!NameInput.submitted` check so tapping anywhere on the game-over screen after submission no longer accidentally restarts the game

---

## [V9.0.1] — 2026-05-23 — GAMEPLAY FIXES & UPGRADES COMPLETE

### Fixed
- **Ricochet upgrade** — `player._ricochet` flag was set by UpgradeSystem but bounce logic was never wired; bullets now reflect off left/right screen edges once (`_bounced` flag prevents infinite loop)
- **Bullet Damage upgrade** — `player._bulletDamage` was ignored by `fireSpread()` and `fireHoming()`; both now read `player._bulletDamage || 1` so the upgrade applies correctly
- **Double Score wave reset** — `player._doubleScore` persisted across waves; now cleared at the start of `initWarp()` and `doWarpAfterUpgrade()` so it correctly lasts only one wave

### Added
- **Railgun Split upgrade** — picking the railgun cooldown upgrade twice now fires 3 beams (offsets −100/0/+100px); boss takes up to 15 damage per shot; `drawRailgunFlash()` renders all beams
- **Mobile soft keyboard fix** — `visualViewport.resize` listener slides canvas up when soft keyboard opens during name entry; `clearCanvasShift()` resets on submit or restart; `CSS transition: transform 0.15s ease` for smooth animation
- **Start screen redesign** — top-anchored layout with weapon chips, mode tabs, and dividers; no more text overlap on mobile

---

## [V9] — 2026-05-23 — DUAL LANGUAGE EDITION

### Added
- **Dual language support** — English and Thai, switchable at any time without restarting
- **`STRINGS` object** — all UI text (`en` / `th` keys) centralised in one place; no hardcoded strings in draw functions
- **`t(key)` helper** — single call to look up the active language string
- **`upgradeLabel(id)` / `upgradeDesc(id)`** — helpers to resolve upgrade card text from STRINGS
- **Language toggle button** — small pill rendered bottom-right corner on every screen (canvas-drawn, tap/click to switch)
- **`L` keyboard shortcut** — toggles language from any screen (except during name entry which uses `L` for leaderboard; that binding remains `STATE.GAMEOVER`-only)
- **English is the default** — `CFG.lang = 'en'` on launch
- **In-game changelog entry** — V9 appears in the C-key changelog screen
- **Archive** — V8 Thai Edition saved to `archive/v8.html` before this change

### Changed
- `CFG.streaks` — replaced `label` fields with `key` fields (resolved via `t()` at runtime so text changes with language)
- `CFG.upgradeDefs` — removed hardcoded `label`/`desc` from each entry (now resolved via `upgradeLabel()`/`upgradeDesc()`)
- `CFG.modes` / `CFG.modeDescs` replaced by `CFG.modeKeys` / `CFG.modeDescKeys` (string keys, not values)
- All `fillText()` calls in `drawHUD`, `drawWarp`, `drawInvaderBanner`, `drawTouchControls`, `drawStart`, `drawUpgradeScreen`, `drawPause`, `drawGameOver`, `LeaderboardUI.drawLeaderboard` — now call `t(key)` instead of hardcoded Thai
- Title tag updated to `Galaxy Shooter V9`
- Start screen version label shows `V9 — DUAL LANG` (EN) / `V9 — สองภาษา` (TH)

---

## [V8] — 2026-05-22 — รุ่นไทย (THAI EDITION)

### Changed — Full Thai Localization
- All in-game UI text translated to Thai for Thai players
- **CFG data**: `CFG.streaks` labels, `CFG.modes`, `CFG.modeDescs`, all 12 `CFG.upgradeDefs` labels and descriptions
- **HUD**: คะแนน (Score), สูงสุด (Hi), ด่าน (Wave), โล่ (Shield), บูสต์ (Speed), คอมโบ (Combo), กำลังชาร์จ (Charging), อันดับ 1 (Rival line)
- **Upgrade screen**: เลือกอัพเกรด (Choose Upgrade), แตะการ์ด / กด 1/2/3 (instructions)
- **Start screen**: version label updated to `V8 — รุ่นไทย`, all instructions and mode hints in Thai
- **Pause**: หยุดชั่วคราว (Paused)
- **Game Over**: เกมจบแล้ว, ใส่ชื่อของคุณ, บันทึก (Submit), ตารางคะแนน (Leaderboard)
- **Invasion banner**: บุกแล้ว!, หยุดพวกมัน! (Stop them!)
- **Touch controls**: ยิง (Fire button)
- **Leaderboard**: นักบินสูงสุด (Top Pilots), full header row in Thai

### Kept in English
- `GALAXY SHOOTER` (brand name / title)
- Weapon names: LASER, SPREAD, HOMING, PLASMA, RAIL (technical terms)
- Numeric values

---

## [V7] — 2026-05-22 — MOBILE POLISH

### Fixed
- **Upgrade screen broken on mobile** — taps were unreliable (canvas `click` has 300ms delay on mobile browsers); replaced with `touchstart` intercept in `onTouchIntercept` for instant response
- **Accidental game restart during upgrade screen** — tapping blank space on upgrade screen no longer triggers `onStart`; intercept returns `true` for all upgrade-screen touches
- **Start screen mode selector inaccessible on mobile** — keyboard-only ArrowLeft/ArrowRight; now has visible `<` / `>` tap buttons flanking the mode name

### Added
- **Responsive upgrade card layout** — detects canvas width < 480px (portrait/phone) and stacks cards vertically (full-width, 90px tall each) for comfortable tapping; horizontal layout retained on desktop/tablet
- **Context-aware hint text** — upgrade screen shows "TAP A CARD" on touch devices, "PRESS 1 / 2 / 3 or click" on desktop
- **Mode arrow buttons on start screen** — two 52×52 pill buttons rendered on touch devices for CAMPAIGN / SURVIVAL / BOSS RUSH selection
- `CFG.upgradeCard` — all card layout values (breakpoint, dimensions, gaps, font sizes) centralized
- `CFG.modeArrow` — arrow button dimensions for start screen

### Changed
- `onTouchIntercept` — extended to handle `STATE.UPGRADE` and `STATE.START` touch events in addition to `STATE.GAMEOVER`

---

## [V6] — 2026-05-22 — CHAOS EDITION

### Added
- **Three game modes** — CAMPAIGN / SURVIVAL / BOSS RUSH selector on start screen (arrow keys or tap)
  - **Campaign**: original wave-based progression with upgrade picks between waves
  - **Survival**: enemies never stop spawning, speed scales with time, score = kills × time
  - **Boss Rush**: every wave is a boss fight; defeat boss = +1 life (up to 3) + instant next boss
- **Roguelike upgrade system** (Campaign only) — after each wave, pick 1 of 3 random upgrades:
  - 12 upgrade types: Fire Rate+, Bullet Damage+, Move Speed+, Shield Duration+, Chain Radius+,
    Combo Window+, Extra Life, Plasma Bomb Radius+, Railgun Cooldown−, Double Score (1 wave),
    Magnet (auto-collect powerups), Ricochet flag
  - Upgrade card UI — 3 glowing cards, pick with 1/2/3 keys or tap
- **Time scaling / slow-motion** — killing 3+ enemies in 0.3s triggers 0.25× slow-mo for 0.4s, lerps back
- **Kill streak announcements** — UNSTOPPABLE! (10 kills), GODLIKE! (20 kills), LEGENDARY! (50 kills)
  - Large glowing text with screen shake + audio hit
- **Rival score ghost line** — dotted gold line in HUD shows where #1 leaderboard score would be; disappears once beaten
- **"NEW #1!" event** — crossing the top leaderboard score mid-run triggers fanfare + fireworks + streak text
- **Weapon-colored screen flashes** — each kill flashes the weapon's color instead of plain white
- **Mega boss death** — 3 particle waves (50+30+20) + full screen shake + 1s slow-mo (via timeScale)
- **Magnet upgrade** — powerups home toward player within 120px when magnet is active
- **Mode label** in HUD (top-right) for non-campaign modes

### Changed
- `awardKill()` — tracks streak counter, rapid-kill window for slow-mo trigger, double-score flag
- `startGame()` — fully resets all CFG/WeaponDefs mutations from previous run upgrades
- `update()` — all gameplay uses `_dt = dt * timeScale`; stars use unscaled `dt`
- Boss kill in Boss Rush grants a small heal (up to 3 lives)

---

## [V5] — 2026-05-22

### Added
- **Leaderboard backend** — Node.js HTTP server (`src/server.js`) on port 3000, zero npm deps
  - `GET /api/scores` — top 10 scores sorted by score descending
  - `POST /api/scores` — saves entry `{name, score, wave}`, keeps top 100 in `src/scores.json`
  - Full CORS headers on all responses
- **Nginx proxy** — `/api/` proxied to Node.js so leaderboard works from any URL (not just localhost)
- **LeaderboardUI module** — fetches and caches scores, `drawLeaderboard(ctx, x, y)` renders top 10
- **Top scores on start screen** — "TOP PILOTS" panel drawn below instructions
- **Post-game leaderboard flow**:
  - Game Over: player types name → gold SUBMIT button (tap/click, no keyboard Enter needed)
  - After submit: two tappable buttons — **▶ RESTART** (green) and **SCORES** (cyan)
  - Leaderboard overlay: full top-10 table with **← BACK** and **▶ RESTART** buttons
  - ESC = back, Space = restart still work for keyboard users
- **Mobile name entry** — hidden `<input id="nameInput">` focused on game over; soft keyboard appears automatically on touch devices; tapping canvas re-focuses it
- **Mobile-aware prompts** — "TAP DONE / PRESS ENTER" and "tap here to type your name" on touch devices
- **Cloudflare Tunnel** — public URL via `cloudflared` (no warning page, no passphrase, worldwide access)
- **Dynamic API URL** — uses `window.location.origin + '/api/scores'` when not on localhost

### Fixed
- Game could not restart after name submission (`NameInput.active` never set to `false` on Enter)
- Leaderboard scores not loading via public URL — API used hardcoded `localhost:3000` instead of relative path
- Clicking SCORES on Game Over started a new game — global `document` click handler raced with canvas button handler; fixed with `e.stopPropagation()` + `!showingLeaderboard` guard on `onStart`
- **Mobile: tapping SCORES started new game instead of opening leaderboard** — `bindTouch`'s `onStart_` called `onStart()` unconditionally before any button hit-testing; fixed with `onTouchIntercept` hook that intercepts all GAMEOVER touches before `onStart_` fires
- SUBMIT/RESTART/BACK/LEADERBOARD buttons not tappable on mobile (touch coordinates not scaled by canvas bounding rect ratio)

### Improved
- Name entry: gold **SUBMIT** button on canvas (tap/click to submit — no keyboard Enter needed)
- Post-submission: two large tappable buttons (**▶ RESTART** + **SCORES**) replace keyboard-only L/Space hints
- Leaderboard overlay: **← BACK** and **▶ RESTART** buttons replace keyboard-only ESC/Space hints
- Mobile soft keyboard auto-focuses on game over; tapping canvas re-focuses input

### Docs
- `docs/SUB_AGENTS.md` — sub-agent workflow, bug-fix loop, deployment checklist, common bug table
- `CLAUDE.md` updated with server.js/scores.json in directory layout, LeaderboardUI/NameInput in architecture table, full-stack run instructions

---

## [V4] — 2026-05-21

### Added
- **Systems architecture refactor** — entire game reorganized into self-contained modules
- `CFG` object — all magic numbers and tunable values in one place
- `EnemyDefs`, `WeaponDefs`, `BossPatternDefs` — data-driven definitions (open for extension, closed for modification)
- `Audio`, `Input`, `FX` — self-contained IIFE modules
- `BossAI` class — finite state machine (patrol → aggressive → enraged) driven by HP percentage
- `MovementPatterns` — strategy pattern for enemy movement (swap behavior without changing callers)
- `WeaponSystem` — pure fire logic returning new game objects, reads `WeaponDefs`
- `NarratorAI` — optional Claude Haiku API for boss-phase taunts with graceful fallback to static messages
- `CLAUDE.md` — AI-assisted dev guide with architecture map and extension recipes
- `docs/AI_BEST_PRACTICES.md` — three-dimension guide: AI workflow, game AI architecture, LLM integration

---

## [V3] — 2026-05-21

### Added
- Pseudo-3D perspective projection system (vanishing point + FOV math)
- 3D starfield warp tunnel — 200 stars with Z-depth, accelerate toward viewer
- Perspective grid floor (Star Fox / Space Harrier style)
- Player ship banks and tilts left/right using canvas shear transform
- **WEAPON 1: Laser Beam** — hold SPACE for continuous beam, damages all enemies in column
- **WEAPON 2: Spread Shot** — 5-bullet fan pattern, 250ms cooldown
- **WEAPON 3: Homing Missiles** — 2 missiles that curve toward nearest enemy, 500ms cooldown
- **WEAPON 4: Plasma Bomb** — slow large projectile, 100px explosion radius, 1200ms cooldown
- **WEAPON 5: Railgun** — instant full-screen kill column, 2000ms cooldown with charging bar
- Weapon selector HUD (bottom-left, color-coded, keys 1–5)
- Mobile weapon selector buttons (5 tap buttons above fire button)
- Boss enters from Z-depth (z=0.8 → z=0.3), scales with perspective
- New boss pattern: 3D Ring Wave (bullets spawn at boss depth, expand outward)
- All enemies have Z-coordinate and scale/alpha based on depth
- Enemy depth-sorted draw order (far enemies drawn behind near ones)

---

## [V2] — 2026-05-21

### Added
- `STATE.WARP` — hyperspace transition between waves (70 speed lines + zoom text)
- **Bullet-hell boss Pattern A**: Spiral Burst — 16-bullet circle, rotating offset each burst
- **Bullet-hell boss Pattern B**: Aimed Barrage — 5-bullet spread aimed at player
- **Bullet-hell boss Pattern C**: Ring Waves — 12-bullet expanding rings (double below 40% HP)
- Boss health phases: 100–60% slow / 60–30% medium / <30% enraged with red tint
- Chain explosion kills — enemy death triggers 80px radius check, max chain depth 4
- Chain bonus score (50pts per chain link × combo multiplier)
- "CHAIN xN!" popup text at kill position when chain ≥ 2
- Mobile touch controls — virtual joystick (left) and fire button (right), canvas-drawn
- Touch `preventDefault` to stop page scroll during play
- Player engine exhaust trail (2 cyan particles per frame at ship rear)
- Score popups — "+N" floats upward 40px over 0.8s at enemy death position
- Dynamic wave color themes — cyan (W1), magenta (W2), gold (W3+), red (boss waves)
- Smooth lerp color transition (1s) between waves
- Hexagonal shield visual — rotating hexagon outline, flickers at 8Hz when <2s left
- Shield expiry effect — brief flash + particle burst at player position
- Responsive canvas — `max-width: 100%; height: auto` for mobile viewports

---

## [V1] — 2026-05-21

### Added
- Core game loop with `requestAnimationFrame` and delta-time (capped at 50ms)
- **Enemy Type A**: Scout — small diamond, red, 10pts, fast approach
- **Enemy Type B**: Fighter — hexagon, orange, 20pts, medium speed
- **Enemy Type C**: Bomber — large octagon, yellow, 30pts, slow but fires more
- Sine-wave enemy movement patterns
- Enemy shooting — bottom-most enemies in each column fire every ~2s
- Boss wave every 3rd wave — complex multi-polygon ship, health bar at top
- Boss health scales with wave number (20 + wave × 5 HP)
- Boss fires 3-bullet spread shots, speeds up below 60% HP
- Combo multiplier — kills within 1.5s build x2/x4/x8/x16 streak
- Combo text display — centered, large, color-coded, scale pop animation
- Screen shake — heavy (player death), medium (boss hit), tiny (regular kill)
- **Power-up: Shield** (S) — 5s invincibility, blue glow
- **Power-up: Spread Shot** (W) — 3-bullet spread for 8s
- **Power-up: Speed Boost** (V) — faster movement for 6s
- Power-ups drop at 15% chance on enemy death, float downward
- Web Audio API synth sounds — all generated, zero audio files
  - Background drone (55Hz sine, continuous)
  - Shoot beep (880Hz square)
  - Enemy death (descending 400→150Hz)
  - Player hit (150Hz sawtooth buzz)
  - Boss hit (220Hz thud)
  - Power-up collect (C–E–G–C arpeggio)
- Particle explosion system — burst on every enemy/boss death
- Animated nebula background — 5 drifting radial gradient blobs
- 100-star twinkling starfield
- HUD — score, hi-score, lives, wave number, power-up timers
- Game states — START, PLAYING, PAUSED, GAMEOVER
- 3 lives with 2s invincibility frames after being hit (player flashes)
- Hi-score persisted to `localStorage`
- Pause toggle (P key)
- Single HTML file, zero external dependencies
- Works on Chrome, Firefox, Safari (desktop)
