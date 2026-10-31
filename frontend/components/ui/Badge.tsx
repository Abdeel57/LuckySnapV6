import React from 'react';

type Tone = 'neutral' | 'accent' | 'action' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, string> = {
    neutral: 'bg-white/10 text-ink',
    accent: 'bg-accent/20 text-accent-ink',
    action: 'bg-action/20 text-action-ink',
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-400/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-300',
};

interface BadgeProps {
    tone?: Tone;
    icon?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', icon, className = '', children }) => (
    <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-extrabold leading-none ${TONES[tone]} ${className}`}>
        {icon}
        {children}
    </span>
);

export default Badge;
