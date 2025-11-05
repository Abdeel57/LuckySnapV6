import React, { useState, useEffect } from 'react';
import { intervalToDuration, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CountdownTimer = ({ targetDate }: { targetDate: Date | string }) => {
    // Normalizar targetDate a objeto Date para comparaciones consistentes
    const target = React.useMemo(() => {
        const date = new Date(targetDate);
        if (isNaN(date.getTime())) {
            console.error('Invalid target date:', targetDate);
            return null;
        }
        return date;
    }, [targetDate]);

    const calculateTimeLeft = React.useCallback(() => {
        if (!target) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const now = new Date();
        
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
    }, [target]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    // Actualizar cuando cambia targetDate
    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
    }, [calculateTimeLeft]);

    useEffect(() => {
        // Actualizar el contador cada segundo
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]); // Recrear el timer cuando cambia la fecha objetivo
    
    // Calcular cuántos dígitos necesita cada unidad (mínimo 2, máximo lo necesario)
    const getDigitCount = (value: number): number => {
        if (value >= 1000) return 4; // Para valores muy grandes (aunque es raro)
        if (value >= 100) return 3;  // Para valores >= 100
        return 2;                    // Mínimo 2 dígitos
    };

    const timeUnits = [
        { label: 'Día', value: timeLeft.days, digitCount: getDigitCount(timeLeft.days) },
        { label: 'Hora', value: timeLeft.hours, digitCount: getDigitCount(timeLeft.hours) },
        { label: 'Minuto', value: timeLeft.minutes, digitCount: getDigitCount(timeLeft.minutes) },
        { label: 'Segundo', value: timeLeft.seconds, digitCount: getDigitCount(timeLeft.seconds) },
    ];
    
    // Verificar si la fecha es válida
    if (!target) {
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
        <div className="flex justify-center items-start gap-1 sm:gap-2 md:gap-3 lg:gap-4">
            {timeUnits.map((unit, index) => {
                // Determinar el tamaño de los dígitos basado en el número de dígitos
                const isThreeOrMoreDigits = unit.digitCount >= 3;
                const digitSizeClasses = isThreeOrMoreDigits
                    ? "w-7 h-11 sm:w-9 sm:h-13 md:w-11 md:h-15 lg:w-13 lg:h-19" // Más pequeño cuando hay 3+ dígitos
                    : "w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20"; // Tamaño normal para 2 dígitos
                
                const textSizeClasses = isThreeOrMoreDigits
                    ? "text-base sm:text-lg md:text-xl lg:text-3xl" // Texto más pequeño para 3+ dígitos
                    : "text-lg sm:text-xl md:text-2xl lg:text-4xl"; // Tamaño normal
                
                const gapClasses = isThreeOrMoreDigits
                    ? "gap-0.5 sm:gap-1 md:gap-1.5" // Gaps más pequeños
                    : "gap-1 sm:gap-1.5 md:gap-2"; // Gaps normales

                return (
                    <React.Fragment key={unit.label}>
                        {/* Unidad de tiempo (días, horas, minutos, segundos) */}
                        <div className="flex flex-col items-center min-w-0">
                            {/* Contenedor de dígitos */}
                            <div className={`flex items-center ${gapClasses}`}>
                                {String(unit.value).padStart(unit.digitCount, '0').split('').map((digit, i) => (
                                    <motion.div
                                        key={`${unit.label}-${digit}-${i}`}
                                        className="relative flex-shrink-0"
                                    >
                                        <div className={`${digitSizeClasses} bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 shadow-lg`}>
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={digit}
                                                    initial={{ y: '-100%', opacity: 0 }}
                                                    animate={{ y: '0%', opacity: 1 }}
                                                    exit={{ y: '100%', opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className={`absolute inset-0 flex items-center justify-center ${textSizeClasses} font-bold text-white`}
                                                >
                                                    {digit}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Etiqueta debajo de los dígitos */}
                            <div className="mt-1 sm:mt-1.5 text-center w-full">
                                <span className="text-[10px] sm:text-xs text-white/70 font-medium uppercase tracking-wide">
                                    {unit.label}
                                </span>
                            </div>
                        </div>
                        {/* Separador (dos puntos) - solo entre unidades, no después de la última */}
                        {index < timeUnits.length - 1 && (
                            <div className="flex items-center self-center pt-6 sm:pt-8 md:pt-10 lg:pt-12 px-0.5 sm:px-1">
                                <span className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none">
                                    :
                                </span>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default CountdownTimer;