import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../services/api';
import { Settings } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons/BrandIcons';

const FOOTER_LINKS = [
    { to: '/verificador', text: 'Verificar boleto' },
    { to: '/cuentas-de-pago', text: 'Cuentas de pago' },
    { to: '/terminos', text: 'Términos y condiciones' },
];

type IconLink = { href: string; label: string; icon: React.ReactNode };

const linkClass = 'inline-flex items-center h-9 text-sm font-semibold text-ink/75 hover:text-ink transition-colors rounded-md';

/**
 * Pie compacto, pensado primero para móvil: marca + iconos de redes en una fila,
 * enlaces en línea debajo y el aviso legal. En escritorio todo cabe en una sola fila.
 */
const Footer = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const { appearance } = useTheme();

    useEffect(() => {
        getSettings().then(setSettings).catch(() => setSettings(null));
    }, []);

    const siteName = appearance?.siteName || settings?.appearance?.siteName || 'Lucky Snap';
    const contactInfo = settings?.contactInfo;
    const socialLinks = settings?.socialLinks;

    const iconLinks = [
        contactInfo?.whatsapp && { href: `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`, label: 'WhatsApp', icon: <WhatsAppIcon className="w-5 h-5" /> },
        socialLinks?.facebookUrl && { href: socialLinks.facebookUrl, label: 'Facebook', icon: <FacebookIcon className="w-5 h-5" /> },
        socialLinks?.instagramUrl && { href: socialLinks.instagramUrl, label: 'Instagram', icon: <InstagramIcon className="w-5 h-5" /> },
        socialLinks?.tiktokUrl && { href: socialLinks.tiktokUrl, label: 'TikTok', icon: <TikTokIcon className="w-5 h-5" /> },
    ].filter(Boolean) as IconLink[];

    return (
        <footer className="mt-12 md:mt-20 border-t border-line bg-surface">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-6 md:py-8">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 md:gap-x-8">
                    <Link to="/" className="inline-flex items-center gap-2 rounded-lg">
                        {appearance?.logo && <img src={appearance.logo} alt="" className="h-9 w-9 object-contain" />}
                        <span className="font-display text-lg font-bold text-ink tracking-tight">{siteName}</span>
                    </Link>

                    {iconLinks.length > 0 && (
                        <ul className="flex items-center gap-1 md:order-last" aria-label="Contacto y redes sociales">
                            {iconLinks.map(item => (
                                <li key={item.label}>
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={item.label}
                                        title={item.label}
                                        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                                    >
                                        {item.icon}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}

                    <nav aria-label="Enlaces" className="w-full md:w-auto">
                        <ul className="flex flex-wrap gap-x-5">
                            {FOOTER_LINKS.map(link => (
                                <li key={link.to}><Link to={link.to} className={linkClass}>{link.text}</Link></li>
                            ))}
                            {contactInfo?.email && (
                                <li><a href={`mailto:${contactInfo.email}`} className={linkClass}>Correo</a></li>
                            )}
                        </ul>
                    </nav>
                </div>

                <p className="mt-3 md:mt-5 text-xs text-muted">
                    © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
