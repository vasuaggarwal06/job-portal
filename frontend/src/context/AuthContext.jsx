import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await client.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async credentials => {
    const { data } = await client.post('/auth/login', credentials);
    setUser(data.user);
  };

  const logout = async () => {
    await client.post('/auth/logout');
    setUser(null);
  };

  const updateUser = updatedUser => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
