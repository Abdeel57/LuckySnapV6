import React from 'react';
import { List, MousePointerClick, Trophy } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            icon: List,
            title: 'Elige tu Sorteo',
            description: 'Explora nuestros sorteos activos y encuentra el premio de tus sueños.'
        },
        {
            icon: MousePointerClick,
            title: 'Selecciona tus Boletos',
            description: 'Escoge tus números de la suerte, llena tus datos y aparta tu lugar. ¡Es fácil y rápido!'
        },
        {
            icon: Trophy,
            title: '¡Gana!',
            description: 'Sigue el sorteo en la fecha indicada. ¡El próximo ganador podrías ser tú!'
        }
    ];

    return (
        <section className="bg-background-secondary py-20">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center text-white mb-12">¿Cómo Funciona?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center p-6">
                            <div className="bg-accent/20 text-accent p-4 rounded-full mb-4">
                                <step.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-slate-400">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
