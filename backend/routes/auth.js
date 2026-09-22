const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login - body: { username, password }
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
      [username.trim()]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu" });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể đăng nhập, thử lại sau" });
  }
});

// GET /api/auth/me - kiem tra token con hop le khong, tra ve thong tin tai khoan
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, display_name FROM users WHERE id = $1",
      [req.userId]
    );
    if (!rows[0]) return res.status(401).json({ error: "Tài khoản không tồn tại" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không kiểm tra được phiên đăng nhập" });
  }
});

module.exports = router;
