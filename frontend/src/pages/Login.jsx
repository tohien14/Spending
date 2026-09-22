import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="mark">🌿</span>
          <span className="name">Spending</span>
        </div>
        <p className="login-subtitle">Đăng nhập để xem chi tiêu của bạn</p>

        <div className="field">
          <label>Tên đăng nhập</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label>Mật khẩu</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn btn-primary" type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>

        <p className="login-hint">Chào mừng đến với Spending!</p>
      </form>
    </div>
  );
}
