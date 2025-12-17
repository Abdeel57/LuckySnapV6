import React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

// FIX: Explicitly type as React.FC to handle special props like 'key'.
const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onClick }) => {
    return (
        <motion.div 
            className={`relative bg-gradient-to-br ${isOpen ? 'from-action/40 to-accent/40' : 'from-background-secondary to-slate-800/50'} rounded-2xl border-2 ${isOpen ? 'border-action/50 shadow-lg shadow-action/20' : 'border-slate-700/50'} overflow-hidden transition-all duration-300 hover:shadow-xl`}
            whileHover={{ scale: 1.02 }}
        >
            {/* Efecto de brillo cuando está abierto */}
            {isOpen && (
                <div className="absolute inset-0 bg-gradient-to-r from-action/10 via-accent/10 to-action/10 animate-pulse" />
            )}
            
            <button
                onClick={onClick}
                className="w-full flex items-center gap-4 text-left p-6 md:p-8 relative z-10 group"
            >
                {/* Icono decorativo */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-gradient-to-br from-action to-accent' : 'bg-slate-700/50 group-hover:bg-slate-600/50'}`}>
                    <HelpCircle className={`w-6 h-6 transition-colors ${isOpen ? 'text-white' : 'text-slate-400'}`} />
                </div>
                
                <div className="flex-1">
                    <h3 className={`font-bold text-lg md:text-xl mb-1 transition-colors ${isOpen ? 'text-white' : 'text-white group-hover:text-action/80'}`}>
                        {question}
                    </h3>
                </div>
                
                <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-action/20 text-action' : 'text-slate-400 group-hover:text-white'}`}
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden relative z-10"
                    >
                        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0">
                            <div className="border-t border-action/20 pt-6">
                                <p className="text-base md:text-lg text-slate-200 leading-relaxed whitespace-pre-line">
                                    {answer}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default FaqItem;
