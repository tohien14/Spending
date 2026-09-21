// db.js
// Ket noi PostgreSQL qua bien moi truong DATABASE_URL (bat buoc phai co).
// Khac voi SQLite truoc day, PostgreSQL la mot database server that su,
// nen ban can 1 chuoi ket noi toi 1 server Postgres dang chay o dau do —
// xem README.md de biet cach lay mien phi (Neon, Supabase, Render Postgres...).
//
// Toan bo cau lenh trong file nay va cac route deu la BAT DONG BO (Promise),
// khac voi node:sqlite/better-sqlite3 truoc day la DONG BO.

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ Thiếu biến môi trường DATABASE_URL.\n" +
      "   Tạo file backend/.env (copy từ backend/.env.example) và điền chuỗi kết nối Postgres.\n" +
      "   Xem README.md mục 'Cơ sở dữ liệu PostgreSQL' để biết cách lấy miễn phí."
  );
  process.exit(1);
}

// Cac dich vu Postgres mien phi (Neon, Supabase, Render...) deu yeu cau SSL.
// Chi tat SSL khi ro rang dang chay Postgres local (localhost/127.0.0.1).
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("❌ Lỗi kết nối PostgreSQL:", err.message);
});

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT '💰',
      color TEXT NOT NULL DEFAULT '#3D5A50',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      amount DOUBLE PRECISION NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      note TEXT DEFAULT '',
      spent_on TEXT NOT NULL,               -- 'YYYY-MM-DD' (giu la TEXT, khong dung DATE,
                                             -- de tranh driver tra ve object Date lam lech
                                             -- dinh dang ma frontend dang doc)
      type TEXT NOT NULL DEFAULT 'expense', -- 'expense' | 'income'
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_spent_on ON expenses(spent_on);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

    -- Thu nhap RIENG cho tung thang
    CREATE TABLE IF NOT EXISTS incomes (
      month TEXT PRIMARY KEY,   -- 'YYYY-MM'
      amount DOUBLE PRECISION NOT NULL DEFAULT 0
    );

    -- Ngan sach moi danh muc cung RIENG cho tung thang
    CREATE TABLE IF NOT EXISTS budgets (
      month TEXT NOT NULL,      -- 'YYYY-MM'
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      PRIMARY KEY (month, category_id)
    );
  `);

  // Seed danh muc mac dinh neu database dang trong (lan chay dau tien)
  const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS c FROM categories");
  if (countRows[0].c === 0) {
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
    const thisMonth = currentMonthStr();

    for (const [name, icon, color, budget] of defaults) {
      const { rows } = await pool.query(
        "INSERT INTO categories (name, icon, color) VALUES ($1, $2, $3) RETURNING id",
        [name, icon, color]
      );
      if (budget > 0) {
        await pool.query(
          `INSERT INTO budgets (month, category_id, amount) VALUES ($1, $2, $3)
           ON CONFLICT (month, category_id) DO NOTHING`,
          [thisMonth, rows[0].id, budget]
        );
      }
    }
  }
}

module.exports = {
  pool,
  currentMonthStr,
  ready: init(),
};
