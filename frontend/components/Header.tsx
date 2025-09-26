import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
    const { appearance } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <header className="bg-background-secondary/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-700/50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="text-2xl font-bold text-white">
                        {appearance.siteName}
                    </Link>
                    
                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map(link => (
                             <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) => 
                                    `text-slate-300 hover:text-accent transition-colors relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-[2px] after:bg-accent after:transition-all after:duration-300 ${isActive ? 'text-accent after:w-full' : 'after:w-0'}`
                                }
                            >
                                {link.text}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2">
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
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
                        className="md:hidden bg-background-secondary border-t border-slate-700/50"
                    >
                         <div className="flex flex-col items-center py-4">
                             {navLinks.map(link => (
                                 <motion.div variants={linkVariants} key={link.to} className="w-full">
                                     <NavLink
                                         to={link.to}
                                         onClick={() => setIsMenuOpen(false)}
                                         className={({ isActive }) =>
                                             `block py-3 text-center text-lg w-full transition-colors ${isActive ? 'text-accent bg-accent/10' : 'text-slate-300'}`
                                         }
                                     >
                                         {link.text}
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
