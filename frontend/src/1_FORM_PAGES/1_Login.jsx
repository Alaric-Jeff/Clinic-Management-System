import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './1.1_Login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
  console.log('Login attempted with:', { email, password });
  // Add your login logic here
};

  return (
    <div className="login-container">
      <div className="login-wrapper">
       {/* Header */}
<div className="header">
  <h1 className="company-name">LEONARDO MEDICAL SERVICES</h1>
  <p className="address">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
  <div className="divider"></div>
</div>

        {/* Login Form */}
        <div className="login-form">
          <h2 className="form-title">Login</h2>
          
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
        placeholder="Email"
       />
      </div>

            {/* Password Input */}
            <div className="input-group">
              <div className="icon">
                <Lock size={32} strokeWidth={2.5} />
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field with-icon"
                  placeholder="Password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="button-group">
              <div className="icon-spacer"></div>
              <button onClick={handleLogin} className="login-button">
                Login
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="link-group">
              <div className="icon-spacer"></div>
              <div className="link-wrapper">
               <Link to="/forgot-password" className="forgot-link">
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
