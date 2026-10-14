import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import API from './api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    API.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async signIn(credentials) {
      const { data } = await API.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    },
    async signUp(details) {
      const { data } = await API.post('/auth/register', details);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    },
    signOut() {
      localStorage.removeItem('token');
      setUser(null);
    },
    updateUser(nextUser) {
      setUser(nextUser);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
