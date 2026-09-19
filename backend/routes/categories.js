const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/categories?month=YYYY-MM - danh sach danh muc
// Neu co truyen "month": monthly_budget tra ve la ngan sach RIENG cua thang do
// (0 neu thang do chua duoc phan bo). Neu khong truyen month: monthly_budget
// tra ve la gia tri mac dinh cu (chi con dung de gia tri khoi tao, khong con
// y nghia "ngan sach hien hanh" nua).
router.get("/", (req, res) => {
  const { month } = req.query;

  if (month) {
    const rows = db
      .prepare(
        `SELECT c.id, c.name, c.icon, c.color, c.created_at,
                COALESCE(b.amount, 0) AS monthly_budget
         FROM categories c
         LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?
         ORDER BY c.name ASC`
      )
      .all(month);
    return res.json(rows);
  }

  const rows = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  res.json(rows);
});

// POST /api/categories - tao danh muc moi
// Neu body co "month", ngan sach ban dau se duoc luu RIENG cho thang do (bang
// budgets) thay vi ap dung cho moi thang.
router.post("/", (req, res) => {
  const { name, icon, color, monthly_budget, month } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Tên danh mục không được để trống" });
  }
  try {
    const stmt = db.prepare(
      "INSERT INTO categories (name, icon, color, monthly_budget) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(
      name.trim(),
      icon || "💰",
      color || "#3D5A50",
      Number(monthly_budget) || 0
    );

    if (month && Number(monthly_budget) > 0) {
      db.prepare(
        "INSERT INTO budgets (month, category_id, amount) VALUES (?, ?, ?)"
      ).run(month, info.lastInsertRowid, Number(monthly_budget));
    }

    const created = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(info.lastInsertRowid);
    res.status(201).json({ ...created, monthly_budget: Number(monthly_budget) || 0 });
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Danh mục này đã tồn tại" });
    }
    res.status(500).json({ error: "Không thể tạo danh mục" });
  }
});

// PUT /api/categories/:id - cap nhat thong tin danh muc (ten/icon/mau).
// KHONG dung endpoint nay de sua ngan sach nua — dung PUT /:id/budget ben duoi
// vi ngan sach gio la theo tung thang.
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Không tìm thấy danh mục" });

  const name = req.body.name ?? existing.name;
  const icon = req.body.icon ?? existing.icon;
  const color = req.body.color ?? existing.color;

  db.prepare("UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?").run(
    name,
    icon,
    color,
    id
  );

  res.json(db.prepare("SELECT * FROM categories WHERE id = ?").get(id));
});

// PUT /api/categories/:id/budget - dat ngan sach cho danh muc, RIENG cho 1 thang
// body: { month: 'YYYY-MM', amount: number }
router.put("/:id/budget", (req, res) => {
  const { id } = req.params;
  const { month, amount } = req.body;

  if (!month) return res.status(400).json({ error: "Thiếu tháng (month)" });

  const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(id);
  if (!category) return res.status(404).json({ error: "Không tìm thấy danh mục" });

  const value = Number(amount) || 0;
  const existing = db
    .prepare("SELECT 1 FROM budgets WHERE month = ? AND category_id = ?")
    .get(month, id);

  if (existing) {
    db.prepare("UPDATE budgets SET amount = ? WHERE month = ? AND category_id = ?").run(
      value,
      month,
      id
    );
  } else {
    db.prepare("INSERT INTO budgets (month, category_id, amount) VALUES (?, ?, ?)").run(
      month,
      id,
      value
    );
  }

  res.json({ category_id: Number(id), month, monthly_budget: value });
});

// DELETE /api/categories/:id - xoa danh muc (chi khi khong con giao dich nao dung no)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const used = db
    .prepare("SELECT COUNT(*) AS c FROM expenses WHERE category_id = ?")
    .get(id).c;
  if (used > 0) {
    return res.status(409).json({
      error: `Không thể xoá: còn ${used} giao dịch đang thuộc danh mục này`,
    });
  }
  const info = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  if (info.changes === 0) return res.status(404).json({ error: "Không tìm thấy danh mục" });
  res.status(204).send();
});

module.exports = router;
