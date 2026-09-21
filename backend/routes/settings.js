const express = require("express");
const { pool, currentMonthStr } = require("../db");

const router = express.Router();

// GET /api/settings?month=YYYY-MM - lay thu nhap CUA RIENG thang do
router.get("/", async (req, res) => {
  try {
    const month = req.query.month || currentMonthStr();
    const { rows } = await pool.query("SELECT amount FROM incomes WHERE month = $1", [month]);
    res.json({ month, monthly_income: rows[0] ? Number(rows[0].amount) : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được thu nhập" });
  }
});

// PUT /api/settings - cap nhat thu nhap cho 1 thang cu the
// body: { month: 'YYYY-MM', monthly_income: number }
router.put("/", async (req, res) => {
  try {
    const month = req.body.month || currentMonthStr();
    const amount = Number(req.body.monthly_income) || 0;

    await pool.query(
      `INSERT INTO incomes (month, amount) VALUES ($1, $2)
       ON CONFLICT (month) DO UPDATE SET amount = EXCLUDED.amount`,
      [month, amount]
    );

    res.json({ month, monthly_income: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu thu nhập" });
  }
});

module.exports = router;
