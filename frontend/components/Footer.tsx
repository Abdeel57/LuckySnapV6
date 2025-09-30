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

    return (
        <footer className="bg-background-secondary mt-16 py-12 border-t border-slate-700/50">
            <div className="container mx-auto px-4 text-center text-slate-400">
                <p className="font-bold text-white text-lg mb-4">{settings?.siteName || 'Lucky Snap'}</p>
                
                <div className="flex justify-center gap-6 mb-6">
                    {/* Contact info removed for now - not in local data structure */}
                </div>

                <div className="flex justify-center gap-8 mb-8">
                    {/* Social links removed for now - not in local data structure */}
                </div>
                
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
