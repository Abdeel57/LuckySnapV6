import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../types';
import { adminLogin } from '../services/api';

interface AuthContextType {
    user: AdminUser | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SuperAdmin hardcodeado - SOLO PARA EL DUEÑO
const SUPER_ADMIN: AdminUser = {
    id: 'superadmin-1',
    name: 'Super Administrador',
    username: 'Orlando12',
    password: 'Pomelo_12@',
    role: 'superadmin'
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

    const login = async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        
        try {
            console.log('🔐 Intentando login para:', username);
            
            // Primero intentar con el superadmin hardcodeado (sin hash)
            if (username.toLowerCase() === SUPER_ADMIN.username.toLowerCase() && password === SUPER_ADMIN.password) {
                const userData = { ...SUPER_ADMIN };
                delete userData.password; // No guardar la contraseña
                
                console.log('✅ Login exitoso con superadmin');
                setUser(userData);
                localStorage.setItem('admin_user', JSON.stringify(userData));
                setIsLoading(false);
                return true;
            }
            
            // Intentar login con el backend (usando bcrypt)
            try {
                const userData = await adminLogin(username, password);
                console.log('✅ Login exitoso con backend:', userData);
                
                setUser(userData);
                localStorage.setItem('admin_user', JSON.stringify(userData));
                setIsLoading(false);
                return true;
            } catch (backendError) {
                console.log('❌ Error en login del backend:', backendError);
                console.log('❌ Credenciales incorrectas para:', username);
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
