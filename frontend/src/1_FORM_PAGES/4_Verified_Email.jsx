import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './4.1_Verified_Email.css';

export default function VerifiedEmailPage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="verified-container">
      <div className="verified-wrapper">
        <div className="verified-card">
          <div className="verified-icon-box">
            <div className="verified-icon">
              <CheckCircle size={80} strokeWidth={3} />
            </div>
          </div>
          <h2 className="verified-title">SUCCESS</h2>
          <p className="verified-message">
            Congratulations, your account has been successfully created.
          </p>
          <button onClick={handleContinue} className="continue-button">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}