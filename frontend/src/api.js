const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error(
      `Không kết nối được tới máy chủ API tại ${BASE_URL}. Kiểm tra backend đã chạy chưa và VITE_API_URL đã đúng chưa.`
    );
  }

  if (!res.ok) {
    let message = `Lỗi ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // giữ nguyên message mặc định
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Giao dịch
  getExpenses: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request(`/expenses${qs ? `?${qs}` : ""}`);
  },
  createExpense: (data) =>
    request("/expenses", { method: "POST", body: JSON.stringify(data) }),
  updateExpense: (id, data) =>
    request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),

  // Thống kê
  getSummary: (month) => request(`/expenses/stats/summary?month=${month}`),
  getByCategory: (month) => request(`/expenses/stats/by-category?month=${month}`),
  getTrend: (months = 6) => request(`/expenses/stats/trend?months=${months}`),

  // Thiết lập (thu nhập RIÊNG cho từng tháng, dùng để phân bổ ngân sách)
  getSettings: (month) => request(`/settings?month=${month}`),
  updateSettings: (data) => request("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Danh mục
  // Truyền "month" để lấy ngân sách RIÊNG của tháng đó; bỏ trống nếu chỉ cần
  // danh sách danh mục (VD: cho dropdown chọn danh mục khi thêm giao dịch).
  getCategories: (month) => request(`/categories${month ? `?month=${month}` : ""}`),
  createCategory: (data) =>
    request("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateCategoryBudget: (id, month, amount) =>
    request(`/categories/${id}/budget`, {
      method: "PUT",
      body: JSON.stringify({ month, amount }),
    }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),
};
