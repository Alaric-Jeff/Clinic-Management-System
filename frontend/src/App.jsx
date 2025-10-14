import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./1_FORM_PAGES/1_Login";
import ForgotPasswordPage from "./1_FORM_PAGES/2_Forgot_Pass";
import AddNewUserPage from "./1_FORM_PAGES/3_Add_New_User";
import VerifiedEmailPage from "./1_FORM_PAGES/4_Verified_Email";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verified-email" element={<VerifiedEmailPage />} />

          {/* ✅ Protected routes */}

          <Route
            path="/add-new-user"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddNewUserPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
