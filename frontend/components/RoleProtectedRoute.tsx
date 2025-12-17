import React, { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleProtectedRouteProps {
    allowedRoles?: ('superadmin' | 'admin' | 'ventas')[];
    redirectTo?: string;
}

// Protege rutas que requieren un rol específico
const RoleProtectedRoute = ({ 
    children, 
    allowedRoles = ['superadmin', 'admin'],
    redirectTo = '/admin'
}: PropsWithChildren<RoleProtectedRouteProps>) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Si no hay usuario, redirigir al login
    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // Verificar si el rol del usuario está permitido
    if (!allowedRoles.includes(user.role)) {
        // Si es vendedor intentando acceder a una ruta no permitida, redirigir al dashboard
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};

export default RoleProtectedRoute;

