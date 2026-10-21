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
        <div className={`rounded-2xl border transition-colors ${isOpen ? 'border-action/50 bg-white/[0.04]' : 'border-white/[0.08] bg-background-secondary'}`}>
            <h3>
                <button
                    type="button"
                    onClick={onClick}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-4 text-left px-4 sm:px-5 py-4 min-h-[56px] rounded-2xl"
                >
                    <span className="font-semibold text-white text-[15px] sm:text-base">{question}</span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
            </h3>
            <div id={panelId} hidden={!isOpen} className="px-4 sm:px-5 pb-5">
                <p className="text-[15px] text-slate-300 whitespace-pre-line">{answer}</p>
            </div>
        </div>
    );
};

export default FaqItem;
