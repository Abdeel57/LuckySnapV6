import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileAdminNavCascadeProps {
    navLinks: { to: string; text: string; icon: LucideIcon }[];
}

const MobileAdminNavCascade = ({ navLinks }: MobileAdminNavCascadeProps) => {
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    
    // Encontrar el elemento activo actual
    const currentNav = navLinks.find(nav => nav.to === location.pathname);
    
    return (
        <>
            {/* Botón flotante principal */}
            <motion.button
                className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-xl z-50 flex items-center justify-center border-4 border-white"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                aria-label="Abrir menú de navegación"
                style={{ 
                    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                    animation: 'pulse 2s infinite'
                }}
            >
                {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </motion.button>
            
            {/* Indicador de que es la nueva navegación */}
            <div className="lg:hidden fixed bottom-6 left-6 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-50">
                NUEVA NAV
            </div>

            {/* Menú en cascada */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            className="lg:hidden fixed inset-0 bg-black/20 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Menú en cascada hacia arriba */}
                        <motion.div
                            className="lg:hidden fixed bottom-6 right-6 z-50"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className="flex flex-col items-end space-y-3">
                                {/* Opciones de navegación */}
                                {navLinks.map(({ to, text, icon: Icon }, index) => (
                                    <motion.div
                                        key={to}
                                        initial={{ x: 100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 100, opacity: 0 }}
                                        transition={{ 
                                            delay: index * 0.05,
                                            duration: 0.2 
                                        }}
                                    >
                                        <NavLink
                                            to={to}
                                            end={to === "/admin"}
                                            onClick={() => setIsOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-lg border-2 transition-all min-w-[200px] ${
                                                    isActive
                                                        ? 'border-blue-600 text-blue-600'
                                                        : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500'
                                                }`
                                            }
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{text}</span>
                                        </NavLink>
                                    </motion.div>
                                ))}
                                
                                {/* Botón de logout */}
                                <motion.div
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 100, opacity: 0 }}
                                    transition={{ 
                                        delay: navLinks.length * 0.05,
                                        duration: 0.2 
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            logout();
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-full shadow-lg border-2 border-red-500 hover:bg-red-600 transition-colors min-w-[200px]"
                                    >
                                        <LogOut className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm font-medium">Cerrar Sesión</span>
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Indicador de página actual */}
            {currentNav && (
                <motion.div
                    className="lg:hidden fixed bottom-24 right-6 bg-white rounded-lg shadow-lg px-3 py-2 z-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                >
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <currentNav.icon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{currentNav.text}</span>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default MobileAdminNavCascade;
