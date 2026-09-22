const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/categories?month=YYYY-MM - danh sach danh muc CUA CHINH tai khoan dang dang nhap
router.get("/", async (req, res) => {
  try {
    const { month } = req.query;

    if (month) {
      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.icon, c.color, c.created_at,
                COALESCE(b.amount, 0) AS monthly_budget
         FROM categories c
         LEFT JOIN budgets b ON b.category_id = c.id AND b.month = $1 AND b.user_id = c.user_id
         WHERE c.user_id = $2
         ORDER BY c.name ASC`,
        [month, req.userId]
      );
      return res.json(rows);
    }

    const { rows } = await pool.query(
      "SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC",
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được danh sách danh mục" });
  }
});

// POST /api/categories - tao danh muc moi cho tai khoan dang dang nhap
router.post("/", async (req, res) => {
  const { name, icon, color, monthly_budget, month } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Tên danh mục không được để trống" });
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO categories (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.userId, name.trim(), icon || "💰", color || "#3D5A50"]
    );
    const created = rows[0];
    const budgetAmount = Number(monthly_budget) || 0;

    if (month && budgetAmount > 0) {
      await pool.query(
        "INSERT INTO budgets (user_id, month, category_id, amount) VALUES ($1, $2, $3, $4)",
        [req.userId, month, created.id, budgetAmount]
      );
    }

    res.status(201).json({ ...created, monthly_budget: budgetAmount });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Danh mục này đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ error: "Không thể tạo danh mục" });
  }
});

// PUT /api/categories/:id - cap nhat ten/icon/mau (chi tren danh muc CUA CHINH minh)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: existingRows } = await pool.query(
      "SELECT * FROM categories WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: "Không tìm thấy danh mục" });

    const name = req.body.name ?? existing.name;
    const icon = req.body.icon ?? existing.icon;
    const color = req.body.color ?? existing.color;

    const { rows } = await pool.query(
      "UPDATE categories SET name = $1, icon = $2, color = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
      [name, icon, color, id, req.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Tên danh mục này đã tồn tại" });
    }
    console.error(err);
    res.status(500).json({ error: "Không thể cập nhật danh mục" });
  }
});

// PUT /api/categories/:id/budget - dat ngan sach RIENG cho 1 thang (chi tren danh muc cua minh)
router.put("/:id/budget", async (req, res) => {
  const { id } = req.params;
  const { month, amount } = req.body;

  if (!month) return res.status(400).json({ error: "Thiếu tháng (month)" });

  try {
    const { rows: catRows } = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    if (catRows.length === 0) return res.status(404).json({ error: "Không tìm thấy danh mục" });

    const value = Number(amount) || 0;
    await pool.query(
      `INSERT INTO budgets (user_id, month, category_id, amount) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, month, category_id) DO UPDATE SET amount = EXCLUDED.amount`,
      [req.userId, month, id, value]
    );

    res.json({ category_id: Number(id), month, monthly_budget: value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể cập nhật ngân sách" });
  }
});

// DELETE /api/categories/:id - xoa danh muc CUA CHINH minh (chi khi khong con giao dich nao dung no)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: catRows } = await pool.query(
      "SELECT id FROM categories WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    if (catRows.length === 0) return res.status(404).json({ error: "Không tìm thấy danh mục" });

    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int AS c FROM expenses WHERE category_id = $1",
      [id]
    );
    if (countRows[0].c > 0) {
      return res.status(409).json({
        error: `Không thể xoá: còn ${countRows[0].c} giao dịch đang thuộc danh mục này`,
      });
    }

    await pool.query("DELETE FROM categories WHERE id = $1 AND user_id = $2", [id, req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể xoá danh mục" });
  }
});

module.exports = router;
