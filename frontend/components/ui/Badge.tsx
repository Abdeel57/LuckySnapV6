import React from 'react';

type Tone = 'neutral' | 'accent' | 'action' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
    neutral: 'bg-white/[0.08] text-slate-200 border-white/10',
    accent: 'bg-accent/15 text-accent border-accent/30',
    action: 'bg-action/15 text-white border-action/40',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    danger: 'bg-red-500/15 text-red-300 border-red-500/30',
};

interface BadgeProps {
    tone?: Tone;
    icon?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', icon, className = '', children }) => (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-xs font-semibold leading-none ${TONES[tone]} ${className}`}>
        {icon}
        {children}
    </span>
);

export default Badge;
