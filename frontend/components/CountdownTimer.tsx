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
        <div className="flex justify-center items-center gap-1 sm:gap-3 flex-wrap">
            {timeUnits.map((unit, index) => (
                <React.Fragment key={unit.label}>
                    <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm text-slate-300 mb-2">{unit.label}{unit.value !== 1 ? 's' : ''}</span>
                        <div className="flex gap-1">
                             {String(unit.value).padStart(2, '0').split('').map((digit, i) => (
                                <div key={i} className="relative w-6 h-8 sm:w-10 sm:h-12 md:w-12 md:h-16 bg-background-primary rounded-md shadow-lg overflow-hidden border border-slate-600">
                                     <AnimatePresence>
                                        <motion.div
                                            key={digit}
                                            initial={{ y: '-100%' }}
                                            animate={{ y: '0%' }}
                                            exit={{ y: '100%' }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="absolute inset-0 flex items-center justify-center text-lg sm:text-2xl md:text-4xl font-bold text-white"
                                        >
                                            {digit}
                                        </motion.div>
                                    </AnimatePresence>
                                     <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30"></div>
                                     <div className="absolute top-1/2 left-0 w-full h-px bg-black/40"></div>
                                </div>
                             ))}
                        </div>
                    </div>
                    {index < timeUnits.length - 1 && (
                        <div className="text-xl sm:text-2xl md:text-3xl text-slate-400 mt-4 font-bold">:</div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CountdownTimer;