import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { LogoAnimation } from '../types';

const NAV_LINKS = [
    { to: '/', text: 'Inicio', end: true },
    { to: '/verificador', text: 'Verificar boleto' },
    { to: '/cuentas-de-pago', text: 'Cuentas de pago' },
];

// Animación del logo elegida por el admin en Ajustes → Apariencia
const LOGO_ANIMATION: Record<LogoAnimation, string> = {
    none: '',
    rotate: 'animate-logo-rotate',
    pulse: 'animate-logo-pulse',
    bounce: 'animate-logo-bounce',
};

const Header = () => {
    const { appearance } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const siteName = appearance?.siteName || 'Lucky Snap';
    const logoAnimation = LOGO_ANIMATION[appearance?.logoAnimation || 'none'] || '';

    // Cerrar el menú al navegar o al pulsar Escape
    useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);
    useEffect(() => {
        if (!isMenuOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isMenuOpen]);

    // Enlaces como pastillas: la activa se rellena
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `inline-flex items-center h-10 px-4 rounded-full text-sm font-extrabold transition-colors ${
            isActive ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink hover:bg-white/[0.06]'
        }`;

    return (
        <header className="sticky top-0 z-50 bg-page/80 backdrop-blur-md border-b border-line">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="group flex items-center gap-2.5 min-w-0 rounded-full" aria-label={`${siteName} — Inicio`}>
                        {appearance?.logo ? (
                            <img src={appearance.logo} alt="" className={`h-11 w-11 flex-shrink-0 object-contain transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105 ${logoAnimation}`} />
                        ) : null}
                        <span className="font-display text-xl font-semibold text-ink truncate">{siteName}</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
                        {NAV_LINKS.map(link => (
                            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                                {link.text}
                            </NavLink>
                        ))}
                    </nav>

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(open => !open)}
                        className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full text-ink bg-white/[0.06] hover:bg-white/10 transition-colors"
                        aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-nav"
                    >
                        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Menú móvil: hoja bajo el encabezado, filas de 48 px */}
            {isMenuOpen && (
                <>
                    <div className="md:hidden fixed inset-0 top-16 bg-black/60" onClick={() => setIsMenuOpen(false)} aria-hidden />
                    <nav id="mobile-nav" aria-label="Principal" className="md:hidden absolute inset-x-0 top-16 bg-surface border-b border-line shadow-lift animate-drop-in">
                        <ul className="container mx-auto px-4 py-2 max-w-6xl">
                            {NAV_LINKS.map((link, index) => (
                                <li key={link.to} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                                    <NavLink
                                        to={link.to}
                                        end={link.end}
                                        className={({ isActive }) =>
                                            `flex items-center h-12 px-4 rounded-full text-base font-extrabold ${
                                                isActive ? 'text-action-ink bg-action/15' : 'text-ink hover:bg-white/[0.06]'
                                            }`
                                        }
                                    >
                                        {link.text}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </>
            )}
        </header>
    );
};

export default Header;
