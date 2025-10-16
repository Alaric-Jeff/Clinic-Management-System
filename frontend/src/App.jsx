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
import MedicalServices from "./components/MedicalServices/MedicalServices";
import PatientDetail from "./components/PatientDetails/PatientDetails";
import EncoderLayout from "./layouts/encoder-layout/EncoderLayout";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verified-email" element={<VerifiedEmailPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patient-list" element={<PatientList />} />
            <Route path="patient-details/:id" element={<PatientDetail />} />
            <Route path="services" element={<MedicalServices />} />
            <Route path="payments" element={<div>Payment Details Page</div>} />
            <Route path="archive" element={<Archive />} />
            <Route path="add-new-user" element={<AddNewUserPage />} />
          </Route>

          {/* Encoder Routes */}
          <Route
            path="/encoder"
            element={
              <ProtectedRoute allowedRoles={["encoder"]}>
                <EncoderLayout />
              </ProtectedRoute>
            }
          >
            <Route path="patient-list" element={<PatientList />} />
            <Route path="patient-details/:id" element={<PatientDetail />} />
            <Route path="payments" element={<div>Payment Details Page</div>} />
            <Route path="archive" element={<Archive />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;