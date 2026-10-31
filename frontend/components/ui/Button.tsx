import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'rainbow' | 'hot';
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

// Pastilla con relieve: la base más oscura "se hunde" al pulsar (translate + sombra más corta)
const BASE = 'inline-flex items-center justify-center gap-2 font-extrabold rounded-full whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform,filter] duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-page';

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-action text-white shadow-press-action hover:brightness-110 active:translate-y-[3px] active:shadow-press-action-down',
    secondary: 'bg-surface-2 text-ink border border-line-strong hover:bg-surface-2/70 hover:border-line-strong active:translate-y-[1px]',
    ghost: 'text-muted hover:text-ink hover:bg-white/[0.06]',
    whatsapp: 'bg-[#25D366] text-[#073b1c] shadow-press-whatsapp hover:brightness-105 active:translate-y-[3px] active:shadow-press-whatsapp-down',
    // Aro arcoíris giratorio (.rainbow-ring en styles.css); el relleno lo pone su ::after
    rainbow: 'rainbow-ring text-ink active:translate-y-[1px]',
    // Rojo intenso: el más vivo que mantiene texto blanco ≥ 4.5:1
    hot: 'bg-[#EE0000] text-white shadow-press-hot hover:bg-[#FF0000] active:translate-y-[3px] active:shadow-press-hot-down',
};

const SIZES: Record<Size, string> = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-[15px]',
    lg: 'h-14 px-7 text-base',
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
