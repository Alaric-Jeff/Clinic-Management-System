import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  CreditCard,
  Archive,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import "./EncoderSidebar.css";

const EncoderSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  const navItems = [
    { name: "Patient Records", path: "/encoder/patient-list", icon: <FileText size={18} /> },
    { name: "Payment Details", path: "/encoder/payments", icon: <CreditCard size={18} /> },
    { name: "Archive", path: "/encoder/archive", icon: <Archive size={18} /> },
  ];

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

      {/* Hamburger Button */}
      <button 
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>ENCODER PANEL</h2>
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

export default EncoderSidebar;