const express = require("express");
const db = require("../db");

const router = express.Router();

function defaultMonth() {
  return db.currentMonthStr();
}

// GET /api/settings?month=YYYY-MM - lay thu nhap CUA RIENG thang do
// (khong con la 1 gia tri dung chung cho moi thang nua)
router.get("/", (req, res) => {
  const month = req.query.month || defaultMonth();
  const row = db.prepare("SELECT amount FROM incomes WHERE month = ?").get(month);
  res.json({ month, monthly_income: row ? row.amount : 0 });
});

// PUT /api/settings - cap nhat thu nhap cho 1 thang cu the
// body: { month: 'YYYY-MM', monthly_income: number }
router.put("/", (req, res) => {
  const month = req.body.month || defaultMonth();
  const amount = Number(req.body.monthly_income) || 0;

  const existing = db.prepare("SELECT month FROM incomes WHERE month = ?").get(month);
  if (existing) {
    db.prepare("UPDATE incomes SET amount = ? WHERE month = ?").run(amount, month);
  } else {
    db.prepare("INSERT INTO incomes (month, amount) VALUES (?, ?)").run(month, amount);
  }

  res.json({ month, monthly_income: amount });
});

module.exports = router;
