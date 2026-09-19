const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/categories - danh sach danh muc
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  res.json(rows);
});

// POST /api/categories - tao danh muc moi
router.post("/", (req, res) => {
  const { name, icon, color, monthly_budget } = req.body;
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
    const created = db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ error: "Danh mục này đã tồn tại" });
    }
    res.status(500).json({ error: "Không thể tạo danh mục" });
  }
});

// PUT /api/categories/:id - cap nhat danh muc
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Không tìm thấy danh mục" });

  const name = req.body.name ?? existing.name;
  const icon = req.body.icon ?? existing.icon;
  const color = req.body.color ?? existing.color;
  const monthly_budget =
    req.body.monthly_budget !== undefined
      ? Number(req.body.monthly_budget)
      : existing.monthly_budget;

  db.prepare(
    "UPDATE categories SET name = ?, icon = ?, color = ?, monthly_budget = ? WHERE id = ?"
  ).run(name, icon, color, monthly_budget, id);

  res.json(db.prepare("SELECT * FROM categories WHERE id = ?").get(id));
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
