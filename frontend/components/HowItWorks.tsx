import React, { memo } from 'react';
import { List, MousePointerClick, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOptimizedAnimations } from '../utils/deviceDetection';

const HowItWorks = () => {
    const reduceAnimations = useOptimizedAnimations();
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
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4 md:mb-6">
                    ¿Cómo Funciona?
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-secondary max-w-2xl mx-auto">
                    Participar es súper fácil. Solo sigue estos 3 simples pasos
                </p>
            </div>
            
            <div className="relative pb-8 md:pb-0">
                {/* Desktop Layout con flechas */}
                <div className="hidden md:flex md:items-start md:justify-center md:gap-4 lg:gap-6 xl:gap-8">
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <motion.div
                                initial={reduceAnimations ? {} : { opacity: 0, y: 30 }}
                                whileInView={reduceAnimations ? {} : { opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={reduceAnimations ? {} : { duration: 0.6, delay: index * 0.2 }}
                                className={`relative ${step.bgColor} ${step.borderColor} border-2 rounded-3xl pt-12 pb-16 px-6 lg:px-8 text-center group hover:shadow-2xl transition-all duration-300 ${reduceAnimations ? '' : 'hover:scale-105'} overflow-visible flex-1 max-w-sm`}
                            >
                                {/* Número del paso */}
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-xl border-4 border-white dark:border-gray-900`}>
                                        <span className="text-3xl font-black text-white">{index + 1}</span>
                                    </div>
                                </div>
                                
                                {/* Contenido */}
                                <div className="mt-6">
                                    <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 ${reduceAnimations ? '' : 'group-hover:scale-110'}`}>
                                        <step.icon size={40} className="text-white" />
                                    </div>
                                    
                                    <h3 className="text-2xl lg:text-3xl font-black text-primary mb-4 group-hover:text-link transition-colors">
                                        {step.title}
                                    </h3>
                                    
                                    <p className="text-base lg:text-lg text-secondary leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                
                                {/* Badge */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-white shadow-md`}>
                                        PASO {index + 1}
                                    </span>
                                </div>
                            </motion.div>
                            
                            {/* Flecha conectora */}
                            {index < steps.length - 1 && (
                                <div className="flex items-center justify-center self-center -mx-2 lg:-mx-4 flex-shrink-0">
                                    <motion.div
                                        initial={reduceAnimations ? {} : { opacity: 0, scale: 0 }}
                                        whileInView={reduceAnimations ? {} : { opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={reduceAnimations ? {} : { duration: 0.5, delay: (index + 1) * 0.2 }}
                                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 p-2.5 lg:p-3 rounded-full shadow-lg z-10"
                                    >
                                        <ArrowRight className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
                                    </motion.div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                
                {/* Mobile Layout */}
                <div className="md:hidden space-y-6 relative z-10">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={reduceAnimations ? { opacity: 0 } : { opacity: 0, y: 20 }}
                            whileInView={reduceAnimations ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={reduceAnimations ? { duration: 0.3, delay: index * 0.1 } : { duration: 0.6, delay: index * 0.2 }}
                            className={`relative ${step.bgColor.replace('dark:', '')} ${step.borderColor.replace('dark:', '')} border-2 rounded-3xl pt-12 pb-16 px-4 sm:px-6 text-center overflow-visible shadow-xl hover:shadow-2xl transition-shadow duration-300`}
                        >
                            {/* Número del paso */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30">
                                <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-xl border-4 border-white`}>
                                    <span className="text-2xl font-black text-white">{index + 1}</span>
                                </div>
                            </div>
                            
                            {/* Contenido */}
                            <div className="mt-4">
                                <div className={`w-20 h-20 mx-auto mb-5 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                                    <step.icon size={36} className="text-white" />
                                </div>
                                
                                <h3 className="text-xl font-black text-primary mb-3">
                                    {step.title}
                                </h3>
                                
                                <p className="text-sm text-secondary leading-relaxed px-2">
                                    {step.description}
                                </p>
                            </div>
                            
                            {/* Badge */}
                            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${step.color} text-white shadow-md`}>
                                    PASO {index + 1}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    
                    {/* Indicador de progreso móvil */}
                    <div className="flex items-center justify-center space-x-2 mt-4 px-4">
                        {steps.map((_, index) => (
                            <React.Fragment key={index}>
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${steps[index].color} shadow-md flex-shrink-0`} />
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 bg-gradient-to-r ${steps[index].color} to-transparent rounded-full`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(HowItWorks);
