import { useEffect, useState } from "react";
import { api } from "../api.js";
import MoneyInput from "./MoneyInput.jsx";

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseDrawer({ open, onClose, onSaved, categories, editing }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [spentOn, setSpentOn] = useState(today());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategoryId(String(editing.category_id));
      setNote(editing.note || "");
      setSpentOn(editing.spent_on);
    } else {
      setType("expense");
      setAmount("");
      setCategoryId(categories[0]?.id ? String(categories[0].id) : "");
      setNote("");
      setSpentOn(today());
    }
    setError("");
  }, [open, editing, categories]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Vui lòng nhập số tiền lớn hơn 0");
      return;
    }
    if (!categoryId) {
      setError("Vui lòng chọn danh mục");
      return;
    }

    const payload = {
      amount: Number(amount),
      category_id: Number(categoryId),
      note,
      spent_on: spentOn,
      type,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.updateExpense(editing.id, payload);
      } else {
        await api.createExpense(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <h3>{editing ? "Sửa giao dịch" : "Thêm giao dịch"}</h3>
          <button className="drawer-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Loại giao dịch</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`expense${type === "expense" ? " active" : ""}`}
                onClick={() => setType("expense")}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                className={`income${type === "income" ? " active" : ""}`}
                onClick={() => setType("income")}
              >
                Thu nhập
              </button>
            </div>
          </div>

          <div className="field">
            <label>Số tiền (₫)</label>
            <MoneyInput value={amount} onChange={setAmount} placeholder="0" autoFocus />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Danh mục</label>
              <select
                className="select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Ngày</label>
              <input
                className="input"
                type="date"
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Ghi chú (không bắt buộc)</label>
            <input
              className="input"
              type="text"
              placeholder="VD: Cà phê với đồng nghiệp"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>
            {saving ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Thêm giao dịch"}
          </button>
        </form>
      </div>
    </>
  );
}
