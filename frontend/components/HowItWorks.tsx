import React from 'react';
import { List, MousePointerClick, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
    const steps = [
        {
            icon: List,
            title: 'Elige tu Sorteo',
            description: 'Explora nuestros sorteos activos y encuentra el premio de tus sueños.',
            color: 'from-blue-500 to-blue-600'
        },
        {
            icon: MousePointerClick,
            title: 'Selecciona tus Boletos',
            description: 'Escoge tus números de la suerte, llena tus datos y aparta tu lugar. ¡Es fácil y rápido!',
            color: 'from-purple-500 to-purple-600'
        },
        {
            icon: Trophy,
            title: '¡Gana!',
            description: 'Sigue el sorteo en la fecha indicada. ¡El próximo ganador podrías ser tú!',
            color: 'from-green-500 to-green-600'
        }
    ];

    return (
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">
                    ¿Cómo Funciona?
                </h2>
                <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto">
                    Participar es súper fácil. Solo sigue estos 3 simples pasos
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        className="text-center group"
                    >
                        <div className="relative mb-8">
                            <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                                <step.icon size={32} className="text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-inverse rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                {index + 1}
                            </div>
                        </div>
                        
                        <h3 className="text-xl md:text-2xl font-bold text-primary mb-4 group-hover:text-link transition-colors">
                            {step.title}
                        </h3>
                        <p className="text-secondary leading-relaxed">
                            {step.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default HowItWorks;
