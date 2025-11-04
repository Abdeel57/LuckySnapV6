import React, { useState, useEffect } from 'react';
import { intervalToDuration, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CountdownTimer = ({ targetDate }: { targetDate: Date | string }) => {
    const calculateTimeLeft = () => {
        const now = new Date();
        const target = new Date(targetDate);
        
        // Verificar si la fecha es válida
        if (isNaN(target.getTime())) {
            console.error('Invalid target date:', targetDate);
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        if (isAfter(now, target)) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        const duration = intervalToDuration({ start: now, end: target });
        return {
            days: duration.days || 0,
            hours: duration.hours || 0,
            minutes: duration.minutes || 0,
            seconds: duration.seconds || 0,
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Removed console.log - causaba memory leak en móviles
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);
    
    const timeUnits = [
        { label: 'Día', value: timeLeft.days },
        { label: 'Hora', value: timeLeft.hours },
        { label: 'Minuto', value: timeLeft.minutes },
        { label: 'Segundo', value: timeLeft.seconds },
    ];
    
    // Verificar si la fecha es válida
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) {
        return (
            <div className="text-center">
                <div className="text-red-400 text-lg mb-2">⚠️</div>
                <div className="text-red-400 text-sm">Fecha de sorteo inválida</div>
            </div>
        );
    }

    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
        return <div className="text-center font-bold text-accent text-2xl">¡EL SORTEO HA FINALIZADO!</div>
    }

    return (
        <div className="flex justify-center items-center gap-2 sm:gap-4">
            {timeUnits.map((unit, index) => (
                <React.Fragment key={unit.label}>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                {String(unit.value).padStart(2, '0').split('').map((digit, i) => (
                                    <motion.div
                                        key={`${unit.label}-${digit}-${i}`}
                                        className="relative"
                                    >
                                        <div className="w-10 h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 shadow-lg">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={digit}
                                                    initial={{ y: '-100%', opacity: 0 }}
                                                    animate={{ y: '0%', opacity: 1 }}
                                                    exit={{ y: '100%', opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl md:text-4xl font-bold text-white"
                                                >
                                                    {digit}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-1.5 text-center">
                                <span className="text-xs text-white/70 font-medium uppercase">
                                    {unit.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    {index < timeUnits.length - 1 && (
                        <div className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mt-8">
                            :
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CountdownTimer;