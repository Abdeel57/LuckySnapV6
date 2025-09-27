import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// CSS para animación pulse
const pulseStyle = `
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`;

// Inyectar CSS
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = pulseStyle;
    document.head.appendChild(style);
}

interface MobileAdminNavProps {
    navLinks: { to: string; text: string; icon: LucideIcon }[];
}

const MobileAdminNav = ({ navLinks }: MobileAdminNavProps) => {
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

            {/* Menú expandible */}
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
                        
                        {/* Menú circular */}
                        <motion.div
                            className="lg:hidden fixed bottom-6 right-6 z-50"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className="relative">
                                {/* Elementos del menú */}
                                {navLinks.map(({ to, text, icon: Icon }, index) => {
                                    const angle = (index * 60) - 90; // Distribuir en círculo
                                    const radius = 80; // Radio del círculo
                                    const x = Math.cos(angle * Math.PI / 180) * radius;
                                    const y = Math.sin(angle * Math.PI / 180) * radius;
                                    
                                    return (
                                        <motion.div
                                            key={to}
                                            className="absolute"
                                            style={{
                                                left: `${x + 28}px`, // 28px es la mitad del botón principal
                                                top: `${y + 28}px`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
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
                                                    `flex flex-col items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border-2 transition-all ${
                                                        isActive
                                                            ? 'border-blue-600 text-blue-600'
                                                            : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500'
                                                    }`
                                                }
                                            >
                                                <Icon className="w-5 h-5" />
                                            </NavLink>
                                        </motion.div>
                                    );
                                })}
                                
                                {/* Botón de logout */}
                                <motion.div
                                    className="absolute"
                                    style={{
                                        left: `${Math.cos(270 * Math.PI / 180) * 80 + 28}px`,
                                        top: `${Math.sin(270 * Math.PI / 180) * 80 + 28}px`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
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
                                        className="flex flex-col items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-lg border-2 border-red-500 hover:bg-red-600 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
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

export default MobileAdminNav;
