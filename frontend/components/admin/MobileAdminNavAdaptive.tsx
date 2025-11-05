import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileAdminNavAdaptiveProps {
    navLinks: { to: string; text: string; icon: LucideIcon }[];
}

const MobileAdminNavAdaptive = ({ navLinks }: MobileAdminNavAdaptiveProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const isVendedor = user?.role === 'ventas';
    
    // Debug: Verificar qué links se reciben
    console.log('📱 MobileAdminNavAdaptive - Links recibidos:', navLinks.map(l => ({ to: l.to, text: l.text })));
    console.log('📱 MobileAdminNavAdaptive - Total links:', navLinks.length);
    
    // Encontrar el elemento activo actual
    const currentNav = navLinks.find(nav => nav.to === location.pathname);
    
    // Decidir qué tipo de menú usar basado en el número de opciones
    const useCascadeMenu = navLinks.length > 6;
    
    // Si no hay links, no renderizar nada
    if (!navLinks || navLinks.length === 0) {
        console.warn('⚠️ MobileAdminNavAdaptive - No hay links para mostrar');
        return null;
    }
    
    // Si es vendedor, no mostrar el botón flotante ni el menú
    if (isVendedor) {
        return null;
    }
    
    return (
        <>
            {/* Botón flotante principal - Se oculta cuando el menú está abierto */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-xl z-50 flex items-center justify-center border-4 border-white"
                        onClick={() => setIsOpen(true)}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        aria-label="Abrir menú de navegación"
                        style={{ 
                            boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                            animation: 'pulse 2s infinite'
                        }}
                    >
                        <Menu className="w-7 h-7" />
                    </motion.button>
                )}
            </AnimatePresence>
            

            {/* Menú adaptativo */}
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
                        
                        {/* Menú en cascada para muchas opciones */}
                        {useCascadeMenu ? (
                            <motion.div
                                className="lg:hidden fixed bottom-6 right-6 z-50"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <div className="flex flex-col items-end space-y-3">
                                    {/* Botón de cerrar */}
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        className="w-12 h-12 bg-gray-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <X className="w-6 h-6" />
                                    </motion.button>
                                    {/* Opciones de navegación */}
                                    {navLinks && navLinks.length > 0 ? navLinks.map(({ to, text, icon: Icon }, index) => (
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
                                    )) : (
                                        <div className="text-white text-sm p-4 bg-red-500 rounded-lg">
                                            ⚠️ No hay opciones de navegación disponibles
                                        </div>
                                    )}
                                    
                                    {/* Botón de logout eliminado - Ya existe en la parte superior */}
                                </div>
                            </motion.div>
                        ) : (
                            /* Menú circular para pocas opciones */
                            <motion.div
                                className="lg:hidden fixed bottom-6 right-6 z-50"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <div className="relative">
                                    {/* Botón de cerrar para menú circular */}
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        className="absolute -top-2 -right-2 w-10 h-10 bg-gray-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-600 transition-colors z-10"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                    {/* Elementos del menú - Distribución inteligente */}
                                    {navLinks && navLinks.length > 0 ? navLinks.map(({ to, text, icon: Icon }, index) => {
                                        // Distribución más inteligente: semicírculo hacia arriba y lados
                                        const totalItems = navLinks.length;
                                        const angleStep = 180 / Math.max(1, totalItems - 1); // Distribuir en semicírculo, evitar división por cero
                                        const angle = (index * angleStep) - 90; // Empezar desde -90°
                                        const radius = 85; // Radio aumentado para acomodar texto
                                        
                                        // Calcular posición con offset para evitar bordes de pantalla
                                        const x = Math.cos(angle * Math.PI / 180) * radius;
                                        const y = Math.sin(angle * Math.PI / 180) * radius;
                                        
                                        // Ajustar posición para que no salga de la pantalla (más espacio para texto)
                                        const adjustedX = Math.max(-80, Math.min(80, x)); // Limitar horizontalmente, más espacio
                                        const adjustedY = Math.min(-50, y - 30); // Subir más las opciones para acomodar texto
                                        
                                        return (
                                            <motion.div
                                                key={to}
                                                className="absolute"
                                                style={{
                                                    left: `${adjustedX + 32}px`, // 32px es la mitad del botón principal (16x16)
                                                    top: `${adjustedY + 32}px`,
                                                    transform: 'translate(-50%, -50%)',
                                                    width: 'auto',
                                                    minWidth: '90px'
                                                }}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ 
                                                    delay: index * 0.03,
                                                    duration: 0.2 
                                                }}
                                            >
                                                <NavLink
                                                    to={to}
                                                    end={to === "/admin"}
                                                    onClick={() => setIsOpen(false)}
                                                    className={({ isActive }) =>
                                                        `flex flex-col items-center justify-center gap-1 px-3 py-2 bg-white rounded-full shadow-lg border-2 transition-all min-w-[80px] ${
                                                            isActive
                                                                ? 'border-blue-600 text-blue-600'
                                                                : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-500'
                                                        }`
                                                    }
                                                    title={text}
                                                >
                                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                                    <span className="text-[10px] font-medium text-center leading-tight">{text}</span>
                                                </NavLink>
                                            </motion.div>
                                        );
                                    }) : (
                                        <div className="absolute top-0 left-0 text-white text-xs p-2 bg-red-500 rounded-lg">
                                            ⚠️ No hay opciones
                                        </div>
                                    )}
                                    
                                    {/* Botón de logout eliminado - Ya existe en la parte superior */}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Indicador de página actual - Se oculta cuando el menú está abierto */}
            {currentNav && !isOpen && (
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

export default MobileAdminNavAdaptive;
