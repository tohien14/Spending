const express = require("express");
const db = require("../db");

const router = express.Router();

function rowWithCategory(row) {
  if (!row) return row;
  const cat = db.prepare("SELECT * FROM categories WHERE id = ?").get(row.category_id);
  return { ...row, category: cat || null };
}

// GET /api/expenses?month=YYYY-MM&category=ID&type=expense|income
router.get("/", (req, res) => {
  const { month, category, type } = req.query;
  let sql = "SELECT * FROM expenses WHERE 1=1";
  const params = [];

  if (month) {
    sql += " AND spent_on LIKE ?";
    params.push(`${month}%`);
  }
  if (category) {
    sql += " AND category_id = ?";
    params.push(category);
  }
  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }
  sql += " ORDER BY spent_on DESC, id DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(rowWithCategory));
});

// POST /api/expenses - them giao dich moi
router.post("/", (req, res) => {
  const { amount, category_id, note, spent_on, type } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: "Số tiền phải lớn hơn 0" });
  }
  if (!category_id) {
    return res.status(400).json({ error: "Vui lòng chọn danh mục" });
  }
  if (!spent_on) {
    return res.status(400).json({ error: "Vui lòng chọn ngày" });
  }

  const stmt = db.prepare(
    "INSERT INTO expenses (amount, category_id, note, spent_on, type) VALUES (?, ?, ?, ?, ?)"
  );
  const info = stmt.run(
    Number(amount),
    category_id,
    note || "",
    spent_on,
    type === "income" ? "income" : "expense"
  );
  const created = db.prepare("SELECT * FROM expenses WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(rowWithCategory(created));
});

// PUT /api/expenses/:id - sua giao dich
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Không tìm thấy giao dịch" });

  const amount = req.body.amount !== undefined ? Number(req.body.amount) : existing.amount;
  const category_id = req.body.category_id ?? existing.category_id;
  const note = req.body.note ?? existing.note;
  const spent_on = req.body.spent_on ?? existing.spent_on;
  const type = req.body.type ?? existing.type;

  db.prepare(
    "UPDATE expenses SET amount = ?, category_id = ?, note = ?, spent_on = ?, type = ? WHERE id = ?"
  ).run(amount, category_id, note, spent_on, type, id);

  res.json(rowWithCategory(db.prepare("SELECT * FROM expenses WHERE id = ?").get(id)));
});

// DELETE /api/expenses/:id
router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM expenses WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Không tìm thấy giao dịch" });
  res.status(204).send();
});

// ---------- THONG KE ----------

// GET /api/expenses/stats/summary?month=YYYY-MM
router.get("/stats/summary", (req, res) => {
  const { month } = req.query;
  const m = month || new Date().toISOString().slice(0, 7);

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
         COUNT(CASE WHEN type = 'expense' THEN 1 END) AS expenseCount
       FROM expenses WHERE spent_on LIKE ?`
    )
    .get(`${m}%`);

  const budget = db
    .prepare("SELECT COALESCE(SUM(monthly_budget), 0) AS total FROM categories")
    .get().total;

  res.json({
    month: m,
    totalExpense: totals.totalExpense,
    totalIncome: totals.totalIncome,
    balance: totals.totalIncome - totals.totalExpense,
    expenseCount: totals.expenseCount,
    totalBudget: budget,
    budgetRemaining: budget - totals.totalExpense,
  });
});

// GET /api/expenses/stats/by-category?month=YYYY-MM
router.get("/stats/by-category", (req, res) => {
  const { month } = req.query;
  const m = month || new Date().toISOString().slice(0, 7);

  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.icon, c.color, c.monthly_budget,
              COALESCE(SUM(e.amount), 0) AS spent
       FROM categories c
       LEFT JOIN expenses e
         ON e.category_id = c.id AND e.type = 'expense' AND e.spent_on LIKE ?
       GROUP BY c.id
       ORDER BY spent DESC`
    )
    .all(`${m}%`);

  res.json(rows);
});

// GET /api/expenses/stats/trend?months=6
router.get("/stats/trend", (req, res) => {
  const months = Number(req.query.months) || 6;
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
         FROM expenses WHERE spent_on LIKE ?`
      )
      .get(`${key}%`);
    result.push({ month: key, expense: row.expense, income: row.income });
  }

  res.json(result);
});

module.exports = router;
