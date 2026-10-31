import React from 'react';

const SIZES = { sm: 'h-5 w-5 border-2', md: 'h-10 w-10 border-[3px]', lg: 'h-14 w-14 border-4' };

const Spinner = ({ size = 'md', label = 'Cargando' }: { size?: 'sm' | 'md' | 'lg'; label?: string }) => (
    <div className="flex justify-center items-center p-4" role="status" aria-live="polite">
        <div className={`animate-spin rounded-full border-ink/10 border-t-action ${SIZES[size]}`} />
        <span className="sr-only">{label}</span>
    </div>
);

export default Spinner;
