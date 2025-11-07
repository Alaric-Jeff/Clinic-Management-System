import React, { useState } from "react";
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
  Menu,
  X,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../../axios/api";
import ConfirmModal from "../ConfirmModal/ConfirmModal";
import Toast from "../Toast/Toast";
import "./Sidebar.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  // Modal state for logout
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  // Change Password Modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Confirm Modal for password change
  const [passwordConfirmModal, setPasswordConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  // Toast state
  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 4000
  });

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

  // Toast functions
  const showToast = (message, type = 'success', duration = 4000) => {
    setToastConfig({
      isVisible: true,
      message,
      type,
      duration
    });
  };

  const closeToast = () => {
    setToastConfig(prev => ({ ...prev, isVisible: false }));
  };

  // Logout modal functions
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

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

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

  const handleLogoutClick = () => {
    showModal(
      "Logout Confirmation",
      "Are you sure you want to logout? You will be redirected to the login page.",
      'warning',
      performLogout
    );
  };

  // Change Password functions
  const handleChangePasswordClick = () => {
    setShowChangePasswordModal(true);
    setPasswordData({ currentPassword: '', newPassword: '' });
    setPasswordErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    // Show confirmation modal
    setPasswordConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Change Password',
      message: 'Are you sure you want to change your password?',
      onConfirm: performPasswordChange,
      isLoading: false
    });
  };

  const performPasswordChange = async () => {
    try {
      setPasswordConfirmModal(prev => ({ ...prev, isLoading: true }));
      setIsChangingPassword(true);

      const response = await api.put('/account/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setPasswordConfirmModal(prev => ({ ...prev, isOpen: false }));
        setShowChangePasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '' });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        showToast('Password changed successfully', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordConfirmModal(prev => ({ ...prev, isOpen: false }));
      showToast(
        error.response?.data?.message || 'Failed to change password. Please try again.',
        'error'
      );
    } finally {
      setIsChangingPassword(false);
      setPasswordConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closePasswordConfirmModal = () => {
    setPasswordConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const closeChangePasswordModal = () => {
    if (!isChangingPassword) {
      setShowChangePasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setPasswordErrors({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    }
  };

  return (
    <>
      {/* Logout Confirm Modal */}
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

      {/* Password Change Confirm Modal */}
      <ConfirmModal
        isOpen={passwordConfirmModal.isOpen}
        onClose={closePasswordConfirmModal}
        onConfirm={passwordConfirmModal.onConfirm}
        title={passwordConfirmModal.title}
        message={passwordConfirmModal.message}
        type={passwordConfirmModal.type}
        isLoading={passwordConfirmModal.isLoading}
        confirmText="Change Password"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toastConfig.isVisible}
        onClose={closeToast}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position="bottom-right"
      />

      {/* Change Password Modal */}
      {showChangePasswordModal && !passwordConfirmModal.isOpen && (
        <div className="change-password-overlay" onClick={closeChangePasswordModal}>
          <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="change-password-header">
              <h2>Change Password</h2>
              <button 
                className="change-password-close" 
                onClick={closeChangePasswordModal}
                disabled={isChangingPassword}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="change-password-form">
              <div className="change-password-field">
                <label>Current Password</label>
                <div className="change-password-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    className="change-password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isChangingPassword}
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="change-password-error">{passwordErrors.currentPassword}</span>
                )}
              </div>

              <div className="change-password-field">
                <label>New Password</label>
                <div className="change-password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    className="change-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isChangingPassword}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="change-password-error">{passwordErrors.newPassword}</span>
                )}
              </div>

              <div className="change-password-actions">
                <button
                  type="button"
                  className="change-password-btn-cancel"
                  onClick={closeChangePasswordModal}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="change-password-btn-confirm"
                  disabled={isChangingPassword}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hamburger Button */}
      <button 
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

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
          <button className="change-password-btn" onClick={handleChangePasswordClick}>
            <Key size={18} />
            <span>Change Password</span>
          </button>
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