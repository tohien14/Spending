import { useState } from "react";
import { api } from "../api.js";
import MoneyInput from "./MoneyInput.jsx";

const today = () => new Date().toISOString().slice(0, 10);
let rowSeq = 0;
const newRow = (categoryId) => ({
  key: ++rowSeq,
  spent_on: today(),
  category_id: categoryId || "",
  type: "expense",
  amount: "",
  note: "",
});

export default function BulkAddModal({ open, onClose, onSaved, categories }) {
  const firstCatId = categories[0]?.id ? String(categories[0].id) : "";
  const [rows, setRows] = useState(() => [newRow(firstCatId), newRow(firstCatId), newRow(firstCatId)]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  function updateRow(key, patch) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow(firstCatId)]);
  }

  function removeRow(key) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  function resetAndClose() {
    setRows([newRow(firstCatId), newRow(firstCatId), newRow(firstCatId)]);
    setError("");
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Bo qua nhung dong chua nhap gi (de trong khong tinh la loi)
    const filled = rows.filter((r) => r.amount || r.note.trim());
    if (filled.length === 0) {
      setError("Chưa có dòng nào được điền số tiền");
      return;
    }

    const items = filled.map((r) => ({
      amount: Number(r.amount) || 0,
      category_id: Number(r.category_id),
      note: r.note,
      spent_on: r.spent_on,
      type: r.type,
    }));

    setSaving(true);
    try {
      const res = await api.createExpensesBulk(items);
      onSaved(res.count);
      resetAndClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={resetAndClose} />
      <div className="bulk-modal" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <h3>Thêm nhiều giao dịch</h3>
          <button className="drawer-close" onClick={resetAndClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bulk-rows">
            <div className="bulk-row bulk-row-head">
              <span>Ngày</span>
              <span>Loại</span>
              <span>Danh mục</span>
              <span>Số tiền</span>
              <span>Ghi chú</span>
              <span></span>
            </div>

            {rows.map((r) => (
              <div className="bulk-row" key={r.key}>
                <input
                  className="input"
                  type="date"
                  value={r.spent_on}
                  onChange={(e) => updateRow(r.key, { spent_on: e.target.value })}
                />
                <select
                  className="select"
                  value={r.type}
                  onChange={(e) => updateRow(r.key, { type: e.target.value })}
                >
                  <option value="expense">Chi</option>
                  <option value="income">Thu</option>
                </select>
                <select
                  className="select"
                  value={r.category_id}
                  onChange={(e) => updateRow(r.key, { category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
                <MoneyInput
                  value={r.amount}
                  onChange={(v) => updateRow(r.key, { amount: v })}
                  placeholder="0"
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Ghi chú"
                  value={r.note}
                  onChange={(e) => updateRow(r.key, { note: e.target.value })}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeRow(r.key)}
                  aria-label="Xoá dòng"
                  disabled={rows.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="btn-text" style={{ padding: 0, marginTop: 4 }} onClick={addRow}>
            + Thêm dòng
          </button>

          {error && <div className="error-msg" style={{ marginTop: 14 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu tất cả"}
            </button>
            <button type="button" className="btn" onClick={resetAndClose}>
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
