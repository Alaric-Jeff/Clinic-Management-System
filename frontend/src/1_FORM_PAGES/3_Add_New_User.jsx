import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './3.1_Add_New_User.css';

export default function AddNewUserPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCreateUser = () => {
    console.log('Create user with:', { firstName, middleName, lastName, email, password, confirmPassword });
    // Add your user creation logic here
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="add-user-container">
      <div className="add-user-scroll">
        <div className="add-user-wrapper">
          {/* Header */}
          <div className="header">
            <h1 className="company-name">LEONARDO MEDICAL SERVICES</h1>
            <p className="address">B1 L17-E Neovista, Bagumbong, Caloocan City</p>
            <div className="divider"></div>
          </div>

          {/* Add New User Form */}
          <div className="add-user-form">
            <h2 className="form-title">Add New User</h2>
            
            <div className="form-fields">
              {/* First Name Input */}
              <div className="input-group">
                <div className="icon">
                  <User size={35} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="First Name"
                />
              </div>

              {/* Middle Name Input */}
              <div className="input-group">
                <div className="icon-spacer"></div>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="input-field"
                  placeholder="Middle Name (Optional)"
                />
              </div>

              {/* Last Name Input */}
              <div className="input-group">
                <div className="icon-spacer"></div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Last Name"
                />
              </div>

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
                  <Lock size={35} strokeWidth={2.5} />
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

              {/* Confirm Password Input */}
              <div className="input-group">
                <div className="icon-spacer"></div>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field with-icon"
                    placeholder="Confirm Password"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="toggle-password"
                  >
                    {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              {/* Create User Button */}
              <div className="button-group">
                <div className="icon-spacer"></div>
                <button onClick={handleCreateUser} className="create-user-button">
                  Create User
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
    </div>
  );
}
