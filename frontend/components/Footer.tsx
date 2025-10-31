import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../services/api';
import { Settings } from '../types';
import { Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';

// Icono de TikTok personalizado
const TikTokIcon = ({ size = 24 }: { size?: number }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block' }}
    >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
);

const Footer = () => {
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    if (!settings) return null;

    const { contactInfo, socialLinks } = settings;

    return (
        <footer className="bg-background-secondary mt-16 py-12 border-t border-slate-700/50">
            <div className="container mx-auto px-4 text-center text-slate-400">
                <p className="font-bold text-white text-lg mb-4">{settings?.siteName || 'Lucky Snap'}</p>
                
                {/* Contact Info */}
                {(contactInfo?.whatsapp || contactInfo?.email) && (
                    <div className="flex justify-center gap-6 mb-6">
                        {contactInfo.whatsapp && (
                            <a 
                                href={`https://wa.me/${contactInfo.whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <MessageCircle size={20} />
                                <span>WhatsApp</span>
                            </a>
                        )}
                        {contactInfo.email && (
                            <a 
                                href={`mailto:${contactInfo.email}`}
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <Mail size={20} />
                                <span>Email</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {(socialLinks?.facebookUrl || socialLinks?.instagramUrl || socialLinks?.tiktokUrl) && (
                    <div className="flex justify-center gap-8 mb-8">
                        {socialLinks.facebookUrl && (
                            <a 
                                href={socialLinks.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook size={24} />
                            </a>
                        )}
                        {socialLinks.instagramUrl && (
                            <a 
                                href={socialLinks.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram size={24} />
                            </a>
                        )}
                        {socialLinks.tiktokUrl && (
                            <a 
                                href={socialLinks.tiktokUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                                aria-label="TikTok"
                            >
                                <TikTokIcon size={24} />
                            </a>
                        )}
                    </div>
                )}
                
                <div className="flex justify-center gap-6 mb-6 text-sm">
                    <Link to="/terminos" className="hover:text-white transition-colors">
                        Términos y Condiciones
                    </Link>
                    <Link to="/verificador" className="hover:text-white transition-colors">
                        Verificar Folio
                    </Link>
                    <Link to="/cuentas-de-pago" className="hover:text-white transition-colors">
                        Cuentas de Pago
                    </Link>
                </div>
                
                <p className="text-sm">© {new Date().getFullYear()} {settings?.siteName || 'Lucky Snap'}. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
