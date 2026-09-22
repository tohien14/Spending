import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAuthToken, getAuthToken, setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const logout = useCallback(() => {
    setAuthToken("");
    setUser(null);
  }, []);

  // Neu API tra ve 401 (token het han/khong hop le) o bat ky dau trong app,
  // tu dong dang xuat va dua ve man hinh dang nhap.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Luc vao app: neu da co token luu tu truoc, kiem tra xem con hop le
  // khong (goi /auth/me) truoc khi cho vao thang, tranh treo o trang trong.
  useEffect(() => {
    async function checkSession() {
      const token = getAuthToken();
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        setAuthToken("");
      } finally {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  async function login(username, password) {
    const res = await api.login(username, password);
    setAuthToken(res.token);
    setUser(res.user);
  }

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
