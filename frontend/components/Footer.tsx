import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings } from '../services/api';
import { Settings } from '../types';
import { Facebook, Instagram, Mail, MessageCircle, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <footer className="relative bg-gradient-to-b from-background-secondary via-slate-900/80 to-background-secondary mt-20 pt-12 pb-8 border-t border-slate-700/30 overflow-hidden">
            {/* Efecto de fondo decorativo - usa colores del tema */}
            <div className="absolute inset-0 bg-gradient-to-r from-action/5 via-accent/5 to-action/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-action/10 rounded-full blur-3xl" />
            
            <div className="container mx-auto px-4 relative z-10">
                {/* Header del Footer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent animate-pulse" />
                        <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-action/80 to-accent/80 bg-clip-text text-transparent">
                            {settings?.siteName || 'Lucky Snap'}
                        </h3>
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>
                    <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
                        Participa en sorteos increíbles y gana premios fantásticos
                    </p>
                </motion.div>

                {/* Sección principal del Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10 max-w-6xl mx-auto">
                    {/* Contacto */}
                    {(contactInfo?.whatsapp || contactInfo?.email) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-center md:text-left flex flex-col"
                        >
                            <h4 className="text-white font-bold text-lg mb-5 flex items-center justify-center md:justify-start gap-2">
                                <MessageCircle className="w-5 h-5 text-accent" />
                                Contáctanos
                            </h4>
                            <div className="flex flex-col gap-3 flex-grow">
                                {contactInfo.whatsapp && (
                                    <motion.a
                                        href={`https://wa.me/${contactInfo.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 hover:border-green-500/40 hover:bg-green-500/15 transition-all duration-300 group"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <MessageCircle className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors flex-shrink-0" />
                                        <span className="text-slate-300 group-hover:text-white transition-colors text-sm md:text-base">WhatsApp</span>
                                    </motion.a>
                                )}
                                {contactInfo.email && (
                                    <motion.a
                                        href={`mailto:${contactInfo.email}`}
                                        className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 bg-gradient-to-r from-action/10 to-action/20 rounded-xl border border-action/20 hover:border-action/40 hover:bg-action/15 transition-all duration-300 group"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Mail className="w-5 h-5 text-action group-hover:text-action/80 transition-colors flex-shrink-0" />
                                        <span className="text-slate-300 group-hover:text-white transition-colors text-sm md:text-base">Email</span>
                                    </motion.a>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Redes Sociales */}
                    {(socialLinks?.facebookUrl || socialLinks?.instagramUrl || socialLinks?.tiktokUrl) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-center flex flex-col items-center md:items-center"
                        >
                            <h4 className="text-white font-bold text-lg mb-5 flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent" />
                                Síguenos
                            </h4>
                            <div className="flex justify-center gap-3 flex-wrap items-center">
                                {socialLinks.facebookUrl && (
                                    <motion.a
                                        href={socialLinks.facebookUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 flex items-center justify-center hover:border-blue-400/50 hover:bg-blue-600/30 transition-all duration-300 group"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label="Facebook"
                                    >
                                        <Facebook className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    </motion.a>
                                )}
                                {socialLinks.instagramUrl && (
                                    <motion.a
                                        href={socialLinks.instagramUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-600/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center hover:border-pink-400/50 hover:bg-pink-600/30 transition-all duration-300 group"
                                        whileHover={{ scale: 1.1, rotate: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label="Instagram"
                                    >
                                        <Instagram className="w-7 h-7 text-pink-400 group-hover:text-pink-300 transition-colors" />
                                    </motion.a>
                                )}
                                {socialLinks.tiktokUrl && (
                                    <motion.a
                                        href={socialLinks.tiktokUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700/20 to-slate-800/20 border border-slate-600/30 flex items-center justify-center hover:border-slate-500/50 hover:bg-slate-700/30 transition-all duration-300 group"
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label="TikTok"
                                    >
                                        <TikTokIcon size={28} className="text-slate-300 group-hover:text-white transition-colors" />
                                    </motion.a>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Enlaces Rápidos */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-center md:text-right flex flex-col"
                    >
                        <h4 className="text-white font-bold text-lg mb-5">Enlaces Rápidos</h4>
                        <div className="flex flex-col gap-2.5 flex-grow justify-start">
                            <Link 
                                to="/terminos" 
                                className="text-slate-400 hover:text-accent transition-colors text-sm md:text-base px-3 py-2.5 rounded-lg hover:bg-slate-800/30 inline-block"
                            >
                                Términos y Condiciones
                            </Link>
                            <Link 
                                to="/verificador" 
                                className="text-slate-400 hover:text-accent transition-colors text-sm md:text-base px-3 py-2.5 rounded-lg hover:bg-slate-800/30 inline-block"
                            >
                                Verificar Folio
                            </Link>
                            <Link 
                                to="/cuentas-de-pago" 
                                className="text-slate-400 hover:text-accent transition-colors text-sm md:text-base px-3 py-2.5 rounded-lg hover:bg-slate-800/30 inline-block"
                            >
                                Cuentas de Pago
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Separador decorativo */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-8" />

                {/* Copyright */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center"
                >
                    <p className="text-slate-500 text-xs md:text-sm flex items-center justify-center gap-2">
                        <span>© {new Date().getFullYear()} {settings?.siteName || 'Lucky Snap'}. Todos los derechos reservados.</span>
                        <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
                    </p>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
