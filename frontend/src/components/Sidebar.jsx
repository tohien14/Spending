import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Tổng quan", icon: "🌾", end: true },
  { to: "/giao-dich", label: "Giao dịch", icon: "📖" },
  { to: "/danh-muc", label: "Danh mục", icon: "🗂️" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="mark">🌿</span>
        <span className="name">Spending</span>
      </div>

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

      <div className="sidebar-foot">
      </div>
    </aside>
  );
}
