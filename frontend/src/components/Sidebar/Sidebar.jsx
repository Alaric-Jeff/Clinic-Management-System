import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { name: "Patient Records", path: "/patient-list", icon: "📋" },
    { name: "Services", path: "/services", icon: "🧾" },
    { name: "Payment Details", path: "/admin/payments", icon: "💳" },
    { name: "User Management", path: "/admin/users", icon: "👥" },
    { name: "Archive", path: "/archive", icon: "🗂️" },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <h2>
            WELCOME!
            <span>{user ? user.name : "Loading..."}</span>
          </h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
