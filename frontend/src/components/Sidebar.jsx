import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Tổng quan", icon: "🌾", end: true },
  { to: "/giao-dich", label: "Giao dịch", icon: "📖" },
  { to: "/danh-muc", label: "Danh mục", icon: "🗂️" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        <span className="mark">🌿</span>
        <span className="name">Spending</span>
      </Link>

      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <span>{l.icon}</span>
            <span className="label">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-name">👤 {user?.display_name || user?.username}</div>
        <button className="sidebar-logout" onClick={logout}>
          Đăng xuất
        </button>
      </div>

      <div className="sidebar-foot">
        Quản lý bởi ToHin
      </div>
    </aside>
  );
}
