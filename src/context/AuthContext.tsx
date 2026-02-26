import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'teacher';
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load stored auth data on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('apas_access_token');
    const storedRefreshToken = localStorage.getItem('apas_refresh_token');
    const storedUser = localStorage.getItem('apas_user');
    
    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (newAccessToken: string, newRefreshToken: string, newUser: User) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    
    localStorage.setItem('apas_access_token', newAccessToken);
    localStorage.setItem('apas_refresh_token', newRefreshToken);
    localStorage.setItem('apas_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    // Call backend logout endpoint to blacklist refresh token
    if (refreshToken) {
      try {
        await fetch('/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
        // Continue with local logout even if API call fails
      }
    }

    // Clear local state and storage
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    
    localStorage.removeItem('apas_access_token');
    localStorage.removeItem('apas_refresh_token');
    localStorage.removeItem('apas_user');
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch('/api/auth/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is invalid or expired, logout user
        await logout();
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.access;
      
      setAccessToken(newAccessToken);
      localStorage.setItem('apas_access_token', newAccessToken);
      
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return null;
    }
  };

  const isAuthenticated = !!accessToken && !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      accessToken, 
      refreshToken, 
      isAuthenticated,
      login, 
      logout,
      refreshAccessToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
