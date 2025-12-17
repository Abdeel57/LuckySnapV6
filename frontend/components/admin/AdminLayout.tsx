import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Ticket, Calendar, Cog, Users, LogOut, Trophy, BarChart3 } from 'lucide-react';
import MobileAdminNavAdaptive from './MobileAdminNavAdaptive';

export const navLinks = [
    { to: "/admin", text: "Inicio", icon: Home },
    { to: "/admin/analytics", text: "Analytics", icon: BarChart3 },
    { to: "/admin/sorteos", text: "Rifas", icon: Ticket },
    { to: "/admin/apartados", text: "Apartados", icon: Calendar },
    { to: "/admin/clientes", text: "Clientes", icon: Users },
    { to: "/admin/ganadores", text: "Ganadores", icon: Trophy },
    { to: "/admin/usuarios", text: "Usuarios", icon: Users },
    { to: "/admin/ajustes", text: "Configuración", icon: Cog },
];

const AdminLayout = () => {
    const { logout, user } = useAuth();

    // Filtrar opciones del menú según el rol
    const getFilteredNavLinks = () => {
        if (!user) {
            console.log('⚠️ No hay usuario, mostrando todos los links');
            return navLinks;
        }
        
        console.log('👤 Usuario:', user.name, '| Rol:', user.role);
        
        // Vendedores solo ven Apartados y Clientes
        if (user.role === 'ventas') {
            const filtered = navLinks.filter(link => 
                link.to === '/admin/apartados' || 
                link.to === '/admin/clientes' ||
                link.to === '/admin' // Inicio siempre visible
            );
            console.log('💰 Usuario ventas - Links filtrados:', filtered.map(l => l.text));
            return filtered;
        }
        
        // Superadmin y admin ven todo
        console.log('🛡️ Usuario admin - Mostrando todos los links');
        return navLinks;
    };

    const filteredNavLinks = getFilteredNavLinks();
    
    // Debug: Verificar qué links se están pasando al componente móvil
    console.log('📱 AdminLayout - filteredNavLinks pasados a Mobile:', filteredNavLinks.map(l => ({ to: l.to, text: l.text })));
    console.log('📱 AdminLayout - Total filteredNavLinks:', filteredNavLinks.length);

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 flex">
            {/* Sidebar for Desktop */}
            <aside className="w-64 bg-white p-4 border-r border-gray-200 hidden lg:flex flex-col shadow-md">
                <Link to="/admin" className="text-2xl font-bold text-gray-800 mb-4 text-center">
                    Lucky Snap <span className="text-blue-600">Admin</span>
                </Link>
                {user && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Conectado como:</p>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.username}</p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                            {user.role === 'superadmin' ? '👑 Super Admin' : 
                             user.role === 'admin' ? '🛡️ Administrador' : 
                             '💰 Ventas'}
                        </p>
                    </div>
                )}
                <nav className="flex flex-col gap-2 flex-grow">
                    {filteredNavLinks.map(({ to, text, icon: Icon }) => (
                         <NavLink
                            key={to}
                            to={to}
                            end={to === "/admin"}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" />
                            {text}
                        </NavLink>
                    ))}
                </nav>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col pb-6 lg:pb-0">
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 md:hidden flex items-center justify-between p-4 shadow-sm">
                     <Link to="/admin" className="text-xl font-bold text-gray-800">
                        Panel de Control
                    </Link>
                    <button
                        onClick={logout}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                        aria-label="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            
            {/* Bottom Nav for Mobile */}
            <MobileAdminNavAdaptive navLinks={filteredNavLinks} />
        </div>
    );
};

export default AdminLayout;