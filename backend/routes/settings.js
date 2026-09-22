const express = require("express");
const { pool, currentMonthStr } = require("../db");

const router = express.Router();

// GET /api/settings?month=YYYY-MM - thu nhap cua CHINH tai khoan dang dang nhap, RIENG cho thang do
router.get("/", async (req, res) => {
  try {
    const month = req.query.month || currentMonthStr();
    const { rows } = await pool.query(
      "SELECT amount FROM incomes WHERE user_id = $1 AND month = $2",
      [req.userId, month]
    );
    res.json({ month, monthly_income: rows[0] ? Number(rows[0].amount) : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không tải được thu nhập" });
  }
});

// PUT /api/settings - cap nhat thu nhap cho 1 thang cu the, CUA CHINH tai khoan dang dang nhap
// body: { month: 'YYYY-MM', monthly_income: number }
router.put("/", async (req, res) => {
  try {
    const month = req.body.month || currentMonthStr();
    const amount = Number(req.body.monthly_income) || 0;

    await pool.query(
      `INSERT INTO incomes (user_id, month, amount) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, month) DO UPDATE SET amount = EXCLUDED.amount`,
      [req.userId, month, amount]
    );

    res.json({ month, monthly_income: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu thu nhập" });
  }
});

module.exports = router;
