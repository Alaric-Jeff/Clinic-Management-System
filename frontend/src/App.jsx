import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./1_FORM_PAGES/1_Login";
import ForgotPasswordPage from "./1_FORM_PAGES/2_Forgot_Pass";
import AddNewUserPage from "./1_FORM_PAGES/3_Add_New_User";
import VerifiedEmailPage from "./1_FORM_PAGES/4_Verified_Email";
import Dashboard from "./Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import PatientList from "./components/PatientList/PatientList";
import AdminLayout from "./layouts/admin-layout/AdminLayout";
import Archive from "./components/Archive/Archive";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 🌐 Public routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verified-email" element={<VerifiedEmailPage />} />

          {/* 🔐 Protected admin layout routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "encoder"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/archive" element={<Archive />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patient-list" element={<PatientList />} />
          </Route>

          {/* 👑 Admin-only route */}
          <Route
            path="/add-new-user"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout>
                  <AddNewUserPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
