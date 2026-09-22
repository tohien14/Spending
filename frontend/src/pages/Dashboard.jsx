import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { formatVND, formatDate, currentMonth, monthLabel } from "../utils.js";
import CategoryDonut from "../components/CategoryDonut.jsx";
import DailyTrendChart from "../components/DailyTrendChart.jsx";
import ExpenseDrawer from "../components/ExpenseDrawer.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [daily, setDaily] = useState([]);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, cat, dl, exp, allCats] = await Promise.all([
        api.getSummary(month),
        api.getByCategory(month),
        api.getDaily(month),
        api.getExpenses({ month }),
        api.getCategories(),
      ]);
      setSummary(s);
      setByCategory(cat);
      setDaily(dl);
      setRecent(exp.slice(0, 6));
      setCategories(allCats);
    } catch (err) {
      setError(err.message || "Không kết nối được tới máy chủ API.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!confirm("Xoá giao dịch này?")) return;
    await api.deleteExpense(id);
    load();
  }

  if (loading && !summary) {
    return <LoadingState />;
  }

  if (error && !summary) {
    return (
      <div className="error-box">
        <strong>Không tải được dữ liệu.</strong>
        <p>{error}</p>
        <p style={{ marginTop: 4 }}>
          Kiểm tra xem backend đã chạy chưa, và biến <code>VITE_API_URL</code> ở frontend có đang trỏ
          đúng tới địa chỉ backend không.
        </p>
        <button className="btn" onClick={load} style={{ marginTop: 10 }}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tổng quan</h1>
          <div className="subtitle">{monthLabel(month)}</div>
        </div>
        <div className="header-actions">
          <input
            className="input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            + Thêm giao dịch
          </button>
        </div>
      </div>

      <div className="hero-stats">
        <div className="hero-stat">
          <div className="label">Đã chi trong tháng</div>
          <div className="value negative">{formatVND(summary.totalExpense)}</div>
          <div className="hint">{summary.expenseCount} giao dịch</div>
        </div>
        <div className="hero-stat">
          <div className="label">Thu nhập</div>
          <div className="value positive">{formatVND(summary.totalIncome)}</div>
          <div className="hint">
            Lương {formatVND(summary.salaryIncome)}
            {summary.extraIncome > 0 ? ` + thêm ${formatVND(summary.extraIncome)}` : ""}
          </div>
        </div>
        <div className="hero-stat">
          <div className="label">Số dư trong tháng</div>
          <div className={`value ${summary.balance < 0 ? "negative" : "positive"}`}>
            {formatVND(summary.balance)}
          </div>
        </div>
        <div className="hero-stat">
          <div className="label">Ngân sách còn lại</div>
          <div className={`value ${summary.budgetRemaining < 0 ? "negative" : ""}`}>
            {formatVND(summary.budgetRemaining)}
          </div>
          <div className="hint">trên tổng {formatVND(summary.totalBudget)}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="section">
          <div className="section-head">
            <h2>Theo danh mục</h2>
          </div>
          <CategoryDonut data={byCategory} />
          <div style={{ marginTop: 4 }}>
            {byCategory
              .filter((c) => c.spent > 0)
              .map((c) => {
                const pct = c.monthly_budget > 0 ? Math.min(100, (c.spent / c.monthly_budget) * 100) : 0;
                const over = c.monthly_budget > 0 && c.spent > c.monthly_budget;
                return (
                  <div className="category-bar-row" key={c.id}>
                    <div className="category-bar-top">
                      <span className="cat-name">
                        {c.icon} {c.name}
                      </span>
                      <span className="cat-amounts">
                        {formatVND(c.spent)}
                        {c.monthly_budget > 0 ? ` / ${formatVND(c.monthly_budget)}` : ""}
                      </span>
                    </div>
                    <div className="category-bar-track">
                      <div
                        className={`category-bar-fill${over ? " over" : ""}`}
                        style={{ width: `${pct || (c.monthly_budget ? 0 : 100)}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="section">
          <div className="section-head">
            <h2>Giao dịch gần đây</h2>
            <Link to="/giao-dich" className="link-btn">
              Xem tất cả →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">Chưa có giao dịch nào trong tháng này.</div>
          ) : (
            <table className="txn-table">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="txn-date">{formatDate(r.spent_on)}</td>
                    <td>
                      <span className="txn-cat">
                        {r.category?.icon} {r.category?.name}
                      </span>
                      {r.note && (
                        <div style={{ fontSize: 12, color: "var(--color-ink-faint)" }}>{r.note}</div>
                      )}
                    </td>
                    <td className={`txn-amount ${r.type}`}>
                      {r.type === "income" ? "+" : "−"}
                      {formatVND(r.amount)}
                    </td>
                    <td className="txn-actions">
                      <button className="icon-btn" onClick={() => handleDelete(r.id)} aria-label="Xoá">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Nhịp độ chi tiêu trong tháng</h2>
        </div>
        <DailyTrendChart data={daily} budget={summary.totalBudget} />
      </div>

      <ExpenseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          load();
        }}
        categories={categories}
      />
    </>
  );
}
