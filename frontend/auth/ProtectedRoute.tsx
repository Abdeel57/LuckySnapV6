import React, { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// FIX: Used PropsWithChildren to correctly type the component that accepts children and removed the now-unused ProtectedRouteProps interface.
const ProtectedRoute = ({ children }: PropsWithChildren) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
