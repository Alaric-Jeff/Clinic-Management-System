import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from '../axios/api.js'

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateUser = async () => {
      try {
        const res = await api.get("/validate");
        setUser(res.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateUser();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await api.post("/account/login", credentials);
      const userData = res.data?.data;

      if (!userData) throw new Error("Invalid login response: user data missing");

      setUser(userData);
      
      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin/dashboard");
      } else if (userData.role === "encoder") {
        navigate("/encoder/patient-list");
      } else {
        // Fallback for unknown roles
        navigate(`/${userData.role}/dashboard`);
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/account/logout");
    } finally {
      setUser(null);
      navigate("/"); 
    }
  };

  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;