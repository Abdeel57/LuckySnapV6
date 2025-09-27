import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    password?: string;
}

interface AuthContextType {
    user: AdminUser | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuario admin por defecto (en producción esto debería venir de una base de datos)
const DEFAULT_ADMIN = {
    id: 'admin-1',
    name: 'Administrador',
    email: 'admin@luckysnap.com',
    password: 'admin123' // Contraseña simple para desarrollo
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verificar si hay sesión guardada al cargar
    useEffect(() => {
        const savedUser = localStorage.getItem('admin_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('admin_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        
        try {
            // Simular delay de autenticación
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar credenciales (en producción esto sería una llamada al backend)
            if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
                const userData = { ...DEFAULT_ADMIN };
                delete userData.password; // No guardar la contraseña
                
                setUser(userData);
                localStorage.setItem('admin_user', JSON.stringify(userData));
                setIsLoading(false);
                return true;
            } else {
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admin_user');
    };

    const value: AuthContextType = {
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
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
