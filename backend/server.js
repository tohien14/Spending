const express = require("express");
const cors = require("cors");

require("./db"); // khoi tao + seed database khi server khoi dong

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

app.use("/api/expenses", expensesRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/settings", settingsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Không tìm thấy đường dẫn API" });
});

app.listen(PORT, () => {
  console.log(`✅ Expense Manager API đang chạy tại http://localhost:${PORT}`);
  console.log(`   Dữ liệu được lưu tại backend/data/expenses.db (SQLite)`);
});
