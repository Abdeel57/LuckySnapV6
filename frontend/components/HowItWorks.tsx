import React, { memo } from 'react';
import { MousePointerClick, Ticket, Trophy } from 'lucide-react';
import SectionHeading from './ui/SectionHeading';
import Reveal from './ui/Reveal';

const STEPS = [
    {
        icon: Ticket,
        title: 'Elige tu sorteo',
        description: 'Revisa el premio, el precio por boleto y la fecha del sorteo.',
    },
    {
        icon: MousePointerClick,
        title: 'Escoge tus boletos',
        description: 'Selecciona tus números o deja que la suerte los elija, y apártalos con tu nombre y teléfono.',
    },
    {
        icon: Trophy,
        title: 'Paga y participa',
        description: 'Realiza el pago y envía tu comprobante. Al confirmarse, tus boletos quedan registrados a tu nombre.',
    },
];

const HowItWorks = () => (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading eyebrow="Así de fácil" title="Cómo participar" lead="Tres pasos, desde tu celular." />
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {STEPS.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 110} className="group relative rounded-2xl border border-white/[0.08] bg-background-secondary p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                    <span className="tnum absolute top-4 right-4 inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-xs font-extrabold text-slate-300" aria-hidden>
                        {index + 1}
                    </span>
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-action to-accent text-white shadow-glow-action transition-transform duration-300 group-hover:scale-110" aria-hidden>
                        <step.icon className="w-6 h-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold text-white">
                        <span className="sr-only">Paso {index + 1}: </span>{step.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                </Reveal>
            ))}
        </ol>
    </div>
);

export default memo(HowItWorks);
