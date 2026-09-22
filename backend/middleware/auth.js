const jwt = require("jsonwebtoken");

// Trong production nen dat bien moi truong JWT_SECRET rieng (chuoi ngau
// nhien, du dai). Neu khong dat, dung gia tri mac dinh nay — van hoat dong
// nhung khong an toan bang, chi phu hop dung ca nhan/gia dinh nhu app nay.
const JWT_SECRET = process.env.JWT_SECRET || "so-chi-tieu-doi-secret-nay-neu-can-an-toan-hon";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Chưa đăng nhập" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
