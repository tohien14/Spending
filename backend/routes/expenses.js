const express = require("express");
const { pool } = require("../db");

const router = express.Router();

async function attachCategory(row) {
  if (!row) return row;
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [row.category_id]);
  return { ...row, category: rows[0] || null };
}

// GET /api/expenses?month=YYYY-MM&category=ID&type=expense|income
router.get("/", async (req, res) => {
  try {
    const { month, category, type } = req.query;
    const conditions = [];
    const params = [];

    if (month) {
      params.push(`${month}%`);
      conditions.push(`spent_on LIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category_id = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT * FROM expenses ${where} ORDER BY spent_on DESC, id DESC`,
      params
    );

    const withCategory = await Promise.all(rows.map(attachCategory));
    res.json(withCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được danh sách giao dịch" });
  }
});

// POST /api/expenses - them giao dich moi
router.post("/", async (req, res) => {
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

  try {
    const { rows } = await pool.query(
      `INSERT INTO expenses (amount, category_id, note, spent_on, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [Number(amount), category_id, note || "", spent_on, type === "income" ? "income" : "expense"]
    );
    res.status(201).json(await attachCategory(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu giao dịch" });
  }
});

// PUT /api/expenses/:id - sua giao dich
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: existingRows } = await pool.query("SELECT * FROM expenses WHERE id = $1", [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Không tìm thấy giao dịch" });

    const amount = req.body.amount !== undefined ? Number(req.body.amount) : existing.amount;
    const category_id = req.body.category_id ?? existing.category_id;
    const note = req.body.note ?? existing.note;
    const spent_on = req.body.spent_on ?? existing.spent_on;
    const type = req.body.type ?? existing.type;

    const { rows } = await pool.query(
      `UPDATE expenses SET amount = $1, category_id = $2, note = $3, spent_on = $4, type = $5
       WHERE id = $6 RETURNING *`,
      [amount, category_id, note, spent_on, type, id]
    );
    res.json(await attachCategory(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể cập nhật giao dịch" });
  }
});

// DELETE /api/expenses/:id
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể xoá giao dịch" });
  }
});

// ---------- THONG KE ----------

// GET /api/expenses/stats/summary?month=YYYY-MM
router.get("/stats/summary", async (req, res) => {
  try {
    const m = req.query.month || new Date().toISOString().slice(0, 7);

    const { rows: totalsRows } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS "totalExpense",
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS "totalIncome",
         COUNT(CASE WHEN type = 'expense' THEN 1 END)::int AS "expenseCount"
       FROM expenses WHERE spent_on LIKE $1`,
      [`${m}%`]
    );
    const totals = totalsRows[0];
    const totalExpense = Number(totals.totalExpense);
    const totalIncome = Number(totals.totalIncome);

    const { rows: budgetRows } = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM budgets WHERE month = $1",
      [m]
    );
    const budget = Number(budgetRows[0].total);

    res.json({
      month: m,
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
      expenseCount: totals.expenseCount,
      totalBudget: budget,
      budgetRemaining: budget - totalExpense,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được số liệu tổng quan" });
  }
});

// GET /api/expenses/stats/by-category?month=YYYY-MM
router.get("/stats/by-category", async (req, res) => {
  try {
    const m = req.query.month || new Date().toISOString().slice(0, 7);

    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.icon, c.color,
              COALESCE(MAX(b.amount), 0) AS monthly_budget,
              COALESCE(SUM(e.amount), 0) AS spent
       FROM categories c
       LEFT JOIN budgets b ON b.category_id = c.id AND b.month = $1
       LEFT JOIN expenses e
         ON e.category_id = c.id AND e.type = 'expense' AND e.spent_on LIKE $2
       GROUP BY c.id
       ORDER BY spent DESC`,
      [m, `${m}%`]
    );

    res.json(
      rows.map((r) => ({ ...r, monthly_budget: Number(r.monthly_budget), spent: Number(r.spent) }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được thống kê theo danh mục" });
  }
});

// GET /api/expenses/stats/trend?months=6
router.get("/stats/trend", async (req, res) => {
  try {
    const months = Number(req.query.months) || 6;
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const { rows } = await pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
         FROM expenses WHERE spent_on LIKE $1`,
        [`${key}%`]
      );

      result.push({
        month: key,
        expense: Number(rows[0].expense),
        income: Number(rows[0].income),
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được xu hướng chi tiêu" });
  }
});

module.exports = router;
