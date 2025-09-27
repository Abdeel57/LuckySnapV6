import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileAdminNavGroupedProps {
    navLinks: { to: string; text: string; icon: LucideIcon }[];
}

const MobileAdminNavGrouped = ({ navLinks }: MobileAdminNavGroupedProps) => {
    const { logout } = useAuth();
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const location = useLocation();
    
    // Agrupar las opciones de navegación
    const groupedNav = {
        'Principal': [
            { to: "/admin", text: "Inicio", icon: navLinks[0].icon },
            { to: "/admin/analytics", text: "Analytics", icon: navLinks[1].icon },
        ],
        'Gestión': [
            { to: "/admin/sorteos", text: "Rifas", icon: navLinks[2].icon },
            { to: "/admin/apartados", text: "Apartados", icon: navLinks[3].icon },
            { to: "/admin/clientes", text: "Clientes", icon: navLinks[4].icon },
        ],
        'Otros': [
            { to: "/admin/ganadores", text: "Ganadores", icon: navLinks[5].icon },
            { to: "/admin/usuarios", text: "Usuarios", icon: navLinks[6].icon },
            { to: "/admin/ajustes", text: "Configuración", icon: navLinks[7].icon },
        ]
    };
    
    return (
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
            {/* Menú expandible */}
            <AnimatePresence>
                {activeGroup && (
                    <motion.div
                        className="bg-white border-t border-gray-200"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-4">
                            <div className="grid grid-cols-3 gap-2">
                                {groupedNav[activeGroup as keyof typeof groupedNav].map(({ to, text, icon: Icon }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        end={to === "/admin"}
                                        onClick={() => setActiveGroup(null)}
                                        className={({ isActive }) =>
                                            `flex flex-col items-center justify-center p-3 rounded-lg text-xs transition-colors ${
                                                isActive
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        <Icon className="w-5 h-5 mb-1" />
                                        <span className="text-center">{text}</span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navegación principal */}
            <nav className="flex items-center h-16">
                {/* Grupos principales */}
                {Object.entries(groupedNav).map(([groupName, items]) => (
                    <button
                        key={groupName}
                        onClick={() => setActiveGroup(activeGroup === groupName ? null : groupName)}
                        className={`flex-1 flex flex-col items-center justify-center h-full text-xs transition-colors ${
                            activeGroup === groupName
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-1 mb-1">
                            {items[0].icon && <items[0].icon className="w-4 h-4" />}
                            {activeGroup === groupName ? (
                                <ChevronUp className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                        </div>
                        <span className="font-medium">{groupName}</span>
                    </button>
                ))}
                
                {/* Botón de logout */}
                <button
                    onClick={logout}
                    className="flex flex-col items-center justify-center w-20 h-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5 mb-1" />
                    <span className="font-medium">Salir</span>
                </button>
            </nav>
        </footer>
    );
};

export default MobileAdminNavGrouped;
