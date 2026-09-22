require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { ready } = require("./db"); // ready: Promise khoi tao + seed database
const { authMiddleware } = require("./middleware/auth");

const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const categoriesRouter = require("./routes/categories");
const settingsRouter = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Expense Manager API đang chạy" });
});

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Đây là API của Sổ Chi Tiêu — không phải trang web. Vào /api/health để kiểm tra, hoặc mở frontend để dùng ứng dụng.",
  });
});

// /api/auth khong yeu cau dang nhap (chinh la noi de dang nhap).
// Cac route con lai deu yeu cau da dang nhap (authMiddleware) va chi thao
// tac tren du lieu CUA CHINH tai khoan dang dang nhap.
app.use("/api/auth", authRouter);
app.use("/api/expenses", authMiddleware, expensesRouter);
app.use("/api/categories", authMiddleware, categoriesRouter);
app.use("/api/settings", authMiddleware, settingsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Không tìm thấy đường dẫn API" });
});

ready
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Expense Manager API đang chạy tại http://localhost:${PORT}`);
      console.log(`   Dữ liệu được lưu trong PostgreSQL (biến DATABASE_URL)`);
    });
  })
  .catch((err) => {
    console.error("❌ Không khởi tạo được database, server không khởi động:", err.message);
    process.exit(1);
  });
