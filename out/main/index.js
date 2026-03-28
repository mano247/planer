"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const utils = require("@electron-toolkit/utils");
const nodeSqlite3Wasm = require("node-sqlite3-wasm");
function runMigrations(db2) {
  db2.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en    TEXT NOT NULL,
      name_sr    TEXT NOT NULL,
      icon       TEXT NOT NULL,
      color      TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      keyword     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      start_time  TEXT NOT NULL,
      end_time    TEXT NOT NULL,
      name        TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      is_event    INTEGER DEFAULT 0,
      event_id    INTEGER REFERENCES calendar_events(id) ON DELETE SET NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      title      TEXT NOT NULL,
      note       TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS todos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      due_date    TEXT,
      priority    TEXT DEFAULT 'medium',
      task_type   TEXT DEFAULT 'daily',
      completed   INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT NOT NULL,
      author       TEXT,
      total_pages  INTEGER NOT NULL DEFAULT 0,
      pages_read   INTEGER NOT NULL DEFAULT 0,
      completed    INTEGER DEFAULT 0,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL UNIQUE,
      content    TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  try {
    db2.exec("ALTER TABLE todos ADD COLUMN task_type TEXT DEFAULT 'daily'");
  } catch {
  }
  const langRow = db2.get("SELECT COUNT(*) as c FROM settings WHERE key = ?", ["language"]);
  if (!langRow || langRow.c === 0) {
    db2.run("INSERT INTO settings (key, value) VALUES ('language', 'en')");
    db2.run("INSERT INTO settings (key, value) VALUES ('last_tab', 'schedule')");
  }
  const catRow = db2.get("SELECT COUNT(*) as c FROM categories");
  if (!catRow || catRow.c === 0) {
    seedCategories(db2);
  }
}
const DEFAULT_CATEGORIES = [
  {
    name_en: "Sport / Fitness",
    name_sr: "Sport / Fitnes",
    icon: "🏃",
    color: "#ef4444",
    keywords: ["gym", "teretana", "run", "trčanje", "trcanje", "workout", "swim", "plivanje", "yoga", "bike", "bicikl", "cycling", "fitness", "sport", "training", "trening", "walk", "setnja", "šetnja", "hike", "planina", "football", "fudbal", "basketball", "kosarka", "košarka", "tennis", "tenis"]
  },
  {
    name_en: "Learning / Study",
    name_sr: "Učenje / Studije",
    icon: "📚",
    color: "#3b82f6",
    keywords: ["study", "ucenje", "učenje", "kurs", "course", "read", "citanje", "čitanje", "lecture", "predavanje", "research", "istrazivanje", "istraživanje", "learn", "tutorial", "book", "knjiga", "school", "skola", "škola", "university", "fakultet", "exam", "ispit", "homework", "domaci", "domaći"]
  },
  {
    name_en: "Work / Job",
    name_sr: "Posao / Rad",
    icon: "💼",
    color: "#8b5cf6",
    keywords: ["work", "posao", "rad", "meeting", "sastanak", "code", "coding", "programiranje", "project", "projekat", "task", "zadatak", "email", "mejl", "call", "poziv", "office", "kancelarija", "client", "klijent", "deadline", "report", "izvestaj", "izveštaj", "prezentacija", "presentation"]
  },
  {
    name_en: "Home / Chores",
    name_sr: "Kućni poslovi",
    icon: "🏠",
    color: "#f59e0b",
    keywords: ["clean", "cleaning", "ciscenje", "čišćenje", "cook", "cooking", "kuvanje", "usisavanje", "vacuum", "laundry", "ves", "veš", "grocery", "groceries", "kupovina", "shopping", "dishes", "sudovi", "trash", "djubre", "đubre", "home", "kuca", "kuća", "maintain", "odrzavanje", "održavanje", "repair", "popravka"]
  },
  {
    name_en: "Social / Friends",
    name_sr: "Prijatelji / Izlasci",
    icon: "👥",
    color: "#10b981",
    keywords: ["friends", "prijatelji", "party", "zabava", "dinner", "vecera", "večera", "lunch", "rucak", "ručak", "coffee", "kafa", "cafe", "kafic", "kafić", "out", "izlazak", "bar", "club", "klub", "gathering", "drustveno", "društveno", "social", "visit", "poseta", "posjeta"]
  },
  {
    name_en: "Family",
    name_sr: "Porodica",
    icon: "👨‍👩‍👧",
    color: "#ec4899",
    keywords: ["family", "porodica", "parents", "roditelji", "kids", "deca", "djeca", "children", "mama", "tata", "baka", "deka", "grandma", "grandpa", "brat", "sestra", "sibling", "brother", "sister", "family time", "porodicno", "porodično"]
  },
  {
    name_en: "Health / Medical",
    name_sr: "Zdravlje / Medicina",
    icon: "❤️",
    color: "#06b6d4",
    keywords: ["doctor", "lekar", "doktor", "hospital", "bolnica", "pharmacy", "apoteka", "therapy", "terapija", "dentist", "zubar", "checkup", "pregled", "medicine", "lek", "lijek", "health", "zdravlje", "meditate", "meditacija", "mental", "mentalno", "wellness"]
  },
  {
    name_en: "Entertainment / Rest",
    name_sr: "Zabava / Odmor",
    icon: "🎮",
    color: "#84cc16",
    keywords: ["movie", "film", "netflix", "game", "igrica", "games", "gaming", "series", "serija", "tv", "relax", "odmor", "rest", "music", "muzika", "concert", "koncert", "youtube", "podcast", "nap", "sleep", "spavanje", "san", "chill", "opustanje"]
  }
];
function seedCategories(db2) {
  for (const cat of DEFAULT_CATEGORIES) {
    const result = db2.run(
      "INSERT INTO categories (name_en, name_sr, icon, color, is_default) VALUES (?, ?, ?, ?, 1)",
      [cat.name_en, cat.name_sr, cat.icon, cat.color]
    );
    const catId = Number(result.lastInsertRowid);
    for (const kw of cat.keywords) {
      db2.run("INSERT INTO keywords (category_id, keyword) VALUES (?, ?)", [catId, kw.toLowerCase()]);
    }
  }
}
let db = null;
function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}
function initDatabase() {
  const dbPath = path.join(electron.app.getPath("userData"), "planner.db");
  db = new nodeSqlite3Wasm.Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
}
const SELECT_WITH_CATEGORY = `
  SELECT a.*,
         c.icon as category_icon,
         c.color as category_color,
         c.name_en as category_name_en,
         c.name_sr as category_name_sr
  FROM activities a
  LEFT JOIN categories c ON a.category_id = c.id
`;
function getActivitiesByWeek(weekStart, weekEnd) {
  return getDb().all(
    `${SELECT_WITH_CATEGORY} WHERE a.date >= ? AND a.date <= ? ORDER BY a.date, a.start_time`,
    [weekStart, weekEnd]
  );
}
function getActivitiesByDateRange(startDate, endDate) {
  return getDb().all(
    `${SELECT_WITH_CATEGORY} WHERE a.date >= ? AND a.date <= ? ORDER BY a.date, a.start_time`,
    [startDate, endDate]
  );
}
function upsertActivity(input) {
  const db2 = getDb();
  if (input.id) {
    db2.run(
      `UPDATE activities SET date=?, start_time=?, end_time=?, name=?, category_id=?, updated_at=datetime('now') WHERE id=?`,
      [input.date, input.start_time, input.end_time, input.name, input.category_id ?? null, input.id]
    );
    return db2.get(`${SELECT_WITH_CATEGORY} WHERE a.id = ?`, [input.id]);
  } else {
    const result = db2.run(
      `INSERT INTO activities (date, start_time, end_time, name, category_id, is_event, event_id) VALUES (?,?,?,?,?,?,?)`,
      [input.date, input.start_time, input.end_time, input.name, input.category_id ?? null, input.is_event ?? 0, input.event_id ?? null]
    );
    return db2.get(`${SELECT_WITH_CATEGORY} WHERE a.id = ?`, [Number(result.lastInsertRowid)]);
  }
}
function deleteActivity(id) {
  getDb().run("DELETE FROM activities WHERE id = ?", [id]);
}
function updateActivityCategory(id, categoryId) {
  getDb().run("UPDATE activities SET category_id=?, updated_at=datetime('now') WHERE id=?", [categoryId, id]);
}
function getAllCategories() {
  const db2 = getDb();
  const cats = db2.all("SELECT * FROM categories ORDER BY is_default DESC, id ASC");
  return cats.map((cat) => ({
    ...cat,
    keywords: db2.all("SELECT keyword FROM keywords WHERE category_id = ?", [cat.id]).map((r) => r.keyword)
  }));
}
function createCategory(input) {
  const db2 = getDb();
  const result = db2.run(
    "INSERT INTO categories (name_en, name_sr, icon, color, is_default) VALUES (?,?,?,?,0)",
    [input.name_en, input.name_sr, input.icon, input.color]
  );
  const catId = Number(result.lastInsertRowid);
  for (const kw of input.keywords) {
    if (kw.trim()) db2.run("INSERT INTO keywords (category_id, keyword) VALUES (?,?)", [catId, kw.toLowerCase().trim()]);
  }
  return getAllCategories().find((c) => c.id === catId);
}
function updateCategory(id, input) {
  const db2 = getDb();
  if (input.name_en !== void 0) db2.run("UPDATE categories SET name_en=? WHERE id=?", [input.name_en, id]);
  if (input.name_sr !== void 0) db2.run("UPDATE categories SET name_sr=? WHERE id=?", [input.name_sr, id]);
  if (input.icon !== void 0) db2.run("UPDATE categories SET icon=? WHERE id=?", [input.icon, id]);
  if (input.color !== void 0) db2.run("UPDATE categories SET color=? WHERE id=?", [input.color, id]);
  if (input.keywords !== void 0) {
    db2.run("DELETE FROM keywords WHERE category_id=?", [id]);
    for (const kw of input.keywords) {
      if (kw.trim()) db2.run("INSERT INTO keywords (category_id, keyword) VALUES (?,?)", [id, kw.toLowerCase().trim()]);
    }
  }
}
function deleteCategory(id) {
  const db2 = getDb();
  db2.run("UPDATE activities SET category_id=NULL WHERE category_id=?", [id]);
  db2.run("DELETE FROM categories WHERE id=?", [id]);
}
function getEventsByMonth(year, month) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return getDb().all("SELECT * FROM calendar_events WHERE date LIKE ? ORDER BY date", [`${prefix}%`]);
}
function getEventsByDateRange(startDate, endDate) {
  return getDb().all("SELECT * FROM calendar_events WHERE date >= ? AND date <= ? ORDER BY date", [startDate, endDate]);
}
function createEvent(input) {
  const db2 = getDb();
  const result = db2.run(
    "INSERT INTO calendar_events (date, title, note) VALUES (?,?,?)",
    [input.date, input.title, input.note ?? null]
  );
  const eventId = Number(result.lastInsertRowid);
  const existing = db2.all("SELECT start_time FROM activities WHERE date=? ORDER BY start_time", [input.date]);
  const occupiedSlots = new Set(existing.map((r) => r.start_time));
  const firstSlot = findFirstFreeSlot(occupiedSlots);
  upsertActivity({
    date: input.date,
    start_time: firstSlot,
    end_time: addMinutes(firstSlot, 30),
    name: input.title,
    category_id: null,
    is_event: 1,
    event_id: eventId
  });
  return db2.get("SELECT * FROM calendar_events WHERE id=?", [eventId]);
}
function updateEvent(id, input) {
  const db2 = getDb();
  if (input.title !== void 0) {
    db2.run("UPDATE calendar_events SET title=? WHERE id=?", [input.title, id]);
    db2.run("UPDATE activities SET name=?, updated_at=datetime('now') WHERE event_id=?", [input.title, id]);
  }
  if (input.note !== void 0) {
    db2.run("UPDATE calendar_events SET note=? WHERE id=?", [input.note, id]);
  }
}
function deleteEvent(id) {
  const db2 = getDb();
  db2.run("DELETE FROM activities WHERE event_id=?", [id]);
  db2.run("DELETE FROM calendar_events WHERE id=?", [id]);
}
function findFirstFreeSlot(occupied) {
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const slot = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      if (!occupied.has(slot)) return slot;
    }
  }
  return "23:30";
}
function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function getAllTodos() {
  return getDb().all(
    "SELECT * FROM todos ORDER BY completed ASC, priority DESC, due_date ASC, created_at DESC"
  );
}
function createTodo(input) {
  const db2 = getDb();
  const result = db2.run(
    "INSERT INTO todos (title, description, due_date, priority, task_type) VALUES (?,?,?,?,?)",
    [input.title, input.description ?? null, input.due_date ?? null, input.priority ?? "medium", input.task_type ?? "daily"]
  );
  return db2.get("SELECT * FROM todos WHERE id=?", [Number(result.lastInsertRowid)]);
}
function updateTodo(id, input) {
  const db2 = getDb();
  if (input.title !== void 0) db2.run("UPDATE todos SET title=?, updated_at=datetime('now') WHERE id=?", [input.title, id]);
  if (input.description !== void 0) db2.run("UPDATE todos SET description=?, updated_at=datetime('now') WHERE id=?", [input.description, id]);
  if (input.due_date !== void 0) db2.run("UPDATE todos SET due_date=?, updated_at=datetime('now') WHERE id=?", [input.due_date, id]);
  if (input.priority !== void 0) db2.run("UPDATE todos SET priority=?, updated_at=datetime('now') WHERE id=?", [input.priority, id]);
  if (input.task_type !== void 0) db2.run("UPDATE todos SET task_type=?, updated_at=datetime('now') WHERE id=?", [input.task_type, id]);
  if (input.completed !== void 0) db2.run("UPDATE todos SET completed=?, updated_at=datetime('now') WHERE id=?", [input.completed ? 1 : 0, id]);
}
function deleteTodo(id) {
  getDb().run("DELETE FROM todos WHERE id=?", [id]);
}
function getAllBooks() {
  return getDb().all("SELECT * FROM books ORDER BY completed ASC, created_at DESC");
}
function createBook(input) {
  const db2 = getDb();
  const result = db2.run(
    "INSERT INTO books (title, author, total_pages, pages_read) VALUES (?,?,?,?)",
    [input.title, input.author ?? null, input.total_pages, input.pages_read ?? 0]
  );
  return db2.get("SELECT * FROM books WHERE id=?", [Number(result.lastInsertRowid)]);
}
function updateBook(id, input) {
  const db2 = getDb();
  if (input.title !== void 0) db2.run("UPDATE books SET title=?, updated_at=datetime('now') WHERE id=?", [input.title, id]);
  if (input.author !== void 0) db2.run("UPDATE books SET author=?, updated_at=datetime('now') WHERE id=?", [input.author, id]);
  if (input.total_pages !== void 0) db2.run("UPDATE books SET total_pages=?, updated_at=datetime('now') WHERE id=?", [input.total_pages, id]);
  if (input.pages_read !== void 0) db2.run("UPDATE books SET pages_read=?, updated_at=datetime('now') WHERE id=?", [input.pages_read, id]);
  if (input.completed !== void 0) {
    const completed = input.completed ? 1 : 0;
    db2.run("UPDATE books SET completed=?, updated_at=datetime('now') WHERE id=?", [completed, id]);
    if (input.completed) {
      db2.run("UPDATE books SET pages_read=total_pages WHERE id=? AND completed=1", [id]);
    }
  }
}
function deleteBook(id) {
  getDb().run("DELETE FROM books WHERE id=?", [id]);
}
function getNoteByDate(date) {
  return getDb().get("SELECT * FROM daily_notes WHERE date=?", [date]) ?? null;
}
function getDatesWithNotes() {
  const rows = getDb().all("SELECT date FROM daily_notes WHERE content != '' ORDER BY date DESC");
  return rows.map((r) => r.date);
}
function upsertNote(date, content) {
  const db2 = getDb();
  const existing = db2.get("SELECT id FROM daily_notes WHERE date=?", [date]);
  if (existing) {
    db2.run("UPDATE daily_notes SET content=?, updated_at=datetime('now') WHERE date=?", [content, date]);
  } else {
    db2.run("INSERT INTO daily_notes (date, content) VALUES (?,?)", [date, content]);
  }
  return db2.get("SELECT * FROM daily_notes WHERE date=?", [date]);
}
function getSetting(key) {
  const row = getDb().get("SELECT value FROM settings WHERE key=?", [key]);
  return row?.value ?? null;
}
function setSetting(key, value) {
  getDb().run("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [key, value]);
}
function getAllSettings() {
  const rows = getDb().all("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
function categorizeActivity(name, categories) {
  const lower = name.toLowerCase();
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) return cat.id;
    }
  }
  return null;
}
function registerAllHandlers() {
  electron.ipcMain.handle(
    "activities:getWeek",
    (_e, weekStart, weekEnd) => getActivitiesByWeek(weekStart, weekEnd)
  );
  electron.ipcMain.handle(
    "activities:getRange",
    (_e, startDate, endDate) => getActivitiesByDateRange(startDate, endDate)
  );
  electron.ipcMain.handle("activities:upsert", (_e, input) => {
    if (input.category_id === void 0 || input.category_id === null) {
      const categories = getAllCategories();
      input.category_id = categorizeActivity(input.name, categories);
    }
    return upsertActivity(input);
  });
  electron.ipcMain.handle("activities:delete", (_e, id) => deleteActivity(id));
  electron.ipcMain.handle(
    "activities:updateCategory",
    (_e, id, categoryId) => updateActivityCategory(id, categoryId)
  );
  electron.ipcMain.handle("categories:getAll", () => getAllCategories());
  electron.ipcMain.handle("categories:create", (_e, input) => createCategory(input));
  electron.ipcMain.handle("categories:update", (_e, id, input) => updateCategory(id, input));
  electron.ipcMain.handle("categories:delete", (_e, id) => deleteCategory(id));
  electron.ipcMain.handle(
    "events:getMonth",
    (_e, year, month) => getEventsByMonth(year, month)
  );
  electron.ipcMain.handle(
    "events:getRange",
    (_e, startDate, endDate) => getEventsByDateRange(startDate, endDate)
  );
  electron.ipcMain.handle("events:create", (_e, input) => createEvent(input));
  electron.ipcMain.handle("events:update", (_e, id, input) => updateEvent(id, input));
  electron.ipcMain.handle("events:delete", (_e, id) => deleteEvent(id));
  electron.ipcMain.handle("todos:getAll", () => getAllTodos());
  electron.ipcMain.handle("todos:create", (_e, input) => createTodo(input));
  electron.ipcMain.handle("todos:update", (_e, id, input) => updateTodo(id, input));
  electron.ipcMain.handle("todos:delete", (_e, id) => deleteTodo(id));
  electron.ipcMain.handle("books:getAll", () => getAllBooks());
  electron.ipcMain.handle("books:create", (_e, input) => createBook(input));
  electron.ipcMain.handle("books:update", (_e, id, input) => updateBook(id, input));
  electron.ipcMain.handle("books:delete", (_e, id) => deleteBook(id));
  electron.ipcMain.handle("notes:getByDate", (_e, date) => getNoteByDate(date));
  electron.ipcMain.handle("notes:getDatesWithNotes", () => getDatesWithNotes());
  electron.ipcMain.handle("notes:upsert", (_e, date, content) => upsertNote(date, content));
  electron.ipcMain.handle("settings:get", (_e, key) => getSetting(key));
  electron.ipcMain.handle("settings:set", (_e, key, value) => setSetting(key, value));
  electron.ipcMain.handle("settings:getAll", () => getAllSettings());
  electron.ipcMain.handle("data:export", async (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    const result = await electron.dialog.showSaveDialog(win, {
      title: "Export Planner Data",
      defaultPath: `planner-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) return { success: false };
    const db2 = getDb();
    const data = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: electron.app.getVersion(),
      categories: db2.all("SELECT * FROM categories"),
      keywords: db2.all("SELECT * FROM keywords"),
      activities: db2.all("SELECT * FROM activities"),
      calendar_events: db2.all("SELECT * FROM calendar_events"),
      todos: db2.all("SELECT * FROM todos"),
      books: db2.all("SELECT * FROM books"),
      daily_notes: db2.all("SELECT * FROM daily_notes"),
      settings: db2.all("SELECT * FROM settings")
    };
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), "utf-8");
    return { success: true, path: result.filePath };
  });
  electron.ipcMain.handle("data:import", async (event) => {
    const win = electron.BrowserWindow.fromWebContents(event.sender);
    const result = await electron.dialog.showOpenDialog(win, {
      title: "Import Planner Data",
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"]
    });
    if (result.canceled || !result.filePaths[0]) return { success: false };
    const raw = fs.readFileSync(result.filePaths[0], "utf-8");
    const data = JSON.parse(raw);
    const db2 = getDb();
    db2.exec("DELETE FROM activities");
    db2.exec("DELETE FROM calendar_events");
    db2.exec("DELETE FROM todos");
    db2.exec("DELETE FROM books");
    db2.exec("DELETE FROM daily_notes");
    db2.exec("DELETE FROM keywords");
    db2.exec("DELETE FROM categories");
    db2.exec("DELETE FROM settings");
    for (const row of data.categories ?? []) {
      db2.run(
        "INSERT INTO categories (id,name_en,name_sr,icon,color,is_default,created_at) VALUES (?,?,?,?,?,?,?)",
        [row.id, row.name_en, row.name_sr, row.icon, row.color, row.is_default, row.created_at]
      );
    }
    for (const row of data.keywords ?? []) {
      db2.run("INSERT INTO keywords (id,category_id,keyword) VALUES (?,?,?)", [row.id, row.category_id, row.keyword]);
    }
    for (const row of data.calendar_events ?? []) {
      db2.run(
        "INSERT INTO calendar_events (id,date,title,note,created_at) VALUES (?,?,?,?,?)",
        [row.id, row.date, row.title, row.note, row.created_at]
      );
    }
    for (const row of data.activities ?? []) {
      db2.run(
        "INSERT INTO activities (id,date,start_time,end_time,name,category_id,is_event,event_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [row.id, row.date, row.start_time, row.end_time, row.name, row.category_id, row.is_event, row.event_id, row.created_at, row.updated_at]
      );
    }
    for (const row of data.todos ?? []) {
      db2.run(
        "INSERT INTO todos (id,title,description,due_date,priority,task_type,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
        [row.id, row.title, row.description, row.due_date, row.priority, row.task_type ?? "daily", row.completed, row.created_at, row.updated_at]
      );
    }
    for (const row of data.books ?? []) {
      db2.run(
        "INSERT INTO books (id,title,author,total_pages,pages_read,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
        [row.id, row.title, row.author, row.total_pages, row.pages_read, row.completed, row.created_at, row.updated_at]
      );
    }
    for (const row of data.daily_notes ?? []) {
      db2.run(
        "INSERT INTO daily_notes (id,date,content,created_at,updated_at) VALUES (?,?,?,?,?)",
        [row.id, row.date, row.content, row.created_at, row.updated_at]
      );
    }
    for (const row of data.settings ?? []) {
      db2.run("INSERT INTO settings (key,value) VALUES (?,?)", [row.key, row.value]);
    }
    return { success: true };
  });
}
let mainWindow = null;
function resolveIcon() {
  const candidates = [
    path.join(process.resourcesPath ?? "", "icon.png"),
    path.join(electron.app.getAppPath(), "..", "resources", "icon.png"),
    path.join(__dirname, "../../resources/icon.png"),
    path.join(__dirname, "../../../resources/icon.png")
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return electron.nativeImage.createFromPath(p);
  }
  return void 0;
}
function createWindow() {
  const icon = resolveIcon();
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    resizable: true,
    maximizable: true,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    title: "Planner",
    ...icon ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.personal.planner");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  initDatabase();
  registerAllHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
