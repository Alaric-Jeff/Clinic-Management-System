import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../axios/api';
import Toast from '../Toast/Toast';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/account/get-accounts');
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
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
    setIsSubmitting(true);
    try {
      const response = await api.post('/account/create-account', pendingUserData);

      if (response.data.success) {
        setOpenConfirmModal(false);
        showToast('Account successfully created', 'success');
        resetForm();
        setPendingUserData(null);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error creating account:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create account';
      showToast(errorMessage, 'error');
      setOpenConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.delete('/account/delete-account', {
        data: { id: userToDelete.id }
      });

      if (response.data.success) {
        setOpenDeleteModal(false);
        showToast('Account successfully deleted', 'success');
        setUserToDelete(null);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete account';
      showToast(errorMessage, 'error');
      setOpenDeleteModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      {/* Leonardo Medical Services Header */}
      <div className="header">
        <div className="title-section">
          <h1>LEONARDO MEDICAL SERVICES</h1>
          <p>B1 L17-E Neovista, Bagumbong, Caloocan City</p>
        </div>
      </div>

      {/* Add User Button */}
      <div className="user-management-controls">
        <button className="add-user-btn" onClick={handleAddUserClick}>
          + Add User
        </button>
      </div>

      {/* User Table */}
      <div className="user-management-table-container">
        <table className="user-management-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Date Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.middleName || ''} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.status === 'ACTIVATED' ? 'status-activated' : 'status-pending'}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDeleteClick(user)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal - REBUILT */}
      {openAddModal && (
        <div className="add-user-modal-overlay" onClick={handleCloseAddModal}>
          <div className="add-user-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-user-modal-header">
              <h3>Add New User</h3>
              <button className="add-user-modal-close-btn" onClick={handleCloseAddModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmitForm}>
              <div className="add-user-modal-body">
                {errorMessage && (
                  <div className="add-user-error-alert">
                    <span>⚠</span>
                    <span>{errorMessage}</span>
                  </div>
                )}
                
                <div className="add-user-field">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>

                <div className="add-user-field">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="add-user-field">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>

                <div className="add-user-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="add-user-field">
                  <label>Password *</label>
                  <div className="add-user-password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="add-user-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small>Min 8 characters, include number & special character</small>
                </div>

                <div className="add-user-field">
                  <label>Confirm Password *</label>
                  <div className="add-user-password-field">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="add-user-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="add-user-modal-footer">
                <button type="submit" className="add-user-submit-btn">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={openConfirmModal}
        onClose={() => !isSubmitting && setOpenConfirmModal(false)}
        onConfirm={handleConfirmCreate}
        title="Create Account?"
        message="Are you sure you want to create this account?"
        confirmText="Yes, Create"
        cancelText="Cancel"
        type="success"
        isLoading={isSubmitting}
      />

      <ConfirmModal
        isOpen={openDeleteModal}
        onClose={() => !isSubmitting && setOpenDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Account?"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isSubmitting}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
        position="bottom-right"
      />
    </div>
  );
};

export default UserManagement;