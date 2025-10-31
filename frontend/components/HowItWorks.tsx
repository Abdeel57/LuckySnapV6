import React from 'react';
import { List, MousePointerClick, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
    const steps = [
        {
            icon: List,
            title: 'Elige tu Sorteo',
            description: 'Explora nuestros sorteos activos y encuentra el premio de tus sueños.',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800'
        },
        {
            icon: MousePointerClick,
            title: 'Selecciona tus Boletos',
            description: 'Escoge tus números de la suerte, llena tus datos y aparta tu lugar. ¡Es fácil y rápido!',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800'
        },
        {
            icon: Trophy,
            title: '¡Gana!',
            description: 'Sigue el sorteo en la fecha indicada. ¡El próximo ganador podrías ser tú!',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800'
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
            
            <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className={`relative ${step.bgColor} ${step.borderColor} border-2 rounded-3xl p-8 text-center group hover:shadow-2xl transition-all duration-300 hover:scale-105`}
                            >
                                {/* Número del paso - Grande y destacado */}
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-900`}>
                                        <span className="text-3xl font-black text-white">{index + 1}</span>
                                    </div>
                                </div>
                                
                                {/* Contenido */}
                                <div className="mt-8">
                                    {/* Icono */}
                                    <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110`}>
                                        <step.icon size={40} className="text-white" />
                                    </div>
                                    
                                    {/* Título */}
                                    <h3 className="text-2xl md:text-3xl font-black text-primary mb-4 group-hover:text-link transition-colors">
                                        {step.title}
                                    </h3>
                                    
                                    {/* Descripción */}
                                    <p className="text-base md:text-lg text-secondary leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                
                                {/* Indicador visual del paso */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-white`}>
                                        PASO {index + 1}
                                    </span>
                                </div>
                            </motion.div>
                            
                            {/* Flecha conectora (solo entre pasos en desktop) */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:flex items-center justify-center -mx-4 z-0">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: (index + 1) * 0.2 }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full shadow-lg"
                                    >
                                        <ArrowRight className="w-8 h-8 text-white" />
                                    </motion.div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                
                {/* Línea conectora en móvil (debajo de las tarjetas) */}
                <div className="md:hidden mt-8 flex items-center justify-center space-x-4">
                    {steps.map((_, index) => (
                        <React.Fragment key={index}>
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${steps[index].color} shadow-md`} />
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-1 bg-gradient-to-r ${steps[index].color} to-transparent`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
