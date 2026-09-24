// db.js
// Ket noi PostgreSQL qua bien moi truong DATABASE_URL.
//
// Ban nay ho tro NHIEU TAI KHOAN (moi tai khoan co du lieu rieng, khong ai
// thay duoc du lieu cua nguoi kia). Neu database cua ban dang chay o phien
// ban CU (chi 1 nguoi dung, chua co bang "users"), code duoi day se TU
// DONG nang cap schema va gan toan bo du lieu cu cho tai khoan DAU TIEN
// duoc tao (mac dinh la "hien") — khong lam mat du lieu ban da nhap.

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ Thiếu biến môi trường DATABASE_URL.\n" +
      "   Tạo file backend/.env (copy từ backend/.env.example) và điền chuỗi kết nối Postgres.\n" +
      "   Xem README.md mục 'Cơ sở dữ liệu PostgreSQL' để biết cách lấy miễn phí."
  );
  process.exit(1);
}

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

// Danh sach tai khoan tinh. Doc tu bien moi truong neu co, de ban co the
// doi mat khau/them tai khoan moi ma khong can sua code.
//
// - Tai khoan 1 va 2 luon co san (mac dinh hien/duc neu khong dat bien).
// - Tu tai khoan thu 3 tro di: dat ca USER{n}_USERNAME va USER{n}_PASSWORD
//   trong file .env thi tai khoan do se duoc tao khi backend khoi dong
//   (khong co gia tri mac dinh, vi khong the doan ban muon them ai).
//   Vi du them tai khoan thu 3 va 4:
//     USER3_USERNAME=an
//     USER3_PASSWORD=matkhau3
//     USER3_DISPLAY_NAME=An
//     USER4_USERNAME=binh
//     USER4_PASSWORD=matkhau4
//     USER4_DISPLAY_NAME=Bình
function loadStaticUsers() {
  const users = [
    {
      username: process.env.USER1_USERNAME || "hien",
      password: process.env.USER1_PASSWORD || "1234&",
      display_name: process.env.USER1_DISPLAY_NAME || "Hiền",
    },
    {
      username: process.env.USER2_USERNAME || "duc",
      password: process.env.USER2_PASSWORD || "1234@",
      display_name: process.env.USER2_DISPLAY_NAME || "Đức",
    },
    {
      username: process.env.USER3_USERNAME || "loan",
      password: process.env.USER3_PASSWORD || "1234",
      display_name: process.env.USER3_DISPLAY_NAME || "Loan",
    }
  ];

  let i = 3;
  while (process.env[`USER${i}_USERNAME`] && process.env[`USER${i}_PASSWORD`]) {
    users.push({
      username: process.env[`USER${i}_USERNAME`],
      password: process.env[`USER${i}_PASSWORD`],
      display_name: process.env[`USER${i}_DISPLAY_NAME`] || `Người dùng ${i}`,
    });
    i++;
  }

  return users;
}

const STATIC_USERS = loadStaticUsers();

const DEFAULT_CATEGORIES = [
  ["Ăn uống", "🍜", "#E83C91", 3000000],
  ["Di chuyển", "🚗", "#43334C", 800000],
  ["Nhà ở", "🏠", "#8E2F63", 5000000],
  ["Giải trí", "🎬", "#FF8FB7", 500000],
  ["Sức khỏe", "💊", "#7A6B94", 500000],
  ["Mua sắm", "🛍️", "#C2447B", 1000000],
  ["Hóa đơn", "🧾", "#B98CA6", 1500000],
  ["Khác", "✳️", "#F2A6C6", 500000],
];

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function ensureUserIdColumn(table) {
  if (!(await columnExists(table, "user_id"))) {
    await pool.query(
      `ALTER TABLE ${table} ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
    );
  }
}

async function backfillUserId(table, userId) {
  await pool.query(`UPDATE ${table} SET user_id = $1 WHERE user_id IS NULL`, [userId]);
}

async function enforceUserIdNotNull(table) {
  await pool.query(`ALTER TABLE ${table} ALTER COLUMN user_id SET NOT NULL`);
}

// Danh muc truoc day la UNIQUE(name) toan cuc — gio can UNIQUE(user_id, name)
// de 2 tai khoan cung duoc dat ten danh muc trung nhau (vd ca 2 deu co "Ăn uống").
async function fixCategoriesUniqueConstraint() {
  const { rows } = await pool.query(
    `SELECT conname FROM pg_constraint WHERE conrelid = 'categories'::regclass AND contype = 'u'`
  );
  if (rows.some((r) => r.conname === "categories_user_id_name_key")) return;

  for (const r of rows) {
    await pool.query(`ALTER TABLE categories DROP CONSTRAINT "${r.conname}"`);
  }
  await pool.query(`ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name)`);
}

async function getPrimaryKeyColumns(table) {
  const { rows } = await pool.query(
    `SELECT a.attname
     FROM pg_constraint c
     JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
     JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
     WHERE c.conrelid = $1::regclass AND c.contype = 'p'
     ORDER BY k.ord`,
    [table]
  );
  return rows.map((r) => r.attname);
}

// incomes truoc day co khoa chinh la (month) — gio can (user_id, month)
async function fixIncomesPrimaryKey() {
  const cols = await getPrimaryKeyColumns("incomes");
  if (cols.length === 2 && cols[0] === "user_id" && cols[1] === "month") return;

  await pool.query(`ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_pkey`);
  await pool.query(`ALTER TABLE incomes ADD PRIMARY KEY (user_id, month)`);
}

// budgets truoc day co khoa chinh la (month, category_id) — gio can them user_id
async function fixBudgetsPrimaryKey() {
  const cols = await getPrimaryKeyColumns("budgets");
  if (cols.length === 3 && cols[0] === "user_id" && cols[1] === "month" && cols[2] === "category_id") return;

  await pool.query(`ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_pkey`);
  await pool.query(`ALTER TABLE budgets ADD PRIMARY KEY (user_id, month, category_id)`);
}

async function seedDefaultCategoriesForUser(userId, month) {
  for (const [name, icon, color, budget] of DEFAULT_CATEGORIES) {
    const { rows } = await pool.query(
      "INSERT INTO categories (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, name, icon, color]
    );
    if (budget > 0) {
      await pool.query(
        `INSERT INTO budgets (user_id, month, category_id, amount) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, month, category_id) DO NOTHING`,
        [userId, month, rows[0].id, budget]
      );
    }
  }
}

// ---------- Tu dong xoa du lieu cu (giam dung luong database ve lau dai) ----------

// So thang duoc GIU LAI, tinh ca thang hien tai. Mac dinh 3 = giu thang
// nay + 2 thang truoc do, xoa tu thang thu 4 tro ve truoc. Vi du dang o
// thang 12: giu 10/11/12, xoa het du lieu tu thang 9 tro ve truoc.
const RETENTION_MONTHS = Math.max(1, Number(process.env.RETENTION_MONTHS) || 3);

function monthsAgoStr(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function cleanupOldData() {
  // Thang cu nhat duoc GIU LAI — moi thu tu thang truoc do se bi xoa
  const cutoffMonth = monthsAgoStr(RETENTION_MONTHS - 1);
  const cutoffDate = `${cutoffMonth}-01`;

  try {
    // spent_on/month deu la TEXT dinh dang 'YYYY-MM-DD'/'YYYY-MM' nen so
    // sanh chuoi '<' cho ra dung thu tu thoi gian.
    const expResult = await pool.query("DELETE FROM expenses WHERE spent_on < $1", [cutoffDate]);
    const budgetResult = await pool.query("DELETE FROM budgets WHERE month < $1", [cutoffMonth]);
    const incomeResult = await pool.query("DELETE FROM incomes WHERE month < $1", [cutoffMonth]);

    const total = expResult.rowCount + budgetResult.rowCount + incomeResult.rowCount;
    if (total > 0) {
      console.log(
        `🧹 Tự động dọn dữ liệu cũ hơn ${RETENTION_MONTHS} tháng (trước ${cutoffMonth}): ` +
          `${expResult.rowCount} giao dịch, ${budgetResult.rowCount} ngân sách, ${incomeResult.rowCount} thu nhập đã bị xoá.`
      );
    }
  } catch (err) {
    console.error("❌ Lỗi khi tự động dọn dữ liệu cũ:", err.message);
  }
}

async function init() {
  // 1) Bang tai khoan
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL
    );
  `);

  // 2) Cac bang du lieu chinh (tao moi neu chua co — giu nguyen dinh dang
  //    CU, vi cot user_id se duoc them o buoc migrate ben duoi cho ca
  //    truong hop bang moi tinh lan va bang da co tu truoc)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '💰',
      color TEXT NOT NULL DEFAULT '#3D5A50',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      amount DOUBLE PRECISION NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      note TEXT DEFAULT '',
      spent_on TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_spent_on ON expenses(spent_on);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

    CREATE TABLE IF NOT EXISTS incomes (
      month TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS budgets (
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL DEFAULT 0
    );
  `);

  // 3) Seed 2 tai khoan tinh neu chua co tai khoan nao
  const { rows: userCountRows } = await pool.query("SELECT COUNT(*)::int AS c FROM users");
  const isFirstEverSetup = userCountRows[0].c === 0;
  if (isFirstEverSetup) {
    for (const u of STATIC_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await pool.query(
        "INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3)",
        [u.username, hash, u.display_name]
      );
    }
  } else {
    // Dam bao ca 2 tai khoan tinh cau hinh trong .env deu ton tai (vd ban
    // vua them 1 tai khoan moi vao STATIC_USERS sau khi da chay he thong
    // truoc do). Khong dong ho mat khau cua tai khoan da ton tai san.
    for (const u of STATIC_USERS) {
      const { rows } = await pool.query("SELECT id FROM users WHERE username = $1", [u.username]);
      if (rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.query(
          "INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3)",
          [u.username, hash, u.display_name]
        );
      }
    }
  }

  // 4) Them cot user_id vao 4 bang du lieu (an toan khi chay lai nhieu lan)
  for (const table of ["categories", "expenses", "incomes", "budgets"]) {
    await ensureUserIdColumn(table);
  }

  // 5) Neu day la database TU PHIEN BAN CU (co du lieu nhung chua gan
  //    user_id), gan toan bo du lieu cu do cho TAI KHOAN DAU TIEN trong
  //    danh sach STATIC_USERS (mac dinh la "hien") — khong mat du lieu.
  const { rows: firstUserRows } = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [STATIC_USERS[0].username]
  );
  const firstUserId = firstUserRows[0]?.id;
  if (firstUserId) {
    for (const table of ["categories", "expenses", "incomes", "budgets"]) {
      await backfillUserId(table, firstUserId);
    }
  }

  // 6) Bat buoc user_id khong duoc rong tu day tro di
  for (const table of ["categories", "expenses", "incomes", "budgets"]) {
    await enforceUserIdNotNull(table);
  }

  // 7) Sua lai cac rang buoc khoa (unique/primary key) cho dung voi mo hinh
  //    nhieu tai khoan
  await fixCategoriesUniqueConstraint();
  await fixIncomesPrimaryKey();
  await fixBudgetsPrimaryKey();

  // 8) Voi tai khoan nao CHUA co danh muc nao (vd tai khoan moi tinh vua
  //    tao lan dau), seed san 8 danh muc mac dinh cho tai khoan do
  const thisMonth = currentMonthStr();
  const { rows: allUsers } = await pool.query("SELECT id, username FROM users");
  for (const u of allUsers) {
    const { rows: catCount } = await pool.query(
      "SELECT COUNT(*)::int AS c FROM categories WHERE user_id = $1",
      [u.id]
    );
    if (catCount[0].c === 0) {
      await seedDefaultCategoriesForUser(u.id, thisMonth);
    }
  }

  // 9) Don du lieu qua han ngay khi khoi dong (VD deploy lai/thuc day sau
  //    khi ngu tren Render), sau do lap lai dinh ky de bat ca truong hop
  //    server chay lien tuc lau ngay khong restart.
  await cleanupOldData();
}

module.exports = {
  pool,
  currentMonthStr,
  ready: init().then(() => {
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
  }),
};
