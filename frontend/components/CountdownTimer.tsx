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
        console.log('🕐 CountdownTimer initialized with targetDate:', targetDate);
        console.log('🕐 Calculated time left:', calculateTimeLeft());
        
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            
            // Log solo cuando cambien los minutos para evitar spam
            if (newTimeLeft.minutes !== timeLeft.minutes) {
                console.log('🕐 Time updated:', newTimeLeft);
            }
        }, 1000); // Update every second for more precision
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
                            <div className="grid grid-cols-2 gap-2">
                                {String(unit.value).padStart(2, '0').split('').map((digit, i) => (
                                    <motion.div
                                        key={`${unit.label}-${digit}-${i}`}
                                        className="relative"
                                    >
                                        <div className="w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 bg-inverse rounded-xl shadow-xl overflow-hidden border-2 border-accent/30">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={digit}
                                                    initial={{ y: '-100%', opacity: 0 }}
                                                    animate={{ y: '0%', opacity: 1 }}
                                                    exit={{ y: '100%', opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl md:text-5xl font-bold text-accent"
                                                >
                                                    {digit}
                                                </motion.div>
                                            </AnimatePresence>
                                            {/* Efecto de brillo */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-2 text-center">
                                <span className="text-xs sm:text-sm text-muted font-semibold uppercase tracking-wider">
                                    {unit.label}
                                </span>
                            </div>
                        </div>
                    </div>
                    {index < timeUnits.length - 1 && (
                        <motion.div
                            className="text-accent text-4xl sm:text-5xl md:text-6xl font-bold mt-6"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            :
                        </motion.div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CountdownTimer;