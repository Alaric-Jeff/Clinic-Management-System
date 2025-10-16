import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();

  const allNavItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "🏠", roles: ["admin"] },
    { name: "Patient Records", path: "/admin/patient-list", icon: "📋", roles: ["admin", "encoder"] },
    { name: "Services", path: "/admin/services", icon: "🧾", roles: ["admin"] },
    { name: "Payment Details", path: "/admin/payments", icon: "💳", roles: ["admin", "encoder"] },
    { name: "User Management", path: "/admin/user-management", icon: "👥", roles: ["admin"] },
    { name: "Archive", path: "/admin/archive", icon: "🗂️", roles: ["admin", "encoder"] },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role)
  );

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