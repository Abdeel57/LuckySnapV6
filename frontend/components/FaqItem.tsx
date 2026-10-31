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
        <div>
            <h3>
                <button
                    type="button"
                    onClick={onClick}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-4 text-left py-4 min-h-[56px]"
                >
                    <span className="font-semibold text-ink text-[15px] sm:text-base">{question}</span>
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full transition-[transform,background-color,color] duration-200 ${isOpen ? 'rotate-180 bg-action text-white' : 'bg-white/10 text-muted'}`} aria-hidden>
                        <ChevronDown className="w-4 h-4" />
                    </span>
                </button>
            </h3>
            <div id={panelId} hidden={!isOpen} className="pb-5">
                {isOpen && <p className="text-[15px] text-muted whitespace-pre-line animate-fade-up">{answer}</p>}
            </div>
        </div>
    );
};

export default FaqItem;
