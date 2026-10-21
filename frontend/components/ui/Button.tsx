import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

type ButtonAsButton = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined; href?: undefined };
type ButtonAsLink = BaseProps & { to: string; href?: undefined; onClick?: React.MouseEventHandler<HTMLAnchorElement>; disabled?: boolean };
type ButtonAsAnchor = BaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string; to?: undefined; disabled?: boolean };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const BASE = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary';

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-action text-white shadow-action hover:brightness-110',
    secondary: 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/10',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/[0.06]',
    whatsapp: 'bg-[#25D366] text-[#073b1c] hover:brightness-105',
};

const SIZES: Record<Size, string> = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-5 text-[15px]',
    lg: 'h-14 px-6 text-base',
};

const Button: React.FC<ButtonProps> = (props) => {
    const { variant = 'primary', size = 'md', fullWidth, loading, icon, className = '', children, ...rest } = props as BaseProps & Record<string, any>;
    const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`;
    const content = (
        <>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : icon}
            <span>{children}</span>
        </>
    );

    if ('to' in props && props.to) {
        const { to, disabled, onClick } = props as ButtonAsLink;
        return (
            <Link to={to} onClick={onClick} className={`${classes} ${disabled ? 'opacity-50 pointer-events-none' : ''}`} aria-disabled={disabled}>
                {content}
            </Link>
        );
    }

    if ('href' in props && props.href) {
        const { href, disabled, ...anchorRest } = rest as ButtonAsAnchor;
        return (
            <a href={href} className={`${classes} ${disabled ? 'opacity-50 pointer-events-none' : ''}`} aria-disabled={disabled} {...(anchorRest as any)}>
                {content}
            </a>
        );
    }

    const { type = 'button', disabled, ...buttonRest } = rest as ButtonAsButton;
    return (
        <button type={type} disabled={disabled || loading} className={classes} aria-busy={loading || undefined} {...(buttonRest as any)}>
            {content}
        </button>
    );
};

export default Button;
