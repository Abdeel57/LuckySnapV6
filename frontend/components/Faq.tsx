import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/api';
import { FaqItemData } from '../types';
import FaqItem from './FaqItem';
import { HelpCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Faq = () => {
    const [faqs, setFaqs] = useState<FaqItemData[]>([]);
    const [openFaqId, setOpenFaqId] = useState<string | null>(null);

    useEffect(() => {
        getSettings().then(settings => setFaqs(settings.faqs));
    }, []);

    const toggleFaq = (id: string) => {
        setOpenFaqId(prevId => {
            // Si la pregunta actual está abierta, cerrarla; si no, abrir esta y cerrar cualquier otra
            if (prevId === id) {
                return null;
            }
            return id;
        });
    };

    if (faqs.length === 0) return null;

    return (
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
            {/* Header mejorado */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12 md:mb-16"
            >
                <div className="inline-flex items-center justify-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                        <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent animate-pulse" />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                    Preguntas Frecuentes
                </h2>
                <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                    Encuentra respuestas rápidas a las dudas más comunes sobre nuestros sorteos
                </p>
            </motion.div>

            {/* Grid mejorado con diseño más atractivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {faqs.map((faq, index) => {
                    // Asegurar que cada FAQ tenga un ID único
                    const faqId = faq.id || `faq-${index}`;
                    const isCurrentlyOpen = openFaqId === faqId;
                    
                    return (
                        <motion.div
                            key={faqId}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <FaqItem 
                                question={faq.question} 
                                answer={faq.answer} 
                                isOpen={isCurrentlyOpen}
                                onClick={() => toggleFaq(faqId)}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer informativo */}
            {faqs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full border border-blue-500/30">
                        <HelpCircle className="w-5 h-5 text-blue-400" />
                        <p className="text-sm md:text-base text-slate-300">
                            ¿No encuentras lo que buscas? <span className="text-accent font-semibold">Contáctanos</span>
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Faq;
