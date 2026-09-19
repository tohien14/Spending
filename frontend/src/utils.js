export function formatVND(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("vi-VN") + " ₫";
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthStr) {
  const [y, m] = monthStr.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

// Hiển thị số có dấu chấm ngăn cách hàng nghìn khi đang gõ, VD: 1.000.000
export function formatThousands(value) {
  if (value === "" || value === null || value === undefined) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

// Ngược lại: lấy input người dùng gõ (có thể có dấu chấm) và trả về số nguyên
export function parseThousands(str) {
  const digits = String(str).replace(/\D/g, "");
  return digits ? Number(digits) : "";
}
