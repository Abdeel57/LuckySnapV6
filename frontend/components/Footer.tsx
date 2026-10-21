import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';
import { getSettings } from '../services/api';
import { Settings } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const TikTokIcon = ({ className = '' }: { className?: string }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
);

const FOOTER_LINKS = [
    { to: '/verificador', text: 'Verificar boleto' },
    { to: '/cuentas-de-pago', text: 'Cuentas de pago' },
    { to: '/terminos', text: 'Términos y condiciones' },
];

const rowClass = 'flex items-center gap-3 h-11 text-sm text-slate-300 hover:text-white transition-colors rounded-lg';

const Footer = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const { appearance } = useTheme();

    useEffect(() => {
        getSettings().then(setSettings).catch(() => setSettings(null));
    }, []);

    const siteName = appearance?.siteName || settings?.appearance?.siteName || 'Lucky Snap';
    const contactInfo = settings?.contactInfo;
    const socialLinks = settings?.socialLinks;
    const hasContact = Boolean(contactInfo?.whatsapp || contactInfo?.email);
    const hasSocial = Boolean(socialLinks?.facebookUrl || socialLinks?.instagramUrl || socialLinks?.tiktokUrl);

    return (
        <footer className="mt-16 md:mt-24 border-t border-white/[0.06] bg-background-secondary/60">
            <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-10 md:py-14">
                <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg">
                            {appearance?.logo && <img src={appearance.logo} alt="" className="h-12 w-12 object-contain" />}
                            <span className="text-lg font-extrabold text-white tracking-tight">{siteName}</span>
                        </Link>
                    </div>

                    {hasContact && (
                        <div>
                            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Contacto</h2>
                            <ul>
                                {contactInfo?.whatsapp && (
                                    <li>
                                        <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={rowClass}>
                                            <MessageCircle className="w-4 h-4 text-[#25D366]" aria-hidden /> WhatsApp
                                        </a>
                                    </li>
                                )}
                                {contactInfo?.email && (
                                    <li>
                                        <a href={`mailto:${contactInfo.email}`} className={rowClass}>
                                            <Mail className="w-4 h-4 text-slate-400" aria-hidden /> Correo
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {hasSocial && (
                        <div>
                            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Síguenos</h2>
                            <ul>
                                {socialLinks?.facebookUrl && (
                                    <li><a href={socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className={rowClass}><Facebook className="w-4 h-4" aria-hidden /> Facebook</a></li>
                                )}
                                {socialLinks?.instagramUrl && (
                                    <li><a href={socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" className={rowClass}><Instagram className="w-4 h-4" aria-hidden /> Instagram</a></li>
                                )}
                                {socialLinks?.tiktokUrl && (
                                    <li><a href={socialLinks.tiktokUrl} target="_blank" rel="noopener noreferrer" className={rowClass}><TikTokIcon className="w-4 h-4" /> TikTok</a></li>
                                )}
                            </ul>
                        </div>
                    )}

                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">Enlaces</h2>
                        <ul>
                            {FOOTER_LINKS.map(link => (
                                <li key={link.to}><Link to={link.to} className={rowClass}>{link.text}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <p className="mt-10 pt-6 border-t border-white/[0.06] text-xs text-slate-400">
                    © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
