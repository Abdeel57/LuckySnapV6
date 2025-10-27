import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

interface WinnerDrawAnimationProps {
    isRunning: boolean;
    winnerNumber: number | null;
    onComplete: () => void;
}

const WinnerDrawAnimation: React.FC<WinnerDrawAnimationProps> = ({ isRunning, winnerNumber, onComplete }) => {
    const [displayNumber, setDisplayNumber] = useState<number>(0);
    const [countdown, setCountdown] = useState<number>(5);

    useEffect(() => {
        if (isRunning && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
                setDisplayNumber(Math.floor(Math.random() * 1000) + 1);
            }, 100);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && winnerNumber !== null) {
            setDisplayNumber(winnerNumber);
            setTimeout(() => {
                onComplete();
            }, 2000);
        }
    }, [isRunning, countdown, winnerNumber, onComplete]);

    return (
        <div className="relative w-full h-96 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 rounded-2xl overflow-hidden">
            {/* Fondo animado */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        initial={{ 
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: 0
                        }}
                        animate={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: [0, 1, 0],
                            scale: [1, 1.5, 1]
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </div>

            {/* Contenido principal */}
            <div className="relative z-10 text-center">
                {isRunning && countdown > 0 ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        {/* Icono de trofeo girando */}
                        <motion.div
                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                            transition={{ 
                                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                                scale: { duration: 0.5, repeat: Infinity }
                            }}
                            className="flex justify-center"
                        >
                            <Trophy className="w-32 h-32 text-yellow-400" />
                        </motion.div>

                        {/* Número que cambia rápidamente */}
                        <motion.div
                            key={displayNumber}
                            initial={{ scale: 0, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0, y: -50, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="text-8xl font-bold text-white drop-shadow-2xl"
                        >
                            {displayNumber.toString().padStart(4, '0')}
                        </motion.div>

                        {/* Contador regresivo */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="flex items-center justify-center gap-2 text-white"
                        >
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                            <span className="text-2xl font-bold">Seleccionando ganador en {countdown}...</span>
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                        </motion.div>
                    </motion.div>
                ) : winnerNumber !== null ? (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="space-y-8"
                    >
                        {/* Confeti */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(50)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-3 h-3 rounded-full"
                                    style={{
                                        background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5],
                                        left: `${(i * 7) % 100}%`,
                                        top: '-10%'
                                    }}
                                    animate={{
                                        y: ['0%', '120%'],
                                        x: [0, Math.random() * 200 - 100],
                                        rotate: [0, 360],
                                        opacity: [1, 0]
                                    }}
                                    transition={{
                                        duration: 2 + Math.random(),
                                        delay: Math.random() * 0.5
                                    }}
                                />
                            ))}
                        </div>

                        {/* Trofeo */}
                        <motion.div
                            animate={{ 
                                y: [0, -20, 0],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="flex justify-center"
                        >
                            <Trophy className="w-32 h-32 text-yellow-400 drop-shadow-2xl" />
                        </motion.div>

                        {/* Número ganador */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <p className="text-3xl font-bold text-white mb-4">¡Ganador!</p>
                            <div className="text-9xl font-bold text-yellow-400 drop-shadow-2xl">
                                {winnerNumber.toString().padStart(4, '0')}
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </div>
        </div>
    );
};

export default WinnerDrawAnimation;
