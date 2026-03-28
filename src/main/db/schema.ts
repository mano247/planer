import { Database } from 'node-sqlite3-wasm'

export function runMigrations(db: Database): void {
  db.exec(`
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
  `)

  // Migrate existing todos table — add task_type if missing
  try {
    db.exec("ALTER TABLE todos ADD COLUMN task_type TEXT DEFAULT 'daily'")
  } catch {
    // Column already exists — that's fine
  }

  // Seed default settings
  const langRow = db.get('SELECT COUNT(*) as c FROM settings WHERE key = ?', ['language']) as { c: number } | null
  if (!langRow || langRow.c === 0) {
    db.run("INSERT INTO settings (key, value) VALUES ('language', 'en')")
    db.run("INSERT INTO settings (key, value) VALUES ('last_tab', 'schedule')")
  }

  // Seed default categories
  const catRow = db.get('SELECT COUNT(*) as c FROM categories') as { c: number } | null
  if (!catRow || catRow.c === 0) {
    seedCategories(db)
  }
}

const DEFAULT_CATEGORIES = [
  {
    name_en: 'Sport / Fitness',
    name_sr: 'Sport / Fitnes',
    icon: '🏃',
    color: '#ef4444',
    keywords: ['gym', 'teretana', 'run', 'trčanje', 'trcanje', 'workout', 'swim', 'plivanje', 'yoga', 'bike', 'bicikl', 'cycling', 'fitness', 'sport', 'training', 'trening', 'walk', 'setnja', 'šetnja', 'hike', 'planina', 'football', 'fudbal', 'basketball', 'kosarka', 'košarka', 'tennis', 'tenis']
  },
  {
    name_en: 'Learning / Study',
    name_sr: 'Učenje / Studije',
    icon: '📚',
    color: '#3b82f6',
    keywords: ['study', 'ucenje', 'učenje', 'kurs', 'course', 'read', 'citanje', 'čitanje', 'lecture', 'predavanje', 'research', 'istrazivanje', 'istraživanje', 'learn', 'tutorial', 'book', 'knjiga', 'school', 'skola', 'škola', 'university', 'fakultet', 'exam', 'ispit', 'homework', 'domaci', 'domaći']
  },
  {
    name_en: 'Work / Job',
    name_sr: 'Posao / Rad',
    icon: '💼',
    color: '#8b5cf6',
    keywords: ['work', 'posao', 'rad', 'meeting', 'sastanak', 'code', 'coding', 'programiranje', 'project', 'projekat', 'task', 'zadatak', 'email', 'mejl', 'call', 'poziv', 'office', 'kancelarija', 'client', 'klijent', 'deadline', 'report', 'izvestaj', 'izveštaj', 'prezentacija', 'presentation']
  },
  {
    name_en: 'Home / Chores',
    name_sr: 'Kućni poslovi',
    icon: '🏠',
    color: '#f59e0b',
    keywords: ['clean', 'cleaning', 'ciscenje', 'čišćenje', 'cook', 'cooking', 'kuvanje', 'usisavanje', 'vacuum', 'laundry', 'ves', 'veš', 'grocery', 'groceries', 'kupovina', 'shopping', 'dishes', 'sudovi', 'trash', 'djubre', 'đubre', 'home', 'kuca', 'kuća', 'maintain', 'odrzavanje', 'održavanje', 'repair', 'popravka']
  },
  {
    name_en: 'Social / Friends',
    name_sr: 'Prijatelji / Izlasci',
    icon: '👥',
    color: '#10b981',
    keywords: ['friends', 'prijatelji', 'party', 'zabava', 'dinner', 'vecera', 'večera', 'lunch', 'rucak', 'ručak', 'coffee', 'kafa', 'cafe', 'kafic', 'kafić', 'out', 'izlazak', 'bar', 'club', 'klub', 'gathering', 'drustveno', 'društveno', 'social', 'visit', 'poseta', 'posjeta']
  },
  {
    name_en: 'Family',
    name_sr: 'Porodica',
    icon: '👨‍👩‍👧',
    color: '#ec4899',
    keywords: ['family', 'porodica', 'parents', 'roditelji', 'kids', 'deca', 'djeca', 'children', 'mama', 'tata', 'baka', 'deka', 'grandma', 'grandpa', 'brat', 'sestra', 'sibling', 'brother', 'sister', 'family time', 'porodicno', 'porodično']
  },
  {
    name_en: 'Health / Medical',
    name_sr: 'Zdravlje / Medicina',
    icon: '❤️',
    color: '#06b6d4',
    keywords: ['doctor', 'lekar', 'doktor', 'hospital', 'bolnica', 'pharmacy', 'apoteka', 'therapy', 'terapija', 'dentist', 'zubar', 'checkup', 'pregled', 'medicine', 'lek', 'lijek', 'health', 'zdravlje', 'meditate', 'meditacija', 'mental', 'mentalno', 'wellness']
  },
  {
    name_en: 'Entertainment / Rest',
    name_sr: 'Zabava / Odmor',
    icon: '🎮',
    color: '#84cc16',
    keywords: ['movie', 'film', 'netflix', 'game', 'igrica', 'games', 'gaming', 'series', 'serija', 'tv', 'relax', 'odmor', 'rest', 'music', 'muzika', 'concert', 'koncert', 'youtube', 'podcast', 'nap', 'sleep', 'spavanje', 'san', 'chill', 'opustanje']
  }
]

function seedCategories(db: Database): void {
  for (const cat of DEFAULT_CATEGORIES) {
    const result = db.run(
      'INSERT INTO categories (name_en, name_sr, icon, color, is_default) VALUES (?, ?, ?, ?, 1)',
      [cat.name_en, cat.name_sr, cat.icon, cat.color]
    )
    const catId = Number(result.lastInsertRowid)
    for (const kw of cat.keywords) {
      db.run('INSERT INTO keywords (category_id, keyword) VALUES (?, ?)', [catId, kw.toLowerCase()])
    }
  }
}
