import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { formatVND, currentMonth, monthLabel } from "../utils.js";
import MoneyInput from "../components/MoneyInput.jsx";
import LoadingState from "../components/LoadingState.jsx";

const EMOJI_CHOICES = ["🍜", "🚗", "🏠", "🎬", "💊", "🛍️", "🧾", "✳️", "📚", "🐾", "✈️", "🎁"];
const COLOR_CHOICES = [
  "#E83C91",
  "#43334C",
  "#FF8FB7",
  "#C2447B",
  "#7A6B94",
  "#8E2F63",
  "#B98CA6",
  "#F2A6C6",
];

export default function Categories() {
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "✳️", color: "#E83C91", monthly_budget: "" });
  const [error, setError] = useState("");

  const [income, setIncome] = useState("");
  const [incomeSaved, setIncomeSaved] = useState(0);
  const [editingIncome, setEditingIncome] = useState(true);
  const [savingIncome, setSavingIncome] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cats, settings] = await Promise.all([api.getCategories(month), api.getSettings(month)]);
      setCategories(cats);
      setIncome(settings.monthly_income || "");
      setIncomeSaved(settings.monthly_income || 0);
      // Thang chua nhap luong -> hien o dang nhap; thang da co luong -> hien o dang xem
      setEditingIncome(!settings.monthly_income);
    } catch (err) {
      setLoadError(err.message || "Không kết nối được tới máy chủ API.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(cat) {
    setEditingId(cat.id);
    setDraft({ ...cat });
    setError("");
  }

  async function saveEdit() {
    setError("");
    try {
      await api.updateCategory(editingId, {
        name: draft.name,
        icon: draft.icon,
        color: draft.color,
      });
      await api.updateCategoryBudget(editingId, month, Number(draft.monthly_budget) || 0);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xoá danh mục này? (sẽ xoá luôn ngân sách đã đặt ở mọi tháng)")) return;
    try {
      await api.deleteCategory(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!newCat.name.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      await api.createCategory({ ...newCat, monthly_budget: Number(newCat.monthly_budget) || 0, month });
      setNewCat({ name: "", icon: "✳️", color: "#E83C91", monthly_budget: "" });
      setShowAdd(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveIncome() {
    setSavingIncome(true);
    try {
      const res = await api.updateSettings({ month, monthly_income: Number(income) || 0 });
      setIncomeSaved(res.monthly_income);
      setEditingIncome(false);
    } finally {
      setSavingIncome(false);
    }
  }

  function cancelEditIncome() {
    setIncome(incomeSaved);
    setEditingIncome(false);
  }

  async function splitEvenly() {
    if (!income || categories.length === 0) return;
    if (!confirm(`Chia đều ${formatVND(income)} cho ${categories.length} danh mục trong ${monthLabel(month)}?`))
      return;
    setSplitting(true);
    try {
      const each = Math.floor(Number(income) / categories.length);
      await Promise.all(categories.map((c) => api.updateCategoryBudget(c.id, month, each)));
      await load();
    } finally {
      setSplitting(false);
    }
  }

  const totalAllocated = categories.reduce((sum, c) => sum + (Number(c.monthly_budget) || 0), 0);
  const incomeNum = Number(income) || 0;
  const remaining = incomeNum - totalAllocated;
  const allocatedPct = incomeNum > 0 ? Math.min(100, (totalAllocated / incomeNum) * 100) : 0;
  const overAllocated = incomeNum > 0 && totalAllocated > incomeNum;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Danh mục</h1>
          <div className="subtitle">
            Tháng {monthLabel(month).toLowerCase()}
          </div>
        </div>
        <div className="header-actions">
          <input
            className="input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn btn-primary" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? "Đóng" : "+ Thêm danh mục"}
          </button>
        </div>
      </div>

      {/* ---------- Thu nhập & phân bổ (RIÊNG cho tháng đang chọn) ---------- */}
      <div className="section">
        <div className="section-head">
          <h2>Thu nhập &amp; phân bổ · {monthLabel(month)}</h2>
        </div>

        <div className="allocation-box">
          {editingIncome ? (
            <div className="allocation-income-row">
              <div className="field">
                <label>Thu nhập tháng này (₫)</label>
                <MoneyInput value={income} onChange={setIncome} placeholder="VD: 15.000.000" />
              </div>
              <button className="btn btn-primary" onClick={saveIncome} disabled={savingIncome}>
                {savingIncome ? "Đang lưu…" : "Lưu thu nhập"}
              </button>
              {incomeSaved > 0 && (
                <button type="button" className="btn" onClick={cancelEditIncome}>
                  Huỷ
                </button>
              )}
            </div>
          ) : (
            <div className="allocation-income-display">
              <div>
                <div className="label">Thu nhập tháng này</div>
                <div className="income-amount">{formatVND(incomeSaved)}</div>
              </div>
              <button type="button" className="btn" onClick={() => setEditingIncome(true)}>
                ✎ Sửa
              </button>
            </div>
          )}

          {incomeSaved > 0 && (
            <>
              <div className="category-bar-top" style={{ marginTop: 16 }}>
                <span className="cat-name">Đã phân bổ vào danh mục</span>
                <span className="cat-amounts">
                  {formatVND(totalAllocated)} / {formatVND(incomeSaved)}
                </span>
              </div>
              <div className="allocation-progress">
                <div
                  className={`allocation-progress-fill${overAllocated ? " over" : ""}`}
                  style={{ width: `${allocatedPct || 0}%` }}
                />
              </div>
              <div
                className="hint"
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  color: overAllocated ? "var(--color-primary)" : "var(--color-ink-soft)",
                  fontWeight: overAllocated ? 600 : 400,
                }}
              >
                {overAllocated
                  ? `Đã phân bổ vượt quá thu nhập ${formatVND(Math.abs(remaining))}`
                  : `Chưa phân bổ: ${formatVND(remaining)}`}
              </div>

              <button
                type="button"
                className="btn-text"
                style={{ marginTop: 14, padding: 0 }}
                onClick={splitEvenly}
                disabled={splitting || categories.length === 0}
              >
                {splitting ? "Đang chia…" : `Chia đều cho ${categories.length} danh mục (chỉ áp dụng cho ${monthLabel(month).toLowerCase()})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------- Thêm danh mục ---------- */}
      {showAdd && (
        <form onSubmit={handleAdd} className="section" style={{ paddingBottom: 20, borderBottom: "1px solid var(--color-line)" }}>
          <div className="field-row">
            <div className="field">
              <label>Tên danh mục</label>
              <input
                className="input"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="VD: Học tập"
              />
            </div>
            <div className="field">
              <label>Ngân sách cho {monthLabel(month).toLowerCase()} (₫)</label>
              <MoneyInput
                value={newCat.monthly_budget}
                onChange={(v) => setNewCat({ ...newCat, monthly_budget: v })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="field">
            <label>Biểu tượng</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EMOJI_CHOICES.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setNewCat({ ...newCat, icon: em })}
                  className="btn"
                  style={{
                    padding: "6px 10px",
                    borderColor: newCat.icon === em ? "var(--color-ink)" : "var(--color-line)",
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Màu</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLOR_CHOICES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewCat({ ...newCat, color: c })}
                  aria-label={c}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: c,
                    border: newCat.color === c ? "2px solid var(--color-ink)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary">
            Lưu danh mục
          </button>
        </form>
      )}

      {/* ---------- Danh sách danh mục ---------- */}
      <div className="section" style={{ marginTop: 24 }}>
        <div className="section-head">
          <h2>Danh sách danh mục</h2>
        </div>
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <div className="error-box">
            <strong>Không tải được dữ liệu.</strong>
            <p>{loadError}</p>
            <button className="btn" onClick={load} style={{ marginTop: 10 }}>
              Thử lại
            </button>
          </div>
        ) : (
          categories.map((c) => (
            <div className="cat-manage-row" key={c.id}>
              <span className="cat-swatch" style={{ background: c.color }} />
              {editingId === c.id ? (
                <>
                  <input
                    className="input"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                  <MoneyInput
                    value={draft.monthly_budget}
                    onChange={(v) => setDraft({ ...draft, monthly_budget: v })}
                  />
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" onClick={saveEdit} aria-label="Lưu">
                      ✓
                    </button>
                    <button className="icon-btn" onClick={() => setEditingId(null)} aria-label="Huỷ">
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="cat-manage-name">
                    {c.icon} {c.name}
                  </span>
                  <span className="cat-manage-budget">
                    {formatVND(c.monthly_budget)} / {monthLabel(month).toLowerCase()}
                    {incomeSaved > 0 && c.monthly_budget > 0
                      ? ` · ${Math.round((c.monthly_budget / incomeSaved) * 100)}% thu nhập`
                      : ""}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="icon-btn" onClick={() => startEdit(c)} aria-label="Sửa">
                      ✎
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(c.id)} aria-label="Xoá">
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
