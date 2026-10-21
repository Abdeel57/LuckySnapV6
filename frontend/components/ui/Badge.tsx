import React from 'react';

type Tone = 'neutral' | 'accent' | 'action' | 'success' | 'warning' | 'danger' | 'gold';

const TONES: Record<Tone, string> = {
    neutral: 'bg-white/[0.08] text-slate-200 border-white/10',
    accent: 'bg-accent/15 text-accent border-accent/40 shadow-[0_0_18px_rgb(var(--color-accent)/0.25)]',
    action: 'bg-action/15 text-white border-action/50 shadow-[0_0_18px_rgb(var(--color-action)/0.3)]',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    danger: 'bg-red-500/15 text-red-300 border-red-500/30',
    gold: 'bg-amber-400/15 text-amber-200 border-amber-400/40 shadow-[0_0_18px_rgb(251_191_36/0.25)]',
};

interface BadgeProps {
    tone?: Tone;
    icon?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', icon, className = '', children }) => (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-bold leading-none ${TONES[tone]} ${className}`}>
        {icon}
        {children}
    </span>
);

export default Badge;
