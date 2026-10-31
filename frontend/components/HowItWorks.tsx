import React, { memo } from 'react';
import SectionHeading from './ui/SectionHeading';

const STEPS = [
    {
        title: 'Elige tu sorteo',
        description: 'Revisa el premio, el precio por boleto y la fecha del sorteo.',
    },
    {
        title: 'Escoge tus boletos',
        description: 'Selecciona tus números o deja que la suerte los elija, y apártalos con tu nombre y teléfono.',
    },
    {
        title: 'Paga y participa',
        description: 'Realiza el pago y envía tu comprobante. Al confirmarse, tus boletos quedan registrados a tu nombre.',
    },
];

const HowItWorks = () => (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading eyebrow="Así de fácil" title="Cómo participar" />
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-3xl bg-surface p-5 shadow-soft lit">
                    <span className="tnum flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-action to-accent font-display text-lg font-semibold text-white" aria-hidden>
                        {index + 1}
                    </span>
                    <div>
                        <h3 className="font-extrabold text-ink">
                            <span className="sr-only">Paso {index + 1}: </span>{step.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted">{step.description}</p>
                    </div>
                </li>
            ))}
        </ol>
    </div>
);

export default memo(HowItWorks);
