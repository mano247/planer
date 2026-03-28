---
name: Desktop Planner App — Project Overview
description: Personal desktop planner app — tech stack, all design decisions, DB schema summary, categories. COMPLETED.
type: project
---

Personal desktop planner app — standalone Windows .exe, no terminal required. **FULLY BUILT.**

**Stack:** Electron 33 + React 18 + TypeScript + Vite + Tailwind CSS v3 + Recharts + node-sqlite3-wasm + react-i18next + Zustand + electron-builder

**Important:** Uses `node-sqlite3-wasm` (NOT `better-sqlite3`) because no Visual Studio Build Tools are available. WAL pragma is set via `db.exec("PRAGMA journal_mode = WAL")`.

**Key decisions:**
- Window: 1280×800px, fixed, dark mode only
- DB: SQLite at `%APPDATA%\Planner\planner.db` via node-sqlite3-wasm
- Week: Mon–Sun, 30-min slots, full 24h grid (48 rows)
- Activity input: click to inline type; drag to span multiple slots; all past slots editable
- Auto-categorization: keyword matching (case-insensitive), user-editable
- 8 built-in categories: Sport 🏃, Learning 📚, Work 💼, Home 🏠, Social 👥, Family 👨‍👩‍👧, Health ❤️, Entertainment 🎮
- Calendar events sync to Tab 1 by occupying first available slot
- Stats: Pie + Bar charts + Summary cards; remaining hours = 17h/day baseline
- Settings: gear icon → slide-in panel (no 6th tab); includes category editor + EN/SR language + JSON export/import
- To-dos: High/Medium/Low priority, 3-color coded; includes Books subsection with page progress tracking
- Daily notes: plain text, one per day, auto-saved
- Notifications: none
- i18n: English + Serbian (srpski), preference persisted in settings table

**Splash screen:** Shows on startup (800ms) then restores last active tab from settings DB.

**Build commands:**
- Dev: `node node_modules/electron/install.js` first (if no path.txt), then `npm run dev`
- Package: `CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:win` → `dist/Planner Setup 1.0.0.exe`

**Files:** DOCUMENTATION.md has full technical docs.

**Why:** User's personal daily-use tool. Fully offline, no accounts, no cloud.

**How to apply:** All code decisions should follow this stack. Don't suggest cloud features, accounts, or non-Windows targets.
