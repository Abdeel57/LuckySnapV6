import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAnimations } from '../utils/deviceDetection';

const Header = () => {
    const { appearance } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const reduceAnimations = useOptimizedAnimations();

    const navLinks = [
        { to: "/", text: "Inicio" },
        { to: "/verificador", text: "Verificador" },
        { to: "/cuentas-de-pago", text: "Cuentas de Pago" },
        { to: "/mis-cuentas", text: "Mi Cuenta" },
    ];

    const menuVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
        exit: { opacity: 0, y: -20 }
    };

    const linkVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <header className={`relative bg-gradient-to-b from-background-secondary/95 via-background-secondary/90 to-background-secondary/95 ${reduceAnimations ? 'backdrop-blur-sm' : 'backdrop-blur-xl'} sticky top-0 z-50 border-b border-slate-700/30 shadow-lg shadow-black/10 overflow-hidden`}>
            {/* Efecto de fondo decorativo - reducido en móviles */}
            {!reduceAnimations && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-r from-action/5 via-accent/5 to-action/5" />
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-action/5 rounded-full blur-3xl -translate-y-1/2" />
                    <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2" />
                </>
            )}
            
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex justify-between items-center h-16 md:h-20">
                    {/* Logo y Nombre del Sitio */}
                    <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                        {appearance?.logo && (
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ duration: 0.2 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-action/20 to-accent/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <img 
                                    src={appearance.logo} 
                                    alt="Logo" 
                                    className="relative h-12 w-12 md:h-14 md:w-14 object-contain drop-shadow-lg"
                                />
                            </motion.div>
                        )}
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-xl md:text-3xl font-black bg-gradient-to-r from-white via-action/90 to-accent/90 bg-clip-text text-transparent drop-shadow-sm">
                                {appearance?.siteName || 'Lucky Snap'}
                            </span>
                        </div>
                    </Link>
                    
                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                        {navLinks.map((link, index) => (
                            <motion.div
                                key={link.to}
                                initial={reduceAnimations ? {} : { opacity: 0, y: -10 }}
                                animate={reduceAnimations ? {} : { opacity: 1, y: 0 }}
                                transition={reduceAnimations ? {} : { delay: index * 0.1 }}
                            >
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) => 
                                        `relative px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 group ${
                                            isActive 
                                                ? 'text-white bg-gradient-to-r from-action/20 to-accent/20 border border-action/30 shadow-lg shadow-action/10' 
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className="relative z-10">{link.text}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-gradient-to-r from-action/10 to-accent/10 rounded-lg -z-0"
                                                    initial={false}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            {!isActive && (
                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-action/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </motion.div>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <motion.button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 flex items-center justify-center text-white hover:bg-slate-700/50 transition-all duration-300 backdrop-blur-sm"
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05 }}
                            aria-label="Toggle menu"
                        >
                            <AnimatePresence mode="wait">
                                {isMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <X size={20} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Menu size={20} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.nav 
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="md:hidden relative bg-gradient-to-b from-background-secondary via-slate-900/95 to-background-secondary border-t border-slate-700/30 backdrop-blur-xl"
                    >
                        {/* Efecto de fondo para menú móvil */}
                        {!reduceAnimations && <div className="absolute inset-0 bg-gradient-to-r from-action/5 via-accent/5 to-action/5" />}
                        
                        <div className="relative z-10 flex flex-col py-2">
                             {navLinks.map((link, index) => (
                                 <motion.div 
                                     variants={linkVariants} 
                                     key={link.to} 
                                     className="w-full"
                                 >
                                     <NavLink
                                         to={link.to}
                                         onClick={() => setIsMenuOpen(false)}
                                         className={({ isActive }) =>
                                             `relative block py-4 px-6 text-center text-base w-full transition-all duration-300 border-b border-slate-700/30 last:border-b-0 overflow-hidden group ${
                                                 isActive 
                                                     ? 'text-white bg-gradient-to-r from-action/20 to-accent/20' 
                                                     : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
                                             }`
                                         }
                                     >
                                         {({ isActive }) => (
                                             <>
                                                 <span className="relative z-10">{link.text}</span>
                                                 {isActive && (
                                                     <motion.div
                                                         className="absolute inset-0 bg-gradient-to-r from-action/10 to-accent/10"
                                                         initial={{ opacity: 0 }}
                                                         animate={{ opacity: 1 }}
                                                         transition={{ duration: 0.3 }}
                                                     />
                                                 )}
                                                 {!isActive && (
                                                     <div className="absolute inset-0 bg-gradient-to-r from-action/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                 )}
                                             </>
                                         )}
                                     </NavLink>
                                 </motion.div>
                             ))}
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
