import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

// ✅ Custom hook for easy access in components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // will hold { id, name, role }
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Runs on app load — check if user already logged in
  useEffect(() => {
    const validateUser = async () => {
      try {
        const res = await api.get("/auth/validate");
        setUser(res.data.user);
      } catch (err) {
        setUser(null); // invalid or expired session
      } finally {
        setLoading(false);
      }
    };
    validateUser();
  }, []);

  // ✅ Login handler (you can call it from your LoginPage)
  const login = async (credentials) => {
    try {
      const res = await api.post("/auth/login", credentials);
      setUser(res.data.user);
      navigate("/dashboard"); 
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{ user, loading, zlogin, logout, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
