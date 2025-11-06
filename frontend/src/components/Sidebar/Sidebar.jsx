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
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true); // Always open, including mobile

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

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

  // Show modal function
  const showModal = (title, message, type = 'warning', onConfirm) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      isLoading: false
    });
  };

  // Close modal function
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Set modal loading state
  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

  // Perform logout
  const performLogout = async () => {
    try {
      setModalLoading(true);
      await logout();
      closeModal();
    } catch (error) {
      console.error("Logout error:", error);
      setModalLoading(false);
    }
  };

  // Handle logout button click
  const handleLogoutClick = () => {
    showModal(
      "Logout Confirmation",
      "Are you sure you want to logout? You will be redirected to the login page.",
      'warning',
      performLogout
    );
  };

  return (
    <>
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={modalConfig.isLoading}
        confirmText="Logout"
        cancelText="Cancel"
      />

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
          <button className="logout-btn" onClick={handleLogoutClick}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;