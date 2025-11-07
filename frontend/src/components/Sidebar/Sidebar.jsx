import React, { useState, useEffect } from "react";
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
  Check,
  X as XIcon,
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
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUppercase: false,
    hasLowercase: false,
    passwordsMatch: false,
    isDifferentFromCurrent: true
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Password validation functions
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);

    return {
      minLength,
      hasNumber,
      hasSpecialChar,
      hasUppercase,
      hasLowercase
    };
  };

  // Real-time validation effect
  useEffect(() => {
    const newPasswordValidation = validatePassword(passwordData.newPassword);
    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0;
    const isDifferentFromCurrent = passwordData.currentPassword === '' || 
                                  passwordData.newPassword === '' || 
                                  passwordData.currentPassword !== passwordData.newPassword;

    setPasswordValidation({
      ...newPasswordValidation,
      passwordsMatch,
      isDifferentFromCurrent
    });

    // Check if all validations pass
    const allValid = Object.values(newPasswordValidation).every(Boolean) && 
                    passwordsMatch && 
                    passwordData.currentPassword.length > 0 &&
                    isDifferentFromCurrent;

    setIsFormValid(allValid);

    // Update errors in real-time
    const newErrors = { ...passwordErrors };
    
    if (passwordData.currentPassword && passwordData.newPassword && !isDifferentFromCurrent) {
      newErrors.newPassword = 'New password must be different from current password';
    } else if (newErrors.newPassword === 'New password must be different from current password') {
      delete newErrors.newPassword;
    }

    if (passwordData.confirmPassword && !passwordsMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
    } else if (newErrors.confirmPassword === 'Passwords do not match') {
      delete newErrors.confirmPassword;
    }

    setPasswordErrors(newErrors);
  }, [passwordData]);

  // Change Password functions
  const handleChangePasswordClick = () => {
    setShowChangePasswordModal(true);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setPasswordValidation({
      minLength: false,
      hasNumber: false,
      hasSpecialChar: false,
      hasUppercase: false,
      hasLowercase: false,
      passwordsMatch: false,
      isDifferentFromCurrent: true
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsFormValid(false);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    }
    
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm() || !isFormValid) {
      if (!isFormValid) {
        showToast('Please meet all password requirements', 'error');
      }
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

      // Handle boolean response directly
      if (response.data === true) {
        setPasswordConfirmModal(prev => ({ ...prev, isOpen: false }));
        setShowChangePasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        showToast('Password changed successfully', 'success');
      } else {
        // If response is false or unexpected
        throw new Error('Failed to change password. Please check your current password.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordConfirmModal(prev => ({ ...prev, isOpen: false }));
      
      // Handle different error response formats
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.data === false) {
          errorMessage = 'Current password is incorrect.';
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setPasswordValidation({
        minLength: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasUppercase: false,
        hasLowercase: false,
        passwordsMatch: false,
        isDifferentFromCurrent: true
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsFormValid(false);
    }
  };

  // Validation item component
  const ValidationItem = ({ isValid, text }) => (
    <div className={`validation-item ${isValid ? 'valid' : 'invalid'}`}>
      {isValid ? <Check size={14} /> : <XIcon size={14} />}
      <span>{text}</span>
    </div>
  );

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
                    className={passwordData.currentPassword && !passwordValidation.isDifferentFromCurrent ? 'error' : ''}
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
                    className={passwordData.newPassword && !passwordValidation.isDifferentFromCurrent ? 'error' : ''}
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

                {/* Password Requirements */}
                <div className="password-requirements">
                  <p className="requirements-title">Password must contain:</p>
                  <div className="requirements-list">
                    <ValidationItem 
                      isValid={passwordValidation.minLength} 
                      text="At least 8 characters" 
                    />
                    <ValidationItem 
                      isValid={passwordValidation.hasNumber} 
                      text="At least 1 number (0-9)" 
                    />
                    <ValidationItem 
                      isValid={passwordValidation.hasSpecialChar} 
                      text="At least 1 special character (!@#$%^&*)" 
                    />
                    <ValidationItem 
                      isValid={passwordValidation.hasUppercase} 
                      text="At least 1 uppercase letter (A-Z)" 
                    />
                    <ValidationItem 
                      isValid={passwordValidation.hasLowercase} 
                      text="At least 1 lowercase letter (a-z)" 
                    />
                    <ValidationItem 
                      isValid={passwordValidation.isDifferentFromCurrent} 
                      text="Different from current password" 
                    />
                  </div>
                </div>
              </div>

              <div className="change-password-field">
                <label>Confirm New Password</label>
                <div className="change-password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                    className={passwordData.confirmPassword && !passwordValidation.passwordsMatch ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="change-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isChangingPassword}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="change-password-error">{passwordErrors.confirmPassword}</span>
                )}
                {passwordData.confirmPassword && (
                  <ValidationItem 
                    isValid={passwordValidation.passwordsMatch} 
                    text="Passwords match" 
                  />
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
                  disabled={!isFormValid || isChangingPassword}
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
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