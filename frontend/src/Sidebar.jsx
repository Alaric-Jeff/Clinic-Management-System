import React, { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Briefcase,
  CreditCard,
  Users,
  Archive,
  LogOut,
} from 'lucide-react';
import { color } from 'chart.js/helpers';

const Sidebar = ({
  userName = 'Admin 1',
  userRole = 'admin',
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const allMenuItems = {
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard' },
      { icon: FileText, label: 'Patient Records', path: 'patient-records' },
      { icon: Briefcase, label: 'Services', path: 'services' },
      { icon: CreditCard, label: 'Payment Details', path: 'payment-details' },
      { icon: Users, label: 'User Management', path: 'user-management' },
      { icon: Archive, label: 'Archive', path: 'archive' },
    ],
    encoder: [
      { icon: FileText, label: 'Patient Records', path: 'patient-records' },
      { icon: CreditCard, label: 'Payment Details', path: 'payment-details' },
      { icon: Archive, label: 'Archive', path: 'archive' },
    ],
  };

  const menuItems = allMenuItems[userRole.toLowerCase()] || allMenuItems.encoder;

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleMenuClick = (item) => {
    setActiveItem(item.label);
    if (onNavigate) onNavigate(item.path);
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Hamburger Button */}
      <button onClick={toggleSidebar} style={styles.hamburgerButton}>
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      {isOpen && <div style={styles.overlay} onClick={toggleSidebar} />}

      {/* Sidebar */}
      <div
        style={{
          ...styles.sidebar,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Profile Section */}
        <div style={styles.profileSection}>
          <div style={styles.avatarContainer}>
            <span style={styles.avatarLetter}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 style={styles.welcomeText}>Welcome!</h2>
          <p style={styles.userName}>{userName}</p>
        </div>

        {/* Menu Items */}
        <nav style={styles.menuContainer}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <button
                key={item.path}
                onClick={() => handleMenuClick(item)}
                style={{
                  ...styles.menuItem,
                  backgroundColor: isActive ? 'white' : 'transparent',
                  color: isActive ? '#7f1d1d' : 'white',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                <Icon
                  size={20}
                  style={{
                    marginRight: 10,
                    color: isActive ? '#7f1d1d' : 'white',
                  }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} style={{ marginRight: 10 }} />
          <span>Logout</span>
        </button>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <center><h1 style={styles.modalTitle}>Confirm Logout?</h1>
            <p style={styles.modalText}>
              Are you sure you want to log out of your account?
            </p></center>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={styles.cancelButton}
              >
                No
              </button>
              <button onClick={confirmLogout} style={styles.confirmButton}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* 🎨 Pure Styles Object */
const styles = {
  hamburgerButton: {
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    zIndex: 50,
    padding: '8px',
    backgroundColor: '#7f1d1d',
    color: 'white',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    transition: '0.2s',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 30,
  },

  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100%',
    width: '240px',
    background: 'linear-gradient(180deg, #7f1d1d, #991b1b)',
    color: 'white',
    zIndex: 40,
    transition: 'transform 0.3s ease-in-out',
    boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
    borderTopRightRadius: '1rem',
    borderBottomRightRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  profileSection: {
    textAlign: 'center',
    padding: '24px 0',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },

  avatarContainer: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'white',
    margin: '0 auto 10px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7f1d1d',
    fontWeight: 'bold',
    fontSize: '20px',
  },

  avatarLetter: {
    fontSize: '22px',
    fontWeight: 'bold',
  },

  welcomeText: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },

  userName: {
    fontSize: '13px',
    color: '#f3f3f3',
    marginTop: '4px',
  },

  menuContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 0',
  },

  menuItem: {
    width: '100%',
    textAlign: 'left',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    background: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  logoutButton: {
    padding: '14px 20px',
    borderTop: '1px solid rgba(255,255,255,0.2)',
    background: 'none',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '350px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },

  modalTitle: {
    fontSize: '30px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1f2937',
  },

  modalText: {
    fontSize: '15px',
    color: '#4b5563',
    marginBottom: '30px',
  },

  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    
  },

  cancelButton: {
    color: '#7f1d1d',
    fontWeight: 'bold',
    backgroundColor: '#ffeeeeff',
    padding: '15px 50px',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '3px solid #7f1d1d'
  },

  confirmButton: {
    backgroundColor: '#7f1d1d',
    color: 'white',
    border: 'none',
    padding: '15px 50px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default Sidebar;
