import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API = '/api/auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('apexcode-token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify token
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    let res;
    try {
      res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Server is not responding. Please try again later.');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server returned an invalid response. Please try again.');
    }

    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('apexcode-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(dataPayload) {
    let res;
    try {
      res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataPayload),
      });
    } catch {
      throw new Error('Server is not responding. Please try again later.');
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Server returned an invalid response. Please try again.');
    }

    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('apexcode-token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('apexcode-token');
    setToken(null);
    setUser(null);
  }

  async function updateUser(updates) {
    const res = await fetch(`${API}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(prev => ({ ...prev, ...updated }));
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
