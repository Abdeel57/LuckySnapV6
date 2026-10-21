import React from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';

interface BrandStoryProps {
    /** Pregunta y respuesta "¿Qué es Lucky Snap?" escritas por el admin en las FAQ. */
    question: string;
    answer: string;
    siteName: string;
    logo?: string;
    whatsapp?: string;
}

/** Presentación de la marca con las palabras del propio negocio. */
const BrandStory: React.FC<BrandStoryProps> = ({ question, answer, siteName, logo, whatsapp }) => (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="glow-border relative overflow-hidden rounded-3xl bg-background-secondary p-6 sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -z-0 inset-0 bg-[radial-gradient(30rem_16rem_at_0%_0%,rgb(var(--color-action)/0.22),transparent_60%)]" aria-hidden />
            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:gap-10 items-center">
                {logo && (
                    <div className="relative mx-auto md:mx-0 w-28 h-28 animate-float-slow">
                        <span className="absolute inset-2 rounded-full bg-action/35 blur-lg" aria-hidden />
                        <img src={logo} alt={siteName} className="relative w-full h-full object-contain" />
                    </div>
                )}
                <div className="text-center md:text-left">
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent">
                        <ShieldCheck className="w-4 h-4" aria-hidden /> Quiénes somos
                    </p>
                    <h2 className="font-display mt-2 text-[clamp(1.35rem,1.8vw+0.6rem,1.9rem)] leading-[1.15] font-bold text-white">{question}</h2>
                    <p className="mt-3 text-[15px] sm:text-base text-slate-200 whitespace-pre-line">{answer}</p>
                    {whatsapp && (
                        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-center md:justify-start">
                            <Button href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" variant="whatsapp" icon={<MessageCircle className="w-5 h-5" aria-hidden />}>
                                Habla con nosotros
                            </Button>
                            <span className="text-sm text-slate-400">Te respondemos por WhatsApp.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

export default BrandStory;
