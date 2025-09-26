import React, { useState, useEffect } from 'react';
import { getSettings } from '../services/api';
import { FaqItemData } from '../types';
import FaqItem from './FaqItem';

const Faq = () => {
    const [faqs, setFaqs] = useState<FaqItemData[]>([]);
    const [openFaqId, setOpenFaqId] = useState<string | null>(null);

    useEffect(() => {
        getSettings().then(settings => setFaqs(settings.faqs));
    }, []);

    const toggleFaq = (id: string) => {
        setOpenFaqId(prevId => (prevId === id ? null : id));
    };

    if (faqs.length === 0) return null;

    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-white mb-8">Preguntas Frecuentes</h2>
            <div className="space-y-4">
                {faqs.map(faq => (
                    <FaqItem 
                        key={faq.id} 
                        question={faq.question} 
                        answer={faq.answer} 
                        isOpen={openFaqId === faq.id}
                        onClick={() => toggleFaq(faq.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Faq;
