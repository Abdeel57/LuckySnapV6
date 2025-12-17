import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileAdminNavDrawerProps {
    navLinks: { to: string; text: string; icon: LucideIcon }[];
}

const MobileAdminNavDrawer = ({ navLinks }: MobileAdminNavDrawerProps) => {
    const { logout, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    
    return (
        <>
            {/* Botón hamburguesa */}
            <motion.button
                className="lg:hidden fixed top-4 left-4 w-12 h-12 bg-blue-600 text-white rounded-lg shadow-lg z-50 flex items-center justify-center"
                onClick={() => setIsOpen(true)}
                whileTap={{ scale: 0.95 }}
            >
                <Menu className="w-6 h-6" />
            </motion.button>

            {/* Drawer lateral */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="lg:hidden fixed inset-0 bg-black/50 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Drawer */}
                        <motion.div
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col"
                            initial={{ x: -320 }}
                            animate={{ x: 0 }}
                            exit={{ x: -320 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {/* Header del drawer */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Panel Admin</h2>
                                    {user && (
                                        <p className="text-sm text-gray-600">{user.name}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Navegación */}
                            <nav className="flex-1 p-6">
                                <div className="space-y-2">
                                    {navLinks.map(({ to, text, icon: Icon }) => (
                                        <NavLink
                                            key={to}
                                            to={to}
                                            end={to === "/admin"}
                                            onClick={() => setIsOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
                                </div>
                            </nav>

                            {/* Footer con logout */}
                            <div className="p-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        logout();
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileAdminNavDrawer;
