import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './2.1_Forgot_Pass.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleConfirm = () => {
    console.log('Password reset with:', { newPassword, confirmPassword });
    // Add your password reset logic here
  };

  const handleSendEmail = () => {
    console.log('Send password reset email');
    // Add your email sending logic here
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="forgot-container">
      <div className="forgot-wrapper">
      

        {/* Header */}
<div className="header">
  <h1 className="company-name">LEONARDO MEDICAL SERVICES</h1>
  <p className="address">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
  <div className="divider"></div>
</div>

        {/* Form */}
        <div className="forgot-form">
          <h2 className="form-title">Forgot Password</h2>
          
          <div className="form-fields">
            {/* New Password */}
            <div className="input-group">
              <div className="icon">
                <Lock size={35} strokeWidth={2.5} />
              </div>
              <div className="input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field with-icon"
                  placeholder="Enter New Password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="toggle-password"
                >
                  {showNewPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <div className="icon-spacer"></div>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field with-icon"
                  placeholder="Confirm New Password"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password"
                >
                  {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="button-group">
              <div className="icon-spacer"></div>
              <button onClick={handleConfirm} className="confirm-button">
                Confirm
              </button>
            </div>

            {/* Send Email Link */}
            <div className="link-group">
              <div className="icon-spacer"></div>
              <div className="link-wrapper">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendEmail();
                  }}
                  className="send-email-link"
                >
                  Send new password to registered email
                </a>
              </div>
            </div>

            {/* Back Link */}
            <div className="link-group">
              <div className="icon-spacer"></div>
              <div className="link-wrapper">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBack();
                  }}
                  className="back-link"
                >
                  Back
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
