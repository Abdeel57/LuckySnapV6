import React, { createContext, useState, useContext, ReactNode, PropsWithChildren } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple hardcoded password check for demo purposes
const ADMIN_PASSWORD = 'password';

// FIX: Used PropsWithChildren to correctly type the component that accepts children.
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('isAdminAuthenticated') === 'true';
    } catch (e) {
      console.warn("Could not access sessionStorage. Defaulting to not authenticated.");
      return false;
    }
  });

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        setIsAuthenticated(true);
        return true;
      } catch(e) {
        console.error("Could not write to sessionStorage.");
        // Allow login for the session even if storage fails
        setIsAuthenticated(true);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('isAdminAuthenticated');
    } catch(e) {
      console.error("Could not remove item from sessionStorage.");
    }
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
