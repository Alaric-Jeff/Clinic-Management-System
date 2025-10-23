import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../axios/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [userToDelete, setUserToDelete] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);
  
  // View modal states
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewPassword, setShowViewPassword] = useState(false);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/account/get-accounts');
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserClick = () => {
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    setErrorMessage('');
    resetForm();
  };

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields!');
      return;
    }

    // Validate name fields
    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (!namePattern.test(firstName)) {
      setErrorMessage('First name can only contain letters, spaces, hyphens, and apostrophes!');
      return;
    }
    if (middleName && !namePattern.test(middleName)) {
      setErrorMessage('Middle name can only contain letters, spaces, hyphens, and apostrophes!');
      return;
    }
    if (!namePattern.test(lastName)) {
      setErrorMessage('Last name can only contain letters, spaces, hyphens, and apostrophes!');
      return;
    }

    // Validate name length
    if (firstName.length > 50) {
      setErrorMessage('First name must not exceed 50 characters!');
      return;
    }
    if (middleName && middleName.length > 50) {
      setErrorMessage('Middle name must not exceed 50 characters!');
      return;
    }
    if (lastName.length > 50) {
      setErrorMessage('Last name must not exceed 50 characters!');
      return;
    }

    // Validate email format
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      setErrorMessage('Please enter a valid email address!');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      return;
    }

    // Validate password pattern
    const passwordPattern = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?!.*\s).+$/;
    if (password.length < 8 || !passwordPattern.test(password)) {
      setErrorMessage('Password must be at least 8 characters and contain at least one number and one special character!');
      return;
    }

    setPendingUserData({
      firstName,
      middleName: middleName || null,
      lastName,
      email,
      password
    });
    
    setOpenAddModal(false);
    setOpenConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    try {
      const response = await api.post('/account/create-account', pendingUserData);

      if (response.data.success) {
        setOpenConfirmModal(false);
        setToastMessage('Account successfully created');
        setShowToast(true);
        resetForm();
        setPendingUserData(null);
        
        // Refresh user list
        await fetchUsers();
        
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create account';
      alert(errorMessage);
      setOpenConfirmModal(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await api.delete('/account/delete-account', {
        data: { id: userToDelete.id }
      });

      if (response.data.success) {
        setOpenDeleteModal(false);
        setToastMessage('Account successfully deleted');
        setShowToast(true);
        setUserToDelete(null);
        
        // Refresh user list
        await fetchUsers();
        
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      alert(errorMessage);
      setOpenDeleteModal(false);
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setOpenViewModal(true);
    setShowViewPassword(false);
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
    setSelectedUser(null);
    setShowViewPassword(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="um-header">
        <div className="um-logo-section">
          <div className="um-medical-symbol">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L10.5 8H14.5L12 2ZM12 22L13.5 16H9.5L12 22ZM2 12L8 13.5V9.5L2 12ZM22 12L16 10.5V14.5L22 12ZM12 8C10.9 8 10 8.9 10 10V11H9C8.4 11 8 11.4 8 12C8 12.6 8.4 13 9 13H10V14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14V13H15C15.6 13 16 12.6 16 12C16 11.4 15.6 11 15 11H14V10C14 8.9 13.1 8 12 8Z"/>
            </svg>
          </div>
          <div className="um-lms-text">LMS</div>
        </div>
        <div className="um-company-info">
          <h1 className="um-company-name">LEONARDO MEDICAL SERVICES</h1>
          <p className="um-address">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      <h2 className="um-page-title">USER MANAGEMENT</h2>

      <button className="um-add-user-btn" onClick={handleAddUserClick}>
        + Add User
      </button>

      {/* User Table */}
      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th className="um-table-header">Full Name</th>
              <th className="um-table-header">Status</th>
              <th className="um-table-header">Date Created</th>
              <th className="um-table-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="um-table-cell-center">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="um-table-cell-center">No users found</td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 1 ? 'um-table-row-alt' : ''}>
                  <td className="um-table-cell">
                    {user.firstName} {user.middleName || ''} {user.lastName}
                  </td>
                  <td className="um-table-cell">
                    <span className={user.status === 'ACTIVATED' ? 'um-status-activated' : 'um-status-pending'}>
                      {user.status}
                    </span>
                  </td>
                  <td className="um-table-cell">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="um-table-cell">
                    <div className="um-action-buttons">
                      <button className="um-btn-view" onClick={() => handleView(user)}>
                        View
                      </button>
                      <button className="um-btn-delete" onClick={() => handleDeleteClick(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {openAddModal && (
        <div className="um-modal-overlay" onClick={handleCloseAddModal}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3 className="um-modal-title">Add New User</h3>
              <button className="um-modal-close" onClick={handleCloseAddModal}>×</button>
            </div>
            <form onSubmit={handleSubmitForm} className="um-modal-body">
              {errorMessage && (
                <div className="um-error-message">
                  <span className="um-error-icon">⚠</span>
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <div className="um-form-group">
                <label className="um-label">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="um-input"
                  maxLength={50}
                />
              </div>

              <div className="um-form-group">
                <label className="um-label">Middle Name (Optional)</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="um-input"
                  maxLength={50}
                />
              </div>

              <div className="um-form-group">
                <label className="um-label">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="um-input"
                  maxLength={50}
                />
              </div>

              <div className="um-form-group">
                <label className="um-label">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="um-input"
                />
              </div>

              <div className="um-form-group">
                <label className="um-label">Password *</label>
                <div className="um-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="um-input"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="um-eye-button"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <small className="um-hint">Min 8 characters, include number & special character</small>
              </div>

              <div className="um-form-group">
                <label className="um-label">Confirm Password *</label>
                <div className="um-password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="um-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="um-eye-button"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="um-modal-buttons">
                <button type="submit" className="um-btn-submit">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Create */}
      {openConfirmModal && (
        <div className="um-modal-overlay">
          <div className="um-modal um-modal-small">
            <div className="um-confirm-content">
              <div className="um-confirm-icon">⚠</div>
              <h3 className="um-confirm-text">Confirm account creation?</h3>
              <div className="um-confirm-buttons">
                <button onClick={handleConfirmCreate} className="um-btn-confirm-yes">
                  Yes, I'm sure
                </button>
                <button onClick={() => setOpenConfirmModal(false)} className="um-btn-confirm-no">
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {openDeleteModal && (
        <div className="um-modal-overlay">
          <div className="um-modal um-modal-small">
            <div className="um-confirm-content">
              <div className="um-confirm-icon">⚠</div>
              <h3 className="um-confirm-text">Confirm account deletion?</h3>
              <div className="um-confirm-buttons">
                <button onClick={handleConfirmDelete} className="um-btn-confirm-yes">
                  Yes, I'm sure
                </button>
                <button onClick={() => setOpenDeleteModal(false)} className="um-btn-confirm-no">
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {openViewModal && selectedUser && (
        <div className="um-modal-overlay" onClick={handleCloseViewModal}>
          <div className="um-modal um-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3 className="um-modal-title">User Details</h3>
              <button className="um-modal-close" onClick={handleCloseViewModal}>×</button>
            </div>
            <div className="um-modal-body">
              <div className="um-view-group">
                <label className="um-view-label">Full Name</label>
                <div className="um-view-value">
                  {selectedUser.firstName} {selectedUser.middleName || ''} {selectedUser.lastName}
                </div>
              </div>

              <div className="um-view-group">
                <label className="um-view-label">Email</label>
                <div className="um-view-value">{selectedUser.email}</div>
              </div>

              <div className="um-view-group">
                <label className="um-view-label">Password</label>
                <div className="um-password-wrapper">
                  <input
                    type={showViewPassword ? 'text' : 'password'}
                    value={showViewPassword ? (selectedUser.password || 'N/A') : '********'}
                    readOnly
                    className="um-input um-input-readonly"
                  />
                  <button
                    type="button"
                    onClick={() => setShowViewPassword(!showViewPassword)}
                    className="um-eye-button"
                  >
                    {showViewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
{showToast && (
  <div className="um-toast-wrapper um-toast-success">
    <div className="um-toast-icon">✓</div>
    <div className="um-toast-message">{toastMessage}</div>
  </div>
)}

    </div>
  );
};

export default UserManagement;