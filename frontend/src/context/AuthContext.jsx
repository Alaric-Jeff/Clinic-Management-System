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
        setUser(res.data.user);
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
      setUser(res.data.user);
      navigate("/dashboard"); // will this cause an error? i meant it's just http://localhost:5173/dashboard right?
    } catch (err) {
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
