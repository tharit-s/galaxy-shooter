# Galaxy Shooter — Feature Pipeline

## How to Use This File
1. Add new ideas to **Backlog** with enough detail to brief an agent
2. Before building, run `/plan` and review the approach
3. Move to **In Progress** and run the pipeline prompt below
4. Agents write handover notes in the **Completed** section when done

## Pipeline Prompt Template
Copy this when starting a new feature:

```
Use the full agent pipeline to build [FEATURE NAME] as described in TODO_PIPELINE.md.

1. game-architect   — design data structures, CFG values, and system scaffolding
2. gameplay-engineer — implement mechanics, collision, and AI behavior  
3. ui-data-manager  — build sprites, HUD elements, and screen visuals
4. qa-balancer      — find bugs, verify all 5 weapons + 3 game modes, balance values

Each agent reads src/game.html and the previous agent's handover note before starting.
After finishing, leave a one-paragraph handover note in TODO_PIPELINE.md under the feature.
```

---

## 📋 Backlog

### Daily Challenge Mode
- Wave patterns seeded from today's date — all players get identical layout
- Separate leaderboard entry tagged `mode: daily`
- Start screen shows "DAILY CHALLENGE" as 4th mode option
- Score resets at midnight UTC

---

## 🏗️ In Progress

*(move a backlog item here when actively building it)*

---

## ✅ Completed

### Fix Mobile Bug — Leaderboard Overlay Restarts Game
- **gameplay-engineer:** Root cause: `onTouchIntercept` returned `false` when the user tapped blank space on the leaderboard overlay, letting `onStart` fire and restart the game. Fix: added `if (showingLeaderboard) return true` before the final fallthrough so any tap on the leaderboard overlay is consumed. JS syntax OK. Deployed nginx HTTP 200.

### Improve After Game Over
- **gameplay-engineer:** Added `goHome()` function that resets state to `STATE.START`, clears leaderboard/name-entry flags, blurs input, stops drone. Added `home` string key to `STRINGS` (EN: `⌂ HOME`, TH: `⌂ หน้าแรก`).
- **ui-data-manager:** Added a third HOME button (purple) to the post-submission game-over screen alongside RESTART and SCORES; added HOME button to the leaderboard overlay alongside BACK and RESTART. Buttons centered using computed total-width layout for responsive fit.
- **qa-balancer:** Wired HOME buttons into `onTouchIntercept` buttons array and the canvas `click` handler for both GAMEOVER states. JS syntax OK. Deployed nginx HTTP 200.

### Weapon Upgrade: Railgun Split
- **gameplay-engineer:** Updated `WeaponSystem.fireRailgun()` to accept `splitCount`; fires 3 beams at offsets `[-100, 0, 100]` when split is active. Boss takes 5 damage per beam (up to 15 total). Returns `{ dead, bossHit, xs }` array.
- **ui-data-manager:** Updated `drawRailgunFlash()` to iterate over `railgunFlash.xs` array and draw each beam independently.
- **qa-balancer:** Updated call site to compute `splitCount` from `UpgradeSystem.chosen` (≥2 railgun picks → 3 beams). Updated invader collision check to use `xs.some()`. JS syntax OK.

### Ricochet Mechanic (finish the upgrade)
- **gameplay-engineer:** Added bullet filter logic: when `player._ricochet` is set and a bullet hits a side wall (`b.x < 0 || b.x > W`) and hasn't bounced yet, reverses `b.vx`, sets `b._bounced = true`, and clamps position. Bullet continues until it exits the top or hits an enemy.

### Double Score Wave Reset (fix the bug)
- **gameplay-engineer:** Added `player._doubleScore = 0` at the top of both `initWarp()` and `doWarpAfterUpgrade()` so the double-score upgrade correctly lasts only one wave.

### Bullet Damage Upgrade (wire up the flag)
- **gameplay-engineer:** Updated `WeaponSystem.fireSpread()` and `WeaponSystem.fireHoming()` to read `player._bulletDamage || 1` and set `damage` on each created bullet/missile, so the Bullet Damage upgrade correctly affects spread and homing weapons.

### Mobile Name Entry — Soft Keyboard Overlap Bug
- **game-architect:** Identified root cause: soft keyboard shrinks `visualViewport.height`, pushing the canvas name-entry box (drawn at `H/2+15`) behind the keyboard. Design: listen on `visualViewport.resize`, slide canvas via `translateY` CSS transform — no draw or coord math changes needed since all touch handlers already use `getBoundingClientRect()`.
- **gameplay-engineer:** Added `visualViewport.resize` listener inside Game IIFE — shifts canvas up by 50% of keyboard height when `STATE.GAMEOVER + NameInput.active`. Added `clearCanvasShift()` helper, called in `submitName()` (keyboard closes after submit) and `startGame()` (reset on restart). Added CSS `transition: transform 0.15s ease` on canvas for smooth slide.
- **qa-balancer:** JS syntax OK. Deployed nginx HTTP 200. Verified reset paths: submit → shift clears; restart → shift clears. `visualViewport` guard (`if (window.visualViewport)`) ensures desktop is unaffected.

### V9 Dual Language Edition
- **game-architect:** Added `STRINGS` object (`en`/`th` keys for all UI text), `t(key)` helper, `upgradeLabel(id)`/`upgradeDesc(id)` helpers. Added `CFG.lang = 'en'`. Replaced `CFG.streaks[].label` with `.key`, replaced `CFG.modes`/`CFG.modeDescs` with `CFG.modeKeys`/`CFG.modeDescKeys`. Removed hardcoded `label`/`desc` from `CFG.upgradeDefs`. Updated streak dispatch to use `t(s.key)`.
- **gameplay-engineer:** Added `_langBtnRect` variable. Added `checkLangToggle(cx, cy)` function. Wired language toggle into canvas click handler (first check on every click) and `onTouchIntercept` (first check on every touch). Added `L` keyboard shortcut (any screen except `STATE.GAMEOVER`). Renamed `const t` loop variable in `drawStreakText` to `prog` to avoid shadowing the global `t()`.
- **ui-data-manager:** Replaced all hardcoded Thai `fillText()` strings in `drawHUD`, `drawRivalLine`, `drawWeaponHUD`, `drawBoss` (HP bar), `drawWarp`, `drawInvaderBanner`, `drawTouchControls`, `drawStart`, `drawUpgradeScreen`, `drawPause`, `drawGameOver`, `LeaderboardUI.drawLeaderboard` with `t()` calls. Added `drawLangBtn()` — small pill button bottom-right, called from all screen branches. Updated version label to `V9 — DUAL LANG` (EN) / `V9 — สองภาษา` (TH). Added V9 entry to `CHANGELOG_DATA`.
- **qa-balancer:** JS syntax OK. Deployed nginx HTTP 200. Archived V8 → `archive/v8.html`. Updated CHANGELOG.md, CLAUDE.md, README.md, TODO_PIPELINE.md. English default confirmed (`CFG.lang = 'en'`).

### Space Invader Formation — V6 Wave Type
- **game-architect:** Added `CFG.invader`, `InvaderFormation` object (grid[][], init, reset, getScreenPos, anyReachedBottom, update stub), `isInvaderWave()` gate, `spawnWave()` branch, `startGame()` reset.
- **gameplay-engineer:** Implemented `InvaderFormation.update()` — full march/edge-detect/drop, shoot AI (random bottom-most column), player-bullet vs invader collision with `awardKill()`/FX, player body vs invader collision. Laser + railgun weapon hits invaders too.
- **ui-data-manager:** `drawInvaders()` — 3-type animated sprites (squid/crab/octopus, 2-frame each); HUD `INVASION N LEFT` counter; `drawInvaderBanner()` — full-screen INVASION! banner with scale+fade on wave start.
- **qa-balancer:** Fixed laser/railgun not hitting invaders; alive count floored at 0; march interval clamped at 0.10s; shoot interval scales with alive-count ratio (last few invaders shoot faster).

### V8 Thai Edition (รุ่นไทย)
- **game-architect:** Updated all CFG data strings — `CFG.streaks`, `CFG.modes`, `CFG.modeDescs`, all 12 `CFG.upgradeDefs` label/desc fields — to Thai.
- **ui-data-manager:** Translated all hardcoded fillText strings in drawHUD, drawBoss, drawWarp, drawInvaderBanner, drawTouchControls, drawStart, drawUpgradeScreen, drawPause, drawGameOver, LeaderboardUI.drawLeaderboard. Updated version label to `V8 — รุ่นไทย`.
- **qa-balancer:** Syntax OK, no untranslated UI strings remaining, deployed game.html + v8.html, both HTTP 200.

### V7 Mobile Polish
- **game-architect:** Added `CFG.upgradeCard` (responsive layout breakpoint + dimensions) and `CFG.modeArrow` (start screen arrow button sizing). Extended `onTouchIntercept` contract to handle UPGRADE and START states.
- **gameplay-engineer:** Implemented responsive card layout (vertical stack < 480px wide, horizontal otherwise). Wired `STATE.UPGRADE` touch intercept — instant tap response, no accidental restart. Added `<`/`>` mode arrow buttons on start screen for touch devices.
- **qa-balancer:** Verified syntax OK, `_btnRects` populated before any touch can fire, touch intercept returns `true` for all upgrade touches, mode arrows don't conflict with keyboard. Deployed nginx HTTP 200.

### V6 Chaos Edition
- **game-architect:** Added `CFG.upgradeDefs`, `CFG.streaks`, `CFG.modes`, `STATE.UPGRADE=6`, `UpgradeSystem` object, `gameMode` variable, `timeScale` variable.
- **gameplay-engineer:** `timeScale` slow-mo on 3+ rapid kills, streak tracking in `awardKill()`, survival mode continuous spawning, magnet powerup homing, boss rush heal on kill, `_dt = dt * timeScale` pattern throughout `update()`.
- **ui-data-manager:** `drawUpgradeScreen()` — 3 glowing upgrade cards; `drawStart()` — V6 branding + mode selector; `drawStreakText()` — UNSTOPPABLE!/GODLIKE!/LEGENDARY! announcements; `drawRivalLine()` — dotted gold #1 pace line in HUD.
- **qa-balancer:** Verified syntax, deployed to nginx HTTP 200, confirmed all 3 modes launch correctly.
