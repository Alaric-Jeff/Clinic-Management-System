import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SuccessfulReset.css'

export default function SuccesfulReset() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/login');
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
            Your password is successfuly reset, please check your gmail!
          </p>
          <button onClick={handleContinue} className="continue-button">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}