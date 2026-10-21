import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NAV_LINKS = [
    { to: '/', text: 'Inicio', end: true },
    { to: '/verificador', text: 'Verificar boleto' },
    { to: '/cuentas-de-pago', text: 'Cuentas de pago' },
];

const Header = () => {
    const { appearance } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const siteName = appearance?.siteName || 'Lucky Snap';

    // Cerrar el menú al navegar o al pulsar Escape
    useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);
    useEffect(() => {
        if (!isMenuOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isMenuOpen]);

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `relative inline-flex items-center h-10 px-3 rounded-lg text-sm font-semibold transition-colors ${
            isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
        }`;

    return (
        <header className="sticky top-0 z-50 bg-background-primary/85 backdrop-blur-md border-b border-white/[0.06]">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2.5 min-w-0 rounded-lg" aria-label={`${siteName} — Inicio`}>
                        {appearance?.logo ? (
                            <img src={appearance.logo} alt="" className="h-11 w-11 object-contain flex-shrink-0" />
                        ) : null}
                        <span className="text-lg font-extrabold text-white tracking-tight truncate">{siteName}</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
                        {NAV_LINKS.map(link => (
                            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                                {({ isActive }) => (
                                    <>
                                        {link.text}
                                        {isActive && <span className="absolute left-3 right-3 -bottom-[13px] h-0.5 rounded-full bg-accent" aria-hidden />}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(open => !open)}
                        className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl text-white hover:bg-white/[0.08] transition-colors"
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
                    <div className="md:hidden fixed inset-0 top-16 bg-black/50" onClick={() => setIsMenuOpen(false)} aria-hidden />
                    <nav id="mobile-nav" aria-label="Principal" className="md:hidden absolute inset-x-0 top-16 bg-background-secondary border-b border-white/[0.08] shadow-raised">
                        <ul className="container mx-auto px-4 py-2 max-w-6xl">
                            {NAV_LINKS.map(link => (
                                <li key={link.to}>
                                    <NavLink
                                        to={link.to}
                                        end={link.end}
                                        className={({ isActive }) =>
                                            `flex items-center h-12 px-3 rounded-xl text-base font-semibold ${
                                                isActive ? 'text-white bg-white/[0.08]' : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
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
