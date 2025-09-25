import React from 'react';
import { ChevronDown } from 'lucide-react';
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
        <div className="bg-background-secondary rounded-lg border border-slate-700/50">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left p-6"
            >
                <span className="font-semibold text-white">{question}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown className="text-white" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 text-slate-300">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FaqItem;
