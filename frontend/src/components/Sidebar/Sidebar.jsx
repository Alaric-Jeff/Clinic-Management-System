import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Stethoscope,
  CreditCard,
  Users,
  History,
  Archive,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true); // Always open, including mobile

  useEffect(() => {
    // Always force sidebar open, regardless of window size
    setIsOpen(true);
  }, []);

  const allNavItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={18} />, roles: ["admin"] },
    { name: "Patient Records", path: "/admin/patient-list", icon: <FileText size={18} />, roles: ["admin", "encoder"] },
    { name: "Services", path: "/admin/services", icon: <Stethoscope size={18} />, roles: ["admin"] },
    { name: "Payment Details", path: "/admin/payments", icon: <CreditCard size={18} />, roles: ["admin", "encoder"] },
    { name: "User Management", path: "/admin/user-management", icon: <Users size={18} />, roles: ["admin"] },
    { name: "History Log", path: "/admin/history-log", icon: <History size={18} />, roles: ["admin"] },
    { name: "Archive", path: "/admin/archive", icon: <Archive size={18} />, roles: ["admin", "encoder"] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>ADMIN PANEL</h2>
        <p className="user-info">
          Welcome, <span>{user ? user.name : "Loading..."}</span>
        </p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}x
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="icon">{item.icon}</span>
            <span className="link-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
