const express = require("express");
const { pool } = require("../db");

const router = express.Router();

async function attachCategory(row) {
  if (!row) return row;
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [row.category_id]);
  return { ...row, category: rows[0] || null };
}

// GET /api/expenses?month=YYYY-MM&category=ID&type=expense|income
// Luon chi tra ve giao dich CUA CHINH tai khoan dang dang nhap.
router.get("/", async (req, res) => {
  try {
    const { month, category, type } = req.query;
    const conditions = ["user_id = $1"];
    const params = [req.userId];

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

    const { rows } = await pool.query(
      `SELECT * FROM expenses WHERE ${conditions.join(" AND ")} ORDER BY spent_on DESC, id DESC`,
      params
    );

    const withCategory = await Promise.all(rows.map(attachCategory));
    res.json(withCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được danh sách giao dịch" });
  }
});

// POST /api/expenses - them giao dich moi cho tai khoan dang dang nhap
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
    // Dam bao danh muc duoc chon la CUA CHINH minh, tranh 1 tai khoan gan
    // giao dich vao danh muc cua tai khoan khac (do doan/gui thang id).
    const { rows: catRows } = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
      [category_id, req.userId]
    );
    if (catRows.length === 0) {
      return res.status(400).json({ error: "Danh mục không hợp lệ" });
    }

    const { rows } = await pool.query(
      `INSERT INTO expenses (user_id, amount, category_id, note, spent_on, type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.userId,
        Number(amount),
        category_id,
        note || "",
        spent_on,
        type === "income" ? "income" : "expense",
      ]
    );
    res.status(201).json(await attachCategory(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu giao dịch" });
  }
});

// POST /api/expenses/bulk - them NHIEU giao dich cung luc, cho tai khoan dang dang nhap
// body: { items: [{ amount, category_id, note, spent_on, type }, ...] }
// Neu bat ky dong nao loi, KHONG dong nao duoc luu (tat ca hoac khong gi ca).
router.post("/bulk", async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Danh sách giao dịch đang trống" });
  }
  if (items.length > 200) {
    return res.status(400).json({ error: "Chỉ được thêm tối đa 200 giao dịch trong 1 lần" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Danh sach id danh muc HOP LE cua chinh tai khoan nay (kiem tra 1 lan
    // cho ca lo, thay vi query lai moi dong)
    const { rows: myCats } = await client.query(
      "SELECT id FROM categories WHERE user_id = $1",
      [req.userId]
    );
    const validCatIds = new Set(myCats.map((c) => c.id));

    const created = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i] || {};
      const amount = Number(item.amount);
      const category_id = Number(item.category_id);
      const spent_on = item.spent_on;
      const type = item.type === "income" ? "income" : "expense";

      if (!amount || amount <= 0) {
        throw new Error(`Dòng ${i + 1}: số tiền phải lớn hơn 0`);
      }
      if (!category_id || !validCatIds.has(category_id)) {
        throw new Error(`Dòng ${i + 1}: danh mục không hợp lệ`);
      }
      if (!spent_on) {
        throw new Error(`Dòng ${i + 1}: thiếu ngày`);
      }

      const { rows } = await client.query(
        `INSERT INTO expenses (user_id, amount, category_id, note, spent_on, type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.userId, amount, category_id, item.note || "", spent_on, type]
      );
      created.push(rows[0]);
    }

    await client.query("COMMIT");

    const withCategory = await Promise.all(created.map(attachCategory));
    res.status(201).json({ count: withCategory.length, items: withCategory });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message || "Không thể lưu các giao dịch" });
  } finally {
    client.release();
  }
});

// PUT /api/expenses/:id - sua giao dich CUA CHINH minh
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: existingRows } = await pool.query(
      "SELECT * FROM expenses WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Không tìm thấy giao dịch" });

    const amount = req.body.amount !== undefined ? Number(req.body.amount) : existing.amount;
    const category_id = req.body.category_id ?? existing.category_id;
    const note = req.body.note ?? existing.note;
    const spent_on = req.body.spent_on ?? existing.spent_on;
    const type = req.body.type ?? existing.type;

    if (req.body.category_id) {
      const { rows: catRows } = await pool.query(
        "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
        [category_id, req.userId]
      );
      if (catRows.length === 0) return res.status(400).json({ error: "Danh mục không hợp lệ" });
    }

    const { rows } = await pool.query(
      `UPDATE expenses SET amount = $1, category_id = $2, note = $3, spent_on = $4, type = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [amount, category_id, note, spent_on, type, id, req.userId]
    );
    res.json(await attachCategory(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể cập nhật giao dịch" });
  }
});

// DELETE /api/expenses/:id - chi xoa duoc giao dich CUA CHINH minh
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM expenses WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể xoá giao dịch" });
  }
});

// ---------- THONG KE (deu chi tinh tren du lieu CUA CHINH tai khoan) ----------

// GET /api/expenses/stats/summary?month=YYYY-MM
router.get("/stats/summary", async (req, res) => {
  try {
    const m = req.query.month || new Date().toISOString().slice(0, 7);

    const { rows: totalsRows } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS "totalExpense",
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS "totalIncome",
         COUNT(CASE WHEN type = 'expense' THEN 1 END)::int AS "expenseCount"
       FROM expenses WHERE user_id = $1 AND spent_on LIKE $2`,
      [req.userId, `${m}%`]
    );
    const totals = totalsRows[0];
    const totalExpense = Number(totals.totalExpense);
    const totalIncome = Number(totals.totalIncome);

    const { rows: budgetRows } = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM budgets WHERE user_id = $1 AND month = $2",
      [req.userId, m]
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
       LEFT JOIN budgets b ON b.category_id = c.id AND b.month = $1 AND b.user_id = c.user_id
       LEFT JOIN expenses e
         ON e.category_id = c.id AND e.type = 'expense' AND e.spent_on LIKE $2 AND e.user_id = c.user_id
       WHERE c.user_id = $3
       GROUP BY c.id
       ORDER BY spent DESC`,
      [m, `${m}%`, req.userId]
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
         FROM expenses WHERE user_id = $1 AND spent_on LIKE $2`,
        [req.userId, `${key}%`]
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
