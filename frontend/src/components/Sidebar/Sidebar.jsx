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
  const [isOpen, setIsOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
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
              to={item.path}
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
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ✅ Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="um-confirm-overlay">
          <div className="um-confirm-content">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="um-confirm-buttons">
              <button
                className="um-btn-confirm-yes"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
              <button
                className="um-btn-confirm-no"
                onClick={cancelLogout}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
