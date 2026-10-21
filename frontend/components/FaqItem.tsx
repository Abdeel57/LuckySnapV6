import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onClick }) => {
    const panelId = useId();

    return (
        <div className={`rounded-2xl transition-[transform,box-shadow] duration-300 ${isOpen ? 'glow-border-soft bg-background-secondary shadow-card-hover' : 'border border-white/[0.08] bg-background-secondary hover:border-white/20'}`}>
            <h3>
                <button
                    type="button"
                    onClick={onClick}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-4 text-left px-4 sm:px-5 py-4 min-h-[56px] rounded-2xl"
                >
                    <span className="font-bold text-white text-[15px] sm:text-base">{question}</span>
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full border transition-[transform,background-color,border-color] duration-300 ${isOpen ? 'rotate-180 bg-action border-action text-white' : 'border-white/15 text-slate-400'}`} aria-hidden>
                        <ChevronDown className="w-4 h-4" />
                    </span>
                </button>
            </h3>
            <div id={panelId} hidden={!isOpen} className="px-4 sm:px-5 pb-5">
                {isOpen && <p className="text-[15px] text-slate-300 whitespace-pre-line animate-fade-up">{answer}</p>}
            </div>
        </div>
    );
};

export default FaqItem;
