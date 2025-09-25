import React, { useState, useEffect } from 'react';
import { intervalToDuration, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const calculateTimeLeft = () => {
        const now = new Date();
        if (isAfter(now, targetDate)) {
            return { days: 0, hours: 0, minutes: 0 };
        }
        const duration = intervalToDuration({ start: now, end: targetDate });
        return {
            days: duration.days || 0,
            hours: duration.hours || 0,
            minutes: duration.minutes || 0,
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute
        return () => clearTimeout(timer);
    });
    
    const timeUnits = [
        { label: 'Día', value: timeLeft.days },
        { label: 'Hora', value: timeLeft.hours },
        { label: 'Minuto', value: timeLeft.minutes },
    ];
    
    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
        return <div className="text-center font-bold text-accent text-2xl">¡EL SORTEO HA FINALIZADO!</div>
    }

    return (
        <div className="flex justify-center items-center gap-1 sm:gap-2">
            {timeUnits.map((unit, index) => (
                <React.Fragment key={unit.label}>
                    <div className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm text-slate-300 mb-1">{unit.label}{unit.value !== 1 ? 's' : ''}</span>
                        <div className="flex gap-1">
                             {String(unit.value).padStart(2, '0').split('').map((digit, i) => (
                                <div key={i} className="relative w-8 h-12 sm:w-12 sm:h-16 bg-background-primary rounded-md shadow-md overflow-hidden">
                                     <AnimatePresence>
                                        <motion.div
                                            key={digit}
                                            initial={{ y: '-100%' }}
                                            animate={{ y: '0%' }}
                                            exit={{ y: '100%' }}
                                            transition={{ duration: 0.4, ease: 'easeInOut' }}
                                            className="absolute inset-0 flex items-center justify-center text-2xl sm:text-4xl font-bold text-white"
                                        >
                                            {digit}
                                        </motion.div>
                                    </AnimatePresence>
                                     <div className="absolute inset-0 bg-black/20"></div>
                                     <div className="absolute top-1/2 left-0 w-full h-px bg-black/50"></div>
                                </div>
                             ))}
                        </div>
                    </div>
                    {index < timeUnits.length - 1 && <div className="text-3xl sm:text-4xl text-slate-500 mt-5">:</div>}
                </React.Fragment>
            ))}
        </div>
    );
};

export default CountdownTimer;