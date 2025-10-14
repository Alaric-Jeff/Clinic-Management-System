import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './1_FORM_PAGES/1_Login';
import ForgotPasswordPage from './1_FORM_PAGES/2_Forgot_Pass';
import AddNewUserPage from './1_FORM_PAGES/3_Add_New_User';
import VerifiedEmailPage from './1_FORM_PAGES/4_Verified_Email';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/add-new-user" element={<AddNewUserPage />} />
        <Route path="/verified-email" element={<VerifiedEmailPage />} />
      </Routes>
    </Router>
  );
}

export default App;