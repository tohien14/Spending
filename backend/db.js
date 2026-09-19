// db.js
// Su dung node:sqlite (co san trong Node.js tu ban 22.5+, on dinh tu ban 24)
// -> KHONG can cai them goi native nao, khong can Python/node-gyp/build tools.
// Toan bo du lieu duoc luu trong 1 file duy nhat (data/expenses.db). Khong
// can cai dat hay chay bat ky database server nao (khong MySQL, khong
// Postgres, khong Docker...). File nay se tu duoc tao ra trong lan chay dau.

const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "expenses.db");
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT '💰',
    color TEXT NOT NULL DEFAULT '#3D5A50',
    monthly_budget REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category_id INTEGER NOT NULL,
    note TEXT DEFAULT '',
    spent_on TEXT NOT NULL,               -- YYYY-MM-DD
    type TEXT NOT NULL DEFAULT 'expense', -- 'expense' | 'income'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_spent_on ON expenses(spent_on);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed du lieu danh muc mac dinh neu bang dang rong
const categoryCount = db.prepare("SELECT COUNT(*) AS c FROM categories").get().c;
if (categoryCount === 0) {
  const insert = db.prepare(
    "INSERT INTO categories (name, icon, color, monthly_budget) VALUES (?, ?, ?, ?)"
  );
  const defaults = [
    ["Ăn uống", "🍜", "#E83C91", 3000000],
    ["Di chuyển", "🚗", "#43334C", 800000],
    ["Nhà ở", "🏠", "#8E2F63", 5000000],
    ["Giải trí", "🎬", "#FF8FB7", 500000],
    ["Sức khỏe", "💊", "#7A6B94", 500000],
    ["Mua sắm", "🛍️", "#C2447B", 1000000],
    ["Hóa đơn", "🧾", "#B98CA6", 1500000],
    ["Khác", "✳️", "#F2A6C6", 500000],
  ];
  for (const row of defaults) insert.run(...row);
}

module.exports = db;
