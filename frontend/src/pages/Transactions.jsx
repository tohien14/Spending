import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { formatVND, formatDate, currentMonth, monthLabel } from "../utils.js";
import ExpenseDrawer from "../components/ExpenseDrawer.jsx";

export default function Transactions() {
  const [month, setMonth] = useState(currentMonth());
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [exp, cats] = await Promise.all([
        api.getExpenses({ month, category: categoryId, type }),
        api.getCategories(),
      ]);
      setExpenses(exp);
      setCategories(cats);
    } catch (err) {
      setError(err.message || "Không kết nối được tới máy chủ API.");
    } finally {
      setLoading(false);
    }
  }, [month, categoryId, type]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setDrawerOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm("Xoá giao dịch này?")) return;
    await api.deleteExpense(id);
    load();
  }

  const total = expenses.reduce(
    (acc, e) => acc + (e.type === "expense" ? -e.amount : e.amount),
    0
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Giao dịch</h1>
          <div className="subtitle">{monthLabel(month)} · {expenses.length} giao dịch</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            + Thêm giao dịch
          </button>
        </div>
      </div>

      <div className="header-actions" style={{ marginBottom: 26, flexWrap: "wrap" }}>
        <input
          className="input"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 160 }}
        />
        <select className="select" style={{ width: 190 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select className="select" style={{ width: 150 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="expense">Chi tiêu</option>
          <option value="income">Thu nhập</option>
        </select>
      </div>

      <div className="section">
        {loading ? (
          <p style={{ color: "var(--color-ink-soft)" }}>Đang tải…</p>
        ) : error ? (
          <div className="error-box">
            <strong>Không tải được dữ liệu.</strong>
            <p>{error}</p>
            <button className="btn" onClick={load} style={{ marginTop: 10 }}>
              Thử lại
            </button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">Không có giao dịch nào khớp bộ lọc hiện tại.</div>
        ) : (
          <>
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Danh mục</th>
                  <th>Ghi chú</th>
                  <th style={{ textAlign: "right" }}>Số tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((r) => (
                  <tr key={r.id}>
                    <td className="txn-date">{formatDate(r.spent_on)}</td>
                    <td>
                      <span className="txn-cat">
                        {r.category?.icon} {r.category?.name}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-ink-soft)" }}>{r.note || "—"}</td>
                    <td className={`txn-amount ${r.type}`}>
                      {r.type === "income" ? "+" : "−"}
                      {formatVND(r.amount)}
                    </td>
                    <td className="txn-actions">
                      <button className="icon-btn" onClick={() => openEdit(r)} aria-label="Sửa">
                        ✎
                      </button>
                      <button className="icon-btn" onClick={() => handleDelete(r.id)} aria-label="Xoá">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="filter-summary" style={{ marginTop: 20, marginBottom: 0 }}>
              <span className="label">Tổng theo bộ lọc</span>
              <span className={`value ${total < 0 ? "negative" : "positive"}`}>
                {formatVND(total)}
              </span>
            </div>
          </>
        )}
      </div>

      <ExpenseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          load();
        }}
        categories={categories}
        editing={editing}
      />
    </>
  );
}
