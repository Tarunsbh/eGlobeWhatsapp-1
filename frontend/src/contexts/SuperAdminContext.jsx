import React, { createContext, useContext, useState, useEffect } from 'react';
import { saAuth } from '../api/super-admin';

const Ctx = createContext(null);

export function SuperAdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sa_admin')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await saAuth.login(email, password);
      const { token, admin: a } = res.data?.data || res.data;
      localStorage.setItem('sa_token', token);
      localStorage.setItem('sa_admin', JSON.stringify(a));
      setAdmin(a);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('sa_token');
    localStorage.removeItem('sa_admin');
    setAdmin(null);
  };

  return (
    <Ctx.Provider value={{ admin, login, logout, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSuperAdmin = () => useContext(Ctx);
