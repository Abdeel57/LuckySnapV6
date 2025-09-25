import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/api';
import { Settings } from '../types';
import { Facebook, Instagram, Twitter, Mail, MessageCircle } from 'lucide-react';

const Footer = () => {
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    if (!settings) return null;

    return (
        <footer className="bg-background-secondary mt-16 py-12 border-t border-slate-700/50">
            <div className="container mx-auto px-4 text-center text-slate-400">
                <p className="font-bold text-white text-lg mb-4">{settings.appearance.siteName}</p>
                
                <div className="flex justify-center gap-6 mb-6">
                    {settings.contactInfo.whatsapp && (
                        <a href={`https://wa.me/${settings.contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors flex items-center gap-2">
                           <MessageCircle size={20}/> WhatsApp
                        </a>
                    )}
                     {settings.contactInfo.email && (
                        <a href={`mailto:${settings.contactInfo.email}`} className="hover:text-accent transition-colors flex items-center gap-2">
                           <Mail size={20}/> Correo
                        </a>
                    )}
                </div>

                <div className="flex justify-center gap-8 mb-8">
                    {settings.socialLinks.facebookUrl && <a href={settings.socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent"><Facebook /></a>}
                    {settings.socialLinks.instagramUrl && <a href={settings.socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent"><Instagram /></a>}
                    {settings.socialLinks.twitterUrl && <a href={settings.socialLinks.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent"><Twitter /></a>}
                </div>
                <p className="text-sm">© {new Date().getFullYear()} {settings.appearance.siteName}. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
