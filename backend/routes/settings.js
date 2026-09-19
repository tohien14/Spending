const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/settings - hien tai chi co "monthly_income" nhung de mo rong sau nay
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;

  res.json({
    monthly_income: Number(settings.monthly_income || 0),
  });
});

// PUT /api/settings - cap nhat thu nhap hang thang
router.put("/", (req, res) => {
  const value = String(Number(req.body.monthly_income) || 0);

  const existing = db.prepare("SELECT key FROM settings WHERE key = ?").get("monthly_income");
  if (existing) {
    db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(value, "monthly_income");
  } else {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run("monthly_income", value);
  }

  res.json({ monthly_income: Number(value) });
});

module.exports = router;
