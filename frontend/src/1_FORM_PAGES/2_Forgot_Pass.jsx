import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios/api'
import './2.1_Forgot_Pass.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendPassword = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/account/request-password-reset', {
        email: email.trim()
      });

      console.log('Password reset response:', res.data);

      if (res.data.success) {
        setSuccess(res.data.message || 'Password reset link has been sent to your email');
        setEmail('');
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(res.data.message || 'Failed to send password reset email');
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError(err.response?.data?.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Success Message */}
          {success && <div className="success-message">{success}</div>}

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
                disabled={loading}
              />
            </div>

            {/* Send New Password Button */}
            <div className="button-group">
              <div className="icon-spacer"></div>
              <button 
                onClick={handleSendPassword} 
                className="send-password-button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send new password'}
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