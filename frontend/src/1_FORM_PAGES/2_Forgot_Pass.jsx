import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './2.1_Forgot_Pass.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSendPassword = () => {
    console.log('Send new password to:', email);
    // Add your email sending logic here
    // After sending, you might want to show a success message or redirect
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

        {/* Forgot Password Form */}
        <div className="forgot-form">
          <h2 className="form-title">Forgot Password</h2>

          <div className="form-fields">
            {/* Email Input */}
            <div className="input-group">
              <div className="icon">
                <Mail size={35} strokeWidth={2.5} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter Email"
              />
            </div>

            {/* Send New Password Button */}
            <div className="button-group">
              <div className="icon-spacer"></div>
              <button onClick={handleSendPassword} className="send-password-button">
                Send new password
              </button>
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
