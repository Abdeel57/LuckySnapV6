import React, { useState, useEffect, memo } from 'react';
import { MessageCircle } from 'lucide-react';
import { getSettings } from '../services/api';
import { FaqItemData } from '../types';
import FaqItem from './FaqItem';
import SectionHeading from './ui/SectionHeading';
import Button from './ui/Button';

const Faq = () => {
    const [faqs, setFaqs] = useState<FaqItemData[]>([]);
    const [whatsapp, setWhatsapp] = useState<string>('');
    const [openFaqId, setOpenFaqId] = useState<string | null>(null);

    useEffect(() => {
        getSettings()
            .then(settings => {
                setFaqs(settings.faqs || []);
                setWhatsapp(settings.contactInfo?.whatsapp || '');
            })
            .catch(() => setFaqs([]));
    }, []);

    const toggleFaq = (id: string) => setOpenFaqId(prev => (prev === id ? null : id));

    if (faqs.length === 0) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <SectionHeading eyebrow="Dudas" title="Preguntas frecuentes" />
            <div className="max-w-3xl space-y-2">
                {faqs.map((faq, index) => {
                    const faqId = faq.id || `faq-${index}`;
                    return (
                        <FaqItem
                            key={faqId}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openFaqId === faqId}
                            onClick={() => toggleFaq(faqId)}
                        />
                    );
                })}
            </div>
            {whatsapp && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-slate-400">¿Tienes otra duda?</p>
                    <Button href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" variant="whatsapp" size="sm" icon={<MessageCircle className="w-4 h-4" aria-hidden />}>
                        Escríbenos por WhatsApp
                    </Button>
                </div>
            )}
        </div>
    );
};

export default memo(Faq);
