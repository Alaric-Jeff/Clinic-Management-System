import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './1.1_Login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Login attempted with:', { email, password });
      
      await login({ email, password });
      console.log('Login successful');
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-company-name">LEONARDO MEDICAL SERVICES</h1>
          <p className="login-address">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
          <div className="login-divider"></div>
        </div>

        {/* Login Form */}
        <div className="login-form">
          <h2 className="login-form-title">Login</h2>
          
          <div className="login-form-fields">
            {/* Email Input */}
            <div className="login-input-group">
              <div className="login-icon">
                <Mail size={35} strokeWidth={2.5} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input-field"
                placeholder="Email"
              />
            </div>

            {/* Password Input */}
            <div className="login-input-group">
              <div className="login-icon">
                <Lock size={32} strokeWidth={2.5} />
              </div>
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input-field login-with-icon"
                  placeholder="Password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-toggle-password"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="login-button-group">
              <div className="login-icon-spacer"></div>
              <button onClick={handleLogin} className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="login-link-group">
              <div className="login-icon-spacer"></div>
              <div className="login-link-wrapper">
                <Link to="/forgot-password" className="login-forgot-link">
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}