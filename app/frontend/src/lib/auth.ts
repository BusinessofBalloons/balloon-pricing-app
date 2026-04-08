import { useState, useEffect, useCallback } from 'react';
import { client } from './api';

interface User {
  id: string;
  email?: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) {
        setUser(res.data as User);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async () => {
  setUser({
    id: "1",
    email: "admin@local",
    name: "Admin"
  });
};

 const logout = async () => {
  setUser(null);
};

  return { user, loading, login, logout, refetch: checkAuth };
}
