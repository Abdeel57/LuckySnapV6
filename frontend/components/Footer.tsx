import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../services/api';
import { Settings } from '../types';
import { Facebook, Instagram, Twitter, Mail, MessageCircle } from 'lucide-react';

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
                {(socialLinks?.facebookUrl || socialLinks?.instagramUrl || socialLinks?.twitterUrl) && (
                    <div className="flex justify-center gap-8 mb-8">
                        {socialLinks.facebookUrl && (
                            <a 
                                href={socialLinks.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
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
                            >
                                <Instagram size={24} />
                            </a>
                        )}
                        {socialLinks.twitterUrl && (
                            <a 
                                href={socialLinks.twitterUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                            >
                                <Twitter size={24} />
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
