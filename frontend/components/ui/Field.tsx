import React from 'react';
import { AlertCircle } from 'lucide-react';

/** Clases compartidas para inputs y selects nativos en tema oscuro. */
export const inputClass =
    'w-full h-12 rounded-xl bg-white/[0.05] border border-white/10 px-4 text-white placeholder:text-slate-400 transition-colors focus:border-action focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-action/40 aria-[invalid=true]:border-red-400/70';

interface FieldProps {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    optional?: boolean;
    /** Prefijo visual dentro del control (p. ej. "+504"); el control debe dejar padding izquierdo. */
    addon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

/**
 * Agrupa etiqueta, control, ayuda y error. La ayuda y el error se enlazan al
 * control mediante aria-describedby para lectores de pantalla.
 */
const Field: React.FC<FieldProps> = ({ id, label, hint, error, optional, addon, children, className = '' }) => {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    const control = React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
              id,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
          })
        : children;

    return (
        <div className={className}>
            <label htmlFor={id} className="flex items-baseline justify-between gap-3 mb-1.5 text-sm font-semibold text-slate-200">
                <span>{label}</span>
                {optional && <span className="text-xs font-medium text-slate-400">Opcional</span>}
            </label>
            {addon ? (
                <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center gap-1.5 text-sm font-semibold text-slate-400 pointer-events-none" aria-hidden>{addon}</span>
                    {control}
                </div>
            ) : control}
            {error ? (
                <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                    {error}
                </p>
            ) : hint ? (
                <p id={hintId} className="mt-1.5 text-sm text-slate-400">{hint}</p>
            ) : null}
        </div>
    );
};

export default Field;
